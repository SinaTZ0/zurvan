// The site's service worker (registered by `app/lib/register-service-worker.ts`; docs/mobile-app.md). It does one
// thing: when a page can't load because there is no network, it shows the offline page instead of the browser's error.
// Nothing else is cached or answered here, so the site behaves exactly as it would without a worker, and a deploy can
// never be hidden behind a stale copy.

/*===== Offline Page =====*/
// Bump the version whenever the offline page, its copy or the files it uses change: a new name makes every browser
// download them again on its next visit and drops the old copy.
const OFFLINE_CACHE = "offline-v1";

// The addresses in `app/lib/pwa.ts` (`PWA_OFFLINE_PATH`, `?lang=en` for English).
const OFFLINE_FA = "/pwa/offline";
const OFFLINE_EN = "/pwa/offline?lang=en";

// Everything the offline page loads: it can't reach the network, so it has only what is precached here.
const OFFLINE_FILES = [
  OFFLINE_FA,
  OFFLINE_EN,
  "/pwa/fonts/vazirmatn-arabic-wght-normal.woff2",
  "/pwa/fonts/vazirmatn-latin-wght-normal.woff2",
  "/pwa/fonts/marhey-vf.woff2",
  "/brand/k9-logo-128.webp",
  "/photo/new-design/offline.webp",
];

// Requests that are not pages a person opens: auth and payment returns, the API and Start's server functions. They go
// straight to the network, worker or not.
const PASS_THROUGH = ["/api/", "/rpc/", "/payment/", "/_serverFn/"];

/*===== Lifecycle =====*/
self.addEventListener("install", (event) => {
  // `reload` skips the browser's HTTP cache, so a new version never precaches yesterday's copy.
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll(OFFLINE_FILES.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== OFFLINE_CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

/*===== Requests =====*/
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /*------ The offline page's own files ------*/
  // Served from the cache only when the network fails, so the offline page can load them while the rest of the site
  // keeps getting them fresh.
  if (url.origin === self.location.origin && OFFLINE_FILES.includes(url.pathname + url.search)) {
    if (request.mode === "navigate") return;
    event.respondWith(fetch(request).catch(() => caches.match(url.pathname + url.search)));
    return;
  }

  /*------ Pages ------*/
  if (request.mode !== "navigate" || url.origin !== self.location.origin) return;
  if (PASS_THROUGH.some((prefix) => url.pathname.startsWith(prefix))) return;

  const english = url.pathname === "/en" || url.pathname.startsWith("/en/");
  event.respondWith(fetch(request).catch(() => caches.match(english ? OFFLINE_EN : OFFLINE_FA)));
});
