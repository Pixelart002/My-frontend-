import { useCallback, useEffect, useState } from 'react';
import { RiRefreshLine, RiTruckLine, RiFileCopyLine, RiMapPinLine, RiFileTextLine, RiLinksLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/States';

const text = (v) => v === null || v === undefined || v === '' ? '—' : String(v);
const statusTone = (s) => ['delivered','picked_up','in_transit','out_for_delivery'].includes(String(s||'').toLowerCase()) ? 'pill-success' : ['failed','cancelled','rto','rto_delivered'].includes(String(s||'').toLowerCase()) ? 'pill-danger' : ['ready_to_create','created','awb_assigned','pickup_scheduled'].includes(String(s||'').toLowerCase()) ? 'pill-gold' : 'pill-muted';
const workflowLabel = (row) => {
  const step = String(row?.metadata?.workflow?.step || '').toLowerCase();
  return ({
    awb_assigned: 'AWB assigned', pickup_scheduled: 'Pickup scheduled',
    label_generated: 'Label generated', manifest_generated: 'Manifest generated',
    invoice_generated: 'Invoice generated', documents_ready: 'Documents ready',
  })[step] || String(row?.status || 'created').replaceAll('_', ' ');
};
const documentLinks = (row) => [
  ['Label', row?.label_url], ['Manifest', row?.manifest_url], ['Invoice', row?.provider_invoice_url],
].filter(([, url]) => url);

export default function FulfillmentPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState('');
  
  const load = useCallback(async () => {
    try {
      const [shipmentResponse, orderResponse] = await Promise.all([
        adminService.fulfillmentShipments(filter || null),
        adminService.listOrders({ page: 1, page_size: 100 }),
      ]);

      const shipments = itemsOfList(shipmentResponse);
      const orders = itemsOfList(orderResponse);
      const shippedOrderIds = new Set(
        shipments.map((shipment) => String(shipment.order_id || shipment.orders?.id || '')).filter(Boolean)
      );

      // A fresh paid/COD order has no shipping_shipments row until Shiprocket
      // booking happens. Surface it here so the Create button is reachable.
      const eligibleOrders = orders.filter((order) => {
        const status = String(order?.status || '').toLowerCase();
        const method = String(order?.payment_method || '').toLowerCase();
        if (!order?.id || shippedOrderIds.has(String(order.id))) return false;
        if (['cancelled', 'refunded', 'delivered', 'shipped'].includes(status)) return false;
        return ['paid', 'processing'].includes(status) || ['cod', 'cash_on_delivery'].includes(method);
      });

      const pendingRows = eligibleOrders.map((order) => ({
        id: 'order:' + String(order.id),
        order_id: order.id,
        status: 'ready_to_create',
        provider_key: 'shiprocket',
        courier_name: null,
        tracking_number: null,
        tracking_url: null,
        orders: order,
      }));

      setRows([...pendingRows, ...shipments]);
    } catch (err) {
      toast.error(err.message || 'Unable to load fulfillment shipments.');
      setRows([]);
    }
  }, [filter, toast]);

  useEffect(() => { load(); }, [load]);

  const action = async (id, fn, success) => {
    setBusy(id + ':' + fn);
    try { await adminService[fn](id); toast.success(success); await load(); }
    catch (err) { toast.error(err.message || 'Fulfillment action failed.'); }
    finally { setBusy(''); }
  };

  const process = async (row) => {
    setBusy(row.id + ':process');
    try {
      await adminService.processProviderShipment(row.id);
      toast.success('Shipment workflow processed/resumed successfully.');
      await load();
    } catch (err) { toast.error(err.message || 'Shipment workflow could not be completed.'); }
    finally { setBusy(''); }
  };

  const create = async (order) => {
    const id = order?.id;
    if (!id) return;
    setBusy(id + ':create');
    try {
      // Backend derives pickup location, parcel weight and default dimensions
      // from the order/product data and Shiprocket account configuration.
      await adminService.createProviderShipment(id, {});
      toast.success('Courier shipment created with server-derived package details.');
      await load();
    } catch (err) { toast.error(err.message || 'Unable to create courier shipment.'); }
    finally { setBusy(''); }
  };

  if (rows === null) return <div className="admin-panel"><Spinner label="Loading fulfillment…" /></div>;

  return <section className="admin-panel">
    <div className="admin-card">
      <div className="admin-toolbar">
        <div><h2>Courier fulfillment</h2><p>Process paid/COD orders from provider shipment creation through AWB, pickup, label, manifest and tracking.</p></div>
        <div className="btn-row">
          <select className="admin-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All shipments</option>
            <option value="ready_to_create">Ready to create</option><option value="created">Created</option><option value="awb_assigned">AWB assigned</option>
            <option value="pickup_scheduled">Pickup scheduled</option><option value="out_for_delivery">Out for delivery</option><option value="in_transit">In transit</option>
            <option value="out_for_delivery">Out for delivery</option><option value="delivered">Delivered</option>
          </select>
          <button className="btn btn-quiet btn-sm" onClick={load}><RiRefreshLine size={16}/>Refresh</button>
        </div>
      </div>
    </div>

    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>Order</th><th>Customer</th><th>Courier</th><th>AWB</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((row) => {
            const order = row.orders || {};
            
            return <tr key={row.id}>
              <td className="td-gold">#{text(order.order_number)}</td>
              <td>{text(order.shipping_name)}<br/><span className="td-dim">{text(order.shipping_city)} · {text(order.shipping_postal_code)}</span></td>
              <td>{text(row.courier_name)}</td>
              <td>{text(row.tracking_number)}</td>
              <td><span className={`admin-pill ${statusTone(row.status)}`}>{workflowLabel(row)}</span></td>
              <td>
                <div className="btn-row">
                  {row.status !== 'ready_to_create' && <button className="btn btn-sm" disabled={busy === row.id + ':process'} onClick={() => process(row)}>
                    {busy === row.id + ':process' ? 'Processing…' : 'Process workflow'}
                  </button>}
                  {row.status === 'created' && <button className="btn btn-sm" disabled={busy === row.id + ':awb'} onClick={() => action(row.id, 'assignAwb', 'AWB assigned.') }><RiTruckLine size={14}/>AWB</button>}
                  {row.status === 'awb_assigned' && <button className="btn btn-sm" disabled={busy === row.id + ':pickup'} onClick={() => action(row.id, 'schedulePickup', 'Pickup scheduled.') }><RiMapPinLine size={14}/>Pickup</button>}
                  {row.tracking_number && <button className="btn btn-quiet btn-sm" disabled={busy === row.id + ':syncTracking'} onClick={() => action(row.id, 'syncTracking', 'Tracking synchronized.')}>Sync</button>}
                  {row.tracking_number && <button className="btn btn-quiet btn-sm" disabled={busy === row.id + ':generateLabel'} onClick={() => action(row.id, 'generateLabel', 'Label generated.') }><RiFileTextLine size={14}/>Label</button>}
                  {row.tracking_number && <button className="btn btn-quiet btn-sm" disabled={busy === row.id + ':generateManifest'} onClick={() => action(row.id, 'generateManifest', 'Manifest generated.') }><RiFileCopyLine size={14}/>Manifest</button>}
                  {row.tracking_number && <button className="btn btn-quiet btn-sm" disabled={busy === row.id + ':generateProviderInvoice'} onClick={() => action(row.id, 'generateProviderInvoice', 'Courier invoice generated.') }><RiFileTextLine size={14}/>Invoice</button>}
                  {row.tracking_url && <a className="btn btn-quiet btn-sm" href={row.tracking_url} target="_blank" rel="noreferrer"><RiLinksLine size={14}/>Track</a>}
                </div>
                {documentLinks(row).length > 0 && <div className="btn-row" style={{marginTop:8}}>
                  {documentLinks(row).map(([label, url]) => <a key={label} className="btn btn-quiet btn-sm" href={url} target="_blank" rel="noreferrer"><RiLinksLine size={14}/>{label}</a>)}
                </div>}
                {row.status === 'ready_to_create' && <div className="admin-page-note fulfillment-auto-note" style={{marginTop:10}}>
                  <RiTruckLine size={15}/>
                  <span>Pickup location, order weight and fallback parcel dimensions are filled server-side from the order/product data and Shiprocket configuration.</span>
                  <button className="btn btn-sm" disabled={busy === order.id + ':create'} onClick={() => create(order)}>
                    {busy === order.id + ':create' ? 'Creating…' : 'Create Shiprocket shipment'}
                  </button>
                </div>}
              </td>
            </tr>;
          }) : <tr><td colSpan="6"><div className="admin-empty">No provider shipments yet.</div></td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
}
