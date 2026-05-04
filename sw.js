const CACHE_NAME = 'arcade-hub-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './manifest.json',
  './games/rhythm/index.html',
  './games/2048/index.html',
  './games/snake/index.html',
  './games/minesweeper/index.html',
  './games/tetris/index.html',
  './games/tetris/app.js'
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
