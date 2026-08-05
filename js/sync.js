// =============================================================
// Shared cloud-sync helper. Each page calls initCloudSync({...}).
// Replace the two placeholders with your Supabase project URL +
// publishable key (same ones you used in topbar.js/gym.html).
// =============================================================
(function () {
  'use strict';
  const SUPABASE_URL = 'https://ubhjdibldkknviezrjys.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGpkaWJsZGtrbnZpZXpyanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzAyNjEsImV4cCI6MjA5OTM0NjI2MX0.ODgzRHVYLEaDCUBXmmSd3oENXlSlarRYVERagHbVCK0';

  // Reserved property inside the app_state row's `data` blob -- carries
  // per-key bookkeeping (last-write-wins timestamps + tombstones) without
  // needing a schema/table migration. Deliberately not shaped like a real
  // synced value so it never collides with an actual localStorage key, and
  // consumers that read row.data.<someKey> directly (e.g.
  // scripts/migrate-orphaned-logs.js) are unaffected since they only ever
  // look up specific known keys.
  const META_KEY = '__sync_meta__';

  window.initCloudSync = function (config) {
    const appKey = config && config.appKey;
    const syncedKeys = (config && config.syncedKeys) || [];
    const syncedPrefixes = (config && config.syncedPrefixes) || [];
    const onApplied = config && config.onApplied;
    if (!appKey || !window.supabase) return;
    if (!SUPABASE_URL || !SUPABASE_KEY) return;
    if (SUPABASE_URL.indexOf('PASTE-') === 0 || SUPABASE_KEY.indexOf('PASTE-') === 0) return;

    let supa = null, pushTimer = null, suppressSync = false, lastSyncedJson = null;

    function matches(k) {
      if (!k) return false;
      if (syncedKeys.indexOf(k) !== -1) return true;
      for (let i = 0; i < syncedPrefixes.length; i++) {
        if (k.indexOf(syncedPrefixes[i]) === 0) return true;
      }
      return false;
    }
    function listAllKeys() {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (matches(k)) out.push(k);
      }
      return out;
    }

    // ---- local per-key sync bookkeeping (timestamps + tombstones) ----
    // Lives under its own, deliberately-unmatched localStorage key (per
    // appKey, since one page can run initCloudSync for several appKeys --
    // see ask.html) so it's never itself treated as a synced value. Read
    // via the original unpatched localStorage methods to avoid any chance
    // of recursing back into the setItem/removeItem hooks below.
    const META_STORAGE_KEY = '__eq_sync_meta__' + appKey;
    const origSet = localStorage.setItem.bind(localStorage);
    const origRemove = localStorage.removeItem.bind(localStorage);
    const origGet = localStorage.getItem.bind(localStorage);

    function loadLocalMeta() {
      try {
        const v = JSON.parse(origGet(META_STORAGE_KEY));
        if (v && typeof v === 'object') {
          return { timestamps: v.timestamps || {}, tombstones: v.tombstones || {} };
        }
      } catch (e) {}
      return { timestamps: {}, tombstones: {} };
    }
    function saveLocalMeta(meta) {
      try { origSet(META_STORAGE_KEY, JSON.stringify(meta)); } catch (e) {}
    }
    function touchTimestamp(k) {
      const meta = loadLocalMeta();
      meta.timestamps[k] = Date.now();
      delete meta.tombstones[k];
      saveLocalMeta(meta);
    }
    function touchTombstone(k) {
      const meta = loadLocalMeta();
      meta.tombstones[k] = Date.now();
      delete meta.timestamps[k];
      saveLocalMeta(meta);
    }

    function collect() {
      const out = {};
      for (const k of listAllKeys()) {
        const v = localStorage.getItem(k);
        if (v == null) continue;
        try { out[k] = JSON.parse(v); } catch (e) { out[k] = v; }
      }
      const localMeta = loadLocalMeta();
      out[META_KEY] = { timestamps: localMeta.timestamps, tombstones: localMeta.tombstones };
      return out;
    }
    localStorage.setItem = function (k, v) {
      origSet(k, v);
      try { if (!suppressSync && matches(k)) { touchTimestamp(k); schedulePush(); } } catch (e) {}
    };
    localStorage.removeItem = function (k) {
      origRemove(k);
      try { if (!suppressSync && matches(k)) { touchTombstone(k); schedulePush(); } } catch (e) {}
    };
    // Last-write-wins per key, using each key's own timestamp rather than
    // one timestamp for the whole blob -- a single blob-level time can't
    // tell you which individual keys inside it are actually stale. A key
    // missing from remote.data is no longer inferred as "delete this
    // locally" -- remote hasn't seen it yet, so it's left alone and gets
    // pushed up on the next push. Real deletions are explicit tombstones,
    // themselves timestamped and compared the same way. Keys with no
    // timestamp on either side (untouched since before this existed)
    // default to 0 -- "missing" reads as "oldest," per spec, so it only
    // loses ties, never wins one against a real timestamp.
    function applyRemote(remote) {
      if (!remote || typeof remote !== 'object') return false;
      const remoteMeta = remote[META_KEY] && typeof remote[META_KEY] === 'object'
        ? { timestamps: remote[META_KEY].timestamps || {}, tombstones: remote[META_KEY].tombstones || {} }
        : { timestamps: {}, tombstones: {} };
      const localMeta = loadLocalMeta();
      suppressSync = true;
      let changed = false;
      try {
        for (const k of Object.keys(remote)) {
          if (k === META_KEY || !matches(k)) continue;
          const remoteTs = remoteMeta.timestamps[k] || 0;
          const localTs = localMeta.timestamps[k] || 0;
          if (remoteTs < localTs) continue; // local is newer -- keep it, it'll push up
          const incoming = JSON.stringify(remote[k]);
          const local = localStorage.getItem(k);
          if (local !== incoming) { try { origSet(k, incoming); changed = true; } catch (e) {} }
          localMeta.timestamps[k] = Math.max(remoteTs, localTs);
          delete localMeta.tombstones[k];
        }
        for (const k of Object.keys(remoteMeta.tombstones)) {
          if (!matches(k)) continue;
          const remoteDelTs = remoteMeta.tombstones[k];
          const localKnownTs = Math.max(localMeta.timestamps[k] || 0, localMeta.tombstones[k] || 0);
          if (remoteDelTs >= localKnownTs) {
            if (localStorage.getItem(k) !== null) { try { origRemove(k); changed = true; } catch (e) {} }
            delete localMeta.timestamps[k];
            localMeta.tombstones[k] = Math.max(remoteDelTs, localMeta.tombstones[k] || 0);
          }
        }
        saveLocalMeta(localMeta);
      } finally { suppressSync = false; }
      if (changed && typeof onApplied === 'function') { try { onApplied(); } catch (e) {} }
      return changed;
    }
    async function pushNow() {
      if (!supa) return;
      const state = collect();
      const json = JSON.stringify(state);
      if (json === lastSyncedJson) return;
      try {
        const { error } = await supa.from('app_state').upsert(
          { key: appKey, data: state, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
        if (!error) lastSyncedJson = json;
      } catch (e) {}
    }
    function schedulePush() { clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 250); }
    function flushOnUnload() {
      const state = collect();
      const json = JSON.stringify(state);
      if (json === lastSyncedJson) return;
      try {
        fetch(SUPABASE_URL + '/rest/v1/app_state?on_conflict=key', {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({ key: appKey, data: state, updated_at: new Date().toISOString() }),
          keepalive: true,
        }).catch(() => {});
        lastSyncedJson = json;
      } catch (e) {}
    }
    (async function init() {
      supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      try {
        const { data, error } = await supa.from('app_state').select('data').eq('key', appKey).maybeSingle();
        if (!error && data && data.data && Object.keys(data.data).length > 0) {
          lastSyncedJson = JSON.stringify(data.data);
          applyRemote(data.data);
        } else if (listAllKeys().length > 0) {
          // Note: not collect().length -- collect() always includes
          // META_KEY now, which would make this true even with nothing
          // real to sync.
          schedulePush();
        }
      } catch (e) {}
      supa.channel('app_state_' + appKey)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'app_state', filter: 'key=eq.' + appKey,
        }, (payload) => {
          if (!payload.new || !payload.new.data) return;
          const incoming = JSON.stringify(payload.new.data);
          if (incoming === lastSyncedJson) return;
          lastSyncedJson = incoming;
          applyRemote(payload.new.data);
        })
        .subscribe();
    })();
    window.addEventListener('beforeunload', flushOnUnload);
    window.addEventListener('pagehide', flushOnUnload);
    window.addEventListener('storage', (e) => { if (e.key && matches(e.key)) schedulePush(); });
  };
})();
