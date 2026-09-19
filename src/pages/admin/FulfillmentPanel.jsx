import { useCallback, useEffect, useState } from 'react';
import { RiRefreshLine, RiTruckLine, RiFileCopyLine, RiMapPinLine, RiFileTextLine, RiLinksLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/States';

const text = (v) => v === null || v === undefined || v === '' ? '—' : String(v);
const statusTone = (s) => ['delivered','picked_up','in_transit'].includes(String(s||'').toLowerCase()) ? 'pill-success' : ['failed','cancelled','rto'].includes(String(s||'').toLowerCase()) ? 'pill-danger' : 'pill-muted';

export default function FulfillmentPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState('');
  const [packageForm, setPackageForm] = useState({});

  const load = useCallback(async () => {
    try {
      setRows(itemsOfList(await adminService.fulfillmentShipments(filter || null)));
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

  const create = async (order) => {
    const id = order?.id;
    const f = packageForm[id] || {};
    if (!id || !f.pickup_location || !f.weight_kg || !f.length_cm || !f.breadth_cm || !f.height_cm) {
      toast.error('Pickup location, weight and final package dimensions are required.');
      return;
    }
    setBusy(id + ':create');
    try {
      await adminService.createProviderShipment(id, f);
      toast.success('Courier shipment created.');
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
            <option value="created">Created</option><option value="awb_assigned">AWB assigned</option>
            <option value="pickup_scheduled">Pickup scheduled</option><option value="in_transit">In transit</option>
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
            const f = packageForm[order.id] || {};
            return <tr key={row.id}>
              <td className="td-gold">#{text(order.order_number)}</td>
              <td>{text(order.shipping_name)}<br/><span className="td-dim">{text(order.shipping_city)} · {text(order.shipping_postal_code)}</span></td>
              <td>{text(row.courier_name)}</td>
              <td>{text(row.tracking_number)}</td>
              <td><span className={`admin-pill ${statusTone(row.status)}`}>{text(row.status)}</span></td>
              <td>
                <div className="btn-row">
                  {row.status === 'created' && <button className="btn btn-sm" disabled={busy === order.id + ':awb'} onClick={() => action(row.id, 'assignAwb', 'AWB assigned.') }><RiTruckLine size={14}/>AWB</button>}
                  {row.status === 'awb_assigned' && <button className="btn btn-sm" disabled={busy === row.id + ':pickup'} onClick={() => action(row.id, 'schedulePickup', 'Pickup scheduled.') }><RiMapPinLine size={14}/>Pickup</button>}
                  {row.tracking_number && <button className="btn btn-quiet btn-sm" disabled={busy === row.id + ':syncTracking'} onClick={() => action(row.id, 'syncTracking', 'Tracking synchronized.')}>Sync</button>}
                  {row.tracking_number && <button className="btn btn-quiet btn-sm" disabled={busy === row.id + ':generateLabel'} onClick={() => action(row.id, 'generateLabel', 'Label generated.') }><RiFileTextLine size={14}/>Label</button>}
                  {row.tracking_number && <button className="btn btn-quiet btn-sm" disabled={busy === row.id + ':generateManifest'} onClick={() => action(row.id, 'generateManifest', 'Manifest generated.') }><RiFileCopyLine size={14}/>Manifest</button>}
                  {row.tracking_number && <button className="btn btn-quiet btn-sm" disabled={busy === row.id + ':generateProviderInvoice'} onClick={() => action(row.id, 'generateProviderInvoice', 'Courier invoice generated.') }><RiFileTextLine size={14}/>Invoice</button>}
                  {row.tracking_url && <a className="btn btn-quiet btn-sm" href={row.tracking_url} target="_blank" rel="noreferrer"><RiLinksLine size={14}/>Track</a>}
                </div>
                {row.status === 'created' && <div className="field-grid" style={{marginTop:10}}>
                  <input placeholder="Pickup location" value={f.pickup_location || ''} onChange={e => setPackageForm(p => ({...p,[order.id]:{...f,pickup_location:e.target.value}}))}/>
                  <input type="number" min="0.01" step="0.01" placeholder="Weight kg" value={f.weight_kg || ''} onChange={e => setPackageForm(p => ({...p,[order.id]:{...f,weight_kg:e.target.value}}))}/>
                  <input type="number" min="1" step="0.1" placeholder="Length cm" value={f.length_cm || ''} onChange={e => setPackageForm(p => ({...p,[order.id]:{...f,length_cm:e.target.value}}))}/>
                  <input type="number" min="1" step="0.1" placeholder="Breadth cm" value={f.breadth_cm || ''} onChange={e => setPackageForm(p => ({...p,[order.id]:{...f,breadth_cm:e.target.value}}))}/>
                  <input type="number" min="1" step="0.1" placeholder="Height cm" value={f.height_cm || ''} onChange={e => setPackageForm(p => ({...p,[order.id]:{...f,height_cm:e.target.value}}))}/>
                  <button className="btn btn-sm" disabled={busy === order.id + ':create'} onClick={() => create(order)}>Create shipment</button>
                </div>}
              </td>
            </tr>;
          }) : <tr><td colSpan="6"><div className="admin-empty">No provider shipments yet.</div></td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
}
