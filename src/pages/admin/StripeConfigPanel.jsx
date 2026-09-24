import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RiKey2Line,
  RiRefreshLine,
  RiShieldCheckLine,
} from '@remixicon/react';
import { adminService } from '../../services/admin';
import { resetStripeConfigCache } from '../../services/stripeConfig';
import { useToast } from '../../context/ToastContext';

const PUBLISHABLE_KEY_PATTERN =
  /^pk_(test|live)_[A-Za-z0-9]+$/;

function normalizePublishableKey(value) {
  return String(value || '').trim();
}

function isValidPublishableKey(value) {
  return PUBLISHABLE_KEY_PATTERN.test(
    normalizePublishableKey(value),
  );
}

function getSettingsItems(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.items)) {
    return result.items;
  }

  return [];
}

function getStripeSetting(result) {
  return getSettingsItems(result).find(
    (item) =>
      String(item?.key || '').trim() ===
      'stripe_publishable_key',
  ) || null;
}

function formatUpdatedAt(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('en-IN');
}

function getStripeMode(value) {
  const key = normalizePublishableKey(value);

  if (key.startsWith('pk_live_')) {
    return 'Live';
  }

  if (key.startsWith('pk_test_')) {
    return 'Test';
  }

  return 'Not configured';
}

export default function StripeConfigPanel() {
  const { toast } = useToast();

  const [setting, setSetting] = useState(null);
  const [draft, setDraft] = useState('');
  const [showKey, setShowKey] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);

    try {
      const result =
        await adminService.settings('financial');

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      const stripe = getStripeSetting(result);
      const value = normalizePublishableKey(
        stripe?.value,
      );

      setSetting(stripe);
      setDraft(value);
    } catch (error) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      toast.error(
        error?.message ||
          'Unable to load Stripe configuration.',
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
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [load]);

  const key = normalizePublishableKey(draft);
  const configured = isValidPublishableKey(key);
  const mode = getStripeMode(key);

  const save = async (event) => {
    event.preventDefault();

    if (savingRef.current) {
      return;
    }

    if (!configured) {
      toast.error(
        'Enter a valid Stripe publishable key beginning with pk_test_ or pk_live_.',
      );
      return;
    }

    if (key.startsWith('sk_')) {
      toast.error(
        'Stripe secret keys are server-only and cannot be stored here.',
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      await adminService.updateSetting(
        'stripe_publishable_key',
        key,
        'Updated Stripe publishable key from admin console',
      );

      resetStripeConfigCache();

      if (!mountedRef.current) {
        return;
      }

      setShowKey(false);

      toast.success(
        'Stripe publishable key updated.',
      );

      await load();
    } catch (error) {
      if (mountedRef.current) {
        toast.error(
          error?.message ||
            'Unable to update Stripe publishable key.',
        );
      }
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleRefresh = () => {
    if (loading || saving) return;
    load();
  };

  const handleDraftChange = (event) => {
    setDraft(event.target.value);
  };

  return (
    <section className="admin-panel">
      <div className="admin-card stripe-config-card">
        <div className="admin-toolbar stripe-config-toolbar">
          <div>
            <p className="eyebrow">Payments</p>

            <h2>Stripe configuration</h2>

            <p>
              Manage the browser-safe Stripe
              publishable key used by checkout.
              Stripe secret and webhook keys remain
              server-only deployment secrets.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={handleRefresh}
            disabled={loading || saving}
          >
            <RiRefreshLine
              size={16}
              aria-hidden="true"
            />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <div className="admin-stats stripe-config-stats">
          <div className="admin-stat">
            <div className="stat-label">
              Status
            </div>

            <div className="stat-value stripe-stat-value">
              {loading
                ? '…'
                : configured
                  ? 'Configured'
                  : 'Missing'}
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">
              Mode
            </div>

            <div className="stat-value stripe-stat-value">
              {loading ? '…' : mode}
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">
              Storage
            </div>

            <div className="stat-value stripe-storage-value">
              Runtime settings
            </div>
          </div>
        </div>

        <form
          onSubmit={save}
          className="ops-form stripe-config-form"
        >
          <div className="field">
            <label htmlFor="stripe-publishable-key">
              Stripe publishable key
            </label>

            <div className="stripe-key-input-row">
              <div className="stripe-key-input-wrap">
                <RiKey2Line
                  className="stripe-key-icon"
                  size={16}
                  aria-hidden="true"
                />

                <input
                  id="stripe-publishable-key"
                  value={draft}
                  onChange={handleDraftChange}
                  type={
                    showKey
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="off"
                  spellCheck="false"
                  inputMode="text"
                  placeholder="pk_live_… or pk_test_…"
                  disabled={loading || saving}
                  aria-describedby="stripe-key-help"
                />
              </div>

              <button
                type="button"
                className="btn btn-quiet"
                onClick={() =>
                  setShowKey((value) => !value)
                }
                disabled={loading || saving}
                aria-controls="stripe-publishable-key"
                aria-pressed={showKey}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>

            <small id="stripe-key-help">
              Use only a Stripe publishable key
              beginning with <code>pk_test_</code>{' '}
              or <code>pk_live_</code>.
            </small>
          </div>

          <div
            className="admin-page-note stripe-security-note"
            role="note"
          >
            <RiShieldCheckLine
              size={17}
              aria-hidden="true"
            />

            <div>
              <strong>
                Browser-safe credential only
              </strong>

              <span>
                Never paste a <code>sk_</code> secret
                key or webhook signing secret into
                this panel.
              </span>

              {setting?.updated_at && (
                <span>
                  Last updated{' '}
                  {formatUpdatedAt(
                    setting.updated_at,
                  )}
                  .
                </span>
              )}
            </div>
          </div>

          <div className="btn-row ops-form-actions">
            <button
              className="btn"
              type="submit"
              disabled={
                loading ||
                saving ||
                !configured
              }
            >
              {saving
                ? 'Saving…'
                : 'Save Stripe configuration'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}