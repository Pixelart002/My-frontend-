import { useCallback, useEffect, useMemo, useState } from 'react';
import { RiEditLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { formatMoney } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import { ErrorState, Spinner } from '../../components/ui/States';
import AdminModal from './Modal';
import { StatusPill } from './DashboardPanel';

const PAGE_SIZE = 100;
const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function OrdersPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setItems(itemsOfList(await adminService.listOrders({ page: 1, page_size: PAGE_SIZE })));
    } catch (err) {
      setError(err.message || 'Unable to load orders.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return filter ? items.filter((o) => o.status === filter) : items;
  }, [items, filter]);

  const openEdit = (o) => {
    setEditing(o);
    setStatus(o.status || '');
    setTracking(o.tracking_number || '');
    setNotes(o.notes || '');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        status: status || undefined,
        tracking_number: tracking.trim() || null,
        notes: notes.trim() || undefined,
      };
      await adminService.updateOrder(editing.id, payload);
      toast.success('Order updated.');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Unable to update order.');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (items === null) return <Spinner label="Loading orders…" />;

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>Orders</h1>
          <p className="admin-sub">{filtered.length} of {items.length} shown.</p>
        </div>
        <select className="admin-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrap">
        {filtered.length === 0 ? (
          <div className="admin-empty">No orders match.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Total</th>
                <th>Status</th>
                <th>Tracking</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="td-dim">{String(o.id).slice(0, 8).toUpperCase()}</td>
                  <td className="td-gold">{formatMoney(Number(o.total_amount) || 0)}</td>
                  <td><StatusPill status={o.status} /></td>
                  <td className="td-dim">{o.tracking_number || '—'}</td>
                  <td className="td-dim">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                  <td><button className="btn btn-quiet btn-sm" onClick={() => openEdit(o)}><RiEditLine size={14} /> Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <AdminModal title={`Order #${String(editing.id).slice(0, 8).toUpperCase()}`} sub="Update status, tracking and internal notes." onClose={() => setEditing(null)}>
          {Array.isArray(editing.order_items) && editing.order_items.length > 0 && (
            <div className="admin-order-items">
              {editing.order_items.map((i, idx) => (
                <div className="oi-row" key={idx}>
                  <span>{i.product_name || i.name} × {i.quantity}</span>
                  <span>{formatMoney(Number(i.subtotal) || 0)}</span>
                </div>
              ))}
              <div className="oi-row oi-total"><span>Total</span><span>{formatMoney(Number(editing.total_amount) || 0)}</span></div>
            </div>
          )}
          <form onSubmit={save}>
            <div className="field">
              <label htmlFor="o-status">Status</label>
              <select id="o-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="o-tracking">Tracking number</label>
              <input id="o-tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. AWB123456789" />
            </div>
            <div className="field">
              <label htmlFor="o-notes">Internal notes</label>
              <textarea id="o-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button className="btn btn-block" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save order'}</button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
