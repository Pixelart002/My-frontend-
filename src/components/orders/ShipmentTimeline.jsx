import {
  RiCheckboxCircleLine,
  RiTruckLine,
  RiTimeLine,
  RiFileTextLine,
  RiAlertLine,
} from '@remixicon/react';

const ONLINE_STEPS = [
  ['pending', 'Payment pending', RiFileTextLine],
  ['paid', 'Payment received', RiFileTextLine],
  ['processing', 'Processing', RiTimeLine],
  ['shipped', 'Shipped', RiTruckLine],
  ['delivered', 'Delivered', RiCheckboxCircleLine],
];

const COD_STEPS = [
  ['pending', 'Order placed', RiFileTextLine],
  ['processing', 'Processing', RiTimeLine],
  ['paid', 'COD paid', RiFileTextLine],
  ['shipped', 'Shipped', RiTruckLine],
  ['delivered', 'Delivered', RiCheckboxCircleLine],
];

const normalizeStatus = (value) =>
  String(value || '').trim().toLowerCase();

const formatDateTime = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const statusMeta = (status, isCod) => {
  if (status === 'delivered') {
    return { tone: 'success', title: 'Delivered', icon: RiCheckboxCircleLine };
  }

  if (status === 'cancelled' || status === 'refunded') {
    return {
      tone: 'warning',
      title: status === 'refunded' ? 'Refunded' : 'Cancelled',
      icon: RiAlertLine,
    };
  }

  if (status === 'shipped') {
    return { tone: 'info', title: 'Shipped', icon: RiTruckLine };
  }

  if (status === 'processing') {
    return { tone: 'info', title: 'Processing', icon: RiTimeLine };
  }

  if (status === 'paid') {
    return {
      tone: 'info',
      title: isCod ? 'COD paid · Ready to ship' : 'Payment received · Ready to process',
      icon: RiFileTextLine,
    };
  }

  if (status === 'pending') {
    return {
      tone: 'info',
      title: isCod ? 'Order placed' : 'Payment pending',
      icon: RiFileTextLine,
    };
  }

  return {
    tone: 'info',
    title: 'Ready for dispatch',
    icon: RiFileTextLine,
  };
};

export default function ShipmentTimeline({ shipment, orderStatus, paymentMethod }) {
  const status = normalizeStatus(orderStatus);
  const isCod = ['cod', 'cash_on_delivery'].includes(
    normalizeStatus(paymentMethod),
  );
  const steps = isCod ? COD_STEPS : ONLINE_STEPS;

  if (status === 'cancelled' || status === 'refunded') {
    const meta = statusMeta(status, isCod);
    const StatusIcon = meta.icon;

    return (
      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5" aria-labelledby="shipment-heading">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted" id="shipment-heading">
          Delivery
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-line bg-surface-2 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-dim text-danger" aria-hidden="true">
            <StatusIcon size={20} />
          </span>
          <div>
            <strong>{meta.title}</strong>
            <p className="mt-1 text-sm leading-6 text-muted">
              {status === 'refunded'
                ? 'This order has been refunded. No further delivery action is pending.'
                : 'This order was cancelled. No delivery is pending.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const statusIndex = Object.fromEntries(
    steps.map(([key], index) => [key, index]),
  );
  const currentIndex = statusIndex[status] ?? 0;
  const trackingNumber = shipment?.tracking_number || 'Pending';
  const trackingUrl =
    typeof shipment?.tracking_url === 'string'
      ? shipment.tracking_url.trim()
      : '';

  const meta = statusMeta(status, isCod);
  const StatusIcon = meta.icon;

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5" aria-labelledby="shipment-heading">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted" id="shipment-heading">
            Delivery tracking
          </div>
          <p className="mt-1 text-sm leading-6 text-muted">
            Follow your Luviio order status and manual delivery tracking.
          </p>
        </div>

        {trackingUrl && (
          <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-3.5 text-sm font-semibold text-text transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" href={trackingUrl} target="_blank" rel="noopener noreferrer">
            <RiTruckLine size={16} aria-hidden="true" />
            Track shipment
          </a>
        )}
      </header>

      <div className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="Shipment details">
        <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-3">
          <span className="block text-xs text-muted">Shipping</span>
          <strong className="mt-1 block text-sm text-text">Manual shipping</strong>
        </div>

        <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-3">
          <span className="block text-xs text-muted">Tracking</span>
          <strong className="mt-1 block break-all text-sm text-text">{trackingNumber}</strong>
        </div>

        {shipment?.created_at && (
          <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-3">
            <span className="block text-xs text-muted">Shipment record</span>
            <strong className="mt-1 block text-sm text-text">
              {formatDateTime(shipment.created_at)}
            </strong>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold-dim p-4" role="status" aria-live="polite">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold" aria-hidden="true">
          <StatusIcon size={18} />
        </span>
        <div className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Order status</span>
          <strong className="mt-1 block text-base font-bold text-text">{meta.title}</strong>
        </div>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-2" aria-label="Order fulfillment progress">
        {steps.map(([key, title, Icon], index) => {
          const isCurrent = key === status;
          const isDone = index < currentIndex;

          return (
            <li
              key={key}
              className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 ${
                isCurrent
                  ? 'border-gold/50 bg-gold-dim'
                  : isDone
                    ? 'border-success/30 bg-success-dim'
                    : 'border-line bg-surface-2'
              }`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                  isCurrent
                    ? 'bg-gold text-gold-ink'
                    : isDone
                      ? 'bg-success/15 text-success'
                      : 'bg-surface text-muted'
                }`}
                aria-hidden="true"
              >
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-sm font-semibold text-text">{title}</strong>
                {isCurrent && (
                  <small className="mt-0.5 block truncate text-xs text-gold">Current status</small>
                )}
                {isDone && !isCurrent && (
                  <small className="mt-0.5 block text-xs text-success">Completed</small>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
