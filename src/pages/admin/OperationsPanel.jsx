import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RiAddLine,
  RiCheckLine,
  RiEditLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiSaveLine,
  RiSendPlaneLine,
  RiShieldCheckLine,
} from '@remixicon/react';

import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AdminModal from './Modal';

import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { formatMoney } from '../../utils/format';

import './operations-panel.css';

const pretty = (value) => {
  if (value === null || value === undefined || value === '') return '—';

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '—';
    }
  }

  return String(value);
};

const text = (value) => String(value ?? '').trim();

const errorMessage = (error, fallback) => {
  const message = text(error?.message);
  return message || fallback;
};

function useAsyncGuard() {
  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const startRequest = useCallback(() => {
    requestRef.current += 1;
    return requestRef.current;
  }, []);

  const isCurrent = useCallback(
    (requestId) => mountedRef.current && requestRef.current === requestId,
    [],
  );

  return {
    mountedRef,
    startRequest,
    isCurrent,
  };
}

function Toolbar({
  title,
  description,
  onRefresh,
  children,
  refreshing = false,
  showRefresh = true,
}) {
  return (
    <div className="admin-toolbar ops-toolbar">
      <div className="ops-toolbar-copy">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {(children || showRefresh) && (
        <div className="ops-toolbar-actions">
          {children}
          {showRefresh && (
            <button
              type="button"
              className="btn btn-quiet btn-sm ops-toolbar-refresh"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label={`Refresh ${title}`}
              title={`Refresh ${title}`}
              aria-busy={refreshing}
            >
              <RiRefreshLine
                size={16}
                className={refreshing ? 'ops-spin' : undefined}
                aria-hidden="true"
              />
              <span className="ops-refresh-label">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function OperationsPanel({ section }) {
  switch (section) {
    case 'inventory':
      return <InventoryPanel />;

    case 'shipping':
      return <ShippingPanel />;

    case 'subscriptions':
      return <SubscriptionPanel />;

    case 'user-actions':
      return <UserActionsPanel />;

    case 'rbac':
      return <RbacPanel />;

    case 'notifications':
      return <NotificationsPanel />;

    case 'settings':
      return <SettingsPanel />;

    case 'payments':
      return <PaymentsPanel />;

    case 'reports':
      return <ReportsPanel />;

    case 'audit':
      return <AuditPanel />;

    case 'reviews':
      return <ReviewsModerationPanel />;

    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Inventory                                                                  */
/* -------------------------------------------------------------------------- */

function InventoryPanel() {
  const { toast } = useToast();
  const { mountedRef, startRequest, isCurrent } = useAsyncGuard();

  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    const requestId = startRequest();

    setLoading(true);

    try {
      const result = await adminService.lowStock();

      if (!isCurrent(requestId)) return;

      setLowStock(itemsOfList(result));
    } catch (error) {
      if (!mountedRef.current) return;
      toast.error(errorMessage(error, 'Unable to load inventory.'));
    } finally {
      if (mountedRef.current && isCurrent(requestId)) {
        setLoading(false);
      }
    }
  }, [isCurrent, mountedRef, startRequest, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const scan = async () => {
    if (scanning) return;

    setScanning(true);

    try {
      const result = await adminService.scanLowStock();

      if (!mountedRef.current) return;

      toast.success(
        `${Number(result?.alerts_published) || 0} low-stock alert(s) published.`,
      );

      await load();
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, 'Low-stock scan failed.'));
      }
    } finally {
      if (mountedRef.current) {
        setScanning(false);
      }
    }
  };

  return (
    <section className="admin-panel" aria-labelledby="ops-inventory-title">
      <div className="admin-card">
        <Toolbar
          title="Inventory"
          description="Monitor stock risk and release abandoned checkout reservations."
          onRefresh={load}
          refreshing={loading}
        >
          <button
            type="button"
            className="btn btn-sm"
            disabled={scanning}
            onClick={scan}
          >
            <RiRefreshLine
              size={16}
              className={scanning ? 'ops-spin' : undefined}
              aria-hidden="true"
            />
            {scanning ? 'Scanning…' : 'Scan low stock'}
          </button>
        </Toolbar>

        <div className="admin-stats">
          <div className="admin-stat">
            <div className="stat-label">Low-stock products</div>
            <div className="stat-value">
              {loading ? '…' : lowStock.length}
            </div>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">
              Products currently below their configured stock threshold
            </caption>

            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Stock</th>
                <th scope="col">Threshold</th>
              </tr>
            </thead>

            <tbody>
              {lowStock.length ? (
                lowStock.map((product, index) => (
                  <tr key={product.id || index}>
                    <td className="td-strong">
                      {pretty(product.name || product.product_name)}
                    </td>
                    <td className="td-gold">
                      {pretty(product.stock ?? product.quantity)}
                    </td>
                    <td>
                      {pretty(
                        product.low_stock_threshold ?? product.threshold,
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">
                    <div className="admin-empty">
                      {loading
                        ? 'Loading inventory…'
                        : 'No low-stock products.'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Shipping                                                                   */
/* -------------------------------------------------------------------------- */

function ShippingPanel() {
  const { toast } = useToast();
  const { mountedRef, startRequest, isCurrent } = useAsyncGuard();

  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const requestId = startRequest();
    setLoading(true);

    try {
      const result = await adminService.settings();
      if (!isCurrent(requestId)) return;
      setSettings(itemsOfList(result));
    } catch (error) {
      if (mountedRef.current) {
        toast.error(
          errorMessage(error, 'Unable to load shipping settings.'),
        );
      }
    } finally {
      if (mountedRef.current && isCurrent(requestId)) {
        setLoading(false);
      }
    }
  }, [isCurrent, mountedRef, startRequest, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const settingValue = useMemo(() => {
    const map = new Map(
      settings.map((setting) => [setting.key, setting.value]),
    );

    return {
      enabled: map.get('shipping_enabled'),
      threshold: map.get('free_shipping_threshold'),
      rate: map.get('flat_shipping_rate'),
    };
  }, [settings]);

  const formatSetting = (value, suffix = '') => {
    if (value === null || value === undefined || value === '') {
      return 'Not configured';
    }

    return `${pretty(value)}${suffix}`;
  };

  return (
    <section className="admin-panel min-w-0" aria-labelledby="ops-shipping-title">
      <div className="admin-card">
        <Toolbar
          title="Shipping"
          description="Luviio uses manual shipping. Checkout pricing and shipping configuration are read from server-side settings."
          onRefresh={load}
          refreshing={loading}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="admin-stat">
            <div className="stat-label">Shipping mode</div>
            <div className="stat-value ops-stat-value-sm">
              Manual
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">Shipping status</div>
            <div className="stat-value ops-stat-value-sm">
              {loading
                ? '…'
                : settingValue.enabled === true ||
                    String(settingValue.enabled).toLowerCase() === 'true'
                  ? 'Enabled'
                  : 'Disabled'}
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">Flat rate</div>
            <div className="stat-value ops-stat-value-sm">
              {loading
                ? '…'
                : `₹${formatSetting(settingValue.rate)}`}
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">Free shipping threshold</div>
            <div className="stat-value ops-stat-value-sm">
              {loading
                ? '…'
                : `₹${formatSetting(settingValue.threshold)}`}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-line-soft bg-surface-2 px-4 py-4 text-sm leading-6 text-muted">
          <strong className="font-semibold text-text">
            Fulfillment is separate from pricing:
          </strong>{' '}
          checkout uses the configured manual shipping rate, while staff
          records dispatch, tracking and delivery status in
          <span className="font-semibold text-text"> Fulfillment</span>.
          No external courier rate is requested from this panel.
        </div>
      </div>

      <div className="admin-card">
        <Toolbar
          title="Shipping configuration"
          description="Read-only operational view. Change values from System settings so the server remains the single source of truth."
          onRefresh={load}
          refreshing={loading}
          showRefresh={false}
        />

        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">
              Current shipping configuration
            </caption>
            <thead>
              <tr>
                <th scope="col">Setting</th>
                <th scope="col">Value</th>
                <th scope="col">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="td-strong">shipping_enabled</td>
                <td className="td-gold">
                  {loading ? '…' : pretty(settingValue.enabled)}
                </td>
                <td>Controls whether a shipping charge is applied.</td>
              </tr>
              <tr>
                <td className="td-strong">flat_shipping_rate</td>
                <td className="td-gold">
                  {loading
                    ? '…'
                    : `₹${formatSetting(settingValue.rate)}`}
                </td>
                <td>Canonical manual shipping charge below the threshold.</td>
              </tr>
              <tr>
                <td className="td-strong">free_shipping_threshold</td>
                <td className="td-gold">
                  {loading
                    ? '…'
                    : `₹${formatSetting(settingValue.threshold)}`}
                </td>
                <td>Subtotal at or above this value receives free shipping.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="admin-page-note mt-4">
          Shipping values are displayed from the backend. This panel does not
          calculate, override or duplicate checkout pricing logic.
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Subscriptions                                                              */
/* -------------------------------------------------------------------------- */

const EMPTY_SUBSCRIPTION = {
  tier: 'premium',
  name: '',
  price_inr: '',
  duration_days: 30,
  description: '',
  is_active: true,
};

function SubscriptionPanel() {
  const { toast } = useToast();
  const { mountedRef, startRequest, isCurrent } = useAsyncGuard();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_SUBSCRIPTION);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const requestId = startRequest();

    setLoading(true);

    try {
      const result = await adminService.subscriptionPlans(true);

      if (!isCurrent(requestId)) return;

      setPlans(itemsOfList(result));
    } catch (error) {
      if (mountedRef.current) {
        toast.error(
          errorMessage(error, 'Unable to load subscription plans.'),
        );
      }
    } finally {
      if (mountedRef.current && isCurrent(requestId)) {
        setLoading(false);
      }
    }
  }, [isCurrent, mountedRef, startRequest, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm({ ...EMPTY_SUBSCRIPTION });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_SUBSCRIPTION });
    setEditorOpen(true);
  };

  const editPlan = (plan) => {
    setEditing(plan.id);
    setEditorOpen(true);
    setForm({
      ...EMPTY_SUBSCRIPTION,
      ...plan,
      price_inr: plan.price_inr ?? '',
      duration_days: plan.duration_days ?? 30,
      description: plan.description ?? '',
      is_active: plan.is_active !== false,
    });
  };

  const save = async (event) => {
    event.preventDefault();

    if (saving) return;

    const name = text(form.name);
    const price = Number(form.price_inr);
    const duration = Number(form.duration_days);

    if (!name) {
      toast.error('Plan name is required.');
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.error('Enter a valid plan price.');
      return;
    }

    if (!Number.isInteger(duration) || duration < 1) {
      toast.error('Duration must be at least 1 day.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        name,
        price_inr: price,
        duration_days: duration,
        description: text(form.description),
        is_active: Boolean(form.is_active),
      };

      if (editing) {
        await adminService.updateSubscription(editing, payload);
      } else {
        await adminService.createSubscription(payload);
      }

      if (!mountedRef.current) return;

      toast.success(editing ? 'Plan updated.' : 'Plan created.');
      resetForm();
      await load();
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, 'Unable to save plan.'));
      }
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  return (
    <section className="admin-panel" aria-labelledby="ops-subscriptions-title">
      <div className="admin-card">
        <Toolbar
          title="Subscription plans"
          description="Manage membership plans and customer entitlements."
          onRefresh={load}
          refreshing={loading}
        >
          <button
            type="button"
            className="subscription-add-button"
            onClick={openCreate}
            disabled={saving}
            aria-label="Create subscription plan"
            title="Create subscription plan"
          >
            <RiAddLine size={21} aria-hidden="true" />
          </button>
        </Toolbar>

        {editorOpen && (
          <AdminModal
            className="subscription-editor-modal"
            title={editing ? 'Edit subscription plan' : 'Create subscription plan'}
            sub="Set the plan's customer-facing name, entitlement tier and price."
            onClose={() => {
              if (!saving) resetForm();
            }}
          >
            <form onSubmit={save} noValidate>
          <div className="field-grid">
            <label>
              Tier
              <select
                value={form.tier}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tier: event.target.value,
                  }))
                }
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="platinum">Platinum</option>
              </select>
            </label>

            <label>
              Name
              <input
                required
                maxLength={120}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Price (INR)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price_inr}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    price_inr: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Duration (days)
              <input
                required
                type="number"
                min="1"
                step="1"
                value={form.duration_days}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    duration_days: event.target.value,
                  }))
                }
              />
            </label>

            <label className="ops-full">
              Description
              <textarea
                maxLength={1000}
                value={form.description || ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={Boolean(form.is_active)}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    is_active: event.target.checked,
                  }))
                }
              />
              Active
            </label>
          </div>

          <div className="btn-row ops-form-actions">
            <button className="btn btn-sm" type="submit" disabled={saving}>
              <RiSaveLine size={16} aria-hidden="true" />
              {saving
                ? 'Saving…'
                : editing
                  ? 'Update plan'
                  : 'Create plan'}
            </button>

            <button
              className="btn btn-quiet btn-sm"
              type="button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
          </AdminModal>
        )}
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">
              Subscription plans
            </caption>

            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">Name</th>
                <th scope="col">Price</th>
                <th scope="col">Duration</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>

            <tbody>
              {plans.length ? (
                plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>{pretty(plan.tier)}</td>
                    <td className="td-strong">{pretty(plan.name)}</td>
                    <td className="td-gold">
                      {formatMoney(Number(plan.price_inr) || 0)}
                    </td>
                    <td>{pretty(plan.duration_days)} days</td>
                    <td>
                      <span
                        className={`admin-pill ${
                          plan.is_active
                            ? 'pill-success'
                            : 'pill-muted'
                        }`}
                      >
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => editPlan(plan)}
                        title={`Edit ${plan.name || 'plan'}`}
                        aria-label={`Edit ${plan.name || 'plan'}`}
                      >
                        <RiEditLine size={15} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty">
                      {loading
                        ? 'Loading plans…'
                        : 'No subscription plans.'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* User actions                                                               */
/* -------------------------------------------------------------------------- */

function UserActionsPanel() {
  const { toast } = useToast();
  const { mountedRef } = useAsyncGuard();
  const [searchParams] = useSearchParams();
  const requestedUserId = searchParams.get('user_id') || '';

  const [userId, setUserId] = useState(requestedUserId);
  const [data, setData] = useState(null);
  const autoLoadedUserIdRef = useRef('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');

  const load = useCallback(async (userIdOverride) => {
    const normalizedUserId = text(typeof userIdOverride === 'string' ? userIdOverride : userId);

    if (!normalizedUserId) {
      toast.error('Enter a customer UUID.');
      return;
    }

    setLoading(true);

    try {
      const result = await adminService.userActions(normalizedUserId);

      if (!mountedRef.current) return;

      setData(result);
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, 'Unable to load user actions.'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [mountedRef, toast, userId]);

  useEffect(() => {
    if (!requestedUserId || autoLoadedUserIdRef.current === requestedUserId) return;
    autoLoadedUserIdRef.current = requestedUserId;
    setUserId(requestedUserId);
    load(requestedUserId);
  }, [load, requestedUserId]);

  const toggle = async (action, blocked) => {
    if (busy) return;

    const normalizedUserId = text(userId);

    if (!normalizedUserId) {
      toast.error('Enter a customer UUID.');
      return;
    }

    setBusy(action);

    try {
      if (blocked) {
        await adminService.removeUserAction(normalizedUserId, action);
      } else {
        await adminService.setUserAction(
          normalizedUserId,
          action,
          false,
          'Disabled by administrator',
        );
      }

      if (!mountedRef.current) return;

      toast.success(blocked ? 'User action restored.' : 'User action disabled.');
      await load();
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, 'Unable to update user action.'));
      }
    } finally {
      if (mountedRef.current) {
        setBusy('');
      }
    }
  };

  const actions = Array.isArray(data?.all_actions)
    ? data.all_actions
    : [];

  return (
    <section className="admin-panel">
      <div className="admin-card">
        <Toolbar
          title="User actions"
          description="Per-customer controls for checkout and commerce capabilities."
          onRefresh={load}
          refreshing={loading}
        />

        <div className="ops-inline">
          <label className="sr-only" htmlFor="admin-user-action-id">
            Customer UUID
          </label>

          <input
            id="admin-user-action-id"
            placeholder="Enter customer UUID"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            autoComplete="off"
          />

          <button
            type="button"
            className="btn btn-sm"
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Load controls'}
          </button>
        </div>

        {loading ? (
          <div className="admin-empty">Loading controls…</div>
        ) : data ? (
          <div className="admin-stats">
            {actions.map((action) => {
              const row = (data.controls || []).find(
                (control) => control.action === action,
              );

              const blocked = row?.enabled === false;

              return (
                <div className="admin-stat" key={action}>
                  <div className="stat-label">
                    {String(action).replaceAll('_', ' ')}
                  </div>

                  <div className="stat-value ops-stat-value-sm">
                    {blocked ? 'Blocked' : 'Enabled'}
                  </div>

                  <div className="permission-control-cell">
                    <button
                      type="button"
                      className="admin-switch"
                      role="switch"
                      aria-checked={!blocked}
                      aria-label={`${blocked ? 'Restore' : 'Disable'} ${String(action).replaceAll('_', ' ')}`}
                      disabled={Boolean(busy)}
                      onClick={() => toggle(action, blocked)}
                    >
                      <span className="admin-switch-thumb" aria-hidden="true">
                        {busy === action ? (
                          <span className="admin-switch-spinner" />
                        ) : blocked ? (
                          <RiCloseLine size={13} />
                        ) : (
                          <RiCheckLine size={13} />
                        )}
                      </span>
                    </button>
                    <span className="settings-switch-label" aria-live="polite">
                      {busy === action ? 'Saving…' : blocked ? 'Disabled' : 'Enabled'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty">
            Enter a customer UUID to inspect controls.
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* RBAC                                                                       */
/* -------------------------------------------------------------------------- */

function RbacPanel() {
  const { toast } = useToast();
  const { mountedRef, startRequest, isCurrent } = useAsyncGuard();

  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');

  const load = useCallback(async () => {
    const requestId = startRequest();

    setLoading(true);

    try {
      const result = await adminService.permissions();

      if (!isCurrent(requestId)) return;

      setMatrix(result);
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, 'Unable to load permissions.'));
      }
    } finally {
      if (mountedRef.current && isCurrent(requestId)) {
        setLoading(false);
      }
    }
  }, [isCurrent, mountedRef, startRequest, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(
    () =>
      Object.entries(matrix?.effective || {}).flatMap(
        ([role, permissions]) =>
          Object.entries(permissions || {}).map(
            ([permission, enabled]) => ({
              role,
              permission,
              enabled: Boolean(enabled),
            }),
          ),
      ),
    [matrix],
  );

  const setPermission = async (row, enabled) => {
    const key = `${row.role}:${row.permission}`;

    if (busyKey || row.role === 'super_admin' || enabled === row.enabled) return;

    setBusyKey(key);

    try {
      await adminService.togglePermission(
        row.role,
        row.permission,
        enabled,
      );

      if (!mountedRef.current) return;

      toast.success('Permission updated.');
      await load();
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, 'Unable to update permission.'));
      }
    } finally {
      if (mountedRef.current) {
        setBusyKey('');
      }
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-card">
        <Toolbar
          title="Roles & permissions"
          description="Effective policy after static defaults and database overrides."
          onRefresh={load}
          refreshing={loading}
        />

        <div className="admin-page-note">
          {loading
            ? 'Loading…'
            : `${rows.length} permission entries loaded.`}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">
              Effective role permissions
            </caption>

            <thead>
              <tr>
                <th scope="col">Role</th>
                <th scope="col">Permission</th>
                <th scope="col">Access</th>
                <th scope="col">Policy</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((row) => {
                  const key = `${row.role}:${row.permission}`;
                  const immutable = row.role === 'super_admin';

                  return (
                    <tr key={key}>
                      <td className="td-strong">{row.role}</td>
                      <td>{row.permission}</td>

                      <td>
                        {immutable ? (
                          <span className="admin-pill pill-muted" title="Super-admin permissions are immutable">Fixed policy</span>
                        ) : (
                          <div className="permission-control-cell">
                            <button
                              type="button"
                              className="admin-switch permission-switch"
                              role="switch"
                              aria-checked={row.enabled}
                              aria-label={`${row.enabled ? 'Disable' : 'Enable'} ${row.permission} for ${row.role}`}
                              title={`${row.enabled ? 'Disable' : 'Enable'} ${row.permission}`}
                              onClick={() => setPermission(row, !row.enabled)}
                              disabled={Boolean(busyKey)}
                            >
                              <span className="admin-switch-thumb" aria-hidden="true">
                                {busyKey === key ? (
                                  <span className="admin-switch-spinner" />
                                ) : row.enabled ? (
                                  <RiCheckLine size={13} />
                                ) : (
                                  <RiCloseLine size={13} />
                                )}
                              </span>
                            </button>
                            <span className="settings-switch-label" aria-live="polite">
                              {busyKey === key ? 'Saving…' : row.enabled ? 'Allowed' : 'Denied'}
                            </span>
                          </div>
                        )}
                      </td>
                        {immutable ? (
                          <span className="admin-pill pill-muted" title="Super-admin permissions are immutable">Fixed policy</span>
                        ) : (
                          <fieldset className="permission-radio-group" disabled={Boolean(busyKey)}>
                            <legend className="sr-only">{row.role} — {row.permission}</legend>
                            <label>
                              <input type="radio" name={`permission-${row.role}-${row.permission}`} value="allow" checked={row.enabled} onChange={() => setPermission(row, true)} disabled={Boolean(busyKey)} />
                              <span>Allow</span>
                            </label>
                            <label>
                              <input type="radio" name={`permission-${row.role}-${row.permission}`} value="deny" checked={!row.enabled} onChange={() => setPermission(row, false)} disabled={Boolean(busyKey)} />
                              <span>Deny</span>
                            </label>
                            {busyKey === key && <span role="status">Saving…</span>}
                          </fieldset>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3">
                    <div className="admin-empty">
                      {loading
                        ? 'Loading permissions…'
                        : 'No permission entries found.'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

function NotificationsPanel() {
  const { toast } = useToast();
  const { mountedRef } = useAsyncGuard();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [icon, setIcon] = useState('/icon-192.png');
  const [badge, setBadge] = useState('/icon-192.png');
  const [image, setImage] = useState('');
  const [tag, setTag] = useState('luviio-offer');
  const [requireInteraction, setRequireInteraction] = useState(false);
  const [renotify, setRenotify] = useState(false);
  const [targetUsers, setTargetUsers] = useState('');
  const [actionOneTitle, setActionOneTitle] = useState('');
  const [actionOneUrl, setActionOneUrl] = useState('');
  const [actionTwoTitle, setActionTwoTitle] = useState('');
  const [actionTwoUrl, setActionTwoUrl] = useState('');

  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const result = await adminService.pushStats();

      if (!mountedRef.current) return;

      setStats(result);
    } catch (error) {
      if (mountedRef.current) {
        toast.error(
          errorMessage(error, 'Unable to load notification stats.'),
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [mountedRef, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (event) => {
    event.preventDefault();

    if (sending) return;

    const normalizedTitle = text(title);
    const normalizedBody = text(body);
    const normalizedUrl = text(url) || '/';
    const normalizedIcon = text(icon) || '/icon-192.png';
    const normalizedBadge = text(badge) || '/icon-192.png';
    const normalizedImage = text(image);
    const normalizedTag = text(tag) || 'luviio-notification';
    const normalizedTargets = targetUsers.trim()
      ? targetUsers.split(/[\s,;]+/).map((id) => id.trim()).filter(Boolean)
      : null;
    const actionFields = [
      { title: text(actionOneTitle), action: text(actionOneUrl) },
      { title: text(actionTwoTitle), action: text(actionTwoUrl) },
    ];
    const partialAction = actionFields.some((item) => Boolean(item.title) !== Boolean(item.action));
    const actions = actionFields.filter((item) => item.title && item.action);

    if (!normalizedTitle || !normalizedBody) {
      toast.error('Title and message are required.');
      return;
    }
    if (partialAction) {
      toast.error('Each notification action needs both a title and an in-site path.');
      return;
    }
    if ([normalizedUrl, normalizedIcon, normalizedBadge, normalizedImage, ...actions.map((item) => item.action)].some((value) => value && (!value.startsWith('/') || value.startsWith('//')))) {
      toast.error('Notification links and assets must use in-site paths beginning with /.');
      return;
    }
    if (normalizedTargets?.some((id) => id.length < 8)) {
      toast.error('Check the targeted user IDs or leave the audience empty to send to all subscribed users.');
      return;
    }

    setSending(true);

    try {
      const result = await adminService.sendPush({
        user_ids: normalizedTargets,
        title: normalizedTitle,
        body: normalizedBody,
        url: normalizedUrl,
        icon: normalizedIcon,
        badge: normalizedBadge,
        ...(normalizedImage ? { image: normalizedImage } : {}),
        tag: normalizedTag,
        require_interaction: requireInteraction,
        renotify,
        actions,
      });

      if (!mountedRef.current) return;

      toast.success(result?.message || 'Notification dispatched.');

      setTitle('');
      setBody('');
      setActionOneTitle('');
      setActionOneUrl('');
      setActionTwoTitle('');
      setActionTwoUrl('');

      await load();
    } catch (error) {
      if (mountedRef.current) {
        toast.error(
          errorMessage(error, 'Unable to send notification.'),
        );
      }
    } finally {
      if (mountedRef.current) {
        setSending(false);
      }
    }
  };

  return (
    <section className="admin-panel notifications-panel">
      <div className="admin-card">
        <Toolbar
          title="Notifications"
          description="Send controlled customer messaging and monitor Web Push subscriptions."
          onRefresh={load}
          refreshing={loading}
        />

        <div className="admin-stats">
          <div className="admin-stat">
            <div className="stat-label">Subscribed devices</div>
            <div className="stat-value">
              {loading
                ? '…'
                : pretty(stats?.total_subscriptions ?? stats?.subscriptions ?? stats?.total ?? 0)}
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">Subscribed customers</div>
            <div className="stat-value">{loading ? '…' : pretty(stats?.unique_users ?? 0)}</div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">Push configuration</div>
            <div className="stat-value ops-stat-value-sm">
              {loading ? 'Checking…' : stats?.vapid_configured ? 'Configured' : 'Not configured'}
            </div>
          </div>
        </div>

        <form onSubmit={send} className="ops-form notification-composer" noValidate>
          <div className="notification-section-heading">
            <h3>Message content</h3>
            <p>Use a clear title, concise message and an in-site destination.</p>
          </div>
          <label>
            Title
            <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. New Luviio offer" />
          </label>
          <label>
            Message
            <textarea required maxLength={2000} rows="4" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tell customers what is new or on offer…" />
          </label>
          <div className="field-grid notification-media-grid">
            <label>
              Click destination
              <input value={url} maxLength={500} onChange={(event) => setUrl(event.target.value)} placeholder="/products/floor-drainer-square-ring" />
            </label>
            <label>
              Notification icon path
              <input value={icon} maxLength={500} onChange={(event) => setIcon(event.target.value)} placeholder="/icon-192.png" />
            </label>
            <label>
              Badge path
              <input value={badge} maxLength={500} onChange={(event) => setBadge(event.target.value)} placeholder="/icon-192.png" />
            </label>
            <label>
              Large image path (optional)
              <input value={image} maxLength={500} onChange={(event) => setImage(event.target.value)} placeholder="/products/offer-banner.webp" />
            </label>
            <label>
              Campaign tag
              <input value={tag} maxLength={100} onChange={(event) => setTag(event.target.value)} placeholder="diwali-offer-2026" />
            </label>
            <label>
              Specific user IDs (optional)
              <input value={targetUsers} maxLength={4000} onChange={(event) => setTargetUsers(event.target.value)} placeholder="Leave empty to send to all subscribers" />
            </label>
          </div>
          <fieldset className="notification-actions-config">
            <legend>Optional notification buttons (up to 2)</legend>
            <div className="field-grid">
              <label>
                Button 1 label
                <input value={actionOneTitle} maxLength={30} onChange={(event) => setActionOneTitle(event.target.value)} placeholder="Shop offer" />
              </label>
              <label>
                Button 1 destination path
                <input value={actionOneUrl} maxLength={500} onChange={(event) => setActionOneUrl(event.target.value)} placeholder="/offers" />
              </label>
              <label>
                Button 2 label
                <input value={actionTwoTitle} maxLength={30} onChange={(event) => setActionTwoTitle(event.target.value)} placeholder="View product" />
              </label>
              <label>
                Button 2 destination path
                <input value={actionTwoUrl} maxLength={500} onChange={(event) => setActionTwoUrl(event.target.value)} placeholder="/products/slug" />
              </label>
            </div>
          </fieldset>
          <div className="notification-toggles">
            <label><input type="checkbox" checked={requireInteraction} onChange={(event) => setRequireInteraction(event.target.checked)} /> Keep visible until interaction (where supported)</label>
            <label><input type="checkbox" checked={renotify} onChange={(event) => setRenotify(event.target.checked)} /> Re-alert for same campaign tag</label>
          </div>
          <div className="notification-form-actions">
            <button className="btn" type="submit" disabled={sending || loading}>
              <RiSendPlaneLine size={16} aria-hidden="true" />
              {sending ? 'Sending…' : 'Send notification'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

function SettingsPanel() {
  const { toast } = useToast();
  const { mountedRef, startRequest, isCurrent } = useAsyncGuard();

  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [switchBusyKey, setSwitchBusyKey] = useState('');

  const load = useCallback(async () => {
    const requestId = startRequest();

    setLoading(true);

    try {
      const result = await adminService.settings();

      if (!isCurrent(requestId)) return;

      setSettings(itemsOfList(result));
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, 'Unable to load settings.'));
      }
    } finally {
      if (mountedRef.current && isCurrent(requestId)) {
        setLoading(false);
      }
    }
  }, [isCurrent, mountedRef, startRequest, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openEditor = (setting) => {
    if (!setting || setting.is_system_locked) return;

    setEditing(setting);

    if (typeof setting.value === 'string') {
      setDraft(setting.value);
      return;
    }

    try {
      setDraft(JSON.stringify(setting.value, null, 2));
    } catch {
      setDraft(String(setting.value ?? ''));
    }
  };

  const closeEditor = () => {
    if (saving) return;

    setEditing(null);
    setDraft('');
  };

  const toggleBooleanSetting = async (setting) => {
    if (!setting || setting.is_system_locked || saving || switchBusyKey) return;

    const currentValue =
      setting.value === true ||
      String(setting.value ?? '').trim().toLowerCase() === 'true';
    const nextValue = !currentValue;
    setSwitchBusyKey(setting.key);

    try {
      await adminService.updateSetting(
        setting.key,
        nextValue,
        'Toggled from System settings',
      );
      if (!mountedRef.current) return;
      toast.success(`${setting.key} ${nextValue ? 'enabled' : 'disabled'}.`);
      await load();
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, `Unable to update ${setting.key}.`));
      }
    } finally {
      if (mountedRef.current) setSwitchBusyKey('');
    }
  };

  const parseDraft = (setting) => {
    const raw = draft.trim();

    if (setting?.data_type === 'string') {
      return draft;
    }

    if (
      setting?.data_type === 'number' ||
      setting?.data_type === 'integer'
    ) {
      const value = Number(raw);

      if (!Number.isFinite(value)) {
        throw new Error('Enter a valid numeric value.');
      }

      if (
        setting.data_type === 'integer' &&
        !Number.isInteger(value)
      ) {
        throw new Error('Enter a whole number.');
      }

      return value;
    }

    if (setting?.data_type === 'boolean') {
      if (!['true', 'false'].includes(raw.toLowerCase())) {
        throw new Error('Enter true or false.');
      }

      return raw.toLowerCase() === 'true';
    }

    try {
      return JSON.parse(raw);
    } catch {
      throw new Error('Enter valid JSON for this setting.');
    }
  };

  const save = async (event) => {
    event.preventDefault();

    if (!editing || saving) return;

    setSaving(true);

    try {
      const value = parseDraft(editing);

      await adminService.updateSetting(
        editing.key,
        value,
        'Updated from admin console',
      );

      if (!mountedRef.current) return;

      toast.success('Setting updated.');

      setEditing(null);
      setDraft('');

      await load();
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, 'Unable to update setting.'));
      }
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-card">
        <Toolbar
          title="System settings"
          description="Operational, financial and UI configuration with server-side validation."
          onRefresh={load}
          refreshing={loading}
        />

        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">
              System configuration settings
            </caption>

            <thead>
              <tr>
                <th scope="col">Key</th>
                <th scope="col">Category</th>
                <th scope="col">Type</th>
                <th scope="col">Value</th>
                <th scope="col">Action</th>
              </tr>
            </thead>

            <tbody>
              {settings.length ? (
                settings.map((setting) => {
                  const isBooleanSetting =
                    setting.data_type === 'boolean' ||
                    typeof setting.value === 'boolean';
                  const booleanValue =
                    setting.value === true ||
                    String(setting.value ?? '').trim().toLowerCase() === 'true';
                  const switchBusy = switchBusyKey === setting.key;

                  return (
                    <tr key={setting.key}>
                      <td className="td-strong">{setting.key}</td>
                      <td>{pretty(setting.category)}</td>
                      <td>{pretty(setting.data_type)}</td>
                      <td className="td-dim">
                        <span title={pretty(setting.value)}>
                          {pretty(setting.value)}
                        </span>
                      </td>
                      <td>
                        {setting.is_system_locked ? (
                          <span className="admin-pill pill-muted">Locked</span>
                        ) : isBooleanSetting ? (
                          <div className="settings-switch-cell">
                            <button
                              type="button"
                              className="admin-switch"
                              role="switch"
                              aria-checked={booleanValue}
                              aria-label={`${booleanValue ? 'Disable' : 'Enable'} ${setting.key}`}
                              title={`${booleanValue ? 'Disable' : 'Enable'} ${setting.key}`}
                              disabled={Boolean(switchBusyKey) || saving}
                              onClick={() => toggleBooleanSetting(setting)}
                            >
                              <span className="admin-switch-thumb" aria-hidden="true">
                                {switchBusy ? <span className="admin-switch-spinner" /> : booleanValue ? <RiCheckLine size={14} /> : <RiCloseLine size={14} />}
                              </span>
                            </button>
                            <span className="settings-switch-label" aria-live="polite">
                              {switchBusy ? 'Saving…' : booleanValue ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-quiet btn-sm"
                            onClick={() => openEditor(setting)}
                            disabled={Boolean(switchBusyKey) || saving}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="admin-empty">
                      {loading
                        ? 'Loading settings…'
                        : 'No settings found.'}
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
          title={`Edit setting · ${editing.key}`}
          sub={`Type: ${
            editing.data_type || 'auto'
          } · Changes are validated server-side.`}
          onClose={closeEditor}
        >
          <form onSubmit={save} noValidate>
            <div className="field">
              <label htmlFor="admin-setting-value">
                Value
              </label>

              {editing.data_type === 'boolean' ? (
                <div className="setting-radio-options" role="radiogroup" aria-labelledby="admin-setting-value">
                  <span id="admin-setting-value" className="setting-radio-label">Choose a value</span>
                  <label>
                    <input type="radio" name="admin-setting-boolean" value="true" checked={draft.trim().toLowerCase() === 'true'} onChange={() => setDraft('true')} />
                    <span>Enabled · true</span>
                  </label>
                  <label>
                    <input type="radio" name="admin-setting-boolean" value="false" checked={draft.trim().toLowerCase() === 'false'} onChange={() => setDraft('false')} />
                    <span>Disabled · false</span>
                  </label>
                </div>
              ) : (
                <textarea
                  id="admin-setting-value"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={
                    editing.data_type === 'json' ||
                    typeof editing.value === 'object'
                      ? 9
                      : 5
                  }
                  spellCheck="false"
                  autoFocus
                  aria-describedby="admin-setting-help"
                />
              )}

              <small id="admin-setting-help">
                JSON settings must contain valid JSON. String values are
                preserved as typed.
              </small>
            </div>

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
                <RiSaveLine size={16} aria-hidden="true" />
                {saving ? 'Saving…' : 'Save setting'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Payments                                                                   */
/* -------------------------------------------------------------------------- */

function PaymentsPanel() {
  const { toast } = useToast();
  const { mountedRef, startRequest, isCurrent } = useAsyncGuard();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const requestId = startRequest();

    setLoading(true);

    try {
      const result = await adminService.paymentsReport();

      if (!isCurrent(requestId)) return;

      setRows(itemsOfList(result));
    } catch (error) {
      if (mountedRef.current) {
        toast.error(
          errorMessage(error, 'Unable to load payment telemetry.'),
        );
      }
    } finally {
      if (mountedRef.current && isCurrent(requestId)) {
        setLoading(false);
      }
    }
  }, [isCurrent, mountedRef, startRequest, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const successfulCount = useMemo(
    () =>
      rows.filter((row) =>
        ['succeeded', 'paid'].includes(
          text(row.status).toLowerCase(),
        ),
      ).length,
    [rows],
  );

  const attentionCount = Math.max(0, rows.length - successfulCount);

  return (
    <section className="admin-panel">
      <div className="admin-card">
        <Toolbar
          title="Payments"
          description="Gateway attempts, payment state and order reconciliation. No card data is exposed."
          onRefresh={load}
          refreshing={loading}
        />

        <div className="admin-stats">
          <div className="admin-stat">
            <div className="stat-label">Attempts</div>
            <div className="stat-value">
              {loading ? '…' : rows.length}
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">Successful</div>
            <div className="stat-value">
              {loading ? '…' : successfulCount}
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">Needs attention</div>
            <div className="stat-value">
              {loading ? '…' : attentionCount}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">
              Payment gateway telemetry
            </caption>

            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
                <th scope="col">Attempts</th>
                <th scope="col">Intent</th>
                <th scope="col">Created</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((row) => {
                  const statusValue = text(row.status).toLowerCase();
                  const successful = ['succeeded', 'paid'].includes(
                    statusValue,
                  );

                  return (
                    <tr key={row.id}>
                      <td className="td-strong">
                        {pretty(row.orders?.order_number)}
                      </td>

                      <td className="td-gold">
                        {formatMoney(Number(row.amount) || 0)}
                      </td>

                      <td>
                        <span
                          className={`admin-pill ${
                            successful
                              ? 'pill-success'
                              : 'pill-muted'
                          }`}
                        >
                          {pretty(row.status)}
                        </span>
                      </td>

                      <td>
                        {row.attempt_number || 1}/
                        {row.total_attempts || 1}
                      </td>

                      <td className="td-dim">
                        {row.latest_payment_intent_id
                          ? `${String(
                              row.latest_payment_intent_id,
                            ).slice(0, 10)}…`
                          : '—'}
                      </td>

                      <td className="td-dim">
                        {row.created_at
                          ? new Date(
                              row.created_at,
                            ).toLocaleString('en-IN')
                          : '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty">
                      {loading
                        ? 'Loading payment telemetry…'
                        : 'No payment attempts found.'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

function ReportsPanel() {
  const { toast } = useToast();
  const { mountedRef, startRequest, isCurrent } = useAsyncGuard();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const requestId = startRequest();

    setLoading(true);

    try {
      const result = await adminService.reports();

      if (!isCurrent(requestId)) return;

      setReport(result);
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, 'Unable to load reports.'));
      }
    } finally {
      if (mountedRef.current && isCurrent(requestId)) {
        setLoading(false);
      }
    }
  }, [isCurrent, mountedRef, startRequest, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const statusCounts = useMemo(
    () => Object.entries(report?.status_counts || {}),
    [report],
  );

  const topProducts = Array.isArray(report?.top_products)
    ? report.top_products
    : [];
  const totalStatusOrders = statusCounts.reduce(
    (total, [, count]) => total + (Number(count) || 0),
    0,
  );
  const maxStatusCount = Math.max(
    1,
    ...statusCounts.map(([, count]) => Number(count) || 0),
  );

  return (
    <section className="admin-panel reports-panel">
      <div className="admin-card reports-summary-card">
        <Toolbar
          title="Reports"
          description="Business signals for stock, order volume, revenue and product performance."
          onRefresh={load}
          refreshing={loading}
        />

        <div className="admin-stats">
          <div className="admin-stat">
            <div className="stat-label">Orders analysed</div>
            <div className="stat-value">
              {loading ? '…' : report?.orders ?? 0}
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">Revenue</div>
            <div className="stat-value">
              {loading
                ? '…'
                : formatMoney(Number(report?.revenue) || 0)}
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">Low stock</div>
            <div className="stat-value">
              {loading
                ? '…'
                : report?.low_stock_products ?? 0}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card reports-visual-card">
        <h3>Order status</h3>

        {statusCounts.length ? (
          <div className="ops-report-grid" role="list" aria-label="Order status breakdown">
            {statusCounts.map(([key, value]) => {
              const count = Number(value) || 0;
              const percentage = totalStatusOrders
                ? Math.round((count / totalStatusOrders) * 100)
                : 0;
              return (
                <div className="ops-report-item" role="listitem" key={key}>
                  <span>{String(key).replaceAll('_', ' ')}</span>
                  <strong>{pretty(count)} <span className="ops-report-percent">{percentage}%</span></strong>
                  <div className="ops-report-track" role="meter" aria-label={`${key} orders`} aria-valuemin={0} aria-valuemax={maxStatusCount} aria-valuenow={count}>
                    <span className="ops-report-fill" style={{ width: `${Math.max(0, Math.min(100, (count / maxStatusCount) * 100))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty">
            {loading ? 'Loading report…' : 'No order status data.'}
          </div>
        )}

        <h3>Top products</h3>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">
              Top products by sales
            </caption>

            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Units</th>
                <th scope="col">Sales</th>
              </tr>
            </thead>

            <tbody>
              {topProducts.length ? (
                topProducts.map((product, index) => (
                  <tr
                    key={product.product_id || index}
                  >
                    <td className="td-strong">
                      {pretty(product.product_name)}
                    </td>
                    <td>{pretty(product.quantity)}</td>
                    <td className="td-gold">
                      {formatMoney(Number(product.sales) || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">
                    <div className="admin-empty">
                      {loading
                        ? 'Loading products…'
                        : 'No product sales data.'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Audit                                                                      */
/* -------------------------------------------------------------------------- */

function AuditPanel() {
  const { toast } = useToast();
  const { mountedRef, startRequest, isCurrent } = useAsyncGuard();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const requestId = startRequest();

    setLoading(true);

    try {
      const result = await adminService.auditLogs(200);

      if (!isCurrent(requestId)) return;

      setRows(itemsOfList(result));
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, 'Unable to load audit logs.'));
      }
    } finally {
      if (mountedRef.current && isCurrent(requestId)) {
        setLoading(false);
      }
    }
  }, [isCurrent, mountedRef, startRequest, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="admin-panel">
      <div className="admin-card">
        <Toolbar
          title="Audit logs"
          description="Server-generated mutation telemetry with actor, request, route and outcome. Sensitive payloads are never stored."
          onRefresh={load}
          refreshing={loading}
        />

        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">
              Administrative audit logs
            </caption>

            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Actor</th>
                <th scope="col">Method</th>
                <th scope="col">Route</th>
                <th scope="col">Status</th>
                <th scope="col">Duration</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((row) => {
                  const statusCode = Number(row.status_code);

                  return (
                    <tr key={row.id}>
                      <td>
                        {row.created_at
                          ? new Date(
                              row.created_at,
                            ).toLocaleString('en-IN')
                          : '—'}
                      </td>

                      <td className="td-dim">
                        {row.actor_user_id
                          ? `${String(
                              row.actor_user_id,
                            ).slice(0, 8)}…`
                          : 'System/guest'}
                      </td>

                      <td>{pretty(row.method)}</td>

                      <td className="td-dim">
                        {pretty(row.path)}
                      </td>

                      <td>
                        <span
                          className={`admin-pill ${
                            Number.isFinite(statusCode) &&
                            statusCode < 400
                              ? 'pill-success'
                              : 'pill-danger'
                          }`}
                        >
                          {pretty(row.status_code)}
                        </span>
                      </td>

                      <td>
                        {pretty(row.duration_ms)} ms
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty">
                      {loading
                        ? 'Loading audit logs…'
                        : 'No mutation audit entries yet.'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Reviews                                                                    */
/* -------------------------------------------------------------------------- */

const REVIEW_STATUSES = [
  'pending',
  'approved',
  'rejected',
];

function ReviewsModerationPanel() {
  const { toast } = useToast();
  const { mountedRef, startRequest, isCurrent } = useAsyncGuard();

  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    const requestId = startRequest();

    setLoading(true);

    try {
      const result = await adminService.reviewList(status);

      if (!isCurrent(requestId)) return;

      setRows(itemsOfList(result));
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, 'Unable to load reviews.'));
      }
    } finally {
      if (mountedRef.current && isCurrent(requestId)) {
        setLoading(false);
      }
    }
  }, [isCurrent, mountedRef, startRequest, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (id, nextStatus) => {
    if (!id || busyId) return;

    setBusyId(id);

    try {
      await adminService.moderateReview(id, nextStatus);

      if (!mountedRef.current) return;

      toast.success(`Review ${nextStatus}.`);
      await load();
    } catch (error) {
      if (mountedRef.current) {
        toast.error(
          errorMessage(error, 'Unable to update review.'),
        );
      }
    } finally {
      if (mountedRef.current) {
        setBusyId('');
      }
    }
  };

  return (
    <section className="admin-panel reviews-panel">
      <div className="admin-card">
        <Toolbar
          title="Review moderation"
          description="Approve genuine customer feedback and reject abuse before publication."
          onRefresh={load}
          refreshing={loading}
        >
          <label className="sr-only" htmlFor="review-status-filter">
            Review status
          </label>

          <select
            id="review-status-filter"
            className="admin-select"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {REVIEW_STATUSES.map((value) => (
              <option value={value} key={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </Toolbar>
      </div>

      {rows.length ? (
        <div className="review-admin-grid">
          {rows.map((review) => {
            const busy = busyId === review.id;

            return (
              <article className="admin-card" key={review.id}>
                <div className="review-admin-head">
                  <div>
                    <strong>
                      {review.products?.name || 'Product'}
                    </strong>

                    <div className="td-dim">
                      {review.users?.full_name || 'Customer'} ·{' '}
                      {pretty(review.rating)}/5
                    </div>
                  </div>

                  <span className="admin-pill pill-muted">
                    {pretty(review.status)}
                  </span>
                </div>

                <h3>{review.title || 'Customer review'}</h3>

                <p className="ops-review-body">
                  {pretty(review.body)}
                </p>

                <div className="btn-row">
                  {status !== 'approved' && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={Boolean(busyId)}
                      onClick={() =>
                        moderate(review.id, 'approved')
                      }
                    >
                      <RiCheckLine
                        size={15}
                        aria-hidden="true"
                      />
                      {busy ? 'Saving…' : 'Approve'}
                    </button>
                  )}

                  {status !== 'rejected' && (
                    <button
                      type="button"
                      className="btn btn-quiet btn-sm"
                      disabled={Boolean(busyId)}
                      onClick={() =>
                        moderate(review.id, 'rejected')
                      }
                    >
                      <RiCloseLine
                        size={15}
                        aria-hidden="true"
                      />
                      {busy ? 'Saving…' : 'Reject'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="admin-empty">
          {loading
            ? 'Loading reviews…'
            : `No ${status} reviews.`}
        </div>
      )}
    </section>
  );
}
