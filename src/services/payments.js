/**
 * Payments service — real Stripe-backed backend flow.
 *
 * Flow:
 *   1. POST /payments/create-intent -> { client_secret, payment_intent_id, order_id, order_number }
 *   2. Complete payment in the browser with Stripe Elements using the client_secret.
 *   3. POST /payments/confirm { payment_intent_id } -> { status, order_id, message }
 *   4. On failure, POST /payments/notify-failed (best-effort) so the backend logs it.
 */
import { request } from '../api/client';

export const paymentService = {
  createIntent: (shippingAddressId, idempotencyKey, billingAddressId = null) => {
    const payload = { shipping_address_id: shippingAddressId, idempotency_key: idempotencyKey };
    if (billingAddressId) payload.billing_address_id = billingAddressId;
    return request('POST', '/payments/create-intent', payload);
  },

  confirm: (paymentIntentId) =>
    request('POST', '/payments/confirm', { payment_intent_id: paymentIntentId }),

  notifyFailed: (paymentIntentId, errorMessage = '') =>
    request('POST', '/payments/notify-failed', {
      payment_intent_id: paymentIntentId,
      error_message: errorMessage,
    }),

  retry: (orderId) => request('POST', `/payments/retry/${encodeURIComponent(orderId)}`, {}),
};
