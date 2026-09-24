/**
 * Browser Push API integration for the Luviio backend.
 *
 * Security:
 * - VAPID private key never reaches the browser.
 * - The public VAPID key is fetched from the authenticated backend.
 * - Subscription state is synchronized with the backend.
 */
import { request } from '../api/client';

function isBrowser() {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined'
  );
}

function urlBase64ToUint8Array(value) {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      'Push notification configuration is unavailable.',
    );
  }

  const normalized =
    value
      .trim()
      .replace(/\s/g, '');

  if (
    !/^[A-Za-z0-9_-]+$/.test(
      normalized,
    )
  ) {
    throw new Error(
      'Push notification configuration is invalid.',
    );
  }

  const padding =
    '='.repeat(
      (4 - (normalized.length % 4)) % 4,
    );

  const base64 =
    `${normalized}${padding}`
      .replace(/-/g, '+')
      .replace(/_/g, '/');

  let raw;

  try {
    raw = window.atob(base64);
  } catch {
    throw new Error(
      'Push notification configuration is invalid.',
    );
  }

  const bytes =
    Uint8Array.from(
      Array.from(raw).map(
        (char) =>
          char.charCodeAt(0),
      ),
    );

  // Uncompressed P-256 public key:
  // 0x04 + 32-byte X + 32-byte Y.
  if (
    bytes.length !== 65 ||
    bytes[0] !== 0x04
  ) {
    throw new Error(
      'Push notification configuration is invalid.',
    );
  }

  return bytes;
}

function classifyPushError(error) {
  const name =
    error?.name || '';

  const message =
    String(
      error?.message ||
        error ||
        '',
    ).trim();

  if (
    name ===
    'NotAllowedError'
  ) {
    return new Error(
      'Notification permission was not granted.',
    );
  }

  if (
    name === 'AbortError' ||
    /push service error/i.test(
      message,
    ) ||
    /registration failed/i.test(
      message,
    )
  ) {
    return new Error(
      'The browser push service could not create a subscription on this device. ' +
        'Please update Chrome and Google Play services, then retry. ' +
        'If it still fails, clear Luviio site data and try again.',
    );
  }

  if (
    name === 'InvalidStateError'
  ) {
    return new Error(
      'Push notifications are temporarily unavailable. Please retry.',
    );
  }

  if (
    name === 'TypeError' ||
    /applicationServerKey|invalid/i.test(
      message,
    )
  ) {
    return new Error(
      'Push notification configuration is invalid.',
    );
  }

  return error instanceof Error
    ? error
    : new Error(
        'Unable to enable push notifications.',
      );
}

function assertPushSupport() {
  if (!isBrowser()) {
    throw new Error(
      'Push notifications are not available in this environment.',
    );
  }

  if (
    !window.isSecureContext
  ) {
    throw new Error(
      'Push notifications require a secure connection.',
    );
  }

  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    throw new Error(
      'Push notifications are not supported by this browser.',
    );
  }
}

async function getRegistration() {
  assertPushSupport();

  return navigator
    .serviceWorker
    .ready;
}

async function getVapidPublicKey() {
  const response =
    await request(
      'GET',
      '/push/vapid-key',
    );

  const key =
    response?.public_key ||
    response?.vapid_public_key ||
    response?.key;

  if (
    typeof key !== 'string' ||
    !key.trim()
  ) {
    throw new Error(
      'Push notification configuration is unavailable.',
    );
  }

  return key;
}

async function syncSubscription(
  subscription,
) {
  if (!subscription) {
    throw new Error(
      'A valid push subscription is required.',
    );
  }

  await request(
    'POST',
    '/push/subscribe',
    subscription.toJSON(),
  );

  return subscription;
}

export const pushService = {
  isSupported: () => {
    if (!isBrowser()) {
      return false;
    }

    return (
      window.isSecureContext &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  },

  getPermission: () => {
    if (
      !isBrowser() ||
      typeof Notification ===
        'undefined'
    ) {
      return 'unsupported';
    }

    return Notification.permission;
  },

  subscribe: async () => {
    assertPushSupport();

    const registration =
      await getRegistration();

    let permission =
      Notification.permission;

    if (
      permission === 'default'
    ) {
      permission =
        await Notification.requestPermission();
    }

    if (
      permission !== 'granted'
    ) {
      throw new Error(
        'Notification permission was not granted.',
      );
    }

    const existing =
      await registration
        .pushManager
        .getSubscription();

    if (existing) {
      return syncSubscription(
        existing,
      );
    }

    const publicKey =
      await getVapidPublicKey();

    const applicationServerKey =
      urlBase64ToUint8Array(
        publicKey,
      );

    let subscription;

    try {
      subscription =
        await registration
          .pushManager
          .subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
    } catch (error) {
      console.error(
        '[Luviio Push] subscription failed',
        {
          name:
            error?.name ||
            'UnknownError',
          message:
            error?.message ||
            String(error),
          permission,
          secureContext:
            window.isSecureContext,
        },
      );

      throw classifyPushError(
        error,
      );
    }

    return syncSubscription(
      subscription,
    );
  },

  unsubscribe: async () => {
    assertPushSupport();

    const registration =
      await getRegistration();

    const subscription =
      await registration
        .pushManager
        .getSubscription();

    if (!subscription) {
      return true;
    }

    /*
     * Sync backend first. If this fails, the browser subscription
     * remains active so the client does not become silently
     * unsubscribed from the server's perspective.
     */
    await request(
      'DELETE',
      '/push/unsubscribe',
      subscription.toJSON(),
    );

    await subscription.unsubscribe();

    return true;
  },

  status: () =>
    request(
      'GET',
      '/push/status',
    ),
};