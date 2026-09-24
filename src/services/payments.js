/**
 * Payments service — real backend payment flow.
 *
 * Backend authority:
 * - payment amount
 * - tax
 * - shipping
 * - discount
 * - order state
 * - Stripe payment state
 * - stock reservation/release
 *
 * Public contract:
 * - create-intent -> { client_secret, payment_intent_id, order_number }
 * - confirm      -> { status, order_number, message }
 * - retry/switch/cancel use customer-facing order_number.
 *
 * Internal database order UUIDs never enter browser URLs.
 */
import { request } from '../api/client';
import {
  asId,
  asTrimmedString,
} from '../utils/dataTypes';

const PAYMENT_METHODS = new Set([
  'stripe',
  'cod',
]);

function requireId(
  value,
  field,
) {
  const id = asId(value);

  if (!id) {
    throw new TypeError(
      `A valid ${field} is required.`,
    );
  }

  return id;
}

function requirePublicOrderNumber(
  value,
) {
  const number =
    asTrimmedString(value);

  if (!number) {
    throw new TypeError(
      'A valid public order number is required.',
    );
  }

  return number;
}

function optionalString(value) {
  const clean =
    asTrimmedString(value);

  return clean || null;
}

function optionalPositiveInteger(
  value,
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number <= 0
  ) {
    return null;
  }

  return number;
}

function buildPaymentPayload(
  shippingAddressId,
  idempotencyKey,
  billingAddressId,
  couponCode,
  shippingCourierId,
) {
  const payload = {
    shipping_address_id:
      requireId(
        shippingAddressId,
        'shipping address id',
      ),

    idempotency_key:
      requireId(
        idempotencyKey,
        'idempotency key',
      ),
  };

  const billingId =
    asId(billingAddressId);

  if (billingId) {
    payload.billing_address_id =
      billingId;
  }

  const coupon =
    optionalString(couponCode);

  if (coupon) {
    payload.coupon_code =
      coupon;
  }

  const courierId =
    optionalPositiveInteger(
      shippingCourierId,
    );

  if (courierId !== null) {
    payload.shipping_courier_id =
      courierId;
  }

  return payload;
}

export const paymentService = {
  createIntent: (
    shippingAddressId,
    idempotencyKey,
    billingAddressId = null,
    couponCode = null,
    shippingCourierId = null,
  ) =>
    request(
      'POST',
      '/payments/create-intent',
      buildPaymentPayload(
        shippingAddressId,
        idempotencyKey,
        billingAddressId,
        couponCode,
        shippingCourierId,
      ),
    ),

  confirm: (
    paymentIntentId,
  ) =>
    request(
      'POST',
      '/payments/confirm',
      {
        payment_intent_id:
          requireId(
            paymentIntentId,
            'payment intent id',
          ),
      },
    ),

  notifyFailed: (
    paymentIntentId,
    errorMessage = '',
  ) =>
    request(
      'POST',
      '/payments/notify-failed',
      {
        payment_intent_id:
          requireId(
            paymentIntentId,
            'payment intent id',
          ),

        error_message:
          asTrimmedString(
            errorMessage,
          ),
      },
    ),

  createCodOrder: (
    shippingAddressId,
    idempotencyKey,
    billingAddressId = null,
    couponCode = null,
    shippingCourierId = null,
  ) =>
    request(
      'POST',
      '/orders/cod',
      {
        ...buildPaymentPayload(
          shippingAddressId,
          idempotencyKey,
          billingAddressId,
          couponCode,
          shippingCourierId,
        ),

        payment_method: 'cod',
      },
    ),

  retry: (
    orderNumber,
  ) => {
    const number =
      requirePublicOrderNumber(
        orderNumber,
      );

    return request(
      'POST',
      `/payments/retry/${encodeURIComponent(
        number,
      )}`,
      {},
    );
  },

  switchMethod: (
    orderNumber,
    method,
  ) => {
    const number =
      requirePublicOrderNumber(
        orderNumber,
      );

    const target =
      asTrimmedString(method)
        .toLowerCase();

    if (
      !PAYMENT_METHODS.has(target)
    ) {
      throw new TypeError(
        'A supported payment method is required.',
      );
    }

    const params =
      new URLSearchParams({
        method: target,
      });

    return request(
      'POST',
      `/payments/switch-method/${encodeURIComponent(
        number,
      )}?${params.toString()}`,
      {},
    );
  },

  cancelCheckout: (
    orderNumber,
  ) => {
    const number =
      requirePublicOrderNumber(
        orderNumber,
      );

    return request(
      'POST',
      `/payments/cancel/${encodeURIComponent(
        number,
      )}`,
      {},
    );
  },
};