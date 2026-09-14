import { useEffect, useMemo, useState } from 'react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';

const pretty = (v) => v === null || v === undefined || v === '' ? '—' : String(v);

export default function InventoryManagementPanel() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await adminService.listProducts({ page: 1, page_size: 100 });
      setProducts(itemsOfList(response));
    } catch (e) {
      toast.error(e.message || 'Unable to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(p => {
      const stock = Number(p.stock || 0);
      const threshold = Number(p.low_stock_threshold ?? 10);
      const state = stock <= 0 ? 'out' : stock <= threshold ? 'low' : 'healthy';
      return (filter === 'all' || filter === state) &&
        (!q || [p.name, p.sku, p.slug].some(v => String(v || '').toLowerCase().includes(q)));
    });
  }, [products, query, filter]);

  const counts = useMemo(() => products.reduce((a, p) => {
    const stock = Number(p.stock || 0), threshold = Number(p.low_stock_threshold ?? 10);
    a.total += 1;
    a.units += stock;
    if (stock <= 0) a.out += 1;
    else if (stock <= threshold) a.low += 1;
    else a.healthy += 1;
    return a;
  }, { total: 0, units: 0, out: 0, low: 0, healthy: 0 }), [products]);

  const openEditor = (product) => {
    setEditing(product);
    setQuantity('');
    setReason('');
  };

  const closeEditor = () => {
    if (busy) return;
    setEditing(null);
    setQuantity('');
    setReason('');
  };

  const submitAdjustment = async (event) => {
    event.preventDefault();
    if (!editing) return;

    const delta = Number(quantity);
    const trimmedReason = reason.trim();

    if (!Number.isInteger(delta) || delta === 0) {
      toast.error('Enter a non-zero whole-number adjustment.');
      return;
    }
    if (!trimmedReason) {
      toast.error('Adjustment reason is required.');
      return;
    }

    setBusy(editing.id);
    try {
      await adminService.adjustStock(editing.id, delta, trimmedReason);
      toast.success(`${editing.name}: stock adjusted by ${delta > 0 ? '+' : ''}${delta}.`);
      closeEditor();
      await load();
    } catch (e) {
      toast.error(e.message || 'Stock adjustment failed.');
    } finally {
      setBusy(null);
    }
  };

  const scan = async () => {
    try {
      const r = await adminService.scanLowStock();
      toast.success(`${r?.alerts_published ?? 0} low-stock alert(s) published.`);
      await load();
    } catch (e) {
      toast.error(e.message || 'Low-stock scan failed.');
    }
  };

  return <section className="admin-panel">
    <div className="admin-card">
      <div className="admin-toolbar ops-toolbar">
        <div>
          <h2>Inventory management</h2>
          <p>Live stock control, low-stock monitoring and auditable manual adjustments.</p>
        </div>
        <div className="btn-row">
          <button className="btn btn-sm" onClick={scan}>Scan low stock</button>
          <button className="btn btn-quiet btn-sm" onClick={load}>Refresh</button>
        </div>
      </div>
      <div className="admin-stats">
        <div className="admin-stat"><div className="stat-label">Products</div><div className="stat-value">{loading ? '…' : counts.total}</div></div>
        <div className="admin-stat"><div className="stat-label">Units on hand</div><div className="stat-value">{loading ? '…' : counts.units}</div></div>
        <div className="admin-stat"><div className="stat-label">Low stock</div><div className="stat-value">{loading ? '…' : counts.low}</div></div>
        <div className="admin-stat"><div className="stat-label">Out of stock</div><div className="stat-value">{loading ? '…' : counts.out}</div></div>
      </div>
    </div>

    <div className="admin-table-wrap">
      <div className="admin-toolbar">
        <label className="admin-search">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search product or SKU…" />
        </label>
        <select className="admin-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All stock</option>
          <option value="healthy">Healthy</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      <table className="admin-table">
        <thead><tr>
          <th>Product</th><th>SKU</th><th>On hand</th><th>Threshold</th><th>Status</th><th aria-label="Actions"></th>
        </tr></thead>
        <tbody>
          {rows.length ? rows.map(p => {
            const stock = Number(p.stock || 0);
            const threshold = Number(p.low_stock_threshold ?? 10);
            const state = stock <= 0 ? 'out' : stock <= threshold ? 'low' : 'healthy';
            return <tr key={p.id}>
              <td><div className="td-strong">{pretty(p.name)}</div><div className="td-dim">{pretty(p.slug)}</div></td>
              <td className="td-dim">{pretty(p.sku)}</td>
              <td className="td-gold">{stock}</td>
              <td>{threshold}</td>
              <td><span className={`admin-pill ${state === 'healthy' ? 'pill-success' : state === 'out' ? 'pill-danger' : 'pill-muted'}`}>
                {state === 'healthy' ? 'Healthy' : state === 'out' ? 'Out of stock' : 'Low stock'}
              </span></td>
              <td className="inventory-action-cell">
                <button
                  type="button"
                  className="btn btn-quiet btn-sm inventory-edit-button"
                  disabled={busy === p.id}
                  onClick={() => openEditor(p)}
                  aria-label={`Edit inventory for ${pretty(p.name)}`}
                  title="Edit inventory"
                >
                  ✎
                </button>
              </td>
            </tr>;
          }) : <tr><td colSpan="6"><div className="admin-empty">{loading ? 'Loading inventory…' : 'No products match the selected filter.'}</div></td></tr>}
        </tbody>
      </table>
    </div>

    {editing && <div className="admin-modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && closeEditor()}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-editor-title">
        <div className="admin-modal-header">
          <div>
            <h3 id="inventory-editor-title">Edit inventory</h3>
            <p>{pretty(editing.name)} · {pretty(editing.sku)}</p>
          </div>
          <button type="button" className="btn btn-quiet btn-sm" onClick={closeEditor} disabled={Boolean(busy)} aria-label="Close">×</button>
        </div>

        <div className="admin-modal-body">
          <div className="admin-stats inventory-editor-stats">
            <div className="admin-stat"><div className="stat-label">Current stock</div><div className="stat-value">{Number(editing.stock || 0)}</div></div>
            <div className="admin-stat"><div className="stat-label">Threshold</div><div className="stat-value">{Number(editing.low_stock_threshold ?? 10)}</div></div>
          </div>

          <form onSubmit={submitAdjustment}>
            <label className="admin-field">
              <span>Stock adjustment</span>
              <input
                type="number"
                step="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="e.g. 25 or -5"
                autoFocus
                disabled={Boolean(busy)}
              />
              <small>Use a positive value to add stock or a negative value to remove stock.</small>
            </label>
            <label className="admin-field">
              <span>Reason <b aria-hidden="true">*</b></span>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Supplier restock, damaged item, stock correction"
                maxLength={500}
                rows={3}
                disabled={Boolean(busy)}
                required
              />
            </label>
            <div className="admin-modal-footer">
              <button type="button" className="btn btn-quiet" onClick={closeEditor} disabled={Boolean(busy)}>Cancel</button>
              <button type="submit" className="btn" disabled={Boolean(busy) || !quantity || !reason.trim()}>
                {busy ? 'Saving…' : 'Save adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>}
  </section>;
}
