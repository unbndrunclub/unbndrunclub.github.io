// UNBND Run Club: makes the site installable and usable offline.
// Pages and race data: fresh from the network first, saved copy if offline.
// Images and fonts: saved copy first, refreshed in the background.
const CACHE = "unbnd-v2";
const CORE = ["./", "index.html", "races.html", "rules.html", "support.html", "register.html", "pay.html", "upload.html",
  "site.js", "config.js", "logo.png", "hero.jpg", "icon-192.png", "manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameSite = url.origin === self.location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameSite && !isFont) return;                      // backend, weather, etc. are never cached
  if (sameSite && /admin\.html$/.test(url.pathname)) return; // admin always comes fresh

  const isPageOrData = req.mode === "navigate" || /\.(html|json|js)$/.test(url.pathname) || url.pathname.endsWith("/");
  if (sameSite && isPageOrData) {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req.url.split("?")[0], copy)); }
      return res;
    }).catch(() => caches.match(req.url.split("?")[0]).then((r) => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then((cached) => {
    const net = fetch(req).then((res) => { if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => cached);
    return cached || net;
  }));
});
