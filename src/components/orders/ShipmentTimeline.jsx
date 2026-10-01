import {
  RiCheckboxCircleLine,
  RiTruckLine,
  RiMapPinLine,
  RiTimeLine,
  RiFileTextLine,
  RiAlertLine,
} from '@remixicon/react';

const label = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const STEPS = [
  ['created', 'Shipment created', RiFileTextLine],
  ['awb_assigned', 'Manual dispatch assigned', RiTruckLine],
  ['pickup_scheduled', 'Pickup scheduled', RiMapPinLine],
  ['picked_up', 'Picked up', RiTruckLine],
  ['in_transit', 'In transit', RiTruckLine],
  ['out_for_delivery', 'Out for delivery', RiMapPinLine],
  ['delivered', 'Delivered', RiCheckboxCircleLine],
];

const STATUS_MAP = {
  6: 'shipped',
  7: 'delivered',
  8: 'cancelled',
  9: 'rto',
  10: 'rto_delivered',
  17: 'out_for_delivery',
  18: 'in_transit',
  19: 'out_for_pickup',
  20: 'pickup_exception',
  21: 'undelivered',
  22: 'delayed',
  42: 'picked_up',

  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  rto: 'rto',
  rto_delivered: 'rto_delivered',
  out_for_delivery: 'out_for_delivery',
  out_for_pickup: 'out_for_pickup',
  pickup_exception: 'pickup_exception',
  picked_up: 'picked_up',
  in_transit: 'in_transit',
  undelivered: 'undelivered',
  delayed: 'delayed',
};

const TERMINAL_STATUSES = new Set([
  'delivered',
  'cancelled',
  'rto',
  'rto_delivered',
]);

const EXCEPTION_STATUSES = new Set([
  'cancelled',
  'rto',
  'rto_delivered',
  'pickup_exception',
  'undelivered',
  'delayed',
]);

const normalizeStatus = (value) => {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '_');

  return STATUS_MAP[raw] || raw;
};

const formatDateTime = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getStatusMeta = (status) => {
  if (status === 'delivered') {
    return {
      tone: 'success',
      title: 'Delivered',
      icon: RiCheckboxCircleLine,
    };
  }

  if (EXCEPTION_STATUSES.has(status)) {
    return {
      tone: 'warning',
      title: label(status),
      icon: RiAlertLine,
    };
  }

  if (status === 'shipped') {
    return {
      tone: 'info',
      title: 'Shipped',
      icon: RiTruckLine,
    };
  }

  return {
    tone: 'info',
    title: label(status || 'pending'),
    icon: RiTruckLine,
  };
};

const getStepState = (key, current, currentIndex, index) => {
  if (key === current) return 'is-current';

  if (currentIndex >= 0 && index < currentIndex) {
    return 'is-done';
  }

  if (TERMINAL_STATUSES.has(current) && current === 'delivered') {
    return index <= currentIndex ? 'is-done' : '';
  }

  return '';
};

