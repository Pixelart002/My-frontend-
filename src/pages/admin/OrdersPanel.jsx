import { useCallback, useEffect, useMemo, useState } from 'react';
import { RiEditLine, RiMapPin2Line, RiRefreshLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { formatMoney } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import { ErrorState, Spinner } from '../../components/ui/States';
import AdminModal from './Modal';
import { StatusPill } from './DashboardPanel';

const PAGE_SIZE = 100;
const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const displayOrderNumber = (order) => {
  const value = String(order?.order_number || '').trim();
  if (!value) return '—';
  return value.startsWith('#') ? value : `#${value}`;
};

const text = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};

const dateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? text(value) : date.toLocaleString();
};

const money = (value, currency) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${formatMoney(amount)}${currency ? ` ${String(currency).toUpperCase()}` : ''}`;
};

const address = (order, prefix) => {
  const parts = [
    order?.[`${prefix}_line1`],
    order?.[`${prefix}_line2`],
    order?.[`${prefix}_landmark`],
    order?.[`${prefix}_city`],
    order?.[`${prefix}_state`],
    order?.[`${prefix}_postal_code`],
    order?.[`${prefix}_country`],
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
};

const itemSummary = (order) => {
  if (!Array.isArray(order?.order_items) || order.order_items.length === 0) return '—';
  return order.order_items.map((item) => `${text(item.name || item.product_name)} × ${text(item.quantity)}`).join(' | ');
};

const columns = [
  { key: 'order_number', label: 'Order', render: (o) => displayOrderNumber(o), className: 'td-gold' },
  { key: 'customer', label: 'Customer', render: (o) => text(o.users?.full_name || o.shipping_name || o.billing_name) },
  { key: 'customer_email', label: 'Customer email', render: (o) => text(o.users?.email || o.shipping_email || o.billing_email) },
  { key: 'customer_id', label: 'Customer ID', render: (o) => text(o.customer_id) },
  { key: 'status', label: 'Status', render: (o) => <StatusPill status={o.status} /> },
  { key: 'payment_method', label: 'Payment method', render: (o) => text(o.payment_method) },
  { key: 'stripe_payment_intent', label: 'Payment intent', render: (o) => text(o.stripe_payment_intent) },
  { key: 'invoice_number', label: 'Invoice', render: (o) => text(o.invoice_number) },
  { key: 'currency', label: 'Currency', render: (o) => text(o.currency).toUpperCase() },
  { key: 'subtotal', label: 'Subtotal', render: (o) => money(o.subtotal, o.currency), className: 'td-gold' },
  { key: 'discount_amount', label: 'Discount', render: (o) => money(o.discount_amount, o.currency) },
  { key: 'shipping_cost', label: 'Shipping', render: (o) => money(o.shipping_cost, o.currency) },
  { key: 'tax_amount', label: 'Tax', render: (o) => money(o.tax_amount, o.currency) },
  { key: 'tax_type', label: 'Tax type', render: (o) => text(o.tax_type) },
  { key: 'total_amount', label: 'Total', render: (o) => money(o.total_amount, o.currency), className: 'td-gold' },
  { key: 'coupon_code', label: 'Coupon', render: (o) => text(o.coupon_code) },
  { key: 'coupon_id', label: 'Coupon ID', render: (o) => text(o.coupon_id) },
  { key: 'tracking_number', label: 'Tracking', render: (o) => text(o.tracking_number) },
  { key: 'items', label: 'Items', render: (o) => itemSummary(o) },
  { key: 'shipping_name', label: 'Shipping name', render: (o) => text(o.shipping_name) },
  { key: 'shipping_phone', label: 'Shipping phone', render: (o) => text(o.shipping_phone) },
  { key: 'shipping_email', label: 'Shipping email', render: (o) => text(o.shipping_email) },
  { key: 'shipping_company_name', label: 'Shipping company', render: (o) => text(o.shipping_company_name) },
  { key: 'shipping_gstin', label: 'Shipping GSTIN', render: (o) => text(o.shipping_gstin) },
  { key: 'shipping_address_id', label: 'Shipping address ID', render: (o) => text(o.shipping_address_id) },
  { key: 'shipping_address', label: 'Shipping address', render: (o) => address(o, 'shipping') },
  { key: 'billing_same_as_shipping', label: 'Billing = shipping', render: (o) => o.billing_same_as_shipping === true ? 'Yes' : o.billing_same_as_shipping === false ? 'No' : '—' },
  { key: 'billing_name', label: 'Billing name', render: (o) => text(o.billing_name) },
  { key: 'billing_phone', label: 'Billing phone', render: (o) => text(o.billing_phone) },
  { key: 'billing_email', label: 'Billing email', render: (o) => text(o.billing_email) },
  { key: 'billing_company_name', label: 'Billing company', render: (o) => text(o.billing_company_name) },
  { key: 'billing_gstin', label: 'Billing GSTIN', render: (o) => text(o.billing_gstin) },
  { key: 'billing_address_id', label: 'Billing address ID', render: (o) => text(o.billing_address_id) },
  { key: 'billing_address', label: 'Billing address', render: (o) => address(o, 'billing') },
  { key: 'shipping_landmark', label: 'Shipping landmark', render: (o) => text(o.shipping_landmark) },
  { key: 'notes', label: 'Notes', render: (o) => text(o.notes) },
  { key: 'created_at', label: 'Created', render: (o) => dateTime(o.created_at) },
  { key: 'paid_at', label: 'Paid at', render: (o) => dateTime(o.paid_at) },
  { key: 'fulfilled_at', label: 'Fulfilled at', render: (o) => dateTime(o.fulfilled_at) },
  { key: 'shipped_at', label: 'Shipped at', render: (o) => dateTime(o.shipped_at) },
  { key: 'delivered_at', label: 'Delivered at', render: (o) => dateTime(o.delivered_at) },
  { key: 'cancelled_at', label: 'Cancelled at', render: (o) => dateTime(o.cancelled_at) },
  { key: 'refunded_at', label: 'Refunded at', render: (o) => dateTime(o.refunded_at) },
];

export default function OrdersPanel({ capabilities = {} }) {
  const canUpdate = capabilities.orderUpdate === true;
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

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return filter ? items.filter((o) => o.status === filter) : items;
  }, [items, filter]);

  const openEdit = (order) => {
    if (!canUpdate) return;
    setEditing(order);
    setStatus(order.status || '');
    setTracking(order.tracking_number || '');
    setNotes(order.notes || '');
  };

  const save = async (event) => {
    event.preventDefault();
    if (!canUpdate) return;
    if (!editing?.order_number) {
      toast.error('This order has no customer-facing order number.');
      return;
    }
    setSaving(true);
    try {
      await adminService.updateOrder(editing.order_number, {
        status: status || undefined,
        tracking_number: tracking.trim() || null,
        notes: notes.trim() || undefined,
      });
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
    <div className="orders-admin-full">
      <div className="admin-head">
        <div>
          <h1>Orders</h1>
          <p className="admin-sub">{filtered.length} of {items.length} shown · full admin order ledger</p>
        </div>
        <div className="admin-toolbar">
          <select className="admin-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-quiet btn-sm" type="button" onClick={load} title="Refresh orders" aria-label="Refresh orders">
            <RiRefreshLine size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="admin-card orders-ledger-card">
        <div className="orders-ledger-caption">
          <strong>Complete exposed order fields</strong>
          <span>Internal database UUID and idempotency key remain intentionally hidden; every other order field returned to admin is represented below.</span>
        </div>
        <div className="admin-table-wrap orders-ledger-wrap">
          {filtered.length === 0 ? (
            <div className="admin-empty">No orders match.</div>
          ) : (
            <table className="admin-table orders-ledger-table">
              <thead>
                <tr>
                  {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                  {canUpdate && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, index) => (
                  <tr key={String(order.order_number || order.created_at || index)}>
                    {columns.map((column) => (
                      <td key={column.key} className={column.className || ''} title={typeof column.render(order) === 'string' ? column.render(order) : undefined}>
                        {column.render(order)}
                      </td>
                    ))}
                    {canUpdate && (
                      <td>
                        <button className="btn btn-quiet btn-sm" type="button" onClick={() => openEdit(order)} disabled={!order.order_number} title="Edit order" aria-label={`Edit ${displayOrderNumber(order)}`}>
                          <RiEditLine size={14} /> Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <AdminModal
          title={`Order ${displayOrderNumber(editing)}`}
          sub="Update status, tracking and internal notes."
          onClose={() => setEditing(null)}
        >
          <div className="admin-order-items">
            {Array.isArray(editing.order_items) && editing.order_items.length > 0 ? editing.order_items.map((item, index) => (
              <div className="oi-row" key={index}>
                <span>{text(item.name || item.product_name)} × {text(item.quantity)}</span>
                <span>{money(item.subtotal, editing.currency)}</span>
              </div>
            )) : <div className="admin-empty">No item details returned.</div>}
            <div className="oi-row oi-total">
              <span>Total</span>
              <span>{money(editing.total_amount, editing.currency)}</span>
            </div>
          </div>
          <div className="admin-order-detail-meta">
            <div><RiMapPin2Line size={15} /> <span>{address(editing, 'shipping')}</span></div>
            <div><span>Invoice:</span> {text(editing.invoice_number)}</div>
            <div><span>Payment:</span> {text(editing.payment_method)}</div>
          </div>
          <form onSubmit={save}>
            <div className="field">
              <label htmlFor="o-status">Status</label>
              <select id="o-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
            <button className="btn btn-block" type="submit" disabled={saving}>
              <RiEditLine size={16} /> {saving ? 'Saving…' : 'Save order'}
            </button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
