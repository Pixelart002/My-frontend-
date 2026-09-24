/**
 * Order status labels and presentation metadata.
 *
 * These values mirror the backend OrderStatus enum.
 * Backend remains authoritative for:
 * - valid status transitions
 * - cancellation eligibility
 * - invoice availability
 * - refunds
 * - order permissions
 */

export const ORDER_STATUS_LABELS = Object.freeze({
  pending: 'Pending',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
});

export const ORDER_STATUS_TONES = Object.freeze({
  pending: 'muted',
  paid: 'info',
  processing: 'info',
  shipped: 'gold',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'danger',
});

/**
 * Customer-cancellable statuses according to the backend
 * OrderPolicy.assert_can_cancel contract.
 */
export const CANCELLABLE_STATUSES = Object.freeze([
  'pending',
  'paid',
  'processing',
]);

/**
 * Statuses where the UI may expose invoice download.
 *
 * Backend remains authoritative and may still reject the request.
 */
export const INVOICE_STATUSES = Object.freeze([
  'paid',
  'processing',
  'shipped',
  'delivered',
]);

function normalizeStatus(status) {
  if (
    status === null ||
    status === undefined
  ) {
    return '';
  }
  
  return String(status)
    .trim()
    .toLowerCase();
}

export function orderStatusLabel(status) {
  const normalized =
    normalizeStatus(status);
  
  return (
    ORDER_STATUS_LABELS[normalized] ??
    (String(status ?? '').trim() || 'Unknown')
  );
}

export function orderStatusTone(status) {
  const normalized =
    normalizeStatus(status);
  
  return (
    ORDER_STATUS_TONES[normalized] ??
    'muted'
  );
}

export function canCancelOrder(status) {
  return CANCELLABLE_STATUSES.includes(
    normalizeStatus(status),
  );
}

export function canDownloadInvoice(status) {
  return INVOICE_STATUSES.includes(
    normalizeStatus(status),
  );
}