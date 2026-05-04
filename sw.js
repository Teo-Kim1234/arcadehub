const CACHE_NAME = 'arcade-hub-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './manifest.json',
  './play/rhythm/index.html',
  './play/2048/index.html',
  './play/snake/index.html',
  './play/minesweeper/index.html',
  './play/tetris/index.html',
  './play/tetris/app.js'
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
