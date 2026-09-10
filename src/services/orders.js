/**
 * Orders service — public customer-facing identifiers only.
 * Internal database UUIDs are never used to construct public URLs.
 */
import { downloadFile, request } from '../api/client';

export const orderService = {
  myOrders: (page = 1, pageSize = 10, statusFilter = null) => {
    let url = `/orders/my?page=${page}&page_size=${pageSize}`;
    if (statusFilter) url += `&status_filter=${encodeURIComponent(statusFilter)}`;
    return request('GET', url);
  },

  myOrder: (orderNumber) => request('GET', `/orders/my/${encodeURIComponent(orderNumber)}`),

  cancel: (orderNumber) => request('POST', `/orders/my/${encodeURIComponent(orderNumber)}/cancel`, {}),

  // Alternative checkout flow: create an order directly from cart without Stripe
  checkout: (shippingAddressId, notes = '', idempotencyKey = null) =>
    request('POST', '/orders/checkout', {
      shipping_address_id: shippingAddressId,
      notes: notes || undefined,
      idempotency_key: idempotencyKey || undefined,
    }),

  invoice: (orderNumber, invoiceNumber = null) => {
    const publicOrderNumber = String(orderNumber || '').trim();
    if (!publicOrderNumber) throw new Error('A valid order number is required for invoice download.');
    const publicInvoiceNumber = String(invoiceNumber || '').trim();
    return downloadFile(
      `/orders/${encodeURIComponent(publicOrderNumber)}/invoice`,
      `${publicInvoiceNumber || publicOrderNumber}.pdf`
    );
  },
};
