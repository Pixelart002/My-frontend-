/**
 * Centralized, environment-driven configuration.
 *
 * SECURITY: Nothing in this file is secret. The API base and Stripe publishable
 * key are safe to expose in a browser bundle by design. Never place server-only
 * credentials (e.g. SB_SERVICE_ROLE_KEY, Stripe secret key, Supabase service key)
 * in client-side code.
 */

const LIVE_API_BASE = 'https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app/api/v1';
const DEV_API_BASE = LIVE_API_BASE;

const stripTrailingSlash = (value) => (value || '').replace(/\/+$/, '');
const normalizeApiBase = (value) => {
  const base = stripTrailingSlash(value);
  if (!base) return '';
  return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
};

/**
 * Production uses the Vercel same-origin /api proxy so HttpOnly auth cookies
 * stay on the storefront origin. A VITE_API_BASE override is still supported
 * for explicit deployments, while development keeps using the live API unless
 * a VITE_API_BASE value is supplied.
 */
export const API_BASE = normalizeApiBase(
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? '/api/v1' : DEV_API_BASE),
);

/** Stripe publishable key — safe for browsers. */
export const STRIPE_PK =
  import.meta.env.VITE_STRIPE_PK ||
  import.meta.env.STRIPE_PK ||
  '';

export const APP_NAME = 'Luviio';

/** Currency used across the store (mirrors backend cart/order currency). */
export const CURRENCY = 'INR';
