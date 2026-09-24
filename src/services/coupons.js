/**
 * Customer coupon service.
 *
 * Backend authority:
 * - coupon existence
 * - validity / expiry
 * - eligibility
 * - minimum order requirements
 * - discount calculation
 * - maximum discount limits
 *
 * The frontend only normalizes the coupon code and forwards
 * the cart subtotal required by the existing API contract.
 */
import { request } from '../api/client';

function requireCouponCode(value) {
  const code = String(value ?? '')
    .trim()
    .toUpperCase();

  if (!code) {
    throw new TypeError(
      'A coupon code is required.',
    );
  }

  return code;
}

function requireCartSubtotal(value) {
  const subtotal = Number(value);

  if (
    !Number.isFinite(subtotal) ||
    subtotal < 0
  ) {
    throw new TypeError(
      'A valid cart subtotal is required.',
    );
  }

  return subtotal;
}

export const couponService = {
  apply: (
    code,
    cartSubtotal,
  ) =>
    request(
      'POST',
      '/coupons/apply',
      {
        code:
          requireCouponCode(code),
        cart_subtotal:
          requireCartSubtotal(
            cartSubtotal,
          ),
      },
    ),
};