// =============================================================
// Cache-first app shell. All actual data lives in localStorage
// (already on-device) or Supabase (needs network regardless), so
// this only has to make the pages/scripts/icons themselves
// available offline — not any live data.
//
// Bump CACHE_NAME on any app-shell file change so clients pick up
// the new list and drop the old cache on next activate.
// =============================================================
const CACHE_NAME = 'equavia-shell-v52';
const APP_SHELL = [
  'lock.html',
  'dashboard.html',
  'health.html',
  'gym.html',
  'finance.html',
  'planner.html',
  'interactions.html',
  'privacy.html',
  'settings.html',
  'ask.html',
  'status.html',
  'manifest.json',
  'js/topbar.js',
  'js/icons.js',
  'js/landing-guard.js',
  'js/auth-gate.js',
  'js/assistant-tools.js',
  'js/expand-primitives.js',
  'js/obsidian-sync.js',
  'js/sync.js',
  'js/collapsible.js',
  'js/dashboard-view.js',
  'js/dexie.min.js',
  'js/status.js',
  'docs/programme.json',
  'images/favicon.png',
  'images/icon-192.png',
  'images/icon-512.png',
  'images/icon-192-maskable.png',
  'images/icon-512-maskable.png',
  'images/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Only handle same-origin requests -- CDN scripts (Supabase, EasyMDE) and
  // API calls (WHOOP, Google, Supabase, Anthropic) pass straight through so
  // this never masks a stale third-party script or a live data fetch.
  if (url.origin !== self.location.origin) return;

  // Stale-while-revalidate: a cache hit is returned immediately (same speed
  // as pure cache-first), but a network fetch always runs alongside it and
  // refreshes the cache for next time. This bounds staleness to "one load
  // behind" instead of "until CACHE_NAME is next bumped" -- CACHE_NAME
  // still matters (see CLAUDE.md's APP_SHELL rule and the version-skew
  // banner in topbar.js), this just stops a forgotten bump from meaning
  // "forever."
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => null);

      if (cached) {
        // Don't await the network -- serve what's cached now, let the
        // fetch finish in the background via waitUntil so the SW stays
        // alive for it even after this response has already resolved.
        event.waitUntil(networkFetch);
        return cached;
      }
      return networkFetch.then((response) => response || Promise.reject(new Error('offline, nothing cached')));
    })
  );
});
