/* Luviio production service worker: push notifications only. */

const RESYNC_CACHE = 'luviio-push-resync-v4';
const SAFE_DEFAULT_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith('luviio-push-resync-') && name !== RESYNC_CACHE)
        .map((name) => caches.delete(name)),
    );
    await self.clients.claim();
  })());
});

const resolveNotificationUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return SAFE_DEFAULT_URL;

  try {
    const url = new URL(value, self.location.origin);
    if (url.origin !== self.location.origin) return SAFE_DEFAULT_URL;
    return `${url.pathname}${url.search}${url.hash}` || SAFE_DEFAULT_URL;
  } catch {
    return SAFE_DEFAULT_URL;
  }
};

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let data = {};

    if (event.data) {
      try {
        data = event.data.json() || {};
      } catch {
        data = {
          title: 'Luviio',
          body: event.data.text(),
          url: SAFE_DEFAULT_URL,
        };
      }
    }

    const title = typeof data.title === 'string' && data.title.trim()
      ? data.title.trim()
      : 'Luviio Update';
    const options = {
      body: typeof data.body === 'string' ? data.body : '',
      data: {
        url: resolveNotificationUrl(data.url),
        timestamp: Number.isFinite(Number(data.timestamp))
          ? Number(data.timestamp) * 1000
          : Date.now(),
      },
      tag: typeof data.tag === 'string' && data.tag ? data.tag : 'luviio-notification',
      renotify: data.renotify === true,
      vibrate: [100, 50, 100],
    };

    if (Array.isArray(data.actions)) {
      options.actions = data.actions
        .filter((action) => action && typeof action.action === 'string' && typeof action.title === 'string')
        .slice(0, 2)
        .map((action) => ({
          action: action.action,
          title: action.title,
          ...(typeof action.icon === 'string' && action.icon ? { icon: action.icon } : {}),
        }));
    }

    // Only use notification assets when the backend supplies real public URLs.
    if (typeof data.icon === 'string' && data.icon) options.icon = data.icon;
    if (typeof data.badge === 'string' && data.badge) options.badge = data.badge;

    await self.registration.showNotification(title, options);
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationUrl = event.notification.data?.url;
  const actionUrl = event.action && event.action.startsWith('/') ? event.action : null;
  const targetUrl = resolveNotificationUrl(actionUrl || notificationUrl);

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

    for (const client of windowClients) {
      if (!client.url.startsWith(self.location.origin)) continue;
      if (typeof client.navigate === 'function') await client.navigate(targetUrl);
      if (typeof client.focus === 'function') return client.focus();
    }

    if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    return undefined;
  })());
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    try {
      const options = event.oldSubscription?.options;
      if (!options) return;

      const newSubscription = await self.registration.pushManager.subscribe(options);
      const serialized = newSubscription.toJSON();
      const cache = await caches.open(RESYNC_CACHE);
      await cache.put('/__pending-resub__', new Response(JSON.stringify(serialized), {
        headers: { 'Content-Type': 'application/json' },
      }));

      const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windowClients) {
        client.postMessage({
          type: 'PUSH_SUBSCRIPTION_CHANGED',
          subscription: serialized,
        });
      }
    } catch (error) {
      console.error('[Luviio SW] push subscription rotation failed:', error);
    }
  })());
});
