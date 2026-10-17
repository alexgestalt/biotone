// Offline cache for Biotone web. Bump VERSION when files change.
const VERSION = 'biotone-web-v9-1';
const PREFIX = 'biotone-web-'; // other apps on this github.io origin keep their own caches
const ASSETS = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './js/app.js', './js/draw.js', './js/synth.js', './js/library-data.js',
  './icons/header-icon-96.png', './icons/header-icon-144.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png', './audio/intro.m4a', './audio/intro.mp3', './audio/intro.json'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network first (updates show up), cache when offline.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true, cacheName: VERSION }).then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html', { cacheName: VERSION }) : undefined)))
  );
});
