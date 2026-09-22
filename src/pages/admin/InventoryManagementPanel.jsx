import { useCallback, useEffect, useMemo, useState } from 'react';
import { RiAddLine, RiBox3Line, RiCloseLine, RiInformationLine, RiPencilLine, RiRefreshLine, RiSearchLine, RiSubtractLine } from '@remixicon/react';
import AdminModal from './Modal';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import '../../styles/inventory-modal.css';

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

  const load = useCallback(async () => {
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

  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const stock = Number(p.stock || 0);
      const threshold = 10;
      const state = stock <= 0 ? 'out' : stock <= threshold ? 'low' : 'healthy';
      return (filter === 'all' || filter === state) && (!q || [p.name, p.sku, p.slug].some(v => String(v || '').toLowerCase().includes(q)));
    });
  }, [products, query, filter]);

  const counts = useMemo(() => products.reduce((a, p) => {
    const stock = Number(p.stock || 0), threshold = 10;
    a.total += 1; a.units += stock;
    if (stock <= 0) a.out += 1; else if (stock <= threshold) a.low += 1; else a.healthy += 1;
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
    if (!Number.isInteger(delta) || delta === 0) return toast.error('Enter a non-zero whole-number adjustment.');
    if (!trimmedReason) return toast.error('Adjustment reason is required.');

    const product = editing;
    setBusy(product.id);
    try {
      const result = await adminService.adjustStock(product.id, delta, trimmedReason);
      const newStock = Number(result?.new_stock ?? (Number(product.stock || 0) + delta));
      setProducts(current => current.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
      toast.success(`${product.name}: stock ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta)}.`);
      setEditing(null);
      setQuantity('');
      setReason('');
    } catch (e) {
      toast.error(e.message || 'Stock adjustment failed.');
    } finally {
      setBusy(null);
    }
  };

  const scan = async () => {
    setBusy('scan');
    try {
      const r = await adminService.scanLowStock();
      toast.success(`${r?.alerts_published ?? 0} low-stock alert(s) published.`);
      await load();
    } catch (e) {
      toast.error(e.message || 'Low-stock scan failed.');
    } finally {
      setBusy(null);
    }
  };

  return <section className="admin-panel">
    <div className="admin-card">
      <div className="admin-toolbar ops-toolbar">
        <div><h2>Inventory management</h2><p>Live stock control, low-stock monitoring and auditable manual adjustments.</p></div>
        <div className="btn-row">
          <button type="button" className="icon-btn" onClick={scan} disabled={busy === 'scan'} title="Scan low stock" aria-label="Scan low stock"><RiBox3Line size={18} /></button>
          <button type="button" className="icon-btn" onClick={load} disabled={loading || Boolean(busy)} title="Refresh inventory" aria-label="Refresh inventory"><RiRefreshLine size={18} /></button>
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
        <label className="admin-search"><RiSearchLine size={17} aria-hidden="true" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search product or SKU…" aria-label="Search inventory" /></label>
        <select className="admin-select" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter inventory">
          <option value="all">All stock</option><option value="healthy">Healthy</option><option value="low">Low stock</option><option value="out">Out of stock</option>
        </select>
      </div>

      <table className="admin-table">
        <thead><tr><th>Product</th><th>SKU</th><th>On hand</th><th>Threshold</th><th>Status</th><th aria-label="Actions"></th></tr></thead>
        <tbody>
          {rows.length ? rows.map(p => {
            const stock = Number(p.stock || 0), threshold = 10;
            const state = stock <= 0 ? 'out' : stock <= threshold ? 'low' : 'healthy';
            return <tr key={p.id}>
              <td><div className="td-strong">{pretty(p.name)}</div><div className="td-dim">{pretty(p.slug)}</div></td>
              <td className="td-dim">{pretty(p.sku)}</td><td className="td-gold">{stock}</td><td>{threshold}</td>
              <td><span className={`admin-pill ${state === 'healthy' ? 'pill-success' : state === 'out' ? 'pill-danger' : 'pill-muted'}`}>{state === 'healthy' ? 'Healthy' : state === 'out' ? 'Out of stock' : 'Low stock'}</span></td>
              <td><button type="button" className="icon-btn" disabled={busy === p.id} onClick={() => openEditor(p)} title="Edit inventory" aria-label={`Edit inventory for ${pretty(p.name)}`}><RiPencilLine size={17} /></button></td>
            </tr>;
          }) : <tr><td colSpan="6"><div className="admin-empty">{loading ? 'Loading inventory…' : 'No products match the selected filter.'}</div></td></tr>}
        </tbody>
      </table>
    </div>

    {editing && <AdminModal className="inventory-modal" title="Edit inventory" sub={`${pretty(editing.name)} · ${pretty(editing.sku)}`} onClose={closeEditor}>
      <div className="inventory-modal-status">
        <span className="inventory-modal-status-icon"><RiBox3Line size={18} /></span>
        <div><strong>Stock adjustment</strong><span>Update available units with an auditable reason.</span></div>
      </div>

      <div className="inventory-editor-summary">
        <div><span className="stat-label">Current stock</span><strong>{Number(editing.stock || 0)}</strong></div>
        <div><span className="stat-label">Threshold</span><strong>{10}</strong></div>
      </div>

      <form onSubmit={submitAdjustment} className="inventory-editor-form">
        <label className="admin-field inventory-quantity-field">
          <span>Quantity change</span>
          <div className="inventory-adjust-controls">
            <button type="button" className="icon-btn inventory-step-btn" onClick={() => setQuantity(v => String((Number(v) || 0) - 1))} disabled={Boolean(busy)} title="Decrease quantity" aria-label="Decrease quantity"><RiSubtractLine size={18} /></button>
            <input type="number" inputMode="numeric" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" disabled={Boolean(busy)} aria-label="Quantity change" />
            <button type="button" className="icon-btn inventory-step-btn" onClick={() => setQuantity(v => String((Number(v) || 0) + 1))} disabled={Boolean(busy)} title="Increase quantity" aria-label="Increase quantity"><RiAddLine size={18} /></button>
          </div>
          <small><RiInformationLine size={14} aria-hidden="true" /> Positive adds stock · negative removes stock</small>
        </label>

        <label className="admin-field">
          <span>Reason <b aria-hidden="true">*</b></span>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is the stock being changed?" maxLength={500} rows={3} disabled={Boolean(busy)} required />
          <small>{reason.length}/500 characters</small>
        </label>

        <div className="inventory-modal-note"><RiInformationLine size={15} aria-hidden="true" /><span>This adjustment is recorded in the inventory audit trail.</span></div>

        <div className="admin-modal-footer inventory-modal-footer">
          <button type="button" className="btn btn-quiet" onClick={closeEditor} disabled={Boolean(busy)}><RiCloseLine size={17} aria-hidden="true" /> Cancel</button>
          <button type="submit" className="btn" disabled={Boolean(busy) || !quantity || !reason.trim()}><RiPencilLine size={16} aria-hidden="true" /> {busy ? 'Saving…' : 'Apply adjustment'}</button>
        </div>
      </form>
    </AdminModal>}
  </section>;
}
