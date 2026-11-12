// OneSignal v16 Unified Service Worker
self._ONESIGNAL_WORKER_LOADED = true;
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
try {
  importScripts("./sw.js");
} catch (e) {
  console.warn("[SW] PWA worker import notice:", e);
}
