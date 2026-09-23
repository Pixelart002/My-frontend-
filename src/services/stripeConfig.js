import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PK } from '../config/env';
import { request } from '../api/client';

let stripePromise = null;
let resolvedPublishableKey = '';

const normalizeKey = (value) => {
  const key = String(value || '').trim();
  return /^pk_(test|live)_[A-Za-z0-9]+$/.test(key) ? key : '';
};

export async function getStripePublishableKey() {
  if (resolvedPublishableKey) return resolvedPublishableKey;
  try {
    const response = await request('GET', '/payments/public-config');
    const remoteKey = normalizeKey(response?.stripe?.publishable_key);
    if (remoteKey) {
      resolvedPublishableKey = remoteKey;
      return remoteKey;
    }
  } catch {
    // Fall back to the build-time public key for resilience during migration.
  }
  resolvedPublishableKey = normalizeKey(STRIPE_PK);
  return resolvedPublishableKey;
}

export async function getStripePromise() {
  if (stripePromise) return stripePromise;
  const key = await getStripePublishableKey();
  if (!key) return null;
  stripePromise = loadStripe(key);
  return stripePromise;
}

export function resetStripeConfigCache() {
  resolvedPublishableKey = '';
  stripePromise = null;
}
