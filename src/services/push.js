/**
 * Browser Push API integration for the Luviio backend.
 * The VAPID private key never reaches the browser; the public key is
 * fetched from the authenticated backend endpoint.
 */
import { request } from '../api/client';

const urlBase64ToUint8Array = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Push notification configuration is unavailable.');
  }

  const normalized = value.trim().replace(/\\s/g, '');
  if (!/^[A-Za-z0-9_-]+$/.test(normalized)) {
    throw new Error('Push notification configuration is invalid.');
  }

  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const base64 = `${normalized}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const bytes = Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));

  // Web Push VAPID applicationServerKey is an uncompressed P-256
  // public key: 0x04 followed by 64 bytes of X/Y coordinates.
  if (bytes.length !== 65 || bytes[0] !== 0x04) {
    throw new Error('Push notification configuration is invalid.');
  }

  return bytes;
};

const classifyPushError = (error) => {
  const name = error?.name || '';
  const message = String(error?.message || error || '').trim();

  if (name === 'NotAllowedError') {
    return new Error('Notification permission was not granted.');
  }

  if (
    name === 'AbortError' ||
    /push service error/i.test(message) ||
    /registration failed/i.test(message)
  ) {
    return new Error(
      'The browser push service could not create a subscription on this device. ' +
      'Please update Chrome and Google Play services, then retry. ' +
      'If it still fails, clear Luviio site data and try again.'
    );
  }

  if (name === 'TypeError' || /applicationServerKey|invalid/i.test(message)) {
    return new Error('Push notification configuration is invalid.');
  }

  return error instanceof Error ? error : new Error('Unable to enable push notifications.');
};

const getRegistration = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported by this browser.');
  }
  return navigator.serviceWorker.ready;
};

const getVapidPublicKey = async () => {
  const response = await request('GET', '/push/vapid-key');
  const key = response?.public_key || response?.vapid_public_key || response?.key;
  if (!key) throw new Error('Push notification configuration is unavailable.');
  return key;
};

export const pushService = {
  isSupported: () => 'serviceWorker' in navigator && 'PushManager' in window,

  getPermission: () => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission),

  subscribe: async () => {
    if (!pushService.isSupported()) {
      throw new Error('Push notifications are not supported by this browser.');
    }

    const registration = await getRegistration();
    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted.');
    }

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await request('POST', '/push/subscribe', existing.toJSON());
      return existing;
    }

    const publicKey = await getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    let subscription;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    } catch (error) {
      console.error('[Luviio Push] subscription failed', {
        name: error?.name || 'UnknownError',
        message: error?.message || String(error),
        permission,
        secureContext: window.isSecureContext,
      });
      throw classifyPushError(error);
    }

    await request('POST', '/push/subscribe', subscription.toJSON());
    return subscription;
  },

  unsubscribe: async () => {
    const registration = await getRegistration();
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    // Backend expects the same PushSubscription shape used by /push/subscribe.
    await request('DELETE', '/push/unsubscribe', subscription.toJSON());
    await subscription.unsubscribe();
    return true;
  },

  status: async () => request('GET', '/push/status'),
};
