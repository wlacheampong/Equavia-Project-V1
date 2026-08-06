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

  // Known appKey key-lists shared by every initCloudSync call for that
  // domain. collect()/pushNow() below build the ENTIRE push payload from
  // an instance's own syncedKeys -- upsert() replaces the row's whole
  // `data` column, it doesn't merge at the field level. Two pages pushing
  // under the same appKey with two different (even overlapping) lists
  // will silently drop whatever fields the narrower one doesn't know
  // about. One shared array per appKey, referenced by every call site
  // for that appKey, is what keeps that from happening.
  window.EqPoCoachSyncedKeys = ['po_coach_v1', 'po_coach_workout_done', 'po_coach_weights', 'po_coach_goal_weight', 'calorie_log_v1', 'session_feel_log_v1'];

  // Same reasoning as EqPoCoachSyncedKeys above -- 'goals' is called from
  // planner.html, ask.html, and dashboard.html; all three need the
  // identical list or a push from the narrower one drops fields the
  // others rely on off the row.
  window.EqGoalsSyncedKeys = ['longterm_goals_v1', 'projects_v1', 'local_cal_events_v1', 'tasks_week_v1', 'tasks_month_v1'];

  // Same reasoning again -- 'health' is called from ask.html and
  // health.html.
  window.EqHealthSyncedKeys = ['stack:items', 'stack:version', 'stack:low', 'eq.energy.logs_v1', 'eq.health.summary', 'eq.energy.customSources_v1'];
  window.EqHealthSyncedPrefixes = ['stack:taken:'];

  // Same reasoning again -- 'finance' is called from ask.html and
  // finance.html.
  window.EqFinanceSyncedKeys = ['subs', 'wishlist', 'incoming_orders', 'fin:income_events'];
  window.EqFinanceSyncedPrefixes = ['nw:', 'budget:'];

  window.initCloudSync = function (config) {
    const appKey = config && config.appKey;
    const syncedKeys = (config && config.syncedKeys) || [];
    const syncedPrefixes = (config && config.syncedPrefixes) || [];
    const onApplied = config && config.onApplied;
    if (!appKey || !window.supabase) return Promise.resolve();
    if (!SUPABASE_URL || !SUPABASE_KEY) return Promise.resolve();
    if (SUPABASE_URL.indexOf('PASTE-') === 0 || SUPABASE_KEY.indexOf('PASTE-') === 0) return Promise.resolve();

    let supa = null, pushTimer = null, suppressSync = false, lastSyncedJson = null, pendingRemote = null;
    // Resolves once the initial pull has been attempted and (if it landed)
    // applied to localStorage -- before the realtime subscription, which is
    // ongoing rather than a one-shot event. None of the existing call sites
    // use this return value, so adding it changes nothing for them; a
    // caller that needs to run logic against post-pull state (e.g.
    // planner.html's auto-promotion) can await it instead of racing the
    // pull with boot-time code.
    let resolveReady;
    const ready = new Promise((resolve) => { resolveReady = resolve; });

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
          // Watermark, not just localTs: a key local just tombstoned has no
          // timestamps entry (touchTombstone deletes it), so checking localTs
          // alone reads as "untouched" and lets remote's still-live copy --
          // fetched before the tombstone had a chance to push -- resurrect it
          // and clobber the tombstone. Mirrors loop 2's localKnownTs below.
          const localWatermark = Math.max(localTs, localMeta.tombstones[k] || 0);
          if (remoteTs < localWatermark) continue; // local is newer -- keep it, it'll push up
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
    // A remote update landing mid-keystroke -- the user is still editing,
    // hasn't saved yet, so nothing they've typed has a timestamp of its
    // own to defend it via applyRemote's own LWW check above. Queue it
    // instead of applying immediately; flushed on focusout once the field
    // isn't active. Only the single latest pending payload is kept -- a
    // second remote update arriving before the field blurs just replaces
    // the queued one, same as it would have applied immediately in series
    // if the user hadn't been mid-edit.
    function isUserEditing() {
      const ae = document.activeElement;
      if (!ae) return false;
      const tag = ae.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (ae.getAttribute && ae.getAttribute('contenteditable') === 'true') return true;
      return false;
    }
    function maybeApplyRemote(remote) {
      if (isUserEditing()) { pendingRemote = remote; return; }
      applyRemote(remote);
    }
    function applyPendingIfReady() {
      if (pendingRemote && !isUserEditing()) {
        const r = pendingRemote;
        pendingRemote = null;
        applyRemote(r);
      }
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
          maybeApplyRemote(data.data);
        } else if (listAllKeys().length > 0) {
          // Note: not collect().length -- collect() always includes
          // META_KEY now, which would make this true even with nothing
          // real to sync.
          schedulePush();
        }
      } catch (e) {}
      resolveReady();
      supa.channel('app_state_' + appKey)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'app_state', filter: 'key=eq.' + appKey,
        }, (payload) => {
          if (!payload.new || !payload.new.data) return;
          const incoming = JSON.stringify(payload.new.data);
          if (incoming === lastSyncedJson) return;
          lastSyncedJson = incoming;
          maybeApplyRemote(payload.new.data);
        })
        .subscribe();
    })();
    window.addEventListener('beforeunload', flushOnUnload);
    window.addEventListener('pagehide', flushOnUnload);
    // beforeunload/pagehide cover a real navigation/close, but on mobile
    // backgrounding a PWA (switching apps, locking the screen) doesn't
    // reliably fire either -- visibilitychange is the signal that
    // actually catches that case, so it gets its own flush rather than
    // depending on an unload event that may never come.
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushOnUnload(); });
    window.addEventListener('storage', (e) => { if (e.key && matches(e.key)) schedulePush(); });
    document.addEventListener('focusout', () => { setTimeout(applyPendingIfReady, 0); }, true);
    return ready;
  };
})();
