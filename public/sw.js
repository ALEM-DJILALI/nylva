// NYLVA Service Worker — minimal, fait pour rendre la PWA installable.
// Cache: shell + assets statiques. Stratégie: network-first, cache fallback.

const CACHE = 'nylva-v1';
const SHELL = [
  '/app',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ne touche pas aux requêtes non-GET (POST API, etc.)
  if (request.method !== 'GET') return;

  // Ne touche pas aux APIs (toujours fraîches)
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return;

  // Network-first pour HTML (toujours fresh)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/app')))
    );
    return;
  }

  // Cache-first pour assets statiques
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone)).catch(() => {});
        }
        return res;
      });
    })
  );
});
