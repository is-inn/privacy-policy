// ゾンビフェイス — minimal offline-capable service worker
// ページ本体はネット優先（更新がすぐ届く）、それ以外はキャッシュ優先
const CACHE = 'zf-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function fetchAndCache(req) {
  return fetch(req).then((resp) => {
    const copy = resp.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
    return resp;
  });
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetchAndCache(e.request).catch(() =>
      caches.match(e.request).then((r) => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((r) =>
      r || fetchAndCache(e.request).catch(() => caches.match('./index.html'))
    )
  );
});
