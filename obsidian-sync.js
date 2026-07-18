// =============================================================
// Obsidian Local REST API bridge for the Notes tile.
// Talks directly from the browser to the "Local REST API" community
// plugin running inside Obsidian on this device -- this can never be
// routed through Vercel's serverless functions, since those execute
// in the cloud and can't reach a user's localhost.
//
// Config (host/port/API key/vault folder) lives in localStorage only:
// sync only works on the device/network where Obsidian is actually
// open, so there is no meaningful "account" to sync the config to.
//
// Every network call is short-timeout and defensive -- an unreachable
// or misconfigured Obsidian must never break the core notes UI.
// =============================================================
(function () {
  'use strict';
  const CONFIG_KEY = 'obsidian_sync_config';
  const DEFAULT_CONFIG = {
    enabled: false, host: '127.0.0.1', port: 27123, protocol: 'http', apiKey: '', folder: 'AppNotes',
    // Used by the Planner's Projects section: vaultName opens the desktop app via the
    // obsidian:// URI scheme (the Local REST API alone can only read/write vault files,
    // it can't focus/open the app UI), projectsFolder keeps project pages out of AppNotes.
    vaultName: '', projectsFolder: 'AppProjects'
  };
  const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp)$/i;

  function getConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (!raw) return Object.assign({}, DEFAULT_CONFIG);
      return Object.assign({}, DEFAULT_CONFIG, JSON.parse(raw));
    } catch (e) { return Object.assign({}, DEFAULT_CONFIG); }
  }
  function setConfig(cfg) {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(Object.assign({}, DEFAULT_CONFIG, cfg))); } catch (e) {}
  }
  function baseUrl(cfg) { return cfg.protocol + '://' + cfg.host + ':' + cfg.port; }
  function vaultPath(cfg, relPath) {
    return '/vault/' + relPath.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  }

  async function apiFetch(path, opts) {
    const cfg = getConfig();
    opts = opts || {};
    const headers = Object.assign({}, opts.headers, cfg.apiKey ? { Authorization: 'Bearer ' + cfg.apiKey } : {});
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs || 6000);
    try {
      return await fetch(baseUrl(cfg) + path, Object.assign({}, opts, { headers, signal: controller.signal }));
    } finally { clearTimeout(timer); }
  }

  async function testConnection() {
    try {
      const res = await apiFetch('/', { timeoutMs: 1500 });
      return res.ok;
    } catch (e) { return false; }
  }

  // Live keyword search across the whole vault (not scoped to cfg.folder --
  // AppNotes only holds the round-tripped Notes tile, the point of search is
  // reaching the user's real, pre-existing notes). Uses the plugin's fuzzy
  // "simple search", which takes the query as a URL param and returns each
  // matching file with short context snippets already extracted, so there's
  // no need to fetch full file bodies just to show relevant excerpts.
  async function searchNotes(query, opts) {
    const q = (query || '').trim();
    const cfg = getConfig();
    if (!cfg.enabled || !q) return { ok: false, reason: !cfg.enabled ? 'disabled' : 'empty_query', results: [] };
    const contextLength = (opts && opts.contextLength) || 200;
    const maxResults = (opts && opts.maxResults) || 4;
    const qs = '?query=' + encodeURIComponent(q) + '&contextLength=' + contextLength;
    try {
      const res = await apiFetch('/search/simple/' + qs, { method: 'POST', timeoutMs: 4000 });
      if (!res.ok) return { ok: false, reason: 'http_' + res.status, results: [] };
      const json = await res.json();
      const results = (Array.isArray(json) ? json : []).slice(0, maxResults).map((item) => ({
        filename: item.filename,
        excerpts: (item.matches || []).map((m) => m.context).filter(Boolean).slice(0, 2),
      }));
      return { ok: true, results };
    } catch (e) { return { ok: false, reason: 'network', results: [] }; }
  }

  function esc(s) { return String(s == null ? '' : s).replace(/"/g, '\\"'); }
  function stripFrontmatter(text) {
    const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(text || '');
    return m ? text.slice(m[0].length) : (text || '');
  }
  function frontmatterBlock(note) {
    return '---\n'
      + 'id: ' + note.id + '\n'
      + 'title: "' + esc(note.title || '') + '"\n'
      + 'pinned: ' + (!!note.pinned) + '\n'
      + 'created: ' + note.createdAt + '\n'
      + 'updated: ' + note.updatedAt + '\n'
      + '---\n\n';
  }
  function dataUrlToBlob(dataUrl) {
    const comma = dataUrl.indexOf(',');
    const meta = dataUrl.slice(0, comma);
    const b64 = dataUrl.slice(comma + 1);
    const mimeMatch = /data:(.*?);base64/.exec(meta);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  async function blobToDataUrl(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  }

  async function pushNote(note) {
    const cfg = getConfig();
    if (!cfg.enabled) return { ok: false, reason: 'disabled' };
    let body = note.body || '';
    for (const img of note.images || []) {
      const ref = '![](attachment:' + img.id + ')';
      if (body.indexOf(ref) === -1) continue;
      const relPath = cfg.folder + '/attachments/' + note.id + '-' + img.id + '.jpg';
      try {
        const blob = dataUrlToBlob(img.dataUrl);
        const res = await apiFetch(vaultPath(cfg, relPath), { method: 'PUT', body: blob, headers: { 'Content-Type': blob.type } });
        if (res.ok) body = body.split(ref).join('![[' + relPath + ']]');
      } catch (e) { /* leave placeholder, retry next sync */ }
    }
    const content = frontmatterBlock(note) + body;
    const relPath = cfg.folder + '/' + note.id + '.md';
    try {
      const res = await apiFetch(vaultPath(cfg, relPath), { method: 'PUT', body: content, headers: { 'Content-Type': 'text/markdown' } });
      if (!res.ok) return { ok: false, reason: 'http_' + res.status };
      return { ok: true, path: relPath, body, syncedAt: new Date().toISOString() };
    } catch (e) { return { ok: false, reason: 'network' }; }
  }

  async function deleteNote(note) {
    const cfg = getConfig();
    if (!cfg.enabled || !note.obsidian || !note.obsidian.path) return { ok: false };
    try {
      await apiFetch(vaultPath(cfg, note.obsidian.path), { method: 'DELETE' });
      return { ok: true };
    } catch (e) { return { ok: false }; }
  }

  async function fetchNoteJson(cfg, relPath) {
    try {
      const res = await apiFetch(vaultPath(cfg, relPath), { headers: { Accept: 'application/vnd.olrapi.note+json' } });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) { return null; }
  }

  async function resolveImageEmbeds(cfg, body) {
    const images = [];
    let resolvedBody = body;
    const embedRe = /!\[\[([^\]]+)\]\]/g;
    let match;
    while ((match = embedRe.exec(body))) {
      const target = match[1];
      if (!IMAGE_EXT_RE.test(target)) continue;
      const candidates = target.indexOf('/') !== -1 ? [target] : [cfg.folder + '/attachments/' + target, target];
      let dataUrl = null;
      for (const candidate of candidates) {
        try {
          const res = await apiFetch(vaultPath(cfg, candidate));
          if (res.ok) { dataUrl = await blobToDataUrl(await res.blob()); if (dataUrl) break; }
        } catch (e) { /* try next candidate */ }
      }
      if (dataUrl) {
        const imgId = 'img' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        images.push({ id: imgId, dataUrl });
        resolvedBody = resolvedBody.split(match[0]).join('![](attachment:' + imgId + ')');
      }
    }
    return { body: resolvedBody, images };
  }

  // Auto-creates a project's Obsidian page the first time it's opened (Planner's
  // Projects section). Unlike pushNote/pullAll this is one-directional and idempotent
  // by design — the spec asks only to create-if-missing, not keep the page in sync on
  // every edit, so re-pushing an already-linked project is a no-op the caller should
  // simply skip (checked via project.obsidian.path before calling this).
  async function pushProjectPage(project) {
    const cfg = getConfig();
    if (!cfg.enabled) return { ok: false, reason: 'disabled' };
    const folder = cfg.projectsFolder || 'AppProjects';
    const relPath = folder + '/' + project.id + '.md';
    const content = '# ' + (project.title || 'Untitled project') + '\n\n';
    try {
      const res = await apiFetch(vaultPath(cfg, relPath), { method: 'PUT', body: content, headers: { 'Content-Type': 'text/markdown' } });
      if (!res.ok) return { ok: false, reason: 'http_' + res.status };
      return { ok: true, path: relPath, syncedAt: new Date().toISOString() };
    } catch (e) { return { ok: false, reason: 'network' }; }
  }

  function sanitizeFilenameSegment(name) {
    const cleaned = String(name == null ? '' : name)
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
      .trim()
      .replace(/\.+$/, '');
    return (cleaned || 'Untitled').slice(0, 100);
  }

  // Moves an already-linked project page to a new folder, preserving
  // whatever the user has actually written into it (a plain GET of the
  // current path, not a re-generated stub) -- pushProjectPage's stub
  // content is only ever right the first time a page is created. The
  // Local REST API has no move/rename verb, so this is PUT-to-new-path
  // then DELETE-old-path; the delete is best-effort (a dangling old
  // file is recoverable, a lost move destination is not).
  //
  // destFolderSegments is an array of individual path segments (e.g.
  // ['Archive', goalTitle]), each sanitized on its own -- NOT a
  // pre-joined 'Archive/<goal title>' string. A goal title containing a
  // literal "/" (e.g. "Q3: Ship it!/Launch") would otherwise get misread
  // as an extra folder boundary instead of an illegal character to
  // sanitize within that one segment.
  async function moveProjectPageToFolder(project, destFolderSegments) {
    const cfg = getConfig();
    if (!cfg.enabled) return { ok: false, reason: 'disabled' };
    if (!project.obsidian || !project.obsidian.path) return { ok: false, reason: 'not_linked' };
    const oldPath = project.obsidian.path;
    let content;
    try {
      const res = await apiFetch(vaultPath(cfg, oldPath));
      if (!res.ok) return { ok: false, reason: 'http_' + res.status };
      content = await res.text();
    } catch (e) { return { ok: false, reason: 'network' }; }

    const newPath = destFolderSegments.map(sanitizeFilenameSegment).join('/') + '/' + project.id + '.md';
    try {
      const putRes = await apiFetch(vaultPath(cfg, newPath), { method: 'PUT', body: content, headers: { 'Content-Type': 'text/markdown' } });
      if (!putRes.ok) return { ok: false, reason: 'http_' + putRes.status };
    } catch (e) { return { ok: false, reason: 'network' }; }

    try { await apiFetch(vaultPath(cfg, oldPath), { method: 'DELETE' }); } catch (e) { /* best-effort; new copy already exists */ }
    return { ok: true, path: newPath };
  }

  // One-shot write for the dashboard's Weekly Report (3.3) -- overwrites
  // if the same week is written twice, same idempotent create-if-missing
  // spirit as pushProjectPage, just always-overwrite since the whole
  // point here is "the current numbers for this week", not user-owned
  // freeform content that must be preserved like a project page is.
  async function pushWeeklyReport(weekKey, markdown) {
    const cfg = getConfig();
    if (!cfg.enabled) return { ok: false, reason: 'disabled' };
    const relPath = (cfg.folder || 'AppNotes') + '/Weekly Reports/' + weekKey + '.md';
    try {
      const res = await apiFetch(vaultPath(cfg, relPath), { method: 'PUT', body: markdown, headers: { 'Content-Type': 'text/markdown' } });
      if (!res.ok) return { ok: false, reason: 'http_' + res.status };
      return { ok: true, path: relPath };
    } catch (e) { return { ok: false, reason: 'network' }; }
  }

  // Ask Claude's "Save to Obsidian" -- same one-shot overwrite shape as
  // pushWeeklyReport (caller builds the markdown, this just PUTs it), keyed
  // by a chat id the caller owns so re-saving the same ongoing conversation
  // updates one file instead of piling up snapshots.
  async function pushChatTranscript(id, markdown) {
    const cfg = getConfig();
    if (!cfg.enabled) return { ok: false, reason: 'disabled' };
    const relPath = (cfg.folder || 'AppNotes') + '/Chats/' + id + '.md';
    try {
      const res = await apiFetch(vaultPath(cfg, relPath), { method: 'PUT', body: markdown, headers: { 'Content-Type': 'text/markdown' } });
      if (!res.ok) return { ok: false, reason: 'http_' + res.status };
      return { ok: true, path: relPath };
    } catch (e) { return { ok: false, reason: 'network' }; }
  }

  async function pullAll(existingNotes) {
    const cfg = getConfig();
    if (!cfg.enabled) return { ok: false, reason: 'disabled', notes: existingNotes };
    let listRes;
    try { listRes = await apiFetch(vaultPath(cfg, cfg.folder) + '/'); } catch (e) { return { ok: false, reason: 'network', notes: existingNotes }; }
    if (!listRes.ok) return { ok: false, reason: 'http_' + listRes.status, notes: existingNotes };
    let listJson;
    try { listJson = await listRes.json(); } catch (e) { return { ok: false, reason: 'bad_json', notes: existingNotes }; }
    const files = (listJson.files || []).filter((f) => /\.md$/i.test(f) && f.indexOf('/') === -1);

    const notes = existingNotes.slice();
    const byId = {};
    notes.forEach((n) => { byId[n.id] = n; });

    for (const filename of files) {
      const relPath = cfg.folder + '/' + filename;
      const data = await fetchNoteJson(cfg, relPath);
      if (!data) continue;
      const meta = data.frontmatter || {};
      const rawBody = stripFrontmatter(data.content || '');
      const remoteMtime = (data.stat && data.stat.mtime) || Date.now();
      const id = meta.id;
      const { body, images } = await resolveImageEmbeds(cfg, rawBody);

      if (id && byId[id]) {
        const local = byId[id];
        const localTime = new Date(local.updatedAt || 0).getTime();
        if (remoteMtime > localTime) {
          Object.assign(local, {
            title: meta.title != null ? String(meta.title) : local.title,
            body,
            images: images.length ? images : local.images,
            pinned: !!meta.pinned,
            updatedAt: new Date(remoteMtime).toISOString(),
          });
        }
        local.obsidian = { path: relPath, lastSyncedAt: new Date().toISOString(), remoteMtime };
      } else if (!id) {
        const newId = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const note = {
          id: newId,
          title: (meta.title != null ? String(meta.title) : filename.replace(/\.md$/i, '')),
          body,
          images,
          pinned: !!meta.pinned,
          createdAt: new Date(remoteMtime).toISOString(),
          updatedAt: new Date(remoteMtime).toISOString(),
          obsidian: { path: relPath, lastSyncedAt: new Date().toISOString(), remoteMtime },
        };
        notes.push(note);
        byId[newId] = note;
      }
    }
    return { ok: true, notes };
  }

  window.ObsidianSync = { getConfig, setConfig, testConnection, pushNote, deleteNote, pullAll, pushProjectPage, moveProjectPageToFolder, pushWeeklyReport, searchNotes, pushChatTranscript };
})();
