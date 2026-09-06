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

/**
 * API base URL, resolved in priority order:
 *   1. VITE_API_BASE env var (set at build time)
 *   2. The live backend in development and production.
 *
 * Production intentionally targets the backend directly. This avoids a
 * Vercel rewrite masking backend route failures as frontend 404 responses.
 */
export const API_BASE = stripTrailingSlash(
  import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? DEV_API_BASE : PROD_API_BASE),
);

/** Stripe publishable key — safe for browsers. */
export const STRIPE_PK =
  import.meta.env.VITE_STRIPE_PK ||
  'pk_test_51LQQdRSDXqp6jmyTe96SuttCSgDD91Yu90PsGPLuw9liYziNa1TT0Yhi01fRdNuh5k656lM93wRYTjJZK7vzJBzL00FQaIQXYa';

export const APP_NAME = 'Luviio';

/** Currency used across the store (mirrors backend cart/order currency). */
export const CURRENCY = 'INR';
