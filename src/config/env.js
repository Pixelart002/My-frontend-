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
const PROD_API_BASE = LIVE_API_BASE;

const stripTrailingSlash = (value) => (value || '').replace(/\/+$/, '');
const normalizeApiBase = (value) => {
  const base = stripTrailingSlash(value);
  if (!base) return '';
  return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
};

export const API_BASE = normalizeApiBase(
  import.meta.env.VITE_API_BASE ||
  import.meta.env.NEXT_PUBLIC_API_URL ||
  (import.meta.env.DEV ? DEV_API_BASE : PROD_API_BASE),
);

/**
 * Stripe publishable key. All supported names are public/browser-safe values.
 * Prefer VITE_STRIPE_PK; aliases keep existing Vercel configurations working.
 */
const DEFAULT_STRIPE_PUBLISHABLE_KEY = 'pk_test_51LQQdRSDXqp6jmyTe96SuttCSgDD91Yu90PsGPLuw9liYziNa1TT0Yhi01fRdNuh5k656lM93wRYTjJZK7vzJBzL00FQaIQXYa';

export const STRIPE_PK = String(
  import.meta.env.VITE_STRIPE_PK ||
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
  import.meta.env.NEXT_PUBLIC_STRIPE_PK ||
  import.meta.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  import.meta.env.STRIPE_PK ||
  import.meta.env.STRIPE_PUBLISHABLE_KEY ||
  DEFAULT_STRIPE_PUBLISHABLE_KEY,
).trim();

export const APP_NAME = 'Luviio';
export const CURRENCY = 'INR';
