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

export const paymentService = {
  createIntent: (shippingAddressId, idempotencyKey, billingAddressId = null, couponCode = null) => {
    const payload = { shipping_address_id: shippingAddressId, idempotency_key: idempotencyKey };
    if (billingAddressId) payload.billing_address_id = billingAddressId;
    if (couponCode) payload.coupon_code = couponCode;
    return request('POST', '/payments/create-intent', payload);
  },

  confirm: (paymentIntentId) =>
    request('POST', '/payments/confirm', { payment_intent_id: paymentIntentId }),

  notifyFailed: (paymentIntentId, errorMessage = '') =>
    request('POST', '/payments/notify-failed', {
      payment_intent_id: paymentIntentId,
      error_message: errorMessage,
    }),

  // COD is a first-class order flow. It must not hit the Stripe/payment-intent endpoint.
  createCodOrder: (shippingAddressId, idempotencyKey, billingAddressId = null, couponCode = null) => {
    const payload = {
      shipping_address_id: shippingAddressId,
      payment_method: 'cod',
      idempotency_key: idempotencyKey,
    };
    if (billingAddressId) payload.billing_address_id = billingAddressId;
    if (couponCode) payload.coupon_code = couponCode;
    return request('POST', '/orders/cod', payload);
  },

  retry: (orderNumber) => request('POST', `/payments/retry/${encodeURIComponent(orderNumber)}`, {}),
};
