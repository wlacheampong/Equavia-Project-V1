// =============================================================
// Bridge for the "sealed" Vitality tiles (train/notes.html).
// (Phase 6.1: peak.html used to be one of these -- deleted and merged into
// health.html's Energy section, which uses sync.js/initCloudSync instead,
// not this bridge.)
// Each tile is deliberately network- and storage-agnostic -- it just calls
// window.Vitality.load()/save() and expects "the dashboard" to handle
// persistence. This is that dashboard: it backs onto the same Supabase
// project as sync.js, so tile data syncs across devices like goals/
// health/finance already do, with a localStorage cache for instant loads
// and offline fallback.
//
// Must load as a plain, non-deferred <head> script, before the tile's own
// bottom-of-body <script> runs -- that call is synchronous, not wrapped in
// a DOMContentLoaded listener, so window.Vitality has to already exist by
// the time the parser reaches it.
// =============================================================
(function () {
  'use strict';
  const SUPABASE_URL = 'https://ubhjdibldkknviezrjys.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGpkaWJsZGtrbnZpZXpyanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzAyNjEsImV4cCI6MjA5OTM0NjI2MX0.ODgzRHVYLEaDCUBXmmSd3oENXlSlarRYVERagHbVCK0';

  function appKey() {
    const file = (location.pathname.split('/').pop() || '').replace(/\.html$/i, '');
    return 'vitality_' + (file || 'tile');
  }
  const KEY = appKey();
  const LOCAL_KEY = 'vitality_bridge:' + KEY;

  function localLoad() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)); } catch (e) { return null; }
  }
  function localSave(data) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch (e) {}
  }

  let supa = null;
  function client() {
    if (!supa && window.supabase && SUPABASE_URL && SUPABASE_KEY) {
      supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return supa;
  }

  let pushTimer = null;
  function schedulePush(data) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => pushNow(data), 250);
  }
  async function pushNow(data) {
    const c = client();
    if (!c) return;
    try {
      await c.from('app_state').upsert(
        { key: KEY, data, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    } catch (e) {}
  }

  window.Vitality = {
    async load() {
      const cached = localLoad();
      const c = client();
      if (!c) return cached;
      try {
        const { data, error } = await c.from('app_state').select('data').eq('key', KEY).maybeSingle();
        if (!error && data && data.data != null) {
          localSave(data.data);
          return data.data;
        }
      } catch (e) {}
      return cached;
    },
    save(data) {
      localSave(data);
      schedulePush(data);
    },
  };
})();
