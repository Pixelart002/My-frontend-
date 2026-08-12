/* ============================================================
   LUVIIO — Production Service Worker (Push Notifications)
   Path: /sw.js (Must be in Root Directory)
   ============================================================ */

// Pulls CONFIG.API_BASE so this file never drifts out of sync
// with js/config.js — single source of truth for the backend URL.
importScripts('/js/config.js');

const CACHE_NAME = 'luviio-push-v2';
const RESYNC_CACHE = 'luviio-push-resync';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Forces the waiting service worker to become the active service worker
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Takes control of all pages immediately
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Luviio', body: event.data.text(), url: '/' };
  }
  
  // 🔥 FIX: these files didn't exist (/img/logo.png 404s) — now point at
  // the real generated icons at the site root.
  const options = {
    body: data.body || '',
    icon: data.icon || '/src/icon-192.png',
    badge: data.badge || '/src/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: data.timestamp ? data.timestamp * 1000 : Date.now(),
    },
    actions: data.actions || [],
    tag: data.tag || 'luviio-notification',
    renotify: data.renotify !== undefined ? data.renotify : false,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Luviio Update', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  let targetUrl = event.notification.data?.url || '/';
  
  if (event.action && (event.action.startsWith('http') || event.action.startsWith('/'))) {
    targetUrl = event.action;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 🔥 NEW: browsers periodically rotate the push subscription's endpoint URL.
// Without this, the OLD endpoint saved in the DB silently goes stale and every
// future push just fails with no error anywhere — a very common "push randomly
// stopped working" root cause.
//
// The SW can't read localStorage (different storage context, no auth token),
// so it can't call POST /push/subscribe directly. Instead: resubscribe here,
// then stash the new subscription in a dedicated cache. js/push.js checks
// that cache on every page load and pushes it to the backend with the real
// JWT — this also handles the case where no tab is open when the rotation happens.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const oldKey = event.oldSubscription?.options?.applicationServerKey;
        const newSub = await self.registration.pushManager.subscribe(
          oldKey ? { userVisibleOnly: true, applicationServerKey: oldKey } : event.oldSubscription?.options
        );
        const cache = await caches.open(RESYNC_CACHE);
        await cache.put(
          '/__pending-resub__',
          new Response(JSON.stringify(newSub.toJSON()), { headers: { 'Content-Type': 'application/json' } })
        );
        // Best-effort real-time sync if a tab happens to be open right now.
        const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of windowClients) {
          client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', subscription: newSub.toJSON() });
        }
      } catch (err) {
        console.error('[SW] pushsubscriptionchange resubscribe failed:', err);
      }
    })()
  );
});