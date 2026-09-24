import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RiCheckLine,
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

function Toolbar({ title, description, onRefresh, children, refreshing = false }) {
  return (
    <div className="admin-toolbar ops-toolbar">
      <div className="ops-toolbar-copy">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      <div className="btn-row">
        {children}

        <button
          type="button"
          className="btn btn-quiet btn-sm"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label={`Refresh ${title}`}
        >
          <RiRefreshLine
            size={16}
            className={refreshing ? 'ops-spin' : undefined}
            aria-hidden="true"
          />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
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

  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const requestId = startRequest();

    setLoading(true);

    try {
      const result = await adminService.shippingMethods(false);

      if (!isCurrent(requestId)) return;

      setMethods(itemsOfList(result));
    } catch (error) {
      if (mountedRef.current) {
        toast.error(errorMessage(error, 'Unable to load shipping history.'));
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
    <section className="admin-panel" aria-labelledby="ops-shipping-title">
      <div className="admin-card">
        <Toolbar
          title="Shipping"
          description="Customer checkout uses live Shiprocket courier pricing. Legacy flat/free-threshold methods are inactive and are not used for new orders."
          onRefresh={load}
          refreshing={loading}
        />

        <div className="admin-stats">
          <div className="admin-stat">
            <div className="stat-label">Checkout provider</div>
            <div className="stat-value ops-stat-value-sm">Shiprocket</div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">Customer rate</div>
            <div className="stat-value ops-stat-value-sm">
              Live courier
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">Legacy methods</div>
            <div className="stat-value ops-stat-value-sm">
              {loading ? '…' : methods.length}
            </div>
          </div>
        </div>

        <div className="admin-page-note">
          Rate is calculated server-side from delivery PIN, parcel weight,
          payment method and Shiprocket serviceability. No admin-entered flat
          shipping amount is applied to customer checkout.
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="ops-toolbar-copy">
            <h2>Legacy shipping methods</h2>
            <p>
              Historical records retained for audit/admin visibility. They
              should remain inactive.
            </p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">
              Historical shipping methods
            </caption>

            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
              </tr>
            </thead>

            <tbody>
              {methods.length ? (
                methods.map((method) => (
                  <tr key={method.id}>
                    <td className="td-strong">{pretty(method.name)}</td>
                    <td>{pretty(method.type)}</td>
                    <td>
                      <span className="admin-pill pill-muted">
                        Archived / ignored
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">
                    <div className="admin-empty">
                      {loading
                        ? 'Loading shipping history…'
                        : 'No legacy shipping methods found.'}
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
    setEditing(null);
    setForm({ ...EMPTY_SUBSCRIPTION });
  };

  const editPlan = (plan) => {
    setEditing(plan.id);
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
        />

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

            {editing && (
              <button
                className="btn btn-quiet btn-sm"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
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
                        <RiSaveLine size={15} aria-hidden="true" />
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

  const [userId, setUserId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    const normalizedUserId = text(userId);

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
        >
          <RiShieldCheckLine size={18} aria-hidden="true" />
        </Toolbar>

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

                  <button
                    type="button"
                    className="btn btn-quiet btn-sm"
                    disabled={Boolean(busy)}
                    onClick={() => toggle(action, blocked)}
                  >
                    {busy === action
                      ? 'Saving…'
                      : blocked
                        ? 'Restore'
                        : 'Disable'}
                  </button>
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

  const toggle = async (row) => {
    const key = `${row.role}:${row.permission}`;

    if (busyKey) return;

    setBusyKey(key);

    try {
      await adminService.togglePermission(
        row.role,
        row.permission,
        !row.enabled,
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
                <th scope="col">State</th>
                <th scope="col">Action</th>
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
                        <span
                          className={`admin-pill ${
                            row.enabled
                              ? 'pill-success'
                              : 'pill-danger'
                          }`}
                        >
                          {row.enabled ? 'Allowed' : 'Denied'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-quiet btn-sm"
                          onClick={() => toggle(row)}
                          disabled={immutable || Boolean(busyKey)}
                        >
                          {immutable
                            ? 'Absolute'
                            : busyKey === key
                              ? 'Saving…'
                              : row.enabled
                                ? 'Deny'
                                : 'Allow'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4">
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

    if (!normalizedTitle || !normalizedBody) {
      toast.error('Title and message are required.');
      return;
    }

    setSending(true);

    try {
      const result = await adminService.sendPush({
        user_ids: null,
        title: normalizedTitle,
        body: normalizedBody,
        url: normalizedUrl,
      });

      if (!mountedRef.current) return;

      toast.success(result?.message || 'Notification dispatched.');

      setTitle('');
      setBody('');

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
    <section className="admin-panel">
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
                : pretty(stats?.subscriptions ?? stats?.total ?? 0)}
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">Delivery health</div>
            <div className="stat-value ops-stat-value-sm">
              Server-side
            </div>
          </div>
        </div>

        <form onSubmit={send} className="ops-form" noValidate>
          <label>
            Title
            <input
              required
              maxLength={80}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label>
            Message
            <textarea
              required
              maxLength={240}
              rows="4"
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>

          <label>
            Destination URL
            <input
              value={url}
              maxLength={500}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="/shop"
            />
          </label>

          <button className="btn" type="submit" disabled={sending}>
            <RiSendPlaneLine size={16} aria-hidden="true" />
            {sending ? 'Sending…' : 'Send notification'}
          </button>
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
                settings.map((setting) => (
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
                        <span className="admin-pill pill-muted">
                          Locked
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-quiet btn-sm"
                          onClick={() => openEditor(setting)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
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

  return (
    <section className="admin-panel">
      <div className="admin-card">
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

      <div className="admin-card">
        <h3>Order status</h3>

        {statusCounts.length ? (
          <div className="ops-report-grid">
            {statusCounts.map(([key, value]) => (
              <div className="ops-report-item" key={key}>
                <span>{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
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
    <section className="admin-panel">
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