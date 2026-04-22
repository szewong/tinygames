const CACHE_NAME = 'tinygames-launcher-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for the launcher itself, cache fallback.
  // Lets each game's own service worker manage its subdirectory.
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
