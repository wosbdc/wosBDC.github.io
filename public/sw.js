const CACHE_NAME = 'wos-bdc-pwa-v2.9.8';
const ASSETS_TO_CACHE = [
  './manifest.json',
  './favicon.svg',
  './icon-192.svg',
  './icon-512.svg'
];

// Install Event - Skip waiting immediately on update
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event - Clean up ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message Event - Handle local test notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TEST_PUSH') {
    self.registration.showNotification(event.data.title || 'wosBDC Alert', {
      body: event.data.body || 'Test push notification received.',
      icon: './favicon.svg',
      badge: './favicon.svg',
      vibrate: [100, 50, 100],
      data: { url: './' }
    });
  }
});

// Notification Click Event - Focus or open dashboard
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});

// Fetch Event - Network-First for HTML/main app files so version updates appear instantly!
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  if (url.includes('CHANGELOG.md') || url.includes('version.json') || url.includes('badges/') || url.includes('firebaseio.com') || url.includes('script.google.com') || url.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network First for HTML and navigation
  if (event.request.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-First with Network Fallback for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      });
    })
  );
});
