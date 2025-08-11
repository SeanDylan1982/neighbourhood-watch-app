// Service Worker for Neibrly - Neighborhood Community App
const CACHE_NAME = "neibrly-app-v2";
const STATIC_CACHE = "neibrly-static-v2";
const DYNAMIC_CACHE = "neibrly-dynamic-v2";

// Essential files to cache for offline functionality
const STATIC_ASSETS = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/favicon.ico",
];

// Optional assets that enhance user experience
const OPTIONAL_ASSETS = [
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/badge-72x72.png",
];

// Install event - Cache essential resources
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn(
            "Service Worker: Failed to cache some static assets:",
            error
          );
          // Cache essential assets individually to avoid complete failure
          return Promise.allSettled(
            STATIC_ASSETS.map((url) =>
              cache
                .add(url)
                .catch((err) => console.warn(`Failed to cache ${url}:`, err))
            )
          );
        });
      }),

      // Cache optional assets (don't fail if these don't exist)
      caches.open(STATIC_CACHE).then((cache) => {
        return Promise.allSettled(
          OPTIONAL_ASSETS.map((url) =>
            cache
              .add(url)
              .catch((err) =>
                console.warn(`Optional asset not found: ${url}`, err)
              )
          )
        );
      }),
    ]).then(() => {
      console.log("Service Worker: Installation complete");
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

// Fetch event - Implement cache-first strategy with network fallback
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        console.log("Service Worker: Serving from cache:", event.request.url);
        return cachedResponse;
      }

      // Fetch from network and cache the response
      return fetch(event.request)
        .then((networkResponse) => {
          // Don't cache non-successful responses
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          // Clone the response before caching
          const responseToCache = networkResponse.clone();

          // Determine which cache to use
          const url = new URL(event.request.url);
          const isStaticAsset =
            STATIC_ASSETS.some((asset) => url.pathname === asset) ||
            OPTIONAL_ASSETS.some((asset) => url.pathname === asset) ||
            url.pathname.startsWith("/static/");

          const cacheName = isStaticAsset ? STATIC_CACHE : DYNAMIC_CACHE;

          caches.open(cacheName).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch((error) => {
          console.warn("Service Worker: Network fetch failed:", error);

          // Return offline fallback for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/").then((fallback) => {
              return (
                fallback ||
                new Response("Offline - Please check your connection", {
                  status: 503,
                  statusText: "Service Unavailable",
                  headers: { "Content-Type": "text/plain" },
                })
              );
            });
          }

          // For other requests, just throw the error
          throw error;
        });
    })
  );
});

// Push event - Handle push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push event received");

  // Default notification configuration
  let notificationData = {
    title: "Neibrly",
    body: "You have a new notification from your neighborhood",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "neibrly-notification",
    requireInteraction: false,
    vibrate: [200, 100, 200],
    silent: false,
    timestamp: Date.now(),
    actions: [
      {
        action: "view",
        title: "View",
        icon: "/icons/view-icon.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
        icon: "/icons/dismiss-icon.png",
      },
    ],
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log("Service Worker: Push data received:", pushData);

      notificationData = {
        ...notificationData,
        ...pushData,
        data: pushData, // Store original data for click handling
        timestamp: Date.now(),
      };

      // Customize notification based on type
      if (pushData.type) {
        switch (pushData.type) {
          case "message":
            notificationData.title = "New Message";
            notificationData.icon = "/icons/message-icon.png";
            break;
          case "friendRequest":
            notificationData.title = "Friend Request";
            notificationData.icon = "/icons/friend-icon.png";
            break;
          case "notice":
            notificationData.title = "New Notice";
            notificationData.icon = "/icons/notice-icon.png";
            break;
          case "report":
            notificationData.title = "Report Update";
            notificationData.icon = "/icons/report-icon.png";
            break;
          default:
            notificationData.title = "Neibrly";
        }
      }
    } catch (error) {
      console.error("Service Worker: Error parsing push data:", error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log("Service Worker: Notification displayed successfully");
      })
      .catch((error) => {
        console.error("Service Worker: Failed to show notification:", error);
      })
  );
});

