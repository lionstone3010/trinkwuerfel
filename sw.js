/* Trinkwürfel – Offline-Modus
   Das Spiel selbst: immer zuerst aus dem Netz (damit Updates sofort ankommen),
   ohne Internet aus dem Speicher. Symbole: aus dem Speicher.
   Schriften und ZIP-Bibliothek: aus dem Speicher, im Hintergrund aktualisiert.
   Der Besucherzähler wird nie gespeichert. Ältere Versionen (v1/, v2/, ...) bleiben unberührt. */
const CACHE = "trinkwuerfel-2.2";
const CORE = ["./", "./manifest.webmanifest", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/favicon-32.png"];
const SCOPE = new URL("./", self.location).pathname;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("trinkwuerfel-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("goatcounter.com") || url.hostname === "gc.zgo.at") return;
  if (url.origin === self.location.origin){
    const rest = url.pathname.slice(SCOPE.length);
    if (/^v[^/]*\//.test(rest)) return;                       // alte Versionen nicht anfassen
    if (req.mode === "navigate" || rest === "" || rest === "index.html"){
      e.respondWith(fetch(new Request(url.href, { cache:"no-cache", credentials:"same-origin" })).then(r => { const copy = r.clone(); if (r.ok) caches.open(CACHE).then(c => c.put("./", copy)); return r; })
        .catch(() => caches.match("./")));
      return;
    }
    e.respondWith(caches.match(req, { ignoreSearch:true }).then(hit => hit || fetch(req).then(r => { if (r.ok){ const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; })));
    return;
  }
  if (url.hostname === "cdnjs.cloudflare.com" || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com"){
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
});
