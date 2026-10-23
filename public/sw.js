/* Just One More Thing — service worker.
   Cache-first for the app shell so the ledger works fully offline.
   Bump VERSION whenever the shell changes. */
const VERSION = "jomt-v4";
const SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await cache.addAll(SHELL);
      // The bundle filenames are hashed, so discover them from index.html and
      // precache them too — otherwise the first visit never caches the JS/CSS
      // (the page loads before this worker takes control).
      try {
        const html = await (await fetch("/index.html")).text();
        const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
        if (assets.length) await cache.addAll(assets);
      } catch {
        /* shell alone still lets the worker install; assets cache at runtime */
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html", { ignoreSearch: true, ignoreVary: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true, ignoreVary: true }).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
    )
  );
});
