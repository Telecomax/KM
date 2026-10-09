// Retire the previous KM service worker and cached app shell.
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil((async () => { for (const key of await caches.keys()) { if (key.startsWith('telecomax-km-')) await caches.delete(key); } await self.registration.unregister(); await self.clients.claim(); })()); });
