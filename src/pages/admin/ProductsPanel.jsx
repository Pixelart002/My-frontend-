import { useCallback, useEffect, useMemo, useState } from 'react';
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiImageAddLine, RiSearchLine, RiCloseLine, RiStarFill } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { formatMoney } from '../../utils/format';
import { ErrorState, Spinner } from '../../components/ui/States';
import AdminModal from './Modal';
import '../../styles/product-admin.css';

const PAGE_SIZE = 100;
const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const GST_SLABS = [0, 5, 12, 18, 28];

const blank = {
  name: '', slug: '', sku: '', category_id: '', price: '', compare_price: '', stock: '0',
  low_stock_threshold: '10', weight_grams: '', hsn_code: '', gst_percentage: '18',
  short_description: '', description: '', image_url: '', images: [], attributes: '{}',
  seo_title: '', seo_description: '', seo_keywords: '', canonical_url: '', is_active: true,
};

const ATTRIBUTE_HINTS = ['Color', 'Material', 'Finish Type', 'Weight', 'Dimensions'];

const toForm = (p) => {
  const images = Array.isArray(p.images) ? p.images.filter(Boolean) : (p.image_url ? [p.image_url] : []);
  return {
    ...blank,
    name: p.name || '', slug: p.slug || '', sku: p.sku || '', category_id: p.category_id || '',
    price: p.price != null ? String(p.price) : '', compare_price: p.compare_price != null ? String(p.compare_price) : '',
    stock: p.stock != null ? String(p.stock) : '0', low_stock_threshold: p.low_stock_threshold != null ? String(p.low_stock_threshold) : '10',
    weight_grams: p.weight_grams != null ? String(p.weight_grams) : '', hsn_code: p.hsn_code || '',
    gst_percentage: p.gst_percentage != null ? String(p.gst_percentage) : '18', short_description: p.short_description || '',
    description: p.description || '', image_url: images[0] || '', images,
    attributes: JSON.stringify(p.attributes || {}, null, 2),
    seo_title: p.seo_title || '', seo_description: p.seo_description || '', seo_keywords: p.seo_keywords || '',
    canonical_url: p.canonical_url || '', is_active: p.is_active !== false,
  };
};

const parseAttributes = (value) => {
  if (!value.trim()) return {};
  let parsed;
  try { parsed = JSON.parse(value); } catch { throw new Error('Attributes must contain valid JSON.'); }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Attributes must be a JSON object.');
  return parsed;
};

const fieldLabel = (label, required) => <>{label}{required ? ' *' : ''}</>;

