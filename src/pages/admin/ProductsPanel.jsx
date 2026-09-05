import { useCallback, useEffect, useMemo, useState } from 'react';
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiSearchLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { formatMoney } from '../../utils/format';
import { ErrorState, Spinner } from '../../components/ui/States';
import AdminModal from './Modal';

const PAGE_SIZE = 100;

const blankForm = {
  name: '',
  slug: '',
  sku: '',
  category_id: '',
  price: '',
  compare_price: '',
  stock: '0',
  low_stock_threshold: '10',
  short_description: '',
  description: '',
  image_url: '',
  is_active: true,
};

function toForm(p) {
  return {
    name: p.name || '',
    slug: p.slug || '',
    sku: p.sku || '',
    category_id: p.category_id || '',
    price: p.price != null ? String(p.price) : '',
    compare_price: p.compare_price != null ? String(p.compare_price) : '',
    stock: p.stock != null ? String(p.stock) : '0',
    low_stock_threshold: p.low_stock_threshold != null ? String(p.low_stock_threshold) : '10',
    short_description: p.short_description || '',
    description: p.description || '',
    image_url: p.image_url || '',
    is_active: p.is_active !== false,
  };
}

export default function ProductsPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [prods, cats] = await Promise.allSettled([
        adminService.listProducts({ page: 1, page_size: PAGE_SIZE }),
        adminService.categories(),
      ]);
      if (prods.status === 'fulfilled') setItems(itemsOfList(prods.value));
      else setError(prods.reason?.message || 'Unable to load products.');
      if (cats.status === 'fulfilled') setCategories(itemsOfList(cats.value));
    } catch (err) {
      setError(err.message || 'Unable to load products.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (catFilter && String(p.category_id || p.category) !== String(catFilter)) return false;
      if (!q) return true;
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.slug || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      );
    });
  }, [items, search, catFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(blankForm);
    setEditing(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm(toForm(p));
    setEditing(true);
  };

  const validate = () => {
    if (form.name.trim().length < 2) return 'Name must be at least 2 characters.';
    if (!/^[a-z0-9-]+$/.test(form.slug.trim().toLowerCase())) return 'Slug can only contain lowercase letters, numbers and dashes.';
    const price = Number(form.price);
    if (!(price > 0)) return 'Price must be greater than zero.';
    const compare = form.compare_price === '' ? null : Number(form.compare_price);
    if (compare != null && compare <= price) return 'Compare-at price must be greater than the price.';
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const base = {
        category_id: form.category_id || undefined,
        image_url: form.image_url.trim() || undefined,
        short_description: form.short_description.trim() || undefined,
        description: form.description.trim() || undefined,
        is_active: form.is_active,
        price: Number(form.price),
        compare_price: form.compare_price === '' ? undefined : Number(form.compare_price),
        stock: Number(form.stock) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 0,
      };
      if (editingId) {
        await adminService.updateProduct(editingId, base);
        toast.success('Product updated.');
      } else {
        await adminService.createProduct({
          ...base,
          name: form.name.trim(),
          slug: form.slug.trim().toLowerCase(),
          sku: form.sku.trim() || undefined,
        });
        toast.success('Product created.');
      }
      setEditing(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setBusyId(p.id);
    try {
      await adminService.deleteProduct(p.id);
      toast.success('Product deleted.');
      load();
    } catch (err) {
      toast.error(err.message || 'Unable to delete product.');
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (items === null) return <Spinner label="Loading products…" />;

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>Products</h1>
          <p className="admin-sub">{filtered.length} of {items.length} shown.</p>
        </div>
        <button className="btn btn-sm" onClick={openCreate}><RiAddLine size={16} /> Add product</button>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-toolbar">
          <label className="admin-search">
            <RiSearchLine size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" />
          </label>
          <select className="admin-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id || c.slug} value={c.id || c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty">No products match.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const cat = categories.find((c) => c.id === p.category_id);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="td-strong">{p.name}</div>
                      <div className="td-dim">{p.slug}</div>
                    </td>
                    <td className="td-dim">{p.sku || '—'}</td>
                    <td className="td-gold">{formatMoney(Number(p.price) || 0)}</td>
                    <td className={Number(p.stock) <= 0 ? 'td-gold' : ''}>{p.stock}</td>
                    <td className="td-dim">{cat?.name || '—'}</td>
                    <td>{p.is_active === false ? <span className="admin-pill pill-danger">Inactive</span> : <span className="admin-pill pill-success">Active</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-quiet btn-sm" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}><RiEditLine size={14} /> Edit</button>
                        <button className="btn btn-quiet btn-sm" onClick={() => remove(p)} disabled={busyId === p.id} aria-label={`Delete ${p.name}`}><RiDeleteBinLine size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <AdminModal
          title={editingId ? 'Edit product' : 'Add product'}
          sub={editingId ? 'Changes apply to the live product.' : 'Create a new product in the catalogue.'}
          onClose={() => setEditing(false)}
        >
          <form onSubmit={submit}>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="p-name">Name *</label>
                <input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="p-slug">Slug *</label>
                <input id="p-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={Boolean(editingId)} />
              </div>
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="p-price">Price (₹) *</label>
                <input id="p-price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="p-compare">Compare-at price</label>
                <input id="p-compare" type="number" min="0" step="0.01" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} />
              </div>
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="p-stock">Stock</label>
                <input id="p-stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="p-threshold">Low stock threshold</label>
                <input id="p-threshold" type="number" min="0" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
              </div>
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="p-cat">Category</label>
                <select id="p-cat" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id || c.slug} value={c.id || c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="p-sku">SKU</label>
                <input id="p-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="p-image">Image URL</label>
              <input id="p-image" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" />
            </div>
            <div className="field">
              <label htmlFor="p-short">Short description</label>
              <input id="p-short" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="p-desc">Full description</label>
              <textarea id="p-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="check-line" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active (visible in the shop)
            </label>
            <button className="btn btn-block" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}</button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
