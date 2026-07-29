// =============================================================
// Row-level Supabase sync for a page's list of "plan days"
// (day_key/name/order/soft-delete) -- e.g. Fitness's Push/Pull/Legs
// tabs and gym.html's day-tag list. Decoupled from the existing whole-blob
// localStorage sync (sync.js/vitality-bridge.js/gym.html's own PC_*): those
// keep syncing everything else (logged sets, exercise config, weights);
// this module is only responsible for which days exist, their names, and
// their order, via one row per (plan, day_key) in public.plan_days.
//
// No per-user auth exists in this app (single shared passcode gate, not
// Supabase Auth -- see lib/auth.js), so there is no user_id column and RLS
// is permissive for the anon key, same trust model as app_state already
// uses everywhere else.
//
// Usage (see gym.html for the actual wiring):
//   const sync = PlanSync.init({
//     plan: 'train',                       // 'train' | 'gym'
//     getLocalSnapshot: () => [...],       // () => [{key,name}] in order, read once for first-run migration
//     applyRemote: (liveList) => {...},    // (liveList:[{key,name,position}]) => void, reconcile into local state + re-render
//     isUserEditing: () => false,          // optional; defaults to "is an <input>/<textarea> focused"
//     onStatus: (status) => {},            // optional; 'synced' | 'pending' | 'offline' | 'error'
//   });
//   sync.pushSnapshot([{key,name}, ...]);   // call after any add/rename/delete of a day
// =============================================================
(function () {
  'use strict';
  const SUPABASE_URL = 'https://ubhjdibldkknviezrjys.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGpkaWJsZGtrbnZpZXpyanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzAyNjEsImV4cCI6MjA5OTM0NjI2MX0.ODgzRHVYLEaDCUBXmmSd3oENXlSlarRYVERagHbVCK0';
  const TABLE = 'plan_days';

  function defaultIsEditing() {
    const ae = document.activeElement;
    if (!ae) return false;
    const tag = ae.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (ae.getAttribute && ae.getAttribute('contenteditable') === 'true') return true;
    return false;
  }

  window.PlanSync = {
    init(config) {
      const plan = config.plan;
      const applyRemote = config.applyRemote;
      const getLocalSnapshot = config.getLocalSnapshot || function () { return []; };
      const isUserEditing = config.isUserEditing || defaultIsEditing;
      const onStatus = config.onStatus || function () {};
      if (!plan || typeof applyRemote !== 'function' || !window.supabase) {
        return { pushSnapshot() {} };
      }

      const QUEUE_KEY = 'plan_sync_queue:' + plan;
      const MIGRATED_KEY = 'plan_sync_migrated_v1:' + plan;

      let supa = null;
      let knownKeys = new Set(); // last-known live key set for this plan, used to detect deletions
      let pushTimer = null;
      let lastAppliedJson = null; // dedupe: skip re-applying a remote snapshot we already reconciled
      let deferredRemote = null;  // a remote snapshot that arrived while the user was mid-edit

      function client() {
        if (!supa) supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        return supa;
      }

      function loadQueue() {
        try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch (e) { return []; }
      }
      function saveQueue(q) {
        try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (e) {}
      }
      // Latest write for a given day_key wins within the queue -- upsert
      // semantics, not an append-only log.
      function enqueue(rows) {
        const q = loadQueue();
        rows.forEach((row) => {
          const i = q.findIndex((r) => r.day_key === row.day_key);
          if (i >= 0) q[i] = row; else q.push(row);
        });
        saveQueue(q);
        onStatus('pending');
      }

      async function flushQueue() {
        if (!navigator.onLine) { onStatus(loadQueue().length ? 'offline' : 'synced'); return; }
        const c = client();
        let q = loadQueue();
        if (!q.length) { onStatus('synced'); return; }
        const remaining = [];
        for (const row of q) {
          try {
            const { error } = await c.from(TABLE).upsert(row, { onConflict: 'plan,day_key' });
            if (error) remaining.push(row);
          } catch (e) { remaining.push(row); }
        }
        saveQueue(remaining);
        onStatus(remaining.length ? (navigator.onLine ? 'error' : 'offline') : 'synced');
      }

      function buildRows(list, deletedKeys) {
        const now = new Date().toISOString();
        const rows = list.map((d, i) => ({
          plan, day_key: d.key, name: d.name, position: i, updated_at: now, deleted_at: null,
        }));
        deletedKeys.forEach((k) => {
          rows.push({ plan, day_key: k, name: '', position: 0, updated_at: now, deleted_at: now });
        });
        return rows;
      }

      function pushSnapshot(list) {
        const liveKeys = new Set(list.map((d) => d.key));
        const deletedKeys = [...knownKeys].filter((k) => !liveKeys.has(k));
        knownKeys = liveKeys;
        enqueue(buildRows(list, deletedKeys));
        clearTimeout(pushTimer);
        pushTimer = setTimeout(flushQueue, 250);
      }

      function reconcile(rows) {
        const live = rows.filter((r) => !r.deleted_at).sort((a, b) => a.position - b.position);
        knownKeys = new Set(live.map((r) => r.day_key));
        const liveList = live.map((r) => ({ key: r.day_key, name: r.name, position: r.position }));
        const json = JSON.stringify(liveList);
        if (json === lastAppliedJson) return;
        if (isUserEditing()) { deferredRemote = liveList; return; }
        lastAppliedJson = json;
        applyRemote(liveList);
      }

      function applyPendingIfReady() {
        if (deferredRemote && !isUserEditing()) {
          const l = deferredRemote;
          deferredRemote = null;
          const json = JSON.stringify(l);
          if (json === lastAppliedJson) return;
          lastAppliedJson = json;
          applyRemote(l);
        }
      }

      async function fetchRows() {
        const c = client();
        const { data, error } = await c.from(TABLE).select('day_key,name,position,deleted_at').eq('plan', plan);
        if (error) throw error;
        return data || [];
      }

      async function fetchAndReconcile() {
        try { reconcile(await fetchRows()); } catch (e) {}
      }

      (async function boot() {
        try {
          const rows = await fetchRows();
          const liveRows = rows.filter((r) => !r.deleted_at);
          if (!liveRows.length && !localStorage.getItem(MIGRATED_KEY)) {
            const local = getLocalSnapshot() || [];
            if (local.length) pushSnapshot(local);
            try { localStorage.setItem(MIGRATED_KEY, '1'); } catch (e) {}
          } else {
            reconcile(rows);
          }
        } catch (e) {}
        flushQueue();
        client().channel('plan_days_' + plan)
          .on('postgres_changes', {
            event: '*', schema: 'public', table: TABLE, filter: 'plan=eq.' + plan,
          }, () => { fetchAndReconcile(); })
          .subscribe();
      })();

      function flushOnUnload() {
        const q = loadQueue();
        if (!q.length) return;
        try {
          q.forEach((row) => {
            fetch(SUPABASE_URL + '/rest/v1/' + TABLE + '?on_conflict=plan,day_key', {
              method: 'POST',
              headers: {
                apikey: SUPABASE_KEY,
                Authorization: 'Bearer ' + SUPABASE_KEY,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates',
              },
              body: JSON.stringify(row),
              keepalive: true,
            }).catch(() => {});
          });
        } catch (e) {}
      }

      window.addEventListener('online', flushQueue);
      window.addEventListener('focus', fetchAndReconcile);
      window.addEventListener('focus', applyPendingIfReady);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') { fetchAndReconcile(); applyPendingIfReady(); }
      });
      document.addEventListener('focusout', applyPendingIfReady);
      window.addEventListener('beforeunload', flushOnUnload);
      window.addEventListener('pagehide', flushOnUnload);

      return { pushSnapshot };
    },
  };
})();
