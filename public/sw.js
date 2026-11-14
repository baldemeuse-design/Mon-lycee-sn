/* Service worker de Mon Lycée SN
   - l'appli (page, icônes) est gardée en cache pour s'ouvrir sans Internet ;
   - les PDF enregistrés par l'élève sont servis depuis le cache « mlsn-pdf-v1 » ;
   - les polices Google sont gardées en cache après le premier chargement. */
const VERSION = "mlsn-app-v2";
const CACHE_PDF = "mlsn-pdf-v1";
const CACHE_POLICES = "mlsn-polices-v1";
const COQUILLE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(cles => Promise.all(
    cles.filter(k => k.startsWith("mlsn-app-") && k !== VERSION).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // PDF : d'abord le cache (lecture hors connexion), sinon Internet
  if (url.origin === location.origin && url.pathname.endsWith(".pdf")) {
    e.respondWith(caches.open(CACHE_PDF).then(c => c.match(req, {ignoreSearch: true}))
      .then(r => r || fetch(req)));
    return;
  }
  // Polices Google : cache, mis à jour en arrière-plan
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(CACHE_POLICES).then(async c => {
      const enCache = await c.match(req);
      const reseau = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => enCache);
      return enCache || reseau;
    }));
    return;
  }
  // Page et fichiers de l'appli : d'abord Internet (pour avoir la dernière version), sinon le cache
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const copie = r.clone(); caches.open(VERSION).then(c => c.put(req, copie)); }
      return r;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match("index.html"))));
  }
});