// Notification click event - Handle user interaction with notifications
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked", event);

  // Close the notification
  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  // Handle dismiss action
  if (action === "dismiss") {
    console.log("Service Worker: Notification dismissed");
    return;
  }

  // Determine target URL based on notification type and data
  let targetUrl = "/dashboard"; // Default fallback

  if (notificationData.url) {
    // Use explicit URL if provided
    targetUrl = notificationData.url;
  } else if (notificationData.type) {
    // Generate URL based on notification type
    switch (notificationData.type) {
      case "friendRequest":
        targetUrl = "/contacts?tab=friends";
        break;
      case "message":
      case "privateMessage":
        targetUrl = notificationData.chatId
          ? `/chat/private/${notificationData.chatId}`
          : "/chat";
        break;
      case "groupMessage":
        targetUrl = notificationData.chatId
          ? `/chat/group/${notificationData.chatId}`
          : "/chat";
        break;
      case "notice":
        targetUrl = notificationData.referenceId
          ? `/notice-board/${notificationData.referenceId}`
          : "/notice-board";
        break;
      case "report":
        targetUrl = notificationData.referenceId
          ? `/reports/${notificationData.referenceId}`
          : "/reports";
        break;
      case "like":
      case "comment":
        targetUrl = notificationData.referenceId
          ? `/notice-board/${notificationData.referenceId}`
          : "/notice-board";
        break;
      default:
        targetUrl = "/notifications";
    }
  }

  // Handle the click event
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        console.log(`Service Worker: Found ${clientList.length} open windows`);

        // Check if the app is already open in any window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            console.log("Service Worker: Focusing existing window");

            // Focus the existing window and send navigation message
            return client.focus().then(() => {
              return client.postMessage({
                type: "NOTIFICATION_CLICK",
                url: targetUrl,
                data: notificationData,
                timestamp: Date.now(),
              });
            });
          }
        }

        // If no window is open, open a new one
        console.log("Service Worker: Opening new window");
        const fullUrl = self.location.origin + targetUrl;

        return clients.openWindow(fullUrl).then((windowClient) => {
          if (windowClient) {
            console.log("Service Worker: New window opened successfully");
            // Send data to the new window once it's loaded
            setTimeout(() => {
              windowClient.postMessage({
                type: "NOTIFICATION_CLICK",
                url: targetUrl,
                data: notificationData,
                timestamp: Date.now(),
              });
            }, 1000);
          }
          return windowClient;
        });
      })
      .catch((error) => {
        console.error(
          "Service Worker: Error handling notification click:",
          error
        );
      })
  );
});

// Background sync for offline functionality
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered:", event.tag);

  switch (event.tag) {
    case "background-notification-sync":
      event.waitUntil(syncPendingNotifications());
      break;
    case "offline-messages":
      event.waitUntil(syncOfflineMessages());
      break;
    default:
      console.log("Service Worker: Unknown sync tag:", event.tag);
  }
});

// Sync pending notifications when back online
async function syncPendingNotifications() {
  try {
    console.log("Service Worker: Syncing pending notifications");

    const pendingNotifications = await getPendingNotifications();
    console.log(
      `Service Worker: Found ${pendingNotifications.length} pending notifications`
    );

    for (const notification of pendingNotifications) {
      try {
        await self.registration.showNotification(
          notification.title,
          notification.options
        );
        console.log(
          "Service Worker: Displayed pending notification:",
          notification.title
        );
      } catch (error) {
        console.error(
          "Service Worker: Failed to show pending notification:",
          error
        );
      }
    }

    // Clear pending notifications after showing
    await clearPendingNotifications();
    console.log("Service Worker: Pending notifications sync complete");
  } catch (error) {
    console.error(
      "Service Worker: Error syncing pending notifications:",
      error
    );
  }
}

// Sync offline messages when back online
async function syncOfflineMessages() {
  try {
    console.log("Service Worker: Syncing offline messages");
    // This would integrate with your offline message queue
    // Implementation depends on your offline storage strategy
  } catch (error) {
    console.error("Service Worker: Error syncing offline messages:", error);
  }
}

// Get pending notifications from storage
async function getPendingNotifications() {
  try {
    // Try to get from IndexedDB first, fallback to localStorage
    if ("indexedDB" in self) {
      // IndexedDB implementation would go here
      return [];
    } else {
      // Fallback to a simple approach
      return [];
    }
  } catch (error) {
    console.error(
      "Service Worker: Error getting pending notifications:",
      error
    );
    return [];
  }
}

// Clear pending notifications from storage
async function clearPendingNotifications() {
  try {
    // Clear from storage after successful sync
    console.log("Service Worker: Clearing pending notifications");
  } catch (error) {
    console.error(
      "Service Worker: Error clearing pending notifications:",
      error
    );
  }
}

// Handle messages from main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker: Message received:", event.data);

  if (!event.data) return;

  switch (event.data.type) {
    case "SKIP_WAITING":
      console.log("Service Worker: Skipping waiting");
      self.skipWaiting();
      break;

    case "GET_VERSION":
      // Send version info back to client
      event.ports[0]?.postMessage({
        type: "VERSION_INFO",
        version: CACHE_NAME,
        timestamp: Date.now(),
      });
      break;

    case "CLEAR_CACHE":
      // Clear specific cache if requested
      const cacheName = event.data.cacheName;
      if (cacheName) {
        caches.delete(cacheName).then(() => {
          event.ports[0]?.postMessage({
            type: "CACHE_CLEARED",
            cacheName: cacheName,
          });
        });
      }
      break;

    default:
      console.log("Service Worker: Unknown message type:", event.data.type);
  }
});

// Activate event - Clean up old caches and take control
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        console.log("Service Worker: Found caches:", cacheNames);

        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete caches that don't match current version
            if (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== CACHE_NAME
            ) {
              console.log("Service Worker: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Take control of all clients immediately
      self.clients.claim(),
    ]).then(() => {
      console.log("Service Worker: Activation complete");
    })
  );
});

// Handle errors
self.addEventListener("error", (event) => {
  console.error("Service Worker: Global error:", event.error);
});

// Handle unhandled promise rejections
self.addEventListener("unhandledrejection", (event) => {
  console.error("Service Worker: Unhandled promise rejection:", event.reason);
  event.preventDefault(); // Prevent the default browser behavior
});

// Log service worker lifecycle
console.log("Service Worker: Script loaded", {
  caches: {
    static: STATIC_CACHE,
    dynamic: DYNAMIC_CACHE,
    main: CACHE_NAME,
  },
  timestamp: new Date().toISOString(),
});
