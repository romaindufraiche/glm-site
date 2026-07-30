const CACHE = 'glm-site-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/main.js',
  './assets/img/icon.svg',
  './manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((cache) => cache.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
