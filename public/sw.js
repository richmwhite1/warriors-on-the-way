// Warriors on the Way — Service Worker
// Minimal Phase 0 SW: cache shell, pass-through for API/auth routes.
// Web push is a secondary channel — primary notifications are Telegram/Discord.

const CACHE_NAME = "wotw-v1";
const SHELL_URLS = ["/", "/sign-in", "/manifest.json", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept auth, API, or Supabase requests
  if (
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co")
  ) {
    return;
  }

  // Network-first for navigation; fall back to cache
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((r) => r || caches.match("/"))
      )
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request))
  );
});

// Web push (secondary channel — Phase 4 wires this up properly)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Warriors on the Way", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
