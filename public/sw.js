// CampusFind PWA Shell Service Worker
// Caches application shell assets only. Map vector tiles and API routes are never cached.

const CACHE_NAME = "campusfind-shell-v1";

const SHELL_ASSETS = [
  "/",
  "/kengeri",
  "/manifest.webmanifest",
  "/favicon.ico",
];

// Install: pre-cache application shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: purge stale cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API & tiles; cache-first for static shell assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Exclude API requests, third-party tile providers, and POST/PATCH/DELETE mutations
  if (
    event.request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("cartocdn.com") ||
    url.hostname.includes("openstreetmap.org") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("supabase.co")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background to keep cache updated
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
