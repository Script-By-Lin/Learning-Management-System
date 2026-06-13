const CACHE_NAME = 'nexora-lms-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/globals.css'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Gracefully handle caching - ignore errors on individual assets to prevent install blocks
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Some initial PWA assets failed to cache during installation:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network-first fallback to Cache)
self.addEventListener('fetch', (event) => {
  // Only intercept HTTP/HTTPS GET requests (avoid chrome-extension:// or POST payloads)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If valid network response, cache it dynamically for offline usage
        if (networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fall back to offline cached copies if offline
        return caches.match(event.request);
      })
  );
});
