/**
 * Orders service — real backend endpoints.
 */
import { downloadFile, request } from '../api/client';

export const orderService = {
  myOrders: (page = 1, pageSize = 10, statusFilter = null) => {
    let url = `/orders/my?page=${page}&page_size=${pageSize}`;
    if (statusFilter) url += `&status_filter=${encodeURIComponent(statusFilter)}`;
    return request('GET', url);
  },

  myOrder: (id) => request('GET', `/orders/my/${encodeURIComponent(id)}`),

  cancel: (id) => request('POST', `/orders/my/${encodeURIComponent(id)}/cancel`, {}),

  // Alternative checkout flow: create an order directly from cart without Stripe
  checkout: (shippingAddressId, notes = '', idempotencyKey = null) =>
    request('POST', '/orders/checkout', {
      shipping_address_id: shippingAddressId,
      notes: notes || undefined,
      idempotency_key: idempotencyKey || undefined,
    }),

  invoice: (id) => downloadFile(`/orders/${encodeURIComponent(id)}/invoice`, `invoice-${id}.pdf`),
};
