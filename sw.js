const CACHE_NAME = 'tinygames-launcher-{{APP_VERSION}}';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './qrcode.svg',
  './icon-source.svg',
  './favicon-16.png',
  './favicon-32.png',
  './apple-touch-icon.png',
  './apple-touch-icon-167.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const accept = req.headers.get('accept') || '';
  const isNav = req.mode === 'navigate' || accept.includes('text/html');

  if (isNav) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./')))
    );
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
