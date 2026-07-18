// =============================================================
// Cache-first app shell. All actual data lives in localStorage
// (already on-device) or Supabase (needs network regardless), so
// this only has to make the pages/scripts/icons themselves
// available offline — not any live data.
//
// Bump CACHE_NAME on any app-shell file change so clients pick up
// the new list and drop the old cache on next activate.
// =============================================================
const CACHE_NAME = 'equavia-shell-v2';
const APP_SHELL = [
  'index.html',
  'dashboard.html',
  'health.html',
  'gym.html',
  'peak.html',
  'finance.html',
  'planner.html',
  'ability.html',
  'notes.html',
  'train.html',
  'vitals.html',
  'brand.html',
  'po-water.html',
  'privacy.html',
  'settings.html',
  'ask.html',
  'manifest.json',
  'topbar.js',
  'landing-guard.js',
  'obsidian-sync.js',
  'sync.js',
  'vitality-bridge.js',
  'images/Index Landing Page.webp',
  'images/splash-red-wing.jpg',
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

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
