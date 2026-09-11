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
// Production uses Vercel's same-origin /api proxy. This avoids browser-level
// DNS/CORS failures against the Koyeb hostname while keeping the backend URL
// configurable for local development and explicit deployments.
const PROD_API_BASE = '/api/v1';

const stripTrailingSlash = (value) => (value || '').replace(/\/+$/, '');
const normalizeApiBase = (value) => {
  const base = stripTrailingSlash(value);
  if (!base) return '';
  return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
};

/**
 * API base URL, resolved in priority order:
 *   1. VITE_API_BASE env var (set at build time)
 *   2. The same-origin Vercel /api proxy in production.
 *   3. The live backend in development.
 */
export const API_BASE = normalizeApiBase(
  import.meta.env.VITE_API_BASE ||
  import.meta.env.NEXT_PUBLIC_API_URL ||
  (import.meta.env.DEV ? DEV_API_BASE : PROD_API_BASE),
);

/** Stripe publishable key — safe for browsers. */
export const STRIPE_PK =
  import.meta.env.VITE_STRIPE_PK ||
  import.meta.env.STRIPE_PK ||
  '';

export const APP_NAME = 'Luviio';

/** Currency used across the store (mirrors backend cart/order currency). */
export const CURRENCY = 'INR';