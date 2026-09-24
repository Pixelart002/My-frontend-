import { loadStripe } from '@stripe/stripe-js';
import { API_BASE, STRIPE_PK } from '../config/env';

let stripePromise = null;

const normalizeKey = (value) => {
  const key = String(value || '').trim();
  return /^pk_(test|live)_[A-Za-z0-9]+$/.test(key) ? key : '';
};

export function getStripePublishableKey() {
  return normalizeKey(STRIPE_PK);
}

async function resolveStripePublishableKey() {
  try {
    const response = await fetch(`${API_BASE}/payments/public-config`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
    });
    if (response.ok) {
      const payload = await response.json();
      const runtimeKey = normalizeKey(
        payload?.data?.stripe?.publishable_key ||
        payload?.stripe?.publishable_key ||
        payload?.data?.publishable_key,
      );
      if (runtimeKey) return runtimeKey;
    }
  } catch {
    // Fall back to the build-time browser-safe key.
  }
  return getStripePublishableKey();
}

export function getStripePromise() {
  if (!stripePromise) {
    stripePromise = resolveStripePublishableKey().then((key) => {
      if (!key) return null;
      return loadStripe(key);
    });
  }
  return stripePromise;
}

export function resetStripeConfigCache() {
  stripePromise = null;
}
