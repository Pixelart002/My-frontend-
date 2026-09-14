import { useEffect, useMemo, useState } from 'react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';

const pretty = (v) => v === null || v === undefined || v === '' ? '—' : String(v);

export default function InventoryManagementPanel() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

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
      return (filter === 'all' || filter === state) && (!q || [p.name, p.sku, p.slug].some(v => String(v || '').toLowerCase().includes(q)));
    });
  }, [products, query, filter]);

  const counts = useMemo(() => products.reduce((a, p) => {
    const stock = Number(p.stock || 0), threshold = Number(p.low_stock_threshold ?? 10);
    a.total += 1; a.units += stock;
    if (stock <= 0) a.out += 1; else if (stock <= threshold) a.low += 1; else a.healthy += 1;
    return a;
  }, { total: 0, units: 0, out: 0, low: 0, healthy: 0 }), [products]);

  const adjust = async (p, delta) => {
    const amount = Number(delta);
    if (!Number.isInteger(amount) || amount === 0) return;
    const reason = window.prompt(amount > 0 ? `Reason for adding ${amount} unit(s) to ${p.name}:` : `Reason for removing ${Math.abs(amount)} unit(s) from ${p.name}:`, amount > 0 ? 'Restock' : 'Stock correction');
    if (reason === null) return;
    if (!reason.trim()) return toast.error('Adjustment reason is required.');
    setBusy(p.id);
    try {
      await adminService.adjustStock(p.id, amount, reason.trim());
      toast.success(`${p.name}: stock adjusted by ${amount > 0 ? '+' : ''}${amount}.`);
      await load();
    } catch (e) {
      toast.error(e.message || 'Stock adjustment failed.');
    } finally { setBusy(null); }
  };

  const scan = async () => {
    try { const r = await adminService.scanLowStock(); toast.success(`${r?.alerts_published ?? 0} low-stock alert(s) published.`); await load(); }
    catch (e) { toast.error(e.message || 'Low-stock scan failed.'); }
  };

  return <section className="admin-panel">
    <div className="admin-card">
      <div className="admin-toolbar ops-toolbar">
        <div><h2>Inventory management</h2><p>Live stock control, low-stock monitoring and auditable manual adjustments.</p></div>
        <div className="btn-row"><button className="btn btn-sm" onClick={scan}>Scan low stock</button><button className="btn btn-quiet btn-sm" onClick={load}>Refresh</button></div>
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
        <label className="admin-search"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search product or SKU…" /></label>
        <select className="admin-select" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All stock</option><option value="healthy">Healthy</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
      </div>
      <table className="admin-table"><thead><tr><th>Product</th><th>SKU</th><th>On hand</th><th>Threshold</th><th>Status</th><th>Quick adjustment</th></tr></thead>
        <tbody>{rows.length ? rows.map(p => { const stock = Number(p.stock || 0), threshold = Number(p.low_stock_threshold ?? 10); const state = stock <= 0 ? 'out' : stock <= threshold ? 'low' : 'healthy'; return <tr key={p.id}>
          <td><div className="td-strong">{p.name}</div><div className="td-dim">{p.slug || '—'}</div></td><td className="td-dim">{p.sku || '—'}</td><td className="td-gold">{stock}</td><td>{threshold}</td>
          <td><span className={`admin-pill ${state === 'healthy' ? 'pill-success' : state === 'out' ? 'pill-danger' : 'pill-muted'}`}>{state === 'healthy' ? 'Healthy' : state === 'out' ? 'Out of stock' : 'Low stock'}</span></td>
          <td><div className="btn-row"><button className="btn btn-quiet btn-sm" disabled={busy === p.id} onClick={() => adjust(p, -1)}>−1</button><button className="btn btn-quiet btn-sm" disabled={busy === p.id} onClick={() => adjust(p, 1)}>+1</button><button className="btn btn-sm" disabled={busy === p.id} onClick={() => { const raw = window.prompt(`Adjustment quantity for ${p.name}:`, '10'); if (raw === null) return; adjust(p, Number(raw)); }}>Adjust</button></div></td>
        </tr>; }) : <tr><td colSpan="6"><div className="admin-empty">{loading ? 'Loading inventory…' : 'No products match the selected filter.'}</div></td></tr>}</tbody>
      </table>
    </div>
  </section>;
}
