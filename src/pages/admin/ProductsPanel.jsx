import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
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
const blank = {
  name: '', slug: '', sku: '', category_id: '', price: '', compare_price: '', stock: '0',
  measurement_type: '', measurement_value: '', measurement_unit: '', hsn_code: '', gst_percentage: '18', short_description: '', description: '',
  image_url: '', images: [], brand: '', manufacturer: '', model_number: '', gtin: '', ean: '',
  part_number: '', key_features: '', material: '', finish: '', color: '', size: '', dimensions: '',
  specifications: '{}', warranty: '', country_of_origin: '', is_active: true,
};

const toForm = (p) => {
  const images = Array.isArray(p.images) ? p.images.filter(Boolean) : (p.image_url ? [p.image_url] : []);
  return {
    ...blank,
    name: p.name || '', slug: p.slug || '', sku: p.sku || '', category_id: p.category_id || '',
    price: p.price != null ? String(p.price) : '', compare_price: p.compare_price != null ? String(p.compare_price) : '',
    stock: p.stock != null ? String(p.stock) : '0', measurement_type: p.measurement_type || '', measurement_value: p.measurement_value != null ? String(p.measurement_value) : '', measurement_unit: p.measurement_unit || '',
    hsn_code: p.hsn_code || '', gst_percentage: p.gst_percentage != null ? String(p.gst_percentage) : '18',
    short_description: p.short_description || '', description: p.description || '', image_url: images[0] || '', images,
    brand: p.brand || '', manufacturer: p.manufacturer || '', model_number: p.model_number || '',
    gtin: p.gtin || '', ean: p.ean || '', part_number: p.part_number || '',
    key_features: Array.isArray(p.key_features) ? p.key_features.join('\n') : '',
    material: p.material || '', finish: p.finish || '', color: p.color || '', size: p.size || '',
    dimensions: p.dimensions || '',
    warranty: p.warranty || '', country_of_origin: p.country_of_origin || '', is_active: p.is_active !== false,
  };
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
  const [measurementCatalog, setMeasurementCatalog] = useState({ types: [], units: [] });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null); const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [deletingImage, setDeletingImage] = useState(null);
  const [primaryBusy, setPrimaryBusy] = useState(null);
  const [hsnSuggestions, setHsnSuggestions] = useState([]);
  const [hsnSuggesting, setHsnSuggesting] = useState(false);
  const hsnRequestSeq = useRef(0);

  const isCreate = !editingId;
  const measurementTypes = measurementCatalog.types || [];
  const gstRates = [0, 5, 12, 18, 28];
  const measurementUnits = (measurementCatalog.units || []).filter((unit) => String(unit.measurement_type) === String(form.measurement_type));

  const load = useCallback(async () => {
    setError('');
    try {
      const [p, c, m] = await Promise.all([
        adminService.listProducts({ page: 1, page_size: PAGE_SIZE }),
        adminService.categories(),
        adminService.measurementCatalog(),
      ]);
      setItems(itemsOfList(p));
      setCategories(itemsOfList(c));
      setMeasurementCatalog({ types: Array.isArray(m?.types) ? m.types : [], units: Array.isArray(m?.units) ? m.units : [] });
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

  const extractGstRates = (results) => [...new Set((results || []).flatMap((item) => {
    const raw = item?.gst_rate;
    if (typeof raw === 'number') return [Number(raw)];
    if (typeof raw !== 'string') return [];
    return raw.replace(/%/g, '').replace(/,/g, '/').split('/').map((v) => Number(v.trim())).filter((v) => Number.isFinite(v) && v >= 0 && v <= 100);
  }))].sort((a, b) => a - b);

  useEffect(() => {
    const query = form.name.trim();
    const seq = ++hsnRequestSeq.current;
    if (query.length < 2) {
      setHsnSuggestions([]);
      setHsnSuggesting(false);
      return undefined;
    }
    const timer = setTimeout(async () => {
      setHsnSuggesting(true);
      try {
        const result = await adminService.hsnSuggestions(query);
        if (seq !== hsnRequestSeq.current) return;
        setHsnSuggestions(Array.isArray(result?.items) ? result.items : []);
      } catch {
        if (seq === hsnRequestSeq.current) setHsnSuggestions([]);
      } finally {
        if (seq === hsnRequestSeq.current) setHsnSuggesting(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [form.name]);

  const selectHsnSuggestion = (item) => {
    setField('hsn_code', String(item?.hsn_code || '').replace(/\D/g, '').slice(0, 8));
    setHsnSuggestions([]);
  };

  const applyHsnResult = (item) => {
    const code = String(item?.hsn_code || '').replace(/\D/g, '').slice(0, 8);
    if (!code) return;
    setField('hsn_code', code);
    setHsnSuggestions([]);
  };

  const selectFiles = (e) => {
    const incoming = Array.from(e.target.files || []);
    if (incoming.some((file) => file.size > MAX_IMAGE_BYTES)) {
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
    const measurementValue = form.measurement_value === '' ? null : Number(form.measurement_value);

    if (isCreate && name.length < 2) return 'Name must be at least 2 characters.';
    if (!isCreate && form.name.trim() && name.length < 2) return 'Name must be at least 2 characters.';
    if (isCreate && !(price > 0)) return 'Price must be greater than zero.';
    if (form.price !== '' && !(price > 0)) return 'Price must be greater than zero.';
    if (compare !== null && (!(compare > 0) || compare <= price)) return 'Compare-at price must be greater than the price.';
    if (isCreate && !hsn) return 'HSN code is required.';
    if (hsn && !/^\d{4,8}$/.test(hsn)) return 'HSN code must contain 4-8 digits.';
    if (!isCreate && form.hsn_code !== '' && !hsn) return 'HSN code cannot be empty.';
    const gst = Number(form.gst_percentage);
    if (isCreate && !gstRates.includes(gst)) return 'GST rate must be one of 0%, 5%, 12%, 18% or 28%.';
    if (!isCreate && form.gst_percentage !== '' && !gstRates.includes(gst)) return 'GST rate must be one of 0%, 5%, 12%, 18% or 28%.';
    if (!Number.isInteger(stock) || stock < 0) return 'Stock must be a whole number of 0 or more.';
    if (form.measurement_type) {
      if (measurementValue === null || !Number.isFinite(measurementValue) || measurementValue < 0) return 'Measurement value must be 0 or more.';
      if (!form.measurement_unit) return 'Select a measurement unit.';
    } else if (form.measurement_value !== '' || form.measurement_unit) {
      return 'Select a measurement type before entering a measurement.';
    }
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

    setSaving(true);
    try {
      const images = form.images.filter(Boolean);
      const keyFeatures = form.key_features.split('\n').map((v) => v.trim()).filter(Boolean);
      const base = {
        name: form.name.trim() || undefined,
        category_id: form.category_id || undefined,
        image_url: images[0] || form.image_url.trim() || undefined,
        images,
        short_description: form.short_description.trim() || undefined,
        description: form.description.trim() || undefined,
        brand: form.brand.trim() || undefined,
        manufacturer: form.manufacturer.trim() || undefined,
        model_number: form.model_number.trim() || undefined,
        gtin: form.gtin.trim() || undefined,
        ean: form.ean.trim() || undefined,
        part_number: form.part_number.trim() || undefined,
        key_features: keyFeatures,
        material: form.material.trim() || undefined,
        finish: form.finish.trim() || undefined,
        color: form.color.trim() || undefined,
        size: form.size.trim() || undefined,
        dimensions: form.dimensions.trim() || undefined,
        warranty: form.warranty.trim() || undefined,
        hsn_code: form.hsn_code.trim() || undefined,
        gst_percentage: Number(form.gst_percentage),
        measurement_type: form.measurement_type || undefined,
        measurement_value: form.measurement_type && form.measurement_value !== '' ? Number(form.measurement_value) : undefined,
        measurement_unit: form.measurement_type ? form.measurement_unit || undefined : undefined,
        country_of_origin: form.country_of_origin.trim() || undefined,
        is_active: form.is_active,
        price: form.price === '' ? undefined : Number(form.price),
        compare_price: form.compare_price === '' ? undefined : Number(form.compare_price),
        stock: Number(form.stock),
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

  return (<><div className="products-admin">
    <div className="admin-head">
      <div><h1>Products</h1><p className="admin-sub">{filtered.length} of {items.length} shown · catalogue, pricing, inventory & hardware specifications</p></div>
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
            {(canUpdate || canDelete) && <td><div className="btn-row">{canUpdate && <button type="button" className="icon-btn" onClick={() => openEdit(p)} title="Edit product" aria-label={`Edit ${p.name}`}><RiEditLine size={16} /></button>}{canDelete && <button type="button" className="icon-btn danger-action" onClick={() => setDeleteTarget(p)} disabled={busyId === p.id} title="Delete product" aria-label={`Delete ${p.name}`}><RiDeleteBinLine size={16} /></button>}</div></td>}
          </tr>;
        })}
      </tbody></table></div>}
    </div>

    {editing && <AdminModal className="product-editor-modal" title={editingId ? 'Edit product' : 'Add product'} sub={editingId ? 'Update catalogue, pricing, inventory, media and hardware fields.' : 'Create a hardware catalogue product with backend-compatible data.'} onClose={closeEditor}>
      <form className="product-editor" onSubmit={save}>
        <div className="editor-section"><div className="editor-section-head"><div><h3>Basic information</h3><p>Required on create: name. SKU is optional and locked after creation. Slug is generated by the backend.</p></div></div>
          <div className="field-grid"><div className="field"><label htmlFor="product-name">{fieldLabel('Name', isCreate)}</label><input id="product-name" autoFocus required={isCreate} minLength={isCreate ? 2 : undefined} maxLength={255} value={form.name} onChange={(e) => setField('name', e.target.value)} /></div><div className="field"><label htmlFor="product-sku">SKU</label><input id="product-sku" maxLength={100} value={form.sku} onChange={(e) => setField('sku', e.target.value)} placeholder="Optional internal SKU" disabled={!!editingId} /></div></div>
          <div className="field-grid"><div className="field"><label htmlFor="product-slug">Slug</label><input id="product-slug" value={form.slug || 'Generated after save'} readOnly disabled /></div><div className="field"><label htmlFor="product-category">Category</label><select id="product-category" value={form.category_id} onChange={(e) => setField('category_id', e.target.value)}><option value="">None</option>{categories.map((c) => <option key={c.id || c.slug} value={c.id || c.slug}>{c.name}</option>)}</select></div></div>
        </div>

        <div className="editor-section"><div className="editor-section-head"><div><h3>Pricing, tax & inventory</h3><p>Create requires price and GST; HSN is required separately. Other inventory fields use backend defaults.</p></div></div>
          <div className="field-grid"><div className="field"><label htmlFor="product-price">{fieldLabel('Price (₹)', isCreate)}</label><input id="product-price" required={isCreate} type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setField('price', e.target.value)} /></div><div className="field"><label htmlFor="product-compare">Compare-at price</label><input id="product-compare" type="number" min="0.01" step="0.01" value={form.compare_price} onChange={(e) => setField('compare_price', e.target.value)} /></div></div>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="product-hsn">{fieldLabel('HSN code', isCreate)}</label>
              <div className="hsn-suggest-wrap">
                <input id="product-hsn" required={isCreate} minLength={isCreate ? 4 : undefined} maxLength={8} value={form.hsn_code} onChange={(e) => { setField('hsn_code', e.target.value.replace(/\\D/g, '').slice(0, 8)); setHsnSuggestions([]); }} placeholder="Enter 4–8 digit HSN" inputMode="numeric" autoComplete="off" />
                {(hsnSuggesting || hsnSuggestions.length > 0) && form.name.trim().length >= 2 && <div className="hsn-suggestions" role="listbox" aria-label="HSN suggestions">
                  {hsnSuggesting && <div className="hsn-suggestion-status">Finding matching HSN codes…</div>}
                  {!hsnSuggesting && hsnSuggestions.map((item) => <button type="button" className="hsn-suggestion" key={item.hsn_code} onClick={() => selectHsnSuggestion(item)} role="option">
                    <strong>{item.hsn_code}</strong><span>{item.description}</span>
                  </button>)}
                  {!hsnSuggesting && hsnSuggestions.length === 0 && <div className="hsn-suggestion-status">No HSN suggestions found. Enter the code manually.</div>}
                </div>}
              </div>
              <small>Type the product name above to get HSN suggestions. Select one explicitly; GST remains a separate manual choice.</small>
            </div>
            <div className="field">
              <label htmlFor="product-gst">{fieldLabel('GST rate', isCreate)}</label>
              <select id="product-gst" required={isCreate} value={form.gst_percentage} onChange={(e) => setField('gst_percentage', e.target.value)}>
                {gstRates.map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
              </select>
              <small>Select the applicable GST slab: 0%, 5%, 12%, 18% or 28%.</small>
            </div>
          </div>
          <div className="field"><label htmlFor="product-stock">Stock</label><input id="product-stock" type="number" min="0" step="1" value={form.stock} onChange={(e) => setField('stock', e.target.value)} /></div>
          <div className="field">
            <label htmlFor="product-measurement-type">Product measurement</label>
            <div className="field-inline">
              <select
                id="product-measurement-type"
                value={form.measurement_type}
                onChange={(e) => setForm((v) => ({ ...v, measurement_type: e.target.value, measurement_value: '', measurement_unit: '' }))}
              >
                <option value="">No measurement</option>
                {measurementTypes.map((type) => <option key={type.code} value={type.code}>{type.name}</option>)}
              </select>
              {form.measurement_type && <input
                id="product-measurement-value"
                type="number"
                min="0"
                step="0.000001"
                value={form.measurement_value}
                onChange={(e) => setField('measurement_value', e.target.value)}
                placeholder="Value"
                aria-label="Measurement value"
              />}
              {form.measurement_type && <select
                aria-label="Measurement unit"
                value={form.measurement_unit}
                onChange={(e) => setField('measurement_unit', e.target.value)}
              >
                <option value="">Select unit</option>
                {measurementUnits.map((unit) => <option key={unit.code} value={unit.code}>{unit.name}{unit.symbol ? ' (' + unit.symbol + ')' : ''}</option>)}
              </select>}
            </div>
            <small>Only the selected measurement type is stored and shown to customers. Units are loaded from the database measurement master.</small>
          </div>
          <div className="field-grid">
            <div className="field"><label htmlFor="product-origin">Country of origin</label><input id="product-origin" maxLength="100" value={form.country_of_origin} onChange={(e) => setField('country_of_origin', e.target.value)} placeholder="e.g. India" /></div>
          </div>
        </div>

        <div className="editor-section"><div className="editor-section-head"><div><h3>Product media</h3><p>Up to 10 images. First image is primary; existing images can be reordered or removed.</p></div><span className="image-count">{form.images.length + selectedFiles.length}/{MAX_IMAGES}</span></div>
          <label className="upload-drop"><RiImageAddLine size={20} /><span><strong>Add product images</strong><small>PNG, JPG, WebP or GIF · max 5 MB each · max 10</small></span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={selectFiles} disabled={!canManageImages || form.images.length + selectedFiles.length >= MAX_IMAGES} /></label>
          {form.images.length > 0 && <div className="admin-image-grid">{form.images.map((src, index) => <div className={`admin-image-item ${index === 0 ? 'is-primary' : ''}`} key={`${src}-${index}`}><img src={src} alt={`${form.name || 'Product'} image ${index + 1}`} /><span className="admin-image-index">{index === 0 ? <><RiStarFill size={12} /> Primary</> : index + 1}</span><div className="admin-image-actions">{index !== 0 && editingId && canUpdate && <button type="button" className="btn btn-quiet btn-sm" disabled={primaryBusy === index} onClick={() => setPrimary(index)}>{primaryBusy === index ? 'Saving…' : 'Set primary'}</button>}{editingId && canUpdate && <button type="button" className="icon-btn" disabled={deletingImage === index} onClick={() => removeImage(index)} aria-label="Remove image"><RiCloseLine size={14} /></button>}</div></div>)}</div>}
          {selectedFiles.length > 0 && <div className="selected-image-list">{selectedFiles.map((f, i) => <div className="selected-image-row" key={`${f.name}-${f.size}-${i}`}><span>{f.name}</span><button type="button" className="icon-btn" onClick={() => removeSelectedFile(i)} disabled={saving} aria-label={`Remove ${f.name}`}><RiCloseLine size={14} /></button></div>)}</div>}
        </div>

        <div className="editor-section"><div className="editor-section-head"><div><h3>Descriptions</h3><p>Customer-facing product copy.</p></div></div><div className="field"><label htmlFor="product-short">Short description</label><input id="product-short" maxLength="500" value={form.short_description} onChange={(e) => setField('short_description', e.target.value)} /></div><div className="field"><label htmlFor="product-description">Description</label><textarea id="product-description" rows="6" value={form.description} onChange={(e) => setField('description', e.target.value)} /></div></div>

        <div className="editor-section"><div className="editor-section-head"><div><h3>Hardware details</h3><p>Common hardware catalogue fields and technical dimensions.</p></div></div>
          <div className="field-grid">
            <div className="field"><label htmlFor="product-brand">Brand</label><input id="product-brand" maxLength="120" value={form.brand} onChange={(e) => setField('brand', e.target.value)} /></div>
            <div className="field"><label htmlFor="product-manufacturer">Manufacturer</label><input id="product-manufacturer" maxLength="160" value={form.manufacturer} onChange={(e) => setField('manufacturer', e.target.value)} /></div>
          </div>
          <div className="field-grid">
            <div className="field"><label htmlFor="product-model">Model number</label><input id="product-model" maxLength="120" value={form.model_number} onChange={(e) => setField('model_number', e.target.value)} /></div>
            <div className="field"><label htmlFor="product-part">Part number</label><input id="product-part" maxLength="120" value={form.part_number} onChange={(e) => setField('part_number', e.target.value)} /></div>
          </div>
          <div className="field-grid">
            <div className="field"><label htmlFor="product-gtin">GTIN</label><input id="product-gtin" maxLength="32" value={form.gtin} onChange={(e) => setField('gtin', e.target.value)} /></div>
            <div className="field"><label htmlFor="product-ean">EAN</label><input id="product-ean" maxLength="32" value={form.ean} onChange={(e) => setField('ean', e.target.value)} /></div>
          </div>
          <div className="field-grid">
            <div className="field"><label htmlFor="product-material">Material</label><input id="product-material" maxLength="160" value={form.material} onChange={(e) => setField('material', e.target.value)} placeholder="e.g. Stainless Steel" /></div>
            <div className="field"><label htmlFor="product-finish">Finish</label><input id="product-finish" maxLength="120" value={form.finish} onChange={(e) => setField('finish', e.target.value)} placeholder="e.g. Polished" /></div>
          </div>
          <div className="field-grid">
            <div className="field"><label htmlFor="product-color">Color</label><input id="product-color" maxLength="80" value={form.color} onChange={(e) => setField('color', e.target.value)} /></div>
            <div className="field"><label htmlFor="product-size">Size</label><input id="product-size" maxLength="120" value={form.size} onChange={(e) => setField('size', e.target.value)} /></div>
          </div>
          <div className="field">
            <label htmlFor="product-dimensions">Dimensions</label>
            <input id="product-dimensions" maxLength="160" value={form.dimensions} onChange={(e) => setField('dimensions', e.target.value)} placeholder="e.g. 150 × 150 × 50 mm" />
            <small>Single hardware dimension field. Enter the complete product dimension in one value.</small>
          </div>
          <div className="field"><label htmlFor="product-warranty">Warranty</label><input id="product-warranty" maxLength="500" value={form.warranty} onChange={(e) => setField('warranty', e.target.value)} /></div>
          <div className="field"><label htmlFor="product-features">Key features <span className="td-dim">one per line</span></label><textarea id="product-features" rows="4" value={form.key_features} onChange={(e) => setField('key_features', e.target.value)} placeholder={'304 grade\nAnti-rust\nEasy installation'} /></div>
        </div>

        <div className="editor-footer"><label className="check-line"><input type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} /> <span><strong>Active listing</strong><small>Visible to customers when published.</small></span></label><div className="btn-row"><button type="button" className="btn btn-quiet" onClick={closeEditor} disabled={saving}>Cancel</button><button className="btn" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}</button></div></div>
      </form>
    </AdminModal>}
  </div>
      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete product?" message={deleteTarget ? `Delete “${deleteTarget.name}”? This cannot be undone.` : ''} confirmLabel="Delete product" danger onCancel={()=>setDeleteTarget(null)} onConfirm={async()=>{await remove(deleteTarget);setDeleteTarget(null)}} />
    </>
  );
}