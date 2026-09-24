import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PK } from '../config/env';

let stripePromise = null;

const normalizeKey = (value) => {
  const key = String(value || '').trim();
  return /^pk_(test|live)_[A-Za-z0-9]+$/.test(key) ? key : '';
};

export function getStripePublishableKey() {
  return normalizeKey(STRIPE_PK);
}

export function getStripePromise() {
  if (!stripePromise) {
    const key = getStripePublishableKey();
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

export function resetStripeConfigCache() {
  stripePromise = null;
}
