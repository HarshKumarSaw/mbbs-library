// OneSignal Web Push Worker
try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch (e) {
  console.warn("[SW] OneSignal worker import error:", e);
}

/**
 * Harsh's Library Service Worker
 * Fully compliant with Google Chrome PWA / WebAPK standards & GitHub Pages subpaths.
 *
 * Strategy:
 *  - Network-First with Cache Fallback for Navigation/HTML requests
 *  - Stale-While-Revalidate for CSS, JS, Fonts, and Icons (instant 0ms launch speed)
 *  - Safe fallback for offline navigation
 */

const CACHE_NAME = 'harsh-library-v1.0.8';

// Detect base subpath dynamically from service worker scope (e.g. '/mbbs-library/')
const getBasePath = () => {
  if (self.registration && self.registration.scope) {
    try {
      const p = new URL(self.registration.scope).pathname;
      return p.endsWith('/') ? p : p + '/';
    } catch (_) {}
  }
  return '/mbbs-library/';
};

const BASE = getBasePath();

// Relative asset list resolved against the base subpath
const RELATIVE_ASSETS = [
  '',
  'index.html',
  'anatomy.html',
  'physiology.html',
  'biochemistry.html',
  '404.html',
  'OneSignalSDKWorker.js',
  'manifest.json',
  'manifest.webmanifest',
  'css/style.min.css',
  'css/style.css',
  'js/data.js',
  'js/app.min.js',
  'js/app.js',
  'js/pwa.js',
  'js/push.js',
  'js/vendor/pdf.min.js',
  'js/vendor/pdf.worker.min.js',
  'assets/fonts/outfit.woff2',
  'assets/fonts/plus-jakarta-sans.woff2',
  'navbar-logo.webp',
  'navbar-logo.png',
  'logo-anatomy.webp',
  'logo-anatomy.png',
  'favicon.ico',
  'favicon-192x192.png',
  'assets/icons/icon-192x192.png',
  'assets/icons/icon-512x512.png',
  'assets/icons/icon-maskable-192x192.png',
  'assets/icons/icon-maskable-512x512.png'
];

const PRECACHE_URLS = RELATIVE_ASSETS.map((asset) => {
  return new URL(asset, self.registration.scope).href;
});

// Installation: Cache core app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
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
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[SW] Purging deprecated cache:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Handling
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Skip cross-origin PDF downloads or external resources
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

          // Try exact matches for start_url or home
          const startUrlMatch = await caches.match(new URL('', self.registration.scope).href);
          if (startUrlMatch) return startUrlMatch;

          const indexMatch = await caches.match(new URL('index.html', self.registration.scope).href);
          if (indexMatch) return indexMatch;

          return caches.match(new URL('404.html', self.registration.scope).href);
        })
    );
    return;
  }

  // 2. Static Assets (CSS, JS, Fonts, Images, Icons): Stale-While-Revalidate
  const isStaticAsset = url.pathname.match(
    /\.(css|js|woff2?|png|jpe?g|webp|ico|svg|json|webmanifest)$/i
  );

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
          .catch(() => {});

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
