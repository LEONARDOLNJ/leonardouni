// Service Worker for Universidade Leonardo (UPM) - Academic Documents & Offline Cache
const CACHE_VERSION = "ul-academic-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const ACADEMIC_DOCS_CACHE = `${CACHE_VERSION}-docs`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Core static assets for offline fallback
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/robots.txt",
];

// Academic documents endpoint path prefix
const ACADEMIC_DOC_PREFIX = "/api/academic-docs";
const OFFLINE_FALLBACK_URL = "/";

// 1. Install Event: Cache Core Shell Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Static asset caching non-fatal error:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean Old Caches & Claim Clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("ul-") && name !== STATIC_CACHE && name !== ACADEMIC_DOCS_CACHE && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log("[SW] Deleting obsolete cache:", name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Routing & Caching Strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET requests and browser extensions
  if (event.request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // A. Academic Documents Cache-First Strategy
  if (url.pathname.startsWith(ACADEMIC_DOC_PREFIX) || url.pathname.includes("/academic-documents/")) {
    event.respondWith(
      caches.open(ACADEMIC_DOCS_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          console.warn("[SW] Network failed for academic doc, serving fallback if available", err);
          return (
            cachedResponse ||
            new Response(
              JSON.stringify({
                error: "Offline mode: Documento indisponível no cache offline.",
                offline: true,
              }),
              {
                headers: { "Content-Type": "application/json" },
                status: 503,
              }
            )
          );
        }
      })
    );
    return;
  }

  // B. Google Fonts & Static CDN Images: Stale-While-Revalidate
  if (
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.hostname.includes("images.unsplash.com")
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(event.request, networkRes.clone());
            }
            return networkRes;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // C. General Navigation & App Assets: Network-First with Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for offline recovery
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".png") ||
            url.pathname.endsWith(".jpg") ||
            url.pathname.endsWith(".svg"))
        ) {
          const resClone = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // If navigation request fails and no cache, return the root app
        if (event.request.mode === "navigate") {
          const rootCached = await caches.match("/");
          if (rootCached) return rootCached;
        }

        return new Response("Offline - Universidade Leonardo", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
  );
});

// 4. Message Event: Programmatic Cache Operations from React
self.addEventListener("message", (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  switch (type) {
    case "CACHE_ACADEMIC_DOC": {
      // Store a document in Cache Storage
      const { id, url, data, contentType } = payload;
      const targetUrl = url || `${ACADEMIC_DOC_PREFIX}/${id}`;
      const response = new Response(typeof data === "string" ? data : JSON.stringify(data), {
        headers: {
          "Content-Type": contentType || "application/json; charset=utf-8",
          "X-Cached-At": new Date().toISOString(),
          "X-Document-Id": id,
        },
      });

      caches.open(ACADEMIC_DOCS_CACHE).then((cache) => {
        cache.put(new Request(targetUrl), response).then(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true, id, url: targetUrl });
          }
        });
      });
      break;
    }

    case "REMOVE_CACHED_DOC": {
      const { id, url } = payload;
      const targetUrl = url || `${ACADEMIC_DOC_PREFIX}/${id}`;
      caches.open(ACADEMIC_DOCS_CACHE).then((cache) => {
        cache.delete(new Request(targetUrl)).then((deleted) => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: deleted, id });
          }
        });
      });
      break;
    }

    case "CLEAR_ACADEMIC_CACHE": {
      caches.delete(ACADEMIC_DOCS_CACHE).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      });
      break;
    }

    case "GET_CACHE_INFO": {
      caches.open(ACADEMIC_DOCS_CACHE).then(async (cache) => {
        const requests = await cache.keys();
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({
            count: requests.length,
            urls: requests.map((r) => r.url),
          });
        }
      });
      break;
    }

    case "SHOW_NOTIFICATION": {
      // Direct trigger of push notification via Service Worker registration
      if (!payload || !payload.title) break;
      const { title, body, icon, badge, data, tag, actions, requireInteraction, vibrate } = payload;

      const notificationOptions = {
        body: body || "Notificação da Secretaria Financeira da Universidade Leonardo",
        icon: icon || "/favicon.ico",
        badge: badge || "/favicon.ico",
        data: data || { url: "/portal" },
        tag: tag || `ul-notif-${Date.now()}`,
        renotify: true,
        requireInteraction: requireInteraction || false,
        vibrate: vibrate || [200, 100, 200],
        actions: actions || [
          { action: "open_url", title: "Ver Detalhes" },
          { action: "dismiss", title: "Dispensar" },
        ],
      };

      event.waitUntil(
        self.registration.showNotification(title, notificationOptions).then(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true, shown: true, tag: notificationOptions.tag });
          }
        }).catch((err) => {
          console.warn("[SW] Falha ao exibir notificação:", err);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: false, error: err.message });
          }
        })
      );
      break;
    }

    case "SKIP_WAITING": {
      self.skipWaiting();
      break;
    }
  }
});

// 5. Push Event: Handle Inbound Server Push or Web Push Protocol
self.addEventListener("push", (event) => {
  let pushData = {
    title: "Universidade Leonardo · Notificação Financeira",
    body: "Tem uma nova actualização sobre as suas propinas ou recibos.",
    url: "/portal",
    category: "general",
  };

  if (event.data) {
    try {
      pushData = event.data.json();
    } catch {
      pushData.body = event.data.text();
    }
  }

  const tag = pushData.tag || `ul-push-${Date.now()}`;
  const options = {
    body: pushData.body || "Nova notificação da Secretaria Académica e Financeira",
    icon: pushData.icon || "/favicon.ico",
    badge: pushData.badge || "/favicon.ico",
    data: {
      url: pushData.url || (pushData.category === "new_receipt" ? "/recibos" : "/portal"),
      id: pushData.id,
      category: pushData.category,
      timestamp: pushData.timestamp || new Date().toISOString(),
    },
    tag: tag,
    vibrate: [200, 100, 200, 100, 200],
    renotify: true,
    requireInteraction: pushData.category === "fee_deadline",
    actions: [
      {
        action: pushData.category === "new_receipt" ? "view_receipt" : "view_portal",
        title: pushData.category === "new_receipt" ? "📄 Abrir Recibo" : "💳 Ver Propinas",
      },
      {
        action: "dismiss",
        title: "Dispensar",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(pushData.title, options));
});

// 6. Notification Click Event: Focus Tab or Navigate to Target URL
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  const targetUrl = data.url || "/portal";

  notification.close();

  if (action === "dismiss") {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 7. Notification Close Event: Telemetry tracking
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notificação dispensada pelo utilizador:", event.notification.tag);
});

