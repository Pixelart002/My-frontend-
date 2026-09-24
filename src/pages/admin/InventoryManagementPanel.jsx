import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  RiAddLine,
  RiBox3Line,
  RiCloseLine,
  RiInformationLine,
  RiPencilLine,
  RiRefreshLine,
  RiSearchLine,
  RiSubtractLine,
} from '@remixicon/react';
import AdminModal from './Modal';
import {
  adminService,
  itemsOfList,
} from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import '../../styles/inventory-modal.css';

const LOW_STOCK_THRESHOLD = 10;
const PRODUCT_PAGE_SIZE = 100;
const REASON_MAX_LENGTH = 500;

const pretty = (value) =>
  value === null ||
  value === undefined ||
  value === ''
    ? '—'
    : String(value);

const normalizeStock = (value) => {
  const stock = Number(value);
  return Number.isFinite(stock) ? stock : 0;
};

const getStockState = (stock) => {
  const value = normalizeStock(stock);

  if (value <= 0) return 'out';
  if (value <= LOW_STOCK_THRESHOLD) return 'low';

  return 'healthy';
};

const getStockLabel = (state) => {
  if (state === 'healthy') return 'Healthy';
  if (state === 'out') return 'Out of stock';

  return 'Low stock';
};

const getStockTone = (state) => {
  if (state === 'healthy') return 'pill-success';
  if (state === 'out') return 'pill-danger';

  return 'pill-muted';
};

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

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);

    try {
      const response = await adminService.listProducts({
        page: 1,
        page_size: PRODUCT_PAGE_SIZE,
      });

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setProducts(itemsOfList(response));
    } catch (error) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      toast.error(
        error?.message ||
          'Unable to load inventory.',
      );
    } finally {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();

    return products.filter((product) => {
      const stock = normalizeStock(product?.stock);
      const state = getStockState(stock);

      const matchesFilter =
        filter === 'all' || filter === state;

      const matchesSearch =
        !search ||
        [
          product?.name,
          product?.sku,
          product?.slug,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(search),
        );

      return matchesFilter && matchesSearch;
    });
  }, [products, query, filter]);

  const counts = useMemo(
    () =>
      products.reduce(
        (result, product) => {
          const stock = normalizeStock(
            product?.stock,
          );
          const state = getStockState(stock);

          result.total += 1;
          result.units += stock;

          if (state === 'out') {
            result.out += 1;
          } else if (state === 'low') {
            result.low += 1;
          } else {
            result.healthy += 1;
          }

          return result;
        },
        {
          total: 0,
          units: 0,
          out: 0,
          low: 0,
          healthy: 0,
        },
      ),
    [products],
  );

  const openEditor = useCallback((product) => {
    if (!product?.id) return;

    setEditing(product);
    setQuantity('');
    setReason('');
  }, []);

  const closeEditor = useCallback(() => {
    if (busy) return;

    setEditing(null);
    setQuantity('');
    setReason('');
  }, [busy]);

  const submitAdjustment = async (event) => {
    event.preventDefault();

    if (!editing?.id || busy) return;

    const delta = Number(quantity);
    const trimmedReason = reason.trim();

    if (
      !Number.isInteger(delta) ||
      delta === 0
    ) {
      toast.error(
        'Enter a non-zero whole-number adjustment.',
      );
      return;
    }

    if (!trimmedReason) {
      toast.error(
        'Adjustment reason is required.',
      );
      return;
    }

    if (
      trimmedReason.length >
      REASON_MAX_LENGTH
    ) {
      toast.error(
        `Reason cannot exceed ${REASON_MAX_LENGTH} characters.`,
      );
      return;
    }

    const productId = editing.id;
    const productName = pretty(editing.name);

    setBusy(productId);

    try {
      const result =
        await adminService.adjustStock(
          productId,
          delta,
          trimmedReason,
        );

      /*
       * Backend is authoritative.
       * Prefer the server-returned stock and only
       * update the local row when it is actually present.
       */
      const serverStock = Number(
        result?.new_stock,
      );

      setProducts((current) =>
        current.map((product) => {
          if (product.id !== productId) {
            return product;
          }

          if (Number.isFinite(serverStock)) {
            return {
              ...product,
              stock: serverStock,
            };
          }

          return product;
        }),
      );

      toast.success(
        `${productName}: stock ${
          delta > 0 ? 'increased' : 'decreased'
        } by ${Math.abs(delta)}.`,
      );

      setEditing(null);
      setQuantity('');
      setReason('');
    } catch (error) {
      toast.error(
        error?.message ||
          'Stock adjustment failed.',
      );
    } finally {
      if (mountedRef.current) {
        setBusy(null);
      }
    }
  };

  const scan = async () => {
    if (busy) return;

    setBusy('scan');

    try {
      const result =
        await adminService.scanLowStock();

      const alerts =
        Number(result?.alerts_published);

      toast.success(
        `${
          Number.isFinite(alerts) ? alerts : 0
        } low-stock alert(s) published.`,
      );

      await load();
    } catch (error) {
      toast.error(
        error?.message ||
          'Low-stock scan failed.',
      );
    } finally {
      if (mountedRef.current) {
        setBusy(null);
      }
    }
  };

  const refreshDisabled =
    loading || Boolean(busy);

  return (
    <section className="admin-panel inventory-panel">
      <div className="admin-card inventory-header-card">
        <div className="admin-toolbar inventory-toolbar">
          <div className="inventory-heading">
            <h2>Inventory management</h2>
            <p>
              Live stock control, low-stock monitoring
              and auditable manual adjustments.
            </p>
          </div>

          <div className="inventory-toolbar-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={scan}
              disabled={Boolean(busy)}
              title="Scan low stock"
              aria-label="Scan low stock"
            >
              <RiBox3Line
                size={18}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              className={`icon-btn${
                loading
                  ? ' inventory-refreshing'
                  : ''
              }`}
              onClick={load}
              disabled={refreshDisabled}
              title="Refresh inventory"
              aria-label="Refresh inventory"
            >
              <RiRefreshLine
                size={18}
                className={
                  loading
                    ? 'inventory-refresh-icon spin'
                    : ''
                }
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <div
          className="admin-stats inventory-stats"
          aria-label="Inventory statistics"
        >
          <article className="admin-stat">
            <div className="stat-label">
              Products
            </div>
            <div className="stat-value">
              {loading ? '…' : counts.total}
            </div>
          </article>

          <article className="admin-stat">
            <div className="stat-label">
              Units on hand
            </div>
            <div className="stat-value">
              {loading ? '…' : counts.units}
            </div>
          </article>

          <article className="admin-stat">
            <div className="stat-label">
              Low stock
            </div>
            <div className="stat-value">
              {loading ? '…' : counts.low}
            </div>
          </article>

          <article className="admin-stat">
            <div className="stat-label">
              Out of stock
            </div>
            <div className="stat-value">
              {loading ? '…' : counts.out}
            </div>
          </article>
        </div>
      </div>

      <div className="admin-table-wrap inventory-table-wrap">
        <div className="admin-toolbar inventory-list-toolbar">
          <label
            className="admin-search inventory-search"
            htmlFor="inventory-search"
          >
            <RiSearchLine
              size={17}
              aria-hidden="true"
            />

            <span className="sr-only">
              Search inventory
            </span>

            <input
              id="inventory-search"
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search product or SKU…"
              autoComplete="off"
            />
          </label>

          <label
            className="inventory-filter"
            htmlFor="inventory-filter"
          >
            <span className="sr-only">
              Filter inventory
            </span>

            <select
              id="inventory-filter"
              className="admin-select"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
            >
              <option value="all">
                All stock
              </option>
              <option value="healthy">
                Healthy
              </option>
              <option value="low">
                Low stock
              </option>
              <option value="out">
                Out of stock
              </option>
            </select>
          </label>
        </div>

        <div className="inventory-table-scroll">
          <table className="admin-table inventory-table">
            <caption className="sr-only">
              Product inventory
            </caption>

            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">SKU</th>
                <th scope="col">On hand</th>
                <th scope="col">
                  Threshold
                </th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((product) => {
                  const stock = normalizeStock(
                    product?.stock,
                  );
                  const state =
                    getStockState(stock);
                  const disabled =
                    busy === product?.id ||
                    Boolean(busy);

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="td-strong inventory-product-name">
                          {pretty(product?.name)}
                        </div>

                        <div className="td-dim inventory-product-slug">
                          {pretty(product?.slug)}
                        </div>
                      </td>

                      <td className="td-dim inventory-sku">
                        {pretty(product?.sku)}
                      </td>

                      <td className="td-gold inventory-stock-value">
                        {stock}
                      </td>

                      <td>
                        {LOW_STOCK_THRESHOLD}
                      </td>

                      <td>
                        <span
                          className={`admin-pill ${getStockTone(
                            state,
                          )}`}
                        >
                          {getStockLabel(
                            state,
                          )}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="icon-btn"
                          disabled={disabled}
                          onClick={() =>
                            openEditor(product)
                          }
                          title="Edit inventory"
                          aria-label={`Edit inventory for ${pretty(
                            product?.name,
                          )}`}
                        >
                          <RiPencilLine
                            size={17}
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty">
                      {loading
                        ? 'Loading inventory…'
                        : query.trim()
                          ? 'No products match your search.'
                          : 'No products match the selected filter.'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <AdminModal
          className="inventory-modal"
          title="Edit inventory"
          sub={`${pretty(
            editing.name,
          )} · ${pretty(editing.sku)}`}
          onClose={closeEditor}
        >
          <div className="inventory-modal-status">
            <span
              className="inventory-modal-status-icon"
              aria-hidden="true"
            >
              <RiBox3Line size={18} />
            </span>

            <div>
              <strong>
                Stock adjustment
              </strong>
              <span>
                Update available units with an
                auditable reason.
              </span>
            </div>
          </div>

          <div className="inventory-editor-summary">
            <div>
              <span className="stat-label">
                Current stock
              </span>

              <strong>
                {normalizeStock(
                  editing.stock,
                )}
              </strong>
            </div>

            <div>
              <span className="stat-label">
                Threshold
              </span>

              <strong>
                {LOW_STOCK_THRESHOLD}
              </strong>
            </div>
          </div>

          <form
            onSubmit={submitAdjustment}
            className="inventory-editor-form"
          >
            <label className="admin-field inventory-quantity-field">
              <span>
                Quantity change
              </span>

              <div className="inventory-adjust-controls">
                <button
                  type="button"
                  className="icon-btn inventory-step-btn"
                  onClick={() =>
                    setQuantity(
                      (value) =>
                        String(
                          (Number(value) || 0) -
                            1,
                        ),
                    )
                  }
                  disabled={Boolean(busy)}
                  title="Decrease quantity"
                  aria-label="Decrease quantity"
                >
                  <RiSubtractLine
                    size={18}
                    aria-hidden="true"
                  />
                </button>

                <input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value,
                    )
                  }
                  placeholder="0"
                  disabled={Boolean(busy)}
                  aria-label="Quantity change"
                />

                <button
                  type="button"
                  className="icon-btn inventory-step-btn"
                  onClick={() =>
                    setQuantity(
                      (value) =>
                        String(
                          (Number(value) || 0) +
                            1,
                        ),
                    )
                  }
                  disabled={Boolean(busy)}
                  title="Increase quantity"
                  aria-label="Increase quantity"
                >
                  <RiAddLine
                    size={18}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <small className="inventory-helper">
                <RiInformationLine
                  size={14}
                  aria-hidden="true"
                />
                <span>
                  Positive adds stock · negative
                  removes stock
                </span>
              </small>
            </label>

            <label className="admin-field">
              <span>
                Reason{' '}
                <b aria-hidden="true">*</b>
              </span>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value,
                  )
                }
                placeholder="Why is the stock being changed?"
                maxLength={
                  REASON_MAX_LENGTH
                }
                rows={3}
                disabled={Boolean(busy)}
                required
              />

              <small>
                {reason.length}/
                {REASON_MAX_LENGTH}{' '}
                characters
              </small>
            </label>

            <div className="inventory-modal-note">
              <RiInformationLine
                size={15}
                aria-hidden="true"
              />

              <span>
                This adjustment is recorded in
                the inventory audit trail.
              </span>
            </div>

            <div className="admin-modal-footer inventory-modal-footer">
              <button
                type="button"
                className="btn btn-quiet"
                onClick={closeEditor}
                disabled={Boolean(busy)}
              >
                <RiCloseLine
                  size={17}
                  aria-hidden="true"
                />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                className="btn"
                disabled={
                  Boolean(busy) ||
                  !quantity ||
                  !reason.trim()
                }
              >
                <RiPencilLine
                  size={16}
                  aria-hidden="true"
                />

                <span>
                  {busy
                    ? 'Saving…'
                    : 'Apply adjustment'}
                </span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </section>
  );
}