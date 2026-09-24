import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  RiAddLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiImageAddLine,
  RiSearchLine,
  RiStarFill,
} from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { formatMoney } from '../../utils/format';
import { ErrorState, Spinner } from '../../components/ui/States';
import AdminModal from './Modal';
import '../../styles/product-admin.css';

const PAGE_SIZE = 100;
const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const GST_RATES = [0, 5, 12, 18, 28];

const BLANK_FORM = {
  name: '',
  slug: '',
  sku: '',
  category_id: '',
  price: '',
  compare_price: '',
  stock: '0',

  measurement_type: '',
  measurement_value: '',
  measurement_unit: '',

  hsn_code: '',
  gst_percentage: '18',

  short_description: '',
  description: '',

  image_url: '',
  images: [],

  brand: '',
  manufacturer: '',
  model_number: '',
  gtin: '',
  ean: '',
  part_number: '',

  key_features: '',

  material: '',
  finish: '',
  color: '',
  size: '',
  dimensions: '',

  warranty: '',
  country_of_origin: '',

  is_active: true,
};

function text(value) {
  return value === null || value === undefined || value === ''
    ? '—'
    : String(value);
}

function fieldLabel(label, required = false) {
  return (
    <>
      {label}
      {required ? ' *' : ''}
    </>
  );
}

function normalizeImages(product) {
  if (Array.isArray(product?.images)) {
    return product.images.filter(Boolean);
  }

  return product?.image_url ? [product.image_url] : [];
}

function toForm(product) {
  const images = normalizeImages(product);

  return {
    ...BLANK_FORM,

    name: product?.name || '',
    slug: product?.slug || '',
    sku: product?.sku || '',
    category_id: product?.category_id || '',

    price:
      product?.price !== null && product?.price !== undefined
        ? String(product.price)
        : '',

    compare_price:
      product?.compare_price !== null &&
      product?.compare_price !== undefined
        ? String(product.compare_price)
        : '',

    stock:
      product?.stock !== null && product?.stock !== undefined
        ? String(product.stock)
        : '0',

    measurement_type: product?.measurement_type || '',

    measurement_value:
      product?.measurement_value !== null &&
      product?.measurement_value !== undefined
        ? String(product.measurement_value)
        : '',

    measurement_unit: product?.measurement_unit || '',

    hsn_code: product?.hsn_code || '',

    gst_percentage:
      product?.gst_percentage !== null &&
      product?.gst_percentage !== undefined
        ? String(product.gst_percentage)
        : '18',

    short_description: product?.short_description || '',
    description: product?.description || '',

    image_url: images[0] || '',
    images,

    brand: product?.brand || '',
    manufacturer: product?.manufacturer || '',
    model_number: product?.model_number || '',

    gtin: product?.gtin || '',
    ean: product?.ean || '',
    part_number: product?.part_number || '',

    key_features: Array.isArray(product?.key_features)
      ? product.key_features.join('\n')
      : '',

    material: product?.material || '',
    finish: product?.finish || '',
    color: product?.color || '',
    size: product?.size || '',
    dimensions: product?.dimensions || '',

    warranty: product?.warranty || '',
    country_of_origin: product?.country_of_origin || '',

    is_active: product?.is_active !== false,
  };
}

function normalizeMeasurementCatalog(value) {
  return {
    types: Array.isArray(value?.types) ? value.types : [],
    units: Array.isArray(value?.units) ? value.units : [],
  };
}

