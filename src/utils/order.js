/**
 * Order status labels and presentation metadata, matching the backend
 * OrderStatus enum values exactly (app/enums/order_status.py).
 */
export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const ORDER_STATUS_TONES = {
  pending: 'muted',
  paid: 'info',
  processing: 'info',
  shipped: 'gold',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'danger',
};

/**
 * Statuses in which the backend allows a customer to cancel
 * (OrderPolicy.assert_can_cancel -> pending, paid, processing).
 */
export const CANCELLABLE_STATUSES = ['pending', 'paid', 'processing'];

/**
 * Statuses in which the backend will serve an invoice PDF
 * (OrderPolicy.assert_can_download_invoice).
 */
export const INVOICE_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'refunded'];

export function orderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status || 'Unknown';
}

export function orderStatusTone(status) {
  return ORDER_STATUS_TONES[String(status || '').toLowerCase()] || 'muted';
}

export function canCancelOrder(status) {
  return CANCELLABLE_STATUSES.includes(String(status || '').toLowerCase());
}

export function canDownloadInvoice(status) {
  return INVOICE_STATUSES.includes(String(status || '').toLowerCase());
}
