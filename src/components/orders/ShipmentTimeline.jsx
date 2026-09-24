import {
  RiCheckboxCircleLine,
  RiTruckLine,
  RiMapPinLine,
  RiTimeLine,
  RiFileTextLine,
  RiAlertLine,
  RiCloseCircleLine,
} from '@remixicon/react';

const label = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const STEPS = [
  ['created', 'Shipment created', RiFileTextLine],
  ['awb_assigned', 'Courier assigned', RiTruckLine],
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
        className="order-shipment-card shipment-card shipment-card--empty"
        aria-labelledby="shipment-heading"
      >
        <div className="order-section-label" id="shipment-heading">
          Delivery
        </div>

        <div className="shipment-empty-state">
          <span className="shipment-empty-icon" aria-hidden="true">
            <RiTruckLine size={20} />
          </span>

          <div>
            <strong>Shipment not booked yet</strong>
            <p className="td-dim">
              Your courier shipment will appear here once the order is booked
              for dispatch.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const providerEvent = shipment?.metadata?.last_provider_event || {};
  const trackingData = providerEvent?.tracking_data || {};

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
    <section
      className="order-shipment-card shipment-card"
      aria-labelledby="shipment-heading"
    >
      <header className="shipment-header">
        <div>
          <div className="order-section-label" id="shipment-heading">
            Delivery tracking
          </div>

          <p className="shipment-header-copy">
            Follow your shipment status and courier updates.
          </p>
        </div>

        {trackingUrl && (
          <a
            className="btn btn-quiet btn-sm shipment-track-button"
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <RiTruckLine size={15} aria-hidden="true" />
            <span>Track courier</span>
          </a>
        )}
      </header>

      <div className="shipment-summary" aria-label="Shipment details">
        <div className="shipment-summary-item">
          <span>Courier</span>
          <strong>{shipment.courier_name || 'Courier partner'}</strong>
        </div>

        <div className="shipment-summary-item">
          <span>AWB</span>
          <strong>
            {shipment.tracking_number ||
              trackRow?.awb_code ||
              'Pending'}
          </strong>
        </div>

        {trackRow?.destination && (
          <div className="shipment-summary-item">
            <span>Destination</span>
            <strong>{trackRow.destination}</strong>
          </div>
        )}

        {(trackingData.etd || trackRow?.edd) && (
          <div className="shipment-summary-item">
            <span>Expected delivery</span>
            <strong>
              {trackingData.etd || trackRow.edd}
            </strong>
          </div>
        )}

        {shipment.pickup_scheduled_at && (
          <div className="shipment-summary-item">
            <span>Pickup</span>
            <strong>
              {formatDateTime(shipment.pickup_scheduled_at)}
            </strong>
          </div>
        )}
      </div>

      <div
        className={`shipment-current-status shipment-current-status--${statusMeta.tone}`}
        role="status"
        aria-live="polite"
      >
        <div className="shipment-current-status-icon" aria-hidden="true">
          <StatusIcon size={18} />
        </div>

        <div className="shipment-current-status-content">
          <span>Live courier status</span>
          <strong>{statusMeta.title}</strong>

          {trackRow?.location && (
            <small>
              <RiMapPinLine size={13} aria-hidden="true" />
              {trackRow.location}
            </small>
          )}
        </div>
      </div>

      <ol
        className="shipment-timeline"
        aria-label="Shipment progress"
      >
        {STEPS.map(([key, title, Icon], index) => {
          const state = getStepState(
            key,
            current,
            knownStepIndex,
            index,
          );

          const isCurrent = state === 'is-current';
          const isDone = state === 'is-done';

          return (
            <li
              key={key}
              className={`shipment-step ${state}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className="shipment-step-marker"
                aria-hidden="true"
              >
                <Icon size={16} />
              </span>

              <div className="shipment-step-content">
                <strong>{title}</strong>

                {isCurrent && (
                  <small>
                    Current status · {label(current)}
                  </small>
                )}

                {isDone && !isCurrent && (
                  <small>Completed</small>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {activities.length > 0 && (
        <div className="shipment-activity-list">
          <div className="shipment-activity-header">
            <div className="order-section-label">
              Courier updates
            </div>

            <span className="shipment-activity-count">
              {activities.length} update
              {activities.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="shipment-activities">
            {activities.slice(0, 8).map((item, index) => {
              const activityStatus = normalizeStatus(
                item?.status || item?.['sr-status-label'],
              );

              const activityTitle =
                item?.['sr-status-label'] ||
                item?.activity ||
                item?.status ||
                'Tracking update';

              return (
                <article
                  className="shipment-activity"
                  key={`${item?.date || 'event'}-${index}`}
                >
                  <span
                    className={`shipment-activity-icon ${
                      EXCEPTION_STATUSES.has(activityStatus)
                        ? 'is-warning'
                        : ''
                    }`}
                    aria-hidden="true"
                  >
                    {EXCEPTION_STATUSES.has(activityStatus) ? (
                      <RiAlertLine size={15} />
                    ) : (
                      <RiTimeLine size={15} />
                    )}
                  </span>

                  <div className="shipment-activity-content">
                    <strong>{activityTitle}</strong>

                    {item?.location && (
                      <span>
                        <RiMapPinLine
                          size={12}
                          aria-hidden="true"
                        />
                        {item.location}
                      </span>
                    )}

                    {item?.date && (
                      <time dateTime={item.date}>
                        {formatDateTime(item.date)}
                      </time>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {trackingUrl && (
        <footer className="shipment-footer">
          <a
            className="btn btn-quiet btn-sm"
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <RiTruckLine size={15} aria-hidden="true" />
            Track with courier
          </a>
        </footer>
      )}
    </section>
  );
}