// Flixworld Service Worker
// Caches static assets and pages for offline/fast loading.

const CACHE_VERSION = "v1";
const STATIC_CACHE = `flixworld-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `flixworld-images-${CACHE_VERSION}`;
const PAGE_CACHE = `flixworld-pages-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/offline",
];

// Install: pre-cache the shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key !== STATIC_CACHE &&
              key !== IMAGE_CACHE &&
              key !== PAGE_CACHE
          )
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: routing strategy per resource type
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin API calls, stream routes, and auth routes
  if (request.method !== "GET") return;
  if (
    url.pathname.startsWith("/api/stream/") ||
    url.pathname.startsWith("/api/hls-proxy") ||
    url.pathname.startsWith("/api/subtitle-proxy") ||
    url.pathname.startsWith("/api/thumbnails-proxy")
  ) {
    return; // let the browser handle these directly
  }

  // Next.js static assets (_next/static) — Cache First, very long TTL
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // TMDB & storage images — Cache First, 30 day TTL (handled by cache expiry is manual)
  if (
    url.hostname === "image.tmdb.org" ||
    url.hostname === "api-backend.jpaworx.com"
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached ?? new Response("Image unavailable", { status: 503 });
        }
      })
    );
    return;
  }

  // App pages — Network First, fall back to cache, then offline page
  if (url.origin === self.location.origin && !url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.open(PAGE_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          // Fall back to the offline page for navigation requests
          if (request.mode === "navigate") {
            const offline = await caches.match("/offline");
            if (offline) return offline;
          }
          return new Response("You are offline", { status: 503 });
        }
      })
    );
    return;
  }
});
