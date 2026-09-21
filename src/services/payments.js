/**
 * Payments service — real Stripe-backed backend flow.
 *
 * Public contract:
 *   create-intent -> { client_secret, payment_intent_id, order_number }
 *   confirm      -> { status, order_number, message }
 *   retry        -> uses the customer-facing order_number in its URL.
 * Internal database order UUIDs never enter browser URLs or public references.
 */
import { request } from '../api/client';
import { asId, asTrimmedString } from '../utils/dataTypes';

function requireId(value, field) {
  const id = asId(value);
  if (!id) throw new TypeError(`A valid ${field} is required.`);
  return id;
}

function optionalString(value) {
  const clean = asTrimmedString(value);
  return clean || null;
}

export const paymentService = {
  createIntent: (shippingAddressId, idempotencyKey, billingAddressId = null, couponCode = null, shippingCourierId = null) => {
    const payload = {
      shipping_address_id: requireId(shippingAddressId, 'shipping address id'),
      idempotency_key: requireId(idempotencyKey, 'idempotency key'),
    };
    const billingId = asId(billingAddressId);
    const coupon = optionalString(couponCode);
    if (billingId) payload.billing_address_id = billingId;
    if (coupon) payload.coupon_code = coupon;
    if (Number.isInteger(Number(shippingCourierId)) && Number(shippingCourierId) > 0) payload.shipping_courier_id = Number(shippingCourierId);
    return request('POST', '/payments/create-intent', payload);
  },

  confirm: (paymentIntentId) =>
    request('POST', '/payments/confirm', {
      payment_intent_id: requireId(paymentIntentId, 'payment intent id'),
    }),

  notifyFailed: (paymentIntentId, errorMessage = '') =>
    request('POST', '/payments/notify-failed', {
      payment_intent_id: requireId(paymentIntentId, 'payment intent id'),
      error_message: asTrimmedString(errorMessage),
    }),

  createCodOrder: (shippingAddressId, idempotencyKey, billingAddressId = null, couponCode = null, shippingCourierId = null) => {
    const payload = {
      shipping_address_id: requireId(shippingAddressId, 'shipping address id'),
      payment_method: 'cod',
      idempotency_key: requireId(idempotencyKey, 'idempotency key'),
    };
    const billingId = asId(billingAddressId);
    const coupon = optionalString(couponCode);
    if (billingId) payload.billing_address_id = billingId;
    if (coupon) payload.coupon_code = coupon;
    if (Number.isInteger(Number(shippingCourierId)) && Number(shippingCourierId) > 0) payload.shipping_courier_id = Number(shippingCourierId);
    return request('POST', '/orders/cod', payload);
  },

  retry: (orderNumber) => {
    const number = asTrimmedString(orderNumber);
    if (!number) throw new TypeError('A valid public order number is required.');
    return request('POST', `/payments/retry/${encodeURIComponent(number)}`, {});
  },

  switchMethod: (orderNumber, method) => {
    const number = asTrimmedString(orderNumber);
    const target = asTrimmedString(method).toLowerCase();
    if (!number) throw new TypeError('A valid public order number is required.');
    if (!['stripe', 'cod'].includes(target)) throw new TypeError('A supported payment method is required.');
    return request('POST', `/payments/switch-method/${encodeURIComponent(number)}?method=${encodeURIComponent(target)}`, {});
  },

  cancelCheckout: (orderNumber) => {
    const number = asTrimmedString(orderNumber);
    if (!number) throw new TypeError('A valid public order number is required.');

    // The backend cancellation RPC is the single source of truth. It cancels
    // the pending checkout and releases reserved stock. Cancelled order items
    // are intentionally not restored to the customer's cart.
    return request('POST', `/payments/cancel/${encodeURIComponent(number)}`, {});
  },
};
