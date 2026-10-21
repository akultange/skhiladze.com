// skhiladze.com, build 3727491597
const KEEP = 'skh-3727491597';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== KEEP) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin || r.headers.has('range') || /\.(mp4|webm|m4v|mov)$/i.test(u.pathname)) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then((res) => {
      if (res.ok) { const c = res.clone(); caches.open(KEEP).then((k) => k.put(r, c)); }
      return res;
    }, () => caches.match(r).then((m) => m || Response.error())));
    return;
  }
  if (!/\.(woff2|webp|avif|jpe?g|png|svg|css|js)$/i.test(u.pathname)) return;
  e.respondWith(caches.open(KEEP).then(async (k) => {
    const hit = await k.match(r);
    if (hit) return hit;
    const res = await fetch(r);
    if (res.ok && res.type === 'basic') k.put(r, res.clone());
    return res;
  }));
});