export default function ProductsPanel({ capabilities = {} }) {
  const canCreate = capabilities.productCreate === true;
  const canUpdate = capabilities.productUpdate === true;
  const canDelete = capabilities.productDelete === true;
  const canManageImages = canCreate || canUpdate;

  const { toast } = useToast();

  const [items, setItems] = useState(null);
  const [categories, setCategories] = useState([]);
  const [measurementCatalog, setMeasurementCatalog] = useState({
    types: [],
    units: [],
  });

  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...BLANK_FORM });

  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [deletingImage, setDeletingImage] = useState(null);
  const [primaryBusy, setPrimaryBusy] = useState(null);

  const mountedRef = useRef(false);
  const loadRequestRef = useRef(0);

  const isCreate = !editingId;

  const measurementTypes = measurementCatalog.types || [];

  const measurementUnits = useMemo(() => {
    if (!form.measurement_type) return [];

    return (measurementCatalog.units || []).filter(
      (unit) =>
        String(unit?.measurement_type) === String(form.measurement_type),
    );
  }, [measurementCatalog.units, form.measurement_type]);

  const load = useCallback(async () => {
    const requestId = ++loadRequestRef.current;

    setError('');

    try {
      const [productsResponse, categoriesResponse, measurementResponse] =
        await Promise.all([
          adminService.listProducts({
            page: 1,
            page_size: PAGE_SIZE,
          }),
          adminService.categories(),
          adminService.measurementCatalog(),
        ]);

      if (!mountedRef.current || requestId !== loadRequestRef.current) {
        return;
      }

      setItems(itemsOfList(productsResponse));
      setCategories(itemsOfList(categoriesResponse));
      setMeasurementCatalog(
        normalizeMeasurementCatalog(measurementResponse),
      );
    } catch (err) {
      if (!mountedRef.current || requestId !== loadRequestRef.current) {
        return;
      }

      setError(err?.message || 'Unable to load products.');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
      loadRequestRef.current += 1;
    };
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (items || []).filter((product) => {
      const matchesCategory =
        !catFilter ||
        String(product?.category_id || product?.category || '') ===
          String(catFilter);

      const matchesSearch =
        !query ||
        [product?.name, product?.slug, product?.sku].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(query),
        );

      return matchesCategory && matchesSearch;
    });
  }, [items, search, catFilter]);

  const openCreate = () => {
    if (!canCreate || saving) return;

    setEditingId(null);
    setForm({
      ...BLANK_FORM,
      images: [],
    });
    setSelectedFiles([]);
    setEditing(true);
  };

  const openEdit = (product) => {
    if (!canUpdate || saving) return;

    setEditingId(product?.id || null);
    setForm(toForm(product));
    setSelectedFiles([]);
    setEditing(true);
  };

  const closeEditor = () => {
    if (saving) return;

    setEditing(false);
    setEditingId(null);
    setSelectedFiles([]);
  };

  const setField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const selectMeasurementType = (value) => {
    setForm((current) => ({
      ...current,
      measurement_type: value,
      measurement_value: '',
      measurement_unit: '',
    }));
  };

  const selectFiles = (event) => {
    const incoming = Array.from(event.target.files || []);

    if (!incoming.length) return;

    const invalidFile = incoming.find(
      (file) => file.size > MAX_IMAGE_BYTES,
    );

    if (invalidFile) {
      toast.error('Each image must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }

    const total =
      form.images.length + selectedFiles.length + incoming.length;

    if (total > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images per product.`);
      event.target.value = '';
      return;
    }

    setSelectedFiles((current) => [...current, ...incoming]);
    event.target.value = '';
  };

  const removeSelectedFile = (index) => {
    if (saving) return;

    setSelectedFiles((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const removeImage = async (index) => {
    if (!editingId || !canUpdate || deletingImage !== null) return;

    setDeletingImage(index);

    try {
      const response = await adminService.deleteProductImage(
        editingId,
        index,
      );

      const images = Array.isArray(response?.images)
        ? response.images.filter(Boolean)
        : form.images.filter((_, currentIndex) => currentIndex !== index);

      if (!mountedRef.current) return;

      setForm((current) => ({
        ...current,
        images,
        image_url: images[0] || '',
      }));

      toast.success('Image removed.');
    } catch (err) {
      toast.error(err?.message || 'Unable to remove image.');
    } finally {
      if (mountedRef.current) {
        setDeletingImage(null);
      }
    }
  };

  const setPrimary = async (index) => {
    if (
      !editingId ||
      !canUpdate ||
      index === 0 ||
      primaryBusy !== null ||
      !form.images[index]
    ) {
      return;
    }

    setPrimaryBusy(index);

    try {
      const ordered = [
        form.images[index],
        ...form.images.filter((_, currentIndex) => currentIndex !== index),
      ];

      const response = await adminService.reorderProductImages(
        editingId,
        ordered,
      );

      const images = Array.isArray(response?.images)
        ? response.images.filter(Boolean)
        : ordered;

      if (!mountedRef.current) return;

      setForm((current) => ({
        ...current,
        images,
        image_url: images[0] || '',
      }));

      toast.success('Primary image updated.');
    } catch (err) {
      toast.error(err?.message || 'Unable to set primary image.');
    } finally {
      if (mountedRef.current) {
        setPrimaryBusy(null);
      }
    }
  };

  const validate = () => {
    const name = form.name.trim();
    const hsn = form.hsn_code.trim();

    const price =
      form.price === ''
        ? null
        : Number(form.price);

    const compare =
      form.compare_price === ''
        ? null
        : Number(form.compare_price);

    const stock = Number(form.stock);

    const measurementValue =
      form.measurement_value === ''
        ? null
        : Number(form.measurement_value);

    const gst = Number(form.gst_percentage);

    if (isCreate && name.length < 2) {
      return 'Name must be at least 2 characters.';
    }

    if (!isCreate && form.name.trim() && name.length < 2) {
      return 'Name must be at least 2 characters.';
    }

    if (isCreate && !(price > 0)) {
      return 'Price must be greater than zero.';
    }

    if (form.price !== '' && !(price > 0)) {
      return 'Price must be greater than zero.';
    }

    if (
      compare !== null &&
      (!(compare > 0) || compare <= price)
    ) {
      return 'Compare-at price must be greater than the price.';
    }

    if (isCreate && !hsn) {
      return 'HSN code is required.';
    }

    if (hsn && !/^\d{4,8}$/.test(hsn)) {
      return 'HSN code must contain 4-8 digits.';
    }

    if (!isCreate && form.hsn_code !== '' && !hsn) {
      return 'HSN code cannot be empty.';
    }

    if (isCreate && !GST_RATES.includes(gst)) {
      return 'GST rate must be one of 0%, 5%, 12%, 18% or 28%.';
    }

    if (
      !isCreate &&
      form.gst_percentage !== '' &&
      !GST_RATES.includes(gst)
    ) {
      return 'GST rate must be one of 0%, 5%, 12%, 18% or 28%.';
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return 'Stock must be a whole number of 0 or more.';
    }

    if (form.measurement_type) {
      if (
        measurementValue === null ||
        !Number.isFinite(measurementValue) ||
        measurementValue < 0
      ) {
        return 'Measurement value must be 0 or more.';
      }

      if (!form.measurement_unit) {
        return 'Select a measurement unit.';
      }

      const validUnit = measurementUnits.some(
        (unit) =>
          String(unit?.code) === String(form.measurement_unit),
      );

      if (!validUnit) {
        return 'Selected measurement unit is not valid for this measurement type.';
      }
    } else if (
      form.measurement_value !== '' ||
      form.measurement_unit
    ) {
      return 'Select a measurement type before entering a measurement.';
    }

    if (form.name.length > 255) {
      return 'Name must be 255 characters or fewer.';
    }

    if (form.sku.length > 100) {
      return 'SKU must be 100 characters or fewer.';
    }

    if (form.short_description.length > 500) {
      return 'Short description must be 500 characters or fewer.';
    }

    if (form.images.length + selectedFiles.length > MAX_IMAGES) {
      return `Maximum ${MAX_IMAGES} images per product.`;
    }

    return null;
  };

  const save = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (editingId && !canUpdate) return;
    if (!editingId && !canCreate) return;

    const problem = validate();

    if (problem) {
      toast.error(problem);
      return;
    }

    setSaving(true);

    try {
      const images = form.images.filter(Boolean);

      const keyFeatures = form.key_features
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean);

      const payload = {
        name: form.name.trim() || undefined,

        category_id: form.category_id || undefined,

        image_url:
          images[0] ||
          form.image_url.trim() ||
          undefined,

        images,

        short_description:
          form.short_description.trim() || undefined,

        description:
          form.description.trim() || undefined,

        brand: form.brand.trim() || undefined,

        manufacturer:
          form.manufacturer.trim() || undefined,

        model_number:
          form.model_number.trim() || undefined,

        gtin: form.gtin.trim() || undefined,
        ean: form.ean.trim() || undefined,

        part_number:
          form.part_number.trim() || undefined,

        key_features: keyFeatures,

        material:
          form.material.trim() || undefined,

        finish:
          form.finish.trim() || undefined,

        color:
          form.color.trim() || undefined,

        size:
          form.size.trim() || undefined,

        dimensions:
          form.dimensions.trim() || undefined,

        warranty:
          form.warranty.trim() || undefined,

        hsn_code:
          form.hsn_code.trim() || undefined,

        gst_percentage:
          Number(form.gst_percentage),

        measurement_type:
          form.measurement_type || undefined,

        measurement_value:
          form.measurement_type &&
          form.measurement_value !== ''
            ? Number(form.measurement_value)
            : undefined,

        measurement_unit:
          form.measurement_type
            ? form.measurement_unit || undefined
            : undefined,

        country_of_origin:
          form.country_of_origin.trim() || undefined,

        is_active: form.is_active,

        price:
          form.price === ''
            ? undefined
            : Number(form.price),

        compare_price:
          form.compare_price === ''
            ? undefined
            : Number(form.compare_price),

        stock: Number(form.stock),
      };

      if (editingId) {
        await adminService.updateProduct(
          editingId,
          payload,
        );

        if (selectedFiles.length) {
          await adminService.uploadProductImages(
            editingId,
            selectedFiles,
          );
        }

        toast.success('Product updated.');
      } else {
        const createPayload = {
          ...payload,
          name: form.name.trim(),
          sku: form.sku.trim() || undefined,
        };

        if (selectedFiles.length) {
          await adminService.createProductWithImages(
            createPayload,
            selectedFiles,
          );
        } else {
          await adminService.createProduct(createPayload);
        }

        toast.success('Product created.');
      }

      if (!mountedRef.current) return;

      setEditing(false);
      setEditingId(null);
      setSelectedFiles([]);

      await load();
    } catch (err) {
      if (mountedRef.current) {
        toast.error(
          err?.message || 'Unable to save product.',
        );
      }
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  const remove = async (product) => {
    if (!product?.id || !canDelete || busyId !== null) {
      return false;
    }

    setBusyId(product.id);

    try {
      await adminService.deleteProduct(product.id);

      toast.success('Product deleted.');

      if (mountedRef.current) {
        await load();
      }

      return true;
    } catch (err) {
      toast.error(
        err?.message || 'Unable to delete product.',
      );

      return false;
    } finally {
      if (mountedRef.current) {
        setBusyId(null);
      }
    }
  };

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={load}
      />
    );
  }

  if (items === null) {
    return <Spinner label="Loading products…" />;
  }

  return (
    <>
      <div className="products-admin">
        <div className="admin-head">
          <div>
            <h1>Products</h1>
            <p className="admin-sub">
              {filtered.length} of {items.length} shown ·
              catalogue, pricing, inventory & hardware
              specifications
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={openCreate}
              disabled={saving}
            >
              <RiAddLine
                size={16}
                aria-hidden="true"
              />
              Add product
            </button>
          )}
        </div>

        <div className="admin-table-wrap">
          <div className="admin-toolbar">
            <label className="admin-search">
              <RiSearchLine
                size={16}
                aria-hidden="true"
              />

              <span className="sr-only">
                Search products
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search name, SKU or slug…"
                type="search"
                autoComplete="off"
              />
            </label>

            <label className="admin-filter">
              <span className="sr-only">
                Filter by category
              </span>

              <select
                className="admin-select"
                value={catFilter}
                onChange={(event) =>
                  setCatFilter(event.target.value)
                }
              >
                <option value="">
                  All categories
                </option>

                {categories.map((category) => (
                  <option
                    key={
                      category.id ||
                      category.slug
                    }
                    value={
                      category.id ||
                      category.slug
                    }
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="admin-empty">
              No products match.
            </div>
          ) : (
            <div className="admin-table-scroll">
              <table className="admin-table">
                <caption className="sr-only">
                  Product catalogue
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">SKU</th>
                    <th scope="col">Price</th>
                    <th scope="col">Stock</th>
                    <th scope="col">GST</th>
                    <th scope="col">Category</th>
                    <th scope="col">Status</th>

                    {(canUpdate || canDelete) && (
                      <th scope="col">Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((product) => {
                    const category =
                      categories.find(
                        (item) =>
                          item.id ===
                          product.category_id,
                      );

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="product-cell">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={
                                  product.name || ''
                                }
                                loading="lazy"
                              />
                            ) : (
                              <div
                                className="product-thumb"
                                aria-hidden="true"
                              >
                                <RiImageAddLine
                                  size={17}
                                />
                              </div>
                            )}

                            <div>
                              <div className="td-strong">
                                {product.name}
                              </div>

                              <div className="td-dim">
                                {product.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="td-dim">
                          {product.sku || '—'}
                        </td>

                        <td className="td-gold">
                          {formatMoney(
                            Number(product.price) ||
                              0,
                          )}
                        </td>

                        <td>
                          {product.stock ?? 0}
                        </td>

                        <td>
                          {product.gst_percentage ??
                            '—'}
                          %
                        </td>

                        <td className="td-dim">
                          {category?.name || '—'}
                        </td>

                        <td>
                          {product.is_active ===
                          false ? (
                            <span className="admin-pill pill-danger">
                              Inactive
                            </span>
                          ) : (
                            <span className="admin-pill pill-success">
                              Active
                            </span>
                          )}
                        </td>

                        {(canUpdate ||
                          canDelete) && (
                          <td>
                            <div className="btn-row">
                              {canUpdate && (
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() =>
                                    openEdit(
                                      product,
                                    )
                                  }
                                  title="Edit product"
                                  aria-label={`Edit ${product.name}`}
                                  disabled={
                                    busyId !==
                                    null
                                  }
                                >
                                  <RiEditLine
                                    size={16}
                                    aria-hidden="true"
                                  />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  className="icon-btn danger-action"
                                  onClick={() =>
                                    setDeleteTarget(
                                      product,
                                    )
                                  }
                                  disabled={
                                    busyId ===
                                    product.id
                                  }
                                  title="Delete product"
                                  aria-label={`Delete ${product.name}`}
                                >
                                  <RiDeleteBinLine
                                    size={16}
                                    aria-hidden="true"
                                  />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editing && (
          <AdminModal
            className="product-editor-modal"
            title={
              editingId
                ? 'Edit product'
                : 'Add product'
            }
            sub={
              editingId
                ? 'Update catalogue, pricing, inventory, media and hardware fields.'
                : 'Create a hardware catalogue product with backend-compatible data.'
            }
            onClose={closeEditor}
          >
            <form
              className="product-editor"
              onSubmit={save}
            >
              <div className="editor-section">
                <div className="editor-section-head">
                  <div>
                    <h3>
                      Basic information
                    </h3>

                    <p>
                      Required on create: name.
                      SKU is optional and locked
                      after creation. Slug is
                      generated by the backend.
                    </p>
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="product-name">
                      {fieldLabel(
                        'Name',
                        isCreate,
                      )}
                    </label>

                    <input
                      id="product-name"
                      autoFocus
                      required={isCreate}
                      minLength={
                        isCreate ? 2 : undefined
                      }
                      maxLength={255}
                      value={form.name}
                      onChange={(event) =>
                        setField(
                          'name',
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="product-sku">
                      SKU
                    </label>

                    <input
                      id="product-sku"
                      maxLength={100}
                      value={form.sku}
                      onChange={(event) =>
                        setField(
                          'sku',
                          event.target.value,
                        )
                      }
                      placeholder="Optional internal SKU"
                      disabled={Boolean(
                        editingId,
                      )}
                    />
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="product-slug">
                      Slug
                    </label>

                    <input
                      id="product-slug"
                      value={
                        form.slug ||
                        'Generated after save'
                      }
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="product-category">
                      Category
                    </label>

                    <select
                      id="product-category"
                      value={form.category_id}
                      onChange={(event) =>
                        setField(
                          'category_id',
                          event.target.value,
                        )
                      }
                    >
                      <option value="">
                        None
                      </option>

                      {categories.map(
                        (category) => (
                          <option
                            key={
                              category.id ||
                              category.slug
                            }
                            value={
                              category.id ||
                              category.slug
                            }
                          >
                            {category.name}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="editor-section">
                <div className="editor-section-head">
                  <div>
                    <h3>
                      Pricing, tax &
                      inventory
                    </h3>

                    <p>
                      Create requires price,
                      GST and HSN. Final
                      validation remains
                      backend-authoritative.
                    </p>
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="product-price">
                      {fieldLabel(
                        'Price (₹)',
                        isCreate,
                      )}
                    </label>

                    <input
                      id="product-price"
                      required={isCreate}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.price}
                      onChange={(event) =>
                        setField(
                          'price',
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="product-compare">
                      Compare-at price
                    </label>

                    <input
                      id="product-compare"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={
                        form.compare_price
                      }
                      onChange={(event) =>
                        setField(
                          'compare_price',
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="product-hsn">
                      {fieldLabel(
                        'HSN code',
                        isCreate,
                      )}
                    </label>

                    <input
                      id="product-hsn"
                      required={isCreate}
                      minLength={
                        isCreate ? 4 : undefined
                      }
                      maxLength={8}
                      value={form.hsn_code}
                      onChange={(event) =>
                        setField(
                          'hsn_code',
                          event.target.value
                            .replace(/\D/g, '')
                            .slice(0, 8),
                        )
                      }
                      placeholder="Enter 4–8 digit HSN"
                      inputMode="numeric"
                      autoComplete="off"
                    />

                    <small>
                      Enter the verified HSN
                      code manually. HSN does
                      not automatically determine
                      the GST rate.
                    </small>
                  </div>

                  <div className="field">
                    <label htmlFor="product-gst">
                      {fieldLabel(
                        'GST rate',
                        isCreate,
                      )}
                    </label>

                    <select
                      id="product-gst"
                      required={isCreate}
                      value={
                        form.gst_percentage
                      }
                      onChange={(event) =>
                        setField(
                          'gst_percentage',
                          event.target.value,
                        )
                      }
                    >
                      {GST_RATES.map(
                        (rate) => (
                          <option
                            key={rate}
                            value={rate}
                          >
                            {rate}%
                          </option>
                        ),
                      )}
                    </select>

                    <small>
                      Select the applicable
                      GST slab.
                    </small>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="product-stock">
                    Stock
                  </label>

                  <input
                    id="product-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) =>
                      setField(
                        'stock',
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="product-measurement-type">
                    Product measurement
                  </label>

                  <div className="field-inline">
                    <select
                      id="product-measurement-type"
                      value={
                        form.measurement_type
                      }
                      onChange={(event) =>
                        selectMeasurementType(
                          event.target.value,
                        )
                      }
                    >
                      <option value="">
                        No measurement
                      </option>

                      {measurementTypes.map(
                        (type) => (
                          <option
                            key={type.code}
                            value={type.code}
                          >
                            {type.name}
                          </option>
                        ),
                      )}
                    </select>

                    {form.measurement_type && (
                      <input
                        id="product-measurement-value"
                        type="number"
                        min="0"
                        step="0.000001"
                        value={
                          form.measurement_value
                        }
                        onChange={(event) =>
                          setField(
                            'measurement_value',
                            event.target.value,
                          )
                        }
                        placeholder="Value"
                        aria-label="Measurement value"
                      />
                    )}

                    {form.measurement_type && (
                      <select
                        aria-label="Measurement unit"
                        value={
                          form.measurement_unit
                        }
                        onChange={(event) =>
                          setField(
                            'measurement_unit',
                            event.target.value,
                          )
                        }
                      >
                        <option value="">
                          Select unit
                        </option>

                        {measurementUnits.map(
                          (unit) => (
                            <option
                              key={unit.code}
                              value={unit.code}
                            >
                              {unit.name}
                              {unit.symbol
                                ? ` (${unit.symbol})`
                                : ''}
                            </option>
                          ),
                        )}
                      </select>
                    )}
                  </div>

                  <small>
                    Measurement type and units
                    are loaded from the database
                    measurement master. Only the
                    selected type, value and
                    compatible unit are stored.
                  </small>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="product-origin">
                      Country of origin
                    </label>

                    <input
                      id="product-origin"
                      maxLength={100}
                      value={
                        form.country_of_origin
                      }
                      onChange={(event) =>
                        setField(
                          'country_of_origin',
                          event.target.value,
                        )
                      }
                      placeholder="e.g. India"
                    />
                  </div>
                </div>
              </div>

              <div className="editor-section">
                <div className="editor-section-head">
                  <div>
                    <h3>
                      Product media
                    </h3>

                    <p>
                      Up to 10 images. First
                      image is primary; existing
                      images can be reordered or
                      removed.
                    </p>
                  </div>

                  <span className="image-count">
                    {form.images.length +
                      selectedFiles.length}
                    /{MAX_IMAGES}
                  </span>
                </div>

                <label className="upload-drop">
                  <RiImageAddLine
                    size={20}
                    aria-hidden="true"
                  />

                  <span>
                    <strong>
                      Add product images
                    </strong>

                    <small>
                      PNG, JPG, WebP or GIF ·
                      max 5 MB each · max 10
                    </small>
                  </span>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    multiple
                    onChange={selectFiles}
                    disabled={
                      !canManageImages ||
                      form.images.length +
                        selectedFiles.length >=
                        MAX_IMAGES ||
                      saving
                    }
                  />
                </label>

                {form.images.length > 0 && (
                  <div className="admin-image-grid">
                    {form.images.map(
                      (src, index) => (
                        <div
                          className={`admin-image-item ${
                            index === 0
                              ? 'is-primary'
                              : ''
                          }`}
                          key={`${src}-${index}`}
                        >
                          <img
                            src={src}
                            alt={`${form.name || 'Product'} image ${
                              index + 1
                            }`}
                          />

                          <span className="admin-image-index">
                            {index === 0 ? (
                              <>
                                <RiStarFill
                                  size={12}
                                  aria-hidden="true"
                                />
                                Primary
                              </>
                            ) : (
                              index + 1
                            )}
                          </span>

                          <div className="admin-image-actions">
                            {index !== 0 &&
                              editingId &&
                              canUpdate && (
                                <button
                                  type="button"
                                  className="btn btn-quiet btn-sm"
                                  disabled={
                                    primaryBusy !==
                                    null
                                  }
                                  onClick={() =>
                                    setPrimary(
                                      index,
                                    )
                                  }
                                >
                                  {primaryBusy ===
                                  index
                                    ? 'Saving…'
                                    : 'Set primary'}
                                </button>
                              )}

                            {editingId &&
                              canUpdate && (
                                <button
                                  type="button"
                                  className="icon-btn"
                                  disabled={
                                    deletingImage !==
                                    null
                                  }
                                  onClick={() =>
                                    removeImage(
                                      index,
                                    )
                                  }
                                  aria-label={`Remove image ${
                                    index + 1
                                  }`}
                                  title="Remove image"
                                >
                                  <RiCloseLine
                                    size={14}
                                    aria-hidden="true"
                                  />
                                </button>
                              )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <div className="selected-image-list">
                    {selectedFiles.map(
                      (file, index) => (
                        <div
                          className="selected-image-row"
                          key={`${file.name}-${file.size}-${index}`}
                        >
                          <span>
                            {file.name}
                          </span>

                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() =>
                              removeSelectedFile(
                                index,
                              )
                            }
                            disabled={saving}
                            aria-label={`Remove ${file.name}`}
                            title="Remove image"
                          >
                            <RiCloseLine
                              size={14}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              <div className="editor-section">
                <div className="editor-section-head">
                  <div>
                    <h3>
                      Descriptions
                    </h3>

                    <p>
                      Customer-facing product
                      copy.
                    </p>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="product-short">
                    Short description
                  </label>

                  <input
                    id="product-short"
                    maxLength={500}
                    value={
                      form.short_description
                    }
                    onChange={(event) =>
                      setField(
                        'short_description',
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="product-description">
                    Description
                  </label>

                  <textarea
                    id="product-description"
                    rows="6"
                    value={form.description}
                    onChange={(event) =>
                      setField(
                        'description',
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="editor-section">
                <div className="editor-section-head">
                  <div>
                    <h3>
                      Hardware details
                    </h3>

                    <p>
                      Common hardware catalogue
                      fields and technical
                      dimensions.
                    </p>
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="product-brand">
                      Brand
                    </label>

                    <input
                      id="product-brand"
                      maxLength={120}
                      value={form.brand}
                      onChange={(event) =>
                        setField(
                          'brand',
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="product-manufacturer">
                      Manufacturer
                    </label>

                    <input
                      id="product-manufacturer"
                      maxLength={160}
                      value={
                        form.manufacturer
                      }
                      onChange={(event) =>
                        setField(
                          'manufacturer',
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="product-model">
                      Model number
                    </label>

                    <input
                      id="product-model"
                      maxLength={120}
                      value={
                        form.model_number
                      }
                      onChange={(event) =>
                        setField(
                          'model_number',
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="product-part">
                      Part number
                    </label>

                    <input
                      id="product-part"
                      maxLength={120}
                      value={
                        form.part_number
                      }
                      onChange={(event) =>
                        setField(
                          'part_number',
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="product-gtin">
                      GTIN
                    </label>

                    <input
                      id="product-gtin"
                      maxLength={32}
                      value={form.gtin}
                      onChange={(event) =>
                        setField(
                          'gtin',
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="product-ean">
                      EAN
                    </label>

                    <input
                      id="product-ean"
                      maxLength={32}
                      value={form.ean}
                      onChange={(event) =>
                        setField(
                          'ean',
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="product-material">
                      Material
                    </label>

                    <input
                      id="product-material"
                      maxLength={160}
                      value={form.material}
                      onChange={(event) =>
                        setField(
                          'material',
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Stainless Steel"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="product-finish">
                      Finish
                    </label>

                    <input
                      id="product-finish"
                      maxLength={120}
                      value={form.finish}
                      onChange={(event) =>
                        setField(
                          'finish',
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Polished"
                    />
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="product-color">
                      Color
                    </label>

                    <input
                      id="product-color"
                      maxLength={80}
                      value={form.color}
                      onChange={(event) =>
                        setField(
                          'color',
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="product-size">
                      Size
                    </label>

                    <input
                      id="product-size"
                      maxLength={120}
                      value={form.size}
                      onChange={(event) =>
                        setField(
                          'size',
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="product-dimensions">
                    Dimensions
                  </label>

                  <input
                    id="product-dimensions"
                    maxLength={160}
                    value={form.dimensions}
                    onChange={(event) =>
                      setField(
                        'dimensions',
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 150 × 150 × 50 mm"
                  />

                  <small>
                    Single hardware dimension
                    field. Enter the complete
                    product dimension in one value.
                  </small>
                </div>

                <div className="field">
                  <label htmlFor="product-warranty">
                    Warranty
                  </label>

                  <input
                    id="product-warranty"
                    maxLength={500}
                    value={form.warranty}
                    onChange={(event) =>
                      setField(
                        'warranty',
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="product-features">
                    Key features{' '}
                    <span className="td-dim">
                      one per line
                    </span>
                  </label>

                  <textarea
                    id="product-features"
                    rows="4"
                    value={
                      form.key_features
                    }
                    onChange={(event) =>
                      setField(
                        'key_features',
                        event.target.value,
                      )
                    }
                    placeholder={
                      '304 grade\nAnti-rust\nEasy installation'
                    }
                  />
                </div>
              </div>

              <div className="editor-footer">
                <label className="check-line">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      setField(
                        'is_active',
                        event.target.checked,
                      )
                    }
                  />

                  <span>
                    <strong>
                      Active listing
                    </strong>

                    <small>
                      Visible to customers when
                      published.
                    </small>
                  </span>
                </label>

                <div className="btn-row">
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={closeEditor}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving…'
                      : editingId
                        ? 'Save changes'
                        : 'Create product'}
                  </button>
                </div>
              </div>
            </form>
          </AdminModal>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete product?"
        message={
          deleteTarget
            ? `Delete “${deleteTarget.name}”? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete product"
        danger
        onCancel={() => {
          if (busyId === null) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={async () => {
          if (!deleteTarget) return;

          const deleted = await remove(
            deleteTarget,
          );

          if (deleted && mountedRef.current) {
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}