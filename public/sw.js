 /* Luviio production service worker: push notifications only. */

const RESYNC_CACHE = 'luviio-push-resync-v5';
const PENDING_RESUB_KEY = '/__pending-resub__';
const SAFE_DEFAULT_URL = '/';

const LEGACY_ROUTES = {
  '/orders.html': '/orders',
  '/cart.html': '/cart',
  '/admin.html': '/admin',
};


/* -------------------------------------------------------------------------- */
/* Lifecycle                                                                  */
/* -------------------------------------------------------------------------- */

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();

        await Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith('luviio-push-resync-') &&
                name !== RESYNC_CACHE
            )
            .map((name) => caches.delete(name))
        );
      } catch (error) {
        /*
         * Cache cleanup is housekeeping only.
         * A cleanup failure must not prevent SW activation.
         */
        console.error(
          '[Luviio SW] cache cleanup failed:',
          error
        );
      }

      await self.clients.claim();
    })()
  );
});


/* -------------------------------------------------------------------------- */
/* URL safety                                                                 */
/* -------------------------------------------------------------------------- */

const resolveNotificationUrl = (value) => {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return SAFE_DEFAULT_URL;
  }

  try {
    const url = new URL(
      value,
      self.location.origin
    );

    if (url.origin !== self.location.origin) {
      return SAFE_DEFAULT_URL;
    }

    const pathname =
      LEGACY_ROUTES[url.pathname] ||
      url.pathname;

    return (
      pathname +
      url.search +
      url.hash
    ) || SAFE_DEFAULT_URL;
  } catch {
    return SAFE_DEFAULT_URL;
  }
};


const toAbsoluteNotificationUrl = (value) => {
  const safePath = resolveNotificationUrl(value);

  try {
    return new URL(
      safePath,
      self.location.origin
    ).href;
  } catch {
    return new URL(
      SAFE_DEFAULT_URL,
      self.location.origin
    ).href;
  }
};


/* -------------------------------------------------------------------------- */
/* Notification assets                                                        */
/* -------------------------------------------------------------------------- */

const resolveNotificationAsset = (value) => {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return undefined;
  }

  try {
    const url = new URL(
      value,
      self.location.origin
    );

    /*
     * Keep notification assets same-origin.
     * This prevents arbitrary remote URLs from being accepted from
     * notification payloads.
     */
    if (url.origin !== self.location.origin) {
      return undefined;
    }

    return url.href;
  } catch {
    return undefined;
  }
};


/* -------------------------------------------------------------------------- */
/* Push                                                                       */
/* -------------------------------------------------------------------------- */

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
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

      const title =
        typeof data.title === 'string' &&
        data.title.trim()
          ? data.title.trim()
          : 'Luviio Update';

      const numericTimestamp =
        Number(data.timestamp);

      const timestamp =
        Number.isFinite(numericTimestamp)
          ? numericTimestamp * 1000
          : Date.now();

      const options = {
        body:
          typeof data.body === 'string'
            ? data.body
            : '',

        data: {
          url: resolveNotificationUrl(
            data.url
          ),
          timestamp,
        },

        tag:
          typeof data.tag === 'string' &&
          data.tag.trim()
            ? data.tag.trim()
            : 'luviio-notification',

        renotify:
          data.renotify === true,

        vibrate: [100, 50, 100],
      };


      if (Array.isArray(data.actions)) {
        options.actions = data.actions
          .filter(
            (action) =>
              action &&
              typeof action.action === 'string' &&
              action.action.startsWith('/') &&
              typeof action.title === 'string' &&
              action.title.trim()
          )
          .slice(0, 2)
          .map((action) => ({
            action: resolveNotificationUrl(
              action.action
            ),
            title: action.title.trim(),

            ...(resolveNotificationAsset(action.icon)
              ? {
                  icon: resolveNotificationAsset(
                    action.icon
                  ),
                }
              : {}),
          }));
      }


      const icon =
        resolveNotificationAsset(
          data.icon
        );

      const badge =
        resolveNotificationAsset(
          data.badge
        );

      if (icon) {
        options.icon = icon;
      }

      if (badge) {
        options.badge = badge;
      }

      await self.registration.showNotification(
        title,
        options
      );
    })()
  );
});


/* -------------------------------------------------------------------------- */
/* Notification click                                                         */
/* -------------------------------------------------------------------------- */

self.addEventListener(
  'notificationclick',
  (event) => {
    event.notification.close();

    const notificationUrl =
      event.notification.data?.url;

    /*
     * Action URLs are deliberately accepted only as SPA-relative paths.
     */
    const actionUrl =
      typeof event.action === 'string' &&
      event.action.startsWith('/')
        ? event.action
        : null;

    const targetUrl =
      toAbsoluteNotificationUrl(
        actionUrl || notificationUrl
      );

    event.waitUntil(
      (async () => {
        const windowClients =
          await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
          });

        for (const client of windowClients) {
          if (
            !client.url.startsWith(
              self.location.origin
            )
          ) {
            continue;
          }

          try {
            if (
              typeof client.navigate === 'function'
            ) {
              await client.navigate(targetUrl);
            }
          } catch (error) {
            console.error(
              '[Luviio SW] notification navigation failed:',
              error
            );
          }

          if (
            typeof client.focus === 'function'
          ) {
            return client.focus();
          }
        }

        if (
          typeof self.clients.openWindow ===
          'function'
        ) {
          return self.clients.openWindow(
            targetUrl
          );
        }

        return undefined;
      })()
    );
  }
);


/* -------------------------------------------------------------------------- */
/* Push subscription rotation                                                 */
/* -------------------------------------------------------------------------- */

self.addEventListener(
  'pushsubscriptionchange',
  (event) => {
    event.waitUntil(
      (async () => {
        try {
          const oldOptions =
            event.oldSubscription?.options;

          if (!oldOptions) {
            return;
          }

          const newSubscription =
            await self.registration.pushManager.subscribe(
              oldOptions
            );

          const serialized =
            newSubscription.toJSON();

          if (
            !serialized?.endpoint ||
            !serialized?.keys
          ) {
            throw new Error(
              'Invalid replacement push subscription.'
            );
          }

          const cache =
            await caches.open(
              RESYNC_CACHE
            );

          await cache.put(
            PENDING_RESUB_KEY,
            new Response(
              JSON.stringify(
                serialized
              ),
              {
                headers: {
                  'Content-Type':
                    'application/json',
                },
              }
            )
          );

          const windowClients =
            await self.clients.matchAll({
              type: 'window',
              includeUncontrolled: true,
            });

          for (const client of windowClients) {
            client.postMessage({
              type:
                'PUSH_SUBSCRIPTION_CHANGED',
              subscription:
                serialized,
            });
          }
        } catch (error) {
          console.error(
            '[Luviio SW] push subscription rotation failed:',
            error
          );
        }
      })()
    );
  }
);