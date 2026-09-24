/**
 * Orders service — customer-facing order operations only.
 *
 * Security boundary:
 * - Public order numbers are used for customer-facing order/shipment URLs.
 * - Internal database UUIDs must never be used to construct public URLs.
 * - Final order totals, tax, shipping, discounts and order state remain
 *   authoritative on the backend.
 */
import {
  downloadFile,
  request,
} from '../api/client';

import {
  asId,
  asPositiveInteger,
  asTrimmedString,
} from '../utils/dataTypes';

function requirePublicNumber(value) {
  const orderNumber =
    asTrimmedString(value);

  if (!orderNumber) {
    throw new TypeError(
      'A valid public order number is required.',
    );
  }

  return orderNumber;
}

function positivePage(
  value,
  fallback = 1,
) {
  const page =
    asPositiveInteger(value);

  return page || fallback;
}

function positivePageSize(
  value,
  fallback = 10,
) {
  const pageSize =
    asPositiveInteger(value);

  return pageSize || fallback;
}

function buildOrdersUrl(
  page,
  pageSize,
  statusFilter,
) {
  const params =
    new URLSearchParams();

  params.set(
    'page',
    String(page),
  );

  params.set(
    'page_size',
    String(pageSize),
  );

  const status =
    asTrimmedString(
      statusFilter,
    );

  if (status) {
    params.set(
      'status_filter',
      status,
    );
  }

  return `/orders/my?${params.toString()}`;
}

export const orderService = {
  myOrders: (
    page = 1,
    pageSize = 10,
    statusFilter = null,
  ) =>
    request(
      'GET',
      buildOrdersUrl(
        positivePage(page),
        positivePageSize(pageSize),
        statusFilter,
      ),
    ),

  myOrder: (
    orderNumber,
  ) =>
    request(
      'GET',
      `/orders/my/${encodeURIComponent(
        requirePublicNumber(
          orderNumber,
        ),
      )}`,
    ),

  myShipment: (
    orderNumber,
  ) =>
    request(
      'GET',
      `/shipping/my/${encodeURIComponent(
        requirePublicNumber(
          orderNumber,
        ),
      )}`,
    ),

  cancel: (
    orderNumber,
  ) =>
    request(
      'POST',
      `/orders/my/${encodeURIComponent(
        requirePublicNumber(
          orderNumber,
        ),
      )}/cancel`,
      {},
    ),

  checkout: (
    shippingAddressId,
    notes = '',
    idempotencyKey = null,
    couponCode = null,
  ) => {
    const addressId =
      asId(shippingAddressId);

    if (!addressId) {
      throw new TypeError(
        'A valid shipping address id is required.',
      );
    }

    const cleanNotes =
      asTrimmedString(notes);

    const key =
      asTrimmedString(
        idempotencyKey,
      );

    const coupon =
      asTrimmedString(
        couponCode,
      );

    return request(
      'POST',
      '/orders/checkout',
      {
        shipping_address_id:
          addressId,

        notes:
          cleanNotes || undefined,

        idempotency_key:
          key || undefined,

        coupon_code:
          coupon || undefined,
      },
    );
  },

  invoice: (
    orderNumber,
    invoiceNumber = null,
  ) => {
    const publicOrderNumber =
      requirePublicNumber(
        orderNumber,
      );

    const publicInvoiceNumber =
      asTrimmedString(
        invoiceNumber,
      );

    const filename =
      `${publicInvoiceNumber || publicOrderNumber}.pdf`;

    return downloadFile(
      `/orders/${encodeURIComponent(
        publicOrderNumber,
      )}/invoice`,
      filename,
    );
  },
};