const CACHE = 'telecomax-km-company-20261009-sso-fix-1';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('telecomax-km-') && k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fresh HTML picks up backend URL corrections; offline fallback keeps the app shell.
// API requests (including cross-origin GET config and every POST) bypass this cache.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const shell = new URL('./index.html', self.registration.scope).href;
  if (e.request.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(e.request);
        if (response.ok && (url.pathname === new URL(shell).pathname || url.pathname === new URL('./', self.registration.scope).pathname)) {
          await cache.put(shell, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await cache.match(shell);
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }
  if (!ASSETS.some(asset => new URL(asset, self.registration.scope).href === url.href)) return;
  e.respondWith(caches.open(CACHE).then(cache => cache.match(e.request)).then(cached => cached || fetch(e.request)));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});
