/**
 * Customer coupon service.
 * Coupon validity and discount calculation remain authoritative on the backend.
 */
import { request } from '../api/client';

export const couponService = {
  apply: (code, cartSubtotal) =>
    request('POST', '/coupons/apply', {
      code: String(code || '').trim().toUpperCase(),
      cart_subtotal: Number(cartSubtotal) || 0,
    }),
};
