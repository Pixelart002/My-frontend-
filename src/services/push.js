/**
 * Browser Push API integration for the Luviio backend.
 * The VAPID private key never reaches the browser; the public key is
 * fetched from the authenticated backend endpoint.
 */
import { request } from '../api/client';

const urlBase64ToUint8Array = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
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
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await request('POST', '/push/subscribe', subscription.toJSON());
    return subscription;
  },

  unsubscribe: async () => {
    const registration = await getRegistration();
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    try {
      await request('DELETE', '/push/unsubscribe', { endpoint });
    } catch (error) {
      // The browser subscription is already removed; backend cleanup can be retried.
      throw error;
    }

    return true;
  },

  status: async () => request('GET', '/push/status'),
};
