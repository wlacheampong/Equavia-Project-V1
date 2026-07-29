// Server-side mirror of sync.js's own app_state read/write pattern -- same
// Supabase project/anon key, same table, same upsert-on-conflict shape (see
// sync.js's flushOnUnload for the exact precedent this copies). An MCP tool
// call is architecturally just "one more synced device" from Supabase's
// point of view, as long as every write follows fetchMergeUpsert below and
// never does a partial/blind write: each app_state row is a flat blob of
// every localStorage key synced for that app section (key -> value), and a
// naive partial write would silently drop whatever else lives in that blob.
const SUPABASE_URL = 'https://ubhjdibldkknviezrjys.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGpkaWJsZGtrbnZpZXpyanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzAyNjEsImV4cCI6MjA5OTM0NjI2MX0.ODgzRHVYLEaDCUBXmmSd3oENXlSlarRYVERagHbVCK0';

async function fetchRow(appKey) {
  const res = await fetch(
    SUPABASE_URL + '/rest/v1/app_state?key=eq.' + encodeURIComponent(appKey) + '&select=data',
    { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } }
  );
  if (!res.ok) throw new Error('Supabase read failed (' + appKey + '): ' + res.status);
  const rows = await res.json();
  return (rows[0] && rows[0].data) || {};
}

async function upsertRow(appKey, data) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/app_state?on_conflict=key', {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ key: appKey, data, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error('Supabase write failed (' + appKey + '): ' + res.status);
}

// Read-only access to a whole domain's synced blob (e.g. appKey='goals').
export async function readDomain(appKey) {
  return fetchRow(appKey);
}

// The only sanctioned write path: fetch the current blob, let mutateFn
// mutate just the sub-key(s) it cares about in place, then upsert the
// WHOLE merged blob back -- never a partial write.
export async function fetchMergeUpsert(appKey, mutateFn) {
  const data = await fetchRow(appKey);
  const result = await mutateFn(data);
  await upsertRow(appKey, data);
  return result;
}

