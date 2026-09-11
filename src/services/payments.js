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
  createIntent: (shippingAddressId, idempotencyKey, billingAddressId = null, couponCode = null) => {
    const payload = {
      shipping_address_id: requireId(shippingAddressId, 'shipping address id'),
      idempotency_key: requireId(idempotencyKey, 'idempotency key'),
    };
    const billingId = asId(billingAddressId);
    const coupon = optionalString(couponCode);
    if (billingId) payload.billing_address_id = billingId;
    if (coupon) payload.coupon_code = coupon;
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

  createCodOrder: (shippingAddressId, idempotencyKey, billingAddressId = null, couponCode = null) => {
    const payload = {
      shipping_address_id: requireId(shippingAddressId, 'shipping address id'),
      payment_method: 'cod',
      idempotency_key: requireId(idempotencyKey, 'idempotency key'),
    };
    const billingId = asId(billingAddressId);
    const coupon = optionalString(couponCode);
    if (billingId) payload.billing_address_id = billingId;
    if (coupon) payload.coupon_code = coupon;
    return request('POST', '/orders/cod', payload);
  },

  retry: (orderNumber) => {
    const number = asTrimmedString(orderNumber);
    if (!number) throw new TypeError('A valid public order number is required.');
    return request('POST', `/payments/retry/${encodeURIComponent(number)}`, {});
  },

  cancelCheckout: async (orderNumber) => {
    const number = asTrimmedString(orderNumber);
    if (!number) throw new TypeError('A valid public order number is required.');

    // Cancellation is authoritative on the order backend first. Once the
    // order is successfully cancelled, the abandoned checkout cart must not
    // remain in the customer's active cart. Cart cleanup is best-effort so a
    // transient cart request cannot make a successfully cancelled order look
    // like a failed cancellation to the customer.
    const result = await request('POST', `/payments/cancel/${encodeURIComponent(number)}`, {});
    try {
      await request('DELETE', '/cart');
    } catch (cartError) {
      // The order is already cancelled; preserve that authoritative result.
      // The next cart load will reconcile with the backend if cleanup failed.
      console.warn('Checkout cancellation succeeded but cart cleanup failed.', cartError);
    }
    return result;
  },
};
