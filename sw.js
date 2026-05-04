const CACHE_NAME = 'arcade-hub-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './games/rhythm/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
