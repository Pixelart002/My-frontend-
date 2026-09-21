import { RiCheckboxCircleLine, RiTruckLine, RiMapPinLine, RiTimeLine, RiFileTextLine } from '@remixicon/react';

const label = (s) => String(s || '').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

const steps = [
  ['created', 'Shipment created', RiFileTextLine],
  ['awb_assigned', 'Courier assigned', RiTruckLine],
  ['pickup_scheduled', 'Pickup scheduled', RiMapPinLine],
  ['picked_up', 'Picked up', RiTruckLine],
  ['in_transit', 'In transit', RiTruckLine],
  ['out_for_delivery', 'Out for delivery', RiMapPinLine],
  ['delivered', 'Delivered', RiCheckboxCircleLine],
];

const normalizeStatus = (value) => {
  const raw = String(value || '').trim().toLowerCase().replaceAll(' ', '_');
  return ({
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
    'out_for_delivery': 'out_for_delivery',
    'picked_up': 'picked_up',
    'in_transit': 'in_transit',
  })[raw] || raw;
};

export default function ShipmentTimeline({ shipment }) {
  if (!shipment || shipment.status === 'not_booked') {
    return <section className="order-shipment-card"><div className="order-section-label">Delivery</div><p className="td-dim">Your courier shipment will appear here once the order is booked for dispatch.</p></section>;
  }

  const providerEvent = shipment?.metadata?.last_provider_event || {};
  const trackingData = providerEvent?.tracking_data || {};
  const trackRow = Array.isArray(trackingData?.shipment_track) ? trackingData.shipment_track[0] : null;
  const activities = Array.isArray(trackingData?.shipment_track_activities) ? trackingData.shipment_track_activities : [];
  const current = normalizeStatus(
    trackRow?.current_status ||
    trackRow?.['sr-status-label'] ||
    shipment.provider_status ||
    shipment.status ||
    'created'
  );
  const currentIndex = Math.max(0, steps.findIndex(([key]) => key === current));
  const trackingUrl = shipment.tracking_url || trackingData.track_url || '';

  return <section className="order-shipment-card">
    <div className="order-section-label">Delivery tracking</div>
    <div className="shipment-summary">
      <div><span>Courier</span><strong>{shipment.courier_name || 'Courier partner'}</strong></div>
      <div><span>AWB</span><strong>{shipment.tracking_number || trackRow?.awb_code || 'Pending'}</strong></div>
      {trackRow?.destination && <div><span>Destination</span><strong>{trackRow.destination}</strong></div>}
      {(trackingData.etd || trackRow?.edd) && <div><span>Expected delivery</span><strong>{trackingData.etd || trackRow.edd}</strong></div>}
      {shipment.pickup_scheduled_at && <div><span>Pickup</span><strong>{new Date(shipment.pickup_scheduled_at).toLocaleString('en-IN')}</strong></div>}
    </div>

    <div className="shipment-current-status">
      <span>Live courier status</span>
      <strong>{label(current || 'pending')}</strong>
      {trackRow?.location && <small>{trackRow.location}</small>}
    </div>

    <ol className="shipment-timeline">
      {steps.map(([key, title, Icon], index) => {
        const done = index <= currentIndex;
        return <li key={key} className={done ? 'is-done' : ''}>
          <span className="shipment-step-icon"><Icon size={16}/></span>
          <div><strong>{title}</strong>{key === current && <small>Current status · {label(current)}</small>}</div>
        </li>;
      })}
    </ol>

    {activities.length > 0 && (
      <div className="shipment-activity-list">
        <div className="order-section-label">Courier updates</div>
        {activities.slice(0, 8).map((item, index) => (
          <div className="shipment-activity" key={`${item.date || 'event'}-${index}`}>
            <RiTimeLine size={15}/>
            <div>
              <strong>{item['sr-status-label'] || item.activity || item.status || 'Tracking update'}</strong>
              {item.location && <span>{item.location}</span>}
              {item.date && <small>{item.date}</small>}
            </div>
          </div>
        ))}
      </div>
    )}

    {trackingUrl && <a className="btn btn-quiet btn-sm" href={trackingUrl} target="_blank" rel="noreferrer"><RiTruckLine size={15}/> Track with courier</a>}
  </section>;
}
