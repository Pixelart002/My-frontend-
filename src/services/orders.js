/**
 * Orders service — public customer-facing identifiers only.
 * Internal database UUIDs are never used to construct public URLs.
 */
import { downloadFile, request } from '../api/client';
import { asId, asPositiveInteger, asTrimmedString } from '../utils/dataTypes';

function requirePublicNumber(value) {
  const orderNumber = asTrimmedString(value);
  if (!orderNumber) throw new TypeError('A valid public order number is required.');
  return orderNumber;
}

export const orderService = {
  myOrders: (page = 1, pageSize = 10, statusFilter = null) => {
    const safePage = asPositiveInteger(page);
    const safePageSize = asPositiveInteger(pageSize, 10);
    let url = `/orders/my?page=${safePage}&page_size=${safePageSize}`;
    const status = asTrimmedString(statusFilter);
    if (status) url += `&status_filter=${encodeURIComponent(status)}`;
    return request('GET', url);
  },

  myOrder: (orderNumber) =>
    request('GET', `/orders/my/${encodeURIComponent(requirePublicNumber(orderNumber))}`),

  cancel: (orderNumber) =>
    request('POST', `/orders/my/${encodeURIComponent(requirePublicNumber(orderNumber))}/cancel`, {}),

  checkout: (shippingAddressId, notes = '', idempotencyKey = null) => {
    const addressId = asId(shippingAddressId);
    if (!addressId) throw new TypeError('A valid shipping address id is required.');
    const cleanNotes = asTrimmedString(notes);
    const key = asTrimmedString(idempotencyKey);
    return request('POST', '/orders/checkout', {
      shipping_address_id: addressId,
      notes: cleanNotes || undefined,
      idempotency_key: key || undefined,
    });
  },

  invoice: (orderNumber, invoiceNumber = null) => {
    const publicOrderNumber = requirePublicNumber(orderNumber);
    const publicInvoiceNumber = asTrimmedString(invoiceNumber);
    return downloadFile(
      `/orders/${encodeURIComponent(publicOrderNumber)}/invoice`,
      `${publicInvoiceNumber || publicOrderNumber}.pdf`
    );
  },
};