export default function ProductsPanel({ capabilities = {} }) {
  const canCreate = capabilities.productCreate === true;
  const canUpdate = capabilities.productUpdate === true;
  const canDelete = capabilities.productDelete === true;
  const canManageImages = canUpdate || canCreate;
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [deletingImage, setDeletingImage] = useState(null);
  const [primaryBusy, setPrimaryBusy] = useState(null);

  const isCreate = !editingId;

  const load = useCallback(async () => {
    setError('');
    try {
      const [p, c] = await Promise.all([
        adminService.listProducts({ page: 1, page_size: PAGE_SIZE }),
        adminService.categories(),
      ]);
      setItems(itemsOfList(p));
      setCategories(itemsOfList(c));
    } catch (e) {
      setError(e.message || 'Unable to load products.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items || []).filter((p) =>
      (!catFilter || String(p.category_id || p.category) === String(catFilter)) &&
      (!q || [p.name, p.slug, p.sku].some((v) => String(v || '').toLowerCase().includes(q)))
    );
  }, [items, search, catFilter]);

  const openCreate = () => {
    if (!canCreate) return;
    setEditingId(null);
    setForm({ ...blank, images: [] });
    setSelectedFiles([]);
    setEditing(true);
  };

  const openEdit = (p) => {
    if (!canUpdate) return;
    setEditingId(p.id);
    setForm(toForm(p));
    setSelectedFiles([]);
    setEditing(true);
  };

  const closeEditor = () => {
    if (!saving) {
      setEditing(false);
      setSelectedFiles([]);
    }
  };

  const setField = (name, value) => setForm((v) => ({ ...v, [name]: value }));

  const selectFiles = (e) => {
    if (!canManageImages) return;
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;
    if (incoming.some((f) => !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(f.type))) {
      return toast.error('Please choose PNG, JPG, WebP or GIF image files only.');
    }
    if (incoming.some((f) => f.size > MAX_IMAGE_BYTES)) {
      return toast.error('Each image must be 5 MB or smaller.');
    }
    if (form.images.length + selectedFiles.length + incoming.length > MAX_IMAGES) {
      return toast.error(`Maximum ${MAX_IMAGES} images per product.`);
    }
    setSelectedFiles((v) => [...v, ...incoming]);
    e.target.value = '';
  };

  const removeSelectedFile = (index) => {
    if (saving) return;
    setSelectedFiles((files) => files.filter((_, i) => i !== index));
  };

  const removeImage = async (index) => {
    if (!editingId || !canUpdate) return;
    setDeletingImage(index);
    try {
      const r = await adminService.deleteProductImage(editingId, index);
      const images = Array.isArray(r?.images) ? r.images : form.images.filter((_, i) => i !== index);
      setForm((v) => ({ ...v, images, image_url: images[0] || '' }));
      toast.success('Image removed.');
    } catch (e) {
      toast.error(e.message || 'Unable to remove image.');
    } finally {
      setDeletingImage(null);
    }
  };

  const setPrimary = async (index) => {
    if (!editingId || index === 0 || !canUpdate) return;
    setPrimaryBusy(index);
    try {
      const ordered = [form.images[index], ...form.images.filter((_, i) => i !== index)];
      const r = await adminService.reorderProductImages(editingId, ordered);
      const images = Array.isArray(r?.images) ? r.images : ordered;
      setForm((v) => ({ ...v, images, image_url: images[0] || '' }));
      toast.success('Primary image updated.');
    } catch (e) {
      toast.error(e.message || 'Unable to set primary image.');
    } finally {
      setPrimaryBusy(null);
    }
  };

  const validate = () => {
    const name = form.name.trim();
    const hsn = form.hsn_code.trim();
    const price = Number(form.price);
    const compare = form.compare_price === '' ? null : Number(form.compare_price);
    const stock = Number(form.stock);
    const threshold = Number(form.low_stock_threshold);
    const weight = form.weight_grams === '' ? null : Number(form.weight_grams);

    if (isCreate && name.length < 2) return 'Name must be at least 2 characters.';
    if (!isCreate && form.name.trim() && name.length < 2) return 'Name must be at least 2 characters.';
    if (isCreate && !(price > 0)) return 'Price must be greater than zero.';
    if (form.price !== '' && !(price > 0)) return 'Price must be greater than zero.';
    if (compare !== null && (!(compare > 0) || compare <= price)) return 'Compare-at price must be greater than the price.';
    if (isCreate && !hsn) return 'HSN code is required.';
    if (!isCreate && form.hsn_code !== '' && !hsn) return 'HSN code cannot be empty.';
    if (isCreate && !GST_SLABS.includes(Number(form.gst_percentage))) return 'Select a valid GST slab: 0, 5, 12, 18 or 28.';
    if (form.gst_percentage !== '' && !GST_SLABS.includes(Number(form.gst_percentage))) return 'Select a valid GST slab: 0, 5, 12, 18 or 28.';
    if (!Number.isInteger(stock) || stock < 0) return 'Stock must be a whole number of 0 or more.';
    if (!Number.isInteger(threshold) || threshold < 0) return 'Low-stock threshold must be a whole number of 0 or more.';
    if (weight !== null && (!Number.isInteger(weight) || weight < 0)) return 'Weight must be a whole number of 0 or more.';
    if (form.seo_title.length > 70) return 'SEO title must be 70 characters or fewer.';
    if (form.seo_description.length > 170) return 'SEO description must be 170 characters or fewer.';
    if (form.seo_keywords.length > 500) return 'SEO keywords must be 500 characters or fewer.';
    if (form.canonical_url.length > 2048) return 'Canonical URL must be 2048 characters or fewer.';
    if (form.name.length > 255) return 'Name must be 255 characters or fewer.';
    if (form.sku.length > 100) return 'SKU must be 100 characters or fewer.';
    if (form.short_description.length > 500) return 'Short description must be 500 characters or fewer.';
    if (form.images.length + selectedFiles.length > MAX_IMAGES) return `Maximum ${MAX_IMAGES} images per product.`;
    return null;
  };

  const save = async (e) => {
    e.preventDefault();
    if (editingId && !canUpdate) return;
    if (!editingId && !canCreate) return;

    const problem = validate();
    if (problem) return toast.error(problem);

    let attributes;
    try {
      attributes = parseAttributes(form.attributes);
    } catch (err) {
      return toast.error(err.message);
    }

    setSaving(true);
    try {
      const images = form.images.filter(Boolean);
      const base = {
        name: form.name.trim() || undefined,
        category_id: form.category_id || undefined,
        image_url: images[0] || form.image_url.trim() || undefined,
        images,
        short_description: form.short_description.trim() || undefined,
        description: form.description.trim() || undefined,
        attributes,
        hsn_code: form.hsn_code.trim() || undefined,
        gst_percentage: Number(form.gst_percentage),
        weight_grams: form.weight_grams === '' ? undefined : Number(form.weight_grams),
        seo_title: form.seo_title.trim() || undefined,
        seo_description: form.seo_description.trim() || undefined,
        seo_keywords: form.seo_keywords.trim() || undefined,
        canonical_url: form.canonical_url.trim() || undefined,
        is_active: form.is_active,
        price: form.price === '' ? undefined : Number(form.price),
        compare_price: form.compare_price === '' ? undefined : Number(form.compare_price),
        stock: Number(form.stock),
        low_stock_threshold: Number(form.low_stock_threshold),
      };

      if (editingId) {
        await adminService.updateProduct(editingId, base);
        if (selectedFiles.length) await adminService.uploadProductImages(editingId, selectedFiles);
        toast.success('Product updated.');
      } else {
        const data = { ...base, name: form.name.trim(), sku: form.sku.trim() || undefined };
        if (selectedFiles.length) await adminService.createProductWithImages(data, selectedFiles);
        else await adminService.createProduct(data);
        toast.success('Product created.');
      }

      setEditing(false);
      setSelectedFiles([]);
      await load();
    } catch (e) {
      toast.error(e.message || 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!canDelete || busyId) return;
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setBusyId(p.id);
    try {
      await adminService.deleteProduct(p.id);
      toast.success('Product deleted.');
      await load();
    } catch (e) {
      toast.error(e.message || 'Unable to delete product.');
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (items === null) return <Spinner label="Loading products…" />;

  return <div className="products-admin">
    <div className="admin-head">
      <div><h1>Products</h1><p className="admin-sub">{filtered.length} of {items.length} shown · catalogue, pricing, inventory & SEO</p></div>
      {canCreate && <button type="button" className="btn btn-sm" onClick={openCreate}><RiAddLine size={16} /> Add product</button>}
    </div>

    <div className="admin-table-wrap">
      <div className="admin-toolbar">
        <label className="admin-search"><RiSearchLine size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, SKU or slug…" /></label>
        <select className="admin-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}><option value="">All categories</option>{categories.map((c) => <option key={c.id || c.slug} value={c.id || c.slug}>{c.name}</option>)}</select>
      </div>
      {filtered.length === 0 ? <div className="admin-empty">No products match.</div> : <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>GST</th><th>Category</th><th>Status</th>{(canUpdate || canDelete) && <th>Actions</th>}</tr></thead><tbody>
        {filtered.map((p) => {
          const cat = categories.find((c) => c.id === p.category_id);
          return <tr key={p.id}>
            <td><div className="product-cell">{p.image_url ? <img src={p.image_url} alt={p.name || ''} loading="lazy" /> : <div className="product-thumb"><RiImageAddLine size={17} /></div>}<div><div className="td-strong">{p.name}</div><div className="td-dim">{p.slug}</div></div></div></td>
            <td className="td-dim">{p.sku || '—'}</td><td className="td-gold">{formatMoney(Number(p.price) || 0)}</td><td>{p.stock ?? 0}</td><td>{p.gst_percentage ?? '—'}%</td><td className="td-dim">{cat?.name || '—'}</td>
            <td>{p.is_active === false ? <span className="admin-pill pill-danger">Inactive</span> : <span className="admin-pill pill-success">Active</span>}</td>
            {(canUpdate || canDelete) && <td><div className="btn-row">{canUpdate && <button type="button" className="icon-btn" onClick={() => openEdit(p)} title="Edit product" aria-label={`Edit ${p.name}`}><RiEditLine size={16} /></button>}{canDelete && <button type="button" className="icon-btn danger-action" onClick={() => remove(p)} disabled={busyId === p.id} title="Delete product" aria-label={`Delete ${p.name}`}><RiDeleteBinLine size={16} /></button>}</div></td>}
          </tr>;
        })}
      </tbody></table></div>}
    </div>

    {editing && <AdminModal className="product-editor-modal" title={editingId ? 'Edit product' : 'Add product'} sub={editingId ? 'Update all catalogue, pricing, inventory, media and SEO fields.' : 'Create a complete catalogue product with backend-compatible data.'} onClose={closeEditor}>
      <form className="product-editor" onSubmit={save}>
        <div className="editor-section"><div className="editor-section-head"><div><h3>Basic information</h3><p>Required on create: name. SKU is optional and locked after creation. Slug is generated by the backend.</p></div></div>
          <div className="field-grid"><div className="field"><label htmlFor="product-name">{fieldLabel('Name', isCreate)}</label><input id="product-name" autoFocus required={isCreate} minLength={isCreate ? 2 : undefined} maxLength={255} value={form.name} onChange={(e) => setField('name', e.target.value)} /></div><div className="field"><label htmlFor="product-sku">SKU</label><input id="product-sku" maxLength={100} value={form.sku} onChange={(e) => setField('sku', e.target.value)} placeholder="Optional internal SKU" disabled={!!editingId} /></div></div>
          <div className="field-grid"><div className="field"><label htmlFor="product-slug">Slug</label><input id="product-slug" value={form.slug || 'Generated after save'} readOnly disabled /></div><div className="field"><label htmlFor="product-category">Category</label><select id="product-category" value={form.category_id} onChange={(e) => setField('category_id', e.target.value)}><option value="">None</option>{categories.map((c) => <option key={c.id || c.slug} value={c.id || c.slug}>{c.name}</option>)}</select></div></div>
        </div>

        <div className="editor-section"><div className="editor-section-head"><div><h3>Pricing, tax & inventory</h3><p>Create requires price and GST; HSN is required separately. Other inventory fields use backend defaults.</p></div></div>
          <div className="field-grid"><div className="field"><label htmlFor="product-price">{fieldLabel('Price (₹)', isCreate)}</label><input id="product-price" required={isCreate} type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setField('price', e.target.value)} /></div><div className="field"><label htmlFor="product-compare">Compare-at price</label><input id="product-compare" type="number" min="0.01" step="0.01" value={form.compare_price} onChange={(e) => setField('compare_price', e.target.value)} /></div></div>
          <div className="field-grid"><div className="field"><label htmlFor="product-gst">{fieldLabel('GST slab', isCreate)}</label><select id="product-gst" required={isCreate} value={form.gst_percentage} onChange={(e) => setField('gst_percentage', e.target.value)}>{GST_SLABS.map((v) => <option key={v} value={v}>{v}%</option>)}</select></div><div className="field"><label htmlFor="product-hsn">{fieldLabel('HSN code', isCreate)}</label><input id="product-hsn" required={isCreate} minLength={isCreate ? 1 : undefined} maxLength={20} value={form.hsn_code} onChange={(e) => setField('hsn_code', e.target.value)} placeholder="Enter the correct HSN for this product" /></div></div>
          <div className="field-grid"><div className="field"><label htmlFor="product-stock">Stock</label><input id="product-stock" type="number" min="0" step="1" value={form.stock} onChange={(e) => setField('stock', e.target.value)} /></div><div className="field"><label htmlFor="product-threshold">Low-stock threshold</label><input id="product-threshold" type="number" min="0" step="1" value={form.low_stock_threshold} onChange={(e) => setField('low_stock_threshold', e.target.value)} /></div></div>
          <div className="field-grid"><div className="field"><label htmlFor="product-weight">Weight (grams)</label><input id="product-weight" type="number" min="0" step="1" value={form.weight_grams} onChange={(e) => setField('weight_grams', e.target.value)} /></div></div>
        </div>

        <div className="editor-section"><div className="editor-section-head"><div><h3>Product media</h3><p>Up to 10 images. First image is primary; existing images can be reordered or removed.</p></div><span className="image-count">{form.images.length + selectedFiles.length}/{MAX_IMAGES}</span></div>
          <label className="upload-drop"><RiImageAddLine size={20} /><span><strong>Add product images</strong><small>PNG, JPG, WebP or GIF · max 5 MB each · max 10</small></span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={selectFiles} disabled={!canManageImages || form.images.length + selectedFiles.length >= MAX_IMAGES} /></label>
          {form.images.length > 0 && <div className="admin-image-grid">{form.images.map((src, index) => <div className={`admin-image-item ${index === 0 ? 'is-primary' : ''}`} key={`${src}-${index}`}><img src={src} alt={`${form.name || 'Product'} image ${index + 1}`} /><span className="admin-image-index">{index === 0 ? <><RiStarFill size={12} /> Primary</> : index + 1}</span><div className="admin-image-actions">{index !== 0 && editingId && canUpdate && <button type="button" className="btn btn-quiet btn-sm" disabled={primaryBusy === index} onClick={() => setPrimary(index)}>{primaryBusy === index ? 'Saving…' : 'Set primary'}</button>}{editingId && canUpdate && <button type="button" className="icon-btn" disabled={deletingImage === index} onClick={() => removeImage(index)} aria-label="Remove image"><RiCloseLine size={14} /></button>}</div></div>)}</div>}
          {selectedFiles.length > 0 && <div className="selected-image-list">{selectedFiles.map((f, i) => <div className="selected-image-row" key={`${f.name}-${f.size}-${i}`}><span>{f.name}</span><button type="button" className="icon-btn" onClick={() => removeSelectedFile(i)} disabled={saving} aria-label={`Remove ${f.name}`}><RiCloseLine size={14} /></button></div>)}</div>}
        </div>

        <div className="editor-section"><div className="editor-section-head"><div><h3>Descriptions</h3><p>Customer-facing product copy.</p></div></div><div className="field"><label htmlFor="product-short">Short description</label><input id="product-short" maxLength="500" value={form.short_description} onChange={(e) => setField('short_description', e.target.value)} /></div><div className="field"><label htmlFor="product-description">Description</label><textarea id="product-description" rows="6" value={form.description} onChange={(e) => setField('description', e.target.value)} /></div></div>

        <div className="editor-section"><div className="editor-section-head"><div><h3>SEO</h3><p>Optional explicit metadata. Leave blank to use backend/server-side fallbacks.</p></div></div>
          <div className="field"><label htmlFor="product-seo-title">SEO title <span className="td-dim">{form.seo_title.length}/70</span></label><input id="product-seo-title" maxLength="70" value={form.seo_title} onChange={(e) => setField('seo_title', e.target.value)} placeholder="Leave blank to use product name" /></div>
          <div className="field"><label htmlFor="product-seo-description">SEO description <span className="td-dim">{form.seo_description.length}/170</span></label><textarea id="product-seo-description" rows="3" maxLength="170" value={form.seo_description} onChange={(e) => setField('seo_description', e.target.value)} placeholder="Leave blank to derive from product copy" /></div>
          <div className="field-grid"><div className="field"><label htmlFor="product-seo-keywords">SEO keywords <span className="td-dim">{form.seo_keywords.length}/500</span></label><input id="product-seo-keywords" maxLength="500" value={form.seo_keywords} onChange={(e) => setField('seo_keywords', e.target.value)} placeholder="hardware, sanitary, drainage" /></div><div className="field"><label htmlFor="product-canonical">Canonical URL</label><input id="product-canonical" type="url" maxLength="2048" value={form.canonical_url} onChange={(e) => setField('canonical_url', e.target.value)} placeholder="Optional" /></div></div>
        </div>

        <div className="editor-section"><div className="editor-section-head"><div><h3>Attributes</h3><p>Flexible JSON object. Standard hints are available; extra keys are allowed by the backend.</p></div></div><div className="attribute-hints">{ATTRIBUTE_HINTS.map((key) => <button key={key} type="button" className="attribute-chip" onClick={() => { try { const obj = parseAttributes(form.attributes); if (!(key in obj)) obj[key] = ''; setField('attributes', JSON.stringify(obj, null, 2)); } catch { toast.error('Fix the existing Attributes JSON before adding a field.'); } }}>{key}</button>)}</div><div className="field"><label htmlFor="product-attributes">Attributes JSON</label><textarea id="product-attributes" rows="9" value={form.attributes} onChange={(e) => setField('attributes', e.target.value)} placeholder={'{\n  "Color": "Chrome",\n  "Material": "Stainless Steel",\n  "Finish Type": "Polished"\n}'} spellCheck="false" /></div></div>

        <div className="editor-footer"><label className="check-line"><input type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} /> <span><strong>Active listing</strong><small>Visible to customers when published.</small></span></label><div className="btn-row"><button type="button" className="btn btn-quiet" onClick={closeEditor} disabled={saving}>Cancel</button><button className="btn" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}</button></div></div>
      </form>
    </AdminModal>}
  </div>;
}
