import { RiCheckboxCircleLine, RiTruckLine, RiMapPinLine, RiTimeLine, RiFileTextLine } from '@remixicon/react';

const label = (s) => String(s || '').replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase());
const steps = [
  ['created', 'Shipment created', RiFileTextLine],
  ['awb_assigned', 'Courier assigned', RiTruckLine],
  ['pickup_scheduled', 'Pickup scheduled', RiMapPinLine],
  ['picked_up', 'Picked up', RiTruckLine],
  ['in_transit', 'In transit', RiTruckLine],
  ['out_for_delivery', 'Out for delivery', RiMapPinLine],
  ['delivered', 'Delivered', RiCheckboxCircleLine],
];

export default function ShipmentTimeline({ shipment }) {
  if (!shipment || shipment.status === 'not_booked') {
    return <section className="order-shipment-card"><div className="order-section-label">Delivery</div><p className="td-dim">Your courier shipment will appear here once the order is booked for dispatch.</p></section>;
  }
  const current = String(shipment.provider_status || shipment.status || 'created').toLowerCase();
  const currentIndex = Math.max(0, steps.findIndex(([key]) => key === current));
  return <section className="order-shipment-card">
    <div className="order-section-label">Delivery tracking</div>
    <div className="shipment-summary">
      <div><span>Courier</span><strong>{shipment.courier_name || 'Courier partner'}</strong></div>
      <div><span>AWB</span><strong>{shipment.tracking_number || 'Pending'}</strong></div>
      {shipment.pickup_scheduled_at && <div><span>Pickup</span><strong>{new Date(shipment.pickup_scheduled_at).toLocaleString('en-IN')}</strong></div>}
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
    {shipment.tracking_url && <a className="btn btn-quiet btn-sm" href={shipment.tracking_url} target="_blank" rel="noreferrer"><RiTruckLine size={15}/> Track with courier</a>}
  </section>;
}
