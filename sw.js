// Freqium has moved to /biotone/. This worker clears the old caches, unregisters itself and reloads open tabs so they hit the redirect.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('freqium-web-')).map((k) => caches.delete(k)));
    await self.registration.unregister();
    const tabs = await self.clients.matchAll({ type: 'window' });
    tabs.forEach((c) => c.navigate(c.url));
  })());
});
