// =============================================================
// Busy Mode -- single Supabase row, deliberately NOT part of any page's
// localStorage-mirrored app_state blob (see sync.js). Arming/clearing must
// be authoritative across devices the moment it happens, not wait for
// another tab's next sync cycle -- so this talks to Supabase directly.
//
// Stored under app_state.key = 'busy_mode', data = { armed_at, expires_at }.
// expires_at is written here for convenience/inspection only -- the source
// of truth for whether Busy Mode is still active is armed_at, recomputed by
// js/status.js's busyModeStatus(armedAt, date) on every read. Never trust
// this row's expires_at for that decision; it can't go stale itself since
// nothing reads it, but that's also why it's not the source of truth.
//
// window.EqBusyMode.get()   -> Promise<{ armed_at, expires_at } | null>  (null = off)
// window.EqBusyMode.arm()   -> Promise<{ armed_at, expires_at }>
// window.EqBusyMode.clear() -> Promise<void>
// =============================================================
(function () {
  'use strict';
  const SUPABASE_URL = 'https://ubhjdibldkknviezrjys.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGpkaWJsZGtrbnZpZXpyanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzAyNjEsImV4cCI6MjA5OTM0NjI2MX0.ODgzRHVYLEaDCUBXmmSd3oENXlSlarRYVERagHbVCK0';
  const ROW_KEY = 'busy_mode';
  const DAYS = 7;

  async function get() {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/app_state?key=eq.' + ROW_KEY + '&select=data',
      { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } }
    );
    if (!res.ok) throw new Error('Busy Mode read failed: ' + res.status);
    const rows = await res.json();
    const data = rows[0] && rows[0].data;
    return (data && data.armed_at) ? data : null;
  }

  async function arm() {
    const armedAt = new Date();
    const expiresAt = new Date(armedAt.getTime() + DAYS * 86400000);
    const data = { armed_at: armedAt.toISOString(), expires_at: expiresAt.toISOString() };
    const res = await fetch(SUPABASE_URL + '/rest/v1/app_state?on_conflict=key', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ key: ROW_KEY, data, updated_at: armedAt.toISOString() }),
    });
    if (!res.ok) throw new Error('Busy Mode arm failed: ' + res.status);
    return data;
  }

  // Upserts armed_at/expires_at to null rather than DELETE-ing the row.
  // DELETE against app_state under the anon key returns 200/204 "success"
  // but silently affects zero rows (confirmed with Prefer: return=
  // representation -- empty array back) -- almost certainly RLS permits
  // insert/update for anon but not delete. get()'s existing
  // `data.armed_at ? data : null` check already treats a null armed_at as
  // off, so this reuses the exact write path arm() already uses
  // successfully instead of a silently-broken one.
  async function clear() {
    const res = await fetch(SUPABASE_URL + '/rest/v1/app_state?on_conflict=key', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ key: ROW_KEY, data: { armed_at: null, expires_at: null }, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error('Busy Mode clear failed: ' + res.status);
  }

  window.EqBusyMode = { get, arm, clear };
})();
