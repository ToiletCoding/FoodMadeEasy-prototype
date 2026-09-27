// Offline support for the installed prototype. Serves from cache first so it opens
// instantly (and in a store basement). When a new version is published (new VERSION,
// stamped by scripts/publish-prototype.sh), it installs in the background and the page
// reloads itself onto it.
const VERSION = 'fme-proto-43b0f8b';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/util.js', 'js/data.js', 'js/offers.js', 'js/mix.js', 'js/i18n.js', 'js/i18n-da.js', 'js/engine.js', 'js/state.js', 'js/ui.js',
  'js/screens-start.js', 'js/screens-week.js', 'js/screens-mix.js', 'js/screens-shop.js', 'js/screens-prep.js', 'js/screens-profile.js', 'js/dev.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' skips the browser's HTTP cache, so a new version never stores old files.
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request, { cache: 'no-cache' }).then((res) => {
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
