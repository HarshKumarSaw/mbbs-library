/**
 * Harsh's Library Service Worker
 * Strategy:
 *  - Network-First with Cache Fallback for Navigation/HTML requests (ensures latest content)
 *  - Stale-While-Revalidate for CSS, JS, Fonts, and Icons (instant 0ms launch speed)
 *  - Network-Only for dynamic PDF streaming/downloads
 */

const CACHE_NAME = 'harsh-library-v1.0.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './anatomy.html',
  './physiology.html',
  './biochemistry.html',
  './404.html',
  './manifest.webmanifest',
  './css/style.min.css',
  './css/style.css',
  './js/data.js',
  './js/app.min.js',
  './js/app.js',
  './js/vendor/pdf.min.js',
  './js/vendor/pdf.worker.min.js',
  './assets/fonts/outfit.woff2',
  './assets/fonts/plus-jakarta-sans.woff2',
  './navbar-logo.webp',
  './navbar-logo.png',
  './favicon.ico',
  './favicon-192x192.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png',
  './assets/icons/icon-maskable-192x192.png',
  './assets/icons/icon-maskable-512x512.png'
];

// Installation: Cache core app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use individual requests to prevent one failing asset from aborting the whole precache
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn('[SW] Precache skipped for:', url, err);
          })
        )
      );
    })
  );
});

// Activation: Clean up older cache versions and claim immediate client control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging deprecated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Handling
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Skip cross-origin PDF downloads or SteadyLink / GitHub Releases from service worker cache
  if (url.origin !== self.location.origin) {
    return;
  }

  // 1. Navigation / HTML Requests: Network-First with Cache Fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          // Fallback to cached index.html or 404.html
          return caches.match('./index.html') || caches.match('./404.html');
        })
    );
    return;
  }

  // 2. Static Assets (CSS, JS, Fonts, Images, Icons): Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.match(/\.(css|js|woff2?|png|jpe?g|webp|ico|svg|json|webmanifest)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failure is fine for stale-while-revalidate if cache exists
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
      );
    })
  );
});
