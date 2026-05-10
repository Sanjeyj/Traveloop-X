// Traveloop X Service Worker — Offline-first caching
const CACHE_NAME = "traveloop-x-v2";
const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache-first for static assets
  if (request.method === "GET" && !url.pathname.startsWith("/api/") && !url.hostname.includes("localhost:3001") && !url.hostname.includes("localhost:8000")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response.ok && response.type !== "opaque") {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => caches.match("/") || new Response("Offline", { status: 503 }));
      })
    );
    return;
  }

  // Network-first for API calls with offline fallback to IndexedDB data
  if (url.pathname.startsWith("/api/trips/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: "offline", cached: true }), {
          headers: { "Content-Type": "application/json" },
        });
      })
    );
  }
});

// Background sync for offline mutations
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-queue") {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  // Sync logic handled by the app via IndexedDB
  console.log("[SW] Background sync triggered");
}