export default function ShipmentTimeline({ shipment }) {
  if (!shipment || shipment.status === 'not_booked') {
    return (
      <section
        className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
        aria-labelledby="shipment-heading"
      >
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted" id="shipment-heading">
          Delivery
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-line bg-surface-2 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-dim text-gold" aria-hidden="true">
            <RiTruckLine size={20} />
          </span>

          <div>
            <strong>Shipment pending</strong>
            <p className="mt-1 text-sm leading-6 text-muted">
              Your shipment will appear here once Luviio has arranged dispatch.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const trackingData = {};

  const trackRow = Array.isArray(trackingData?.shipment_track)
    ? trackingData.shipment_track[0]
    : null;

  const activities = Array.isArray(
    trackingData?.shipment_track_activities,
  )
    ? trackingData.shipment_track_activities
    : [];

  const current = normalizeStatus(
    trackRow?.current_status ||
      trackRow?.['sr-status-label'] ||
      shipment.provider_status ||
      shipment.status ||
      'created',
  );

  const currentIndex = STEPS.findIndex(([key]) => key === current);

  const trackingUrl =
    shipment.tracking_url ||
    trackingData.track_url ||
    '';

  const statusMeta = getStatusMeta(current);
  const StatusIcon = statusMeta.icon;

  const knownStepIndex = Math.max(0, currentIndex);

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5" aria-labelledby="shipment-heading">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted" id="shipment-heading">Delivery tracking</div>
          <p className="mt-1 text-sm leading-6 text-muted">Follow your manual shipment status and tracking updates.</p>
        </div>
        {trackingUrl && (
          <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-3.5 text-sm font-semibold text-text transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" href={trackingUrl} target="_blank" rel="noopener noreferrer">
            <RiTruckLine size={16} aria-hidden="true" /> Track shipment
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
          <strong className="mt-1 block break-all text-sm text-text">{shipment.tracking_number || trackRow?.awb_code || 'Pending'}</strong>
        </div>
        {trackRow?.destination && (
          <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-3">
            <span className="block text-xs text-muted">Destination</span>
            <strong className="mt-1 block text-sm text-text">{trackRow.destination}</strong>
          </div>
        )}
        {(trackingData.etd || trackRow?.edd) && (
          <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-3">
            <span className="block text-xs text-muted">Expected delivery</span>
            <strong className="mt-1 block text-sm text-text">{trackingData.etd || trackRow.edd}</strong>
          </div>
        )}
        {shipment.pickup_scheduled_at && (
          <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-3">
            <span className="block text-xs text-muted">Pickup</span>
            <strong className="mt-1 block text-sm text-text">{formatDateTime(shipment.pickup_scheduled_at)}</strong>
          </div>
        )}
      </div>

      <div
        className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ${statusMeta.tone === 'success' ? 'border-success/30 bg-success-dim' : statusMeta.tone === 'warning' ? 'border-danger/30 bg-danger-dim' : 'border-gold/30 bg-gold-dim'}`}
        role="status"
        aria-live="polite"
      >
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${statusMeta.tone === 'success' ? 'bg-success/15 text-success' : statusMeta.tone === 'warning' ? 'bg-danger/15 text-danger' : 'bg-gold/15 text-gold'}`} aria-hidden="true">
          <StatusIcon size={18} />
        </span>
        <div className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Shipment status</span>
          <strong className="mt-1 block text-base font-bold text-text">{statusMeta.title}</strong>
          {trackRow?.location && (
            <small className="mt-1 flex items-center gap-1 text-xs text-muted">
              <RiMapPinLine size={13} aria-hidden="true" /> {trackRow.location}
            </small>
          )}
        </div>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-2" aria-label="Shipment progress">
        {STEPS.map(([key, title, Icon], index) => {
          const state = getStepState(key, current, knownStepIndex, index);
          const isCurrent = state === 'is-current';
          const isDone = state === 'is-done';

          return (
            <li key={key} className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 ${isCurrent ? 'border-gold/50 bg-gold-dim' : isDone ? 'border-success/30 bg-success-dim' : 'border-line bg-surface-2'}`} aria-current={isCurrent ? 'step' : undefined}>
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isCurrent ? 'bg-gold text-gold-ink' : isDone ? 'bg-success/15 text-success' : 'bg-surface text-muted'}`} aria-hidden="true">
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-sm font-semibold text-text">{title}</strong>
                {isCurrent && <small className="mt-0.5 block truncate text-xs text-gold">Current status · {label(current)}</small>}
                {isDone && !isCurrent && <small className="mt-0.5 block text-xs text-success">Completed</small>}
              </div>
            </li>
          );
        })}
      </ol>

      {activities.length > 0 && (
        <div className="mt-5 border-t border-line pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Shipping updates</div>
            <span className="text-xs font-medium text-muted">{activities.length} update{activities.length === 1 ? '' : 's'}</span>
          </div>
          <div className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line">
            {activities.slice(0, 8).map((item, index) => {
              const activityStatus = normalizeStatus(item?.status || item?.['sr-status-label']);
              const activityTitle = item?.['sr-status-label'] || item?.activity || item?.status || 'Tracking update';
              const exception = EXCEPTION_STATUSES.has(activityStatus);
              return (
                <article className="flex items-start gap-3 bg-surface-2 px-3 py-3" key={`${item?.date || 'event'}-${index}`}>
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${exception ? 'bg-danger-dim text-danger' : 'bg-gold-dim text-gold'}`} aria-hidden="true">
                    {exception ? <RiAlertLine size={15} /> : <RiTimeLine size={15} />}
                  </span>
                  <div className="min-w-0">
                    <strong className="block text-sm font-semibold text-text">{activityTitle}</strong>
                    {item?.location && <span className="mt-1 flex items-center gap-1 text-xs text-muted"><RiMapPinLine size={12} aria-hidden="true" />{item.location}</span>}
                    {item?.date && <time className="mt-1 block text-xs text-muted" dateTime={item.date}>{formatDateTime(item.date)}</time>}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {trackingUrl && (
        <footer className="mt-4 flex justify-end border-t border-line pt-4">
          <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-3.5 text-sm font-semibold text-text transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" href={trackingUrl} target="_blank" rel="noopener noreferrer">
            <RiTruckLine size={16} aria-hidden="true" /> Track shipment
          </a>
        </footer>
      )}
    </section>
  );
}
