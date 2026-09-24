import { loadStripe } from '@stripe/stripe-js';
import { API_BASE, STRIPE_PK } from '../config/env';

let stripePromise = null;

const STRIPE_PUBLISHABLE_KEY_PATTERN =
  /^pk_(test|live)_[A-Za-z0-9]+$/;

function normalizeKey(value) {
  const key = String(value ?? '').trim();
  
  return STRIPE_PUBLISHABLE_KEY_PATTERN.test(key) ?
    key :
    '';
}

export function getStripePublishableKey() {
  return normalizeKey(STRIPE_PK);
}

function extractRuntimePublishableKey(payload) {
  return normalizeKey(
    payload?.data?.stripe?.publishable_key ??
    payload?.stripe?.publishable_key ??
    payload?.data?.publishable_key,
  );
}

async function resolveStripePublishableKey() {
  const fallbackKey =
    getStripePublishableKey();
  
  try {
    const response = await fetch(
      `${API_BASE}/payments/public-config`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'omit',
        cache: 'no-store',
      },
    );
    
    if (!response.ok) {
      return fallbackKey;
    }
    
    const payload =
      await response.json();
    
    const runtimeKey =
      extractRuntimePublishableKey(
        payload,
      );
    
    return runtimeKey || fallbackKey;
  } catch {
    return fallbackKey;
  }
}

export function getStripePromise() {
  if (!stripePromise) {
    stripePromise = resolveStripePublishableKey()
      .then((key) => {
        if (!key) {
          return null;
        }
        
        return loadStripe(key);
      })
      .catch(() => null);
  }
  
  return stripePromise;
}

export function resetStripeConfigCache() {
  stripePromise = null;
}