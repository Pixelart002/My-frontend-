import { useCallback, useEffect, useState } from 'react';
import { RiRefreshLine, RiShieldCheckLine, RiKey2Line } from '@remixicon/react';
import { adminService } from '../../services/admin';
import { resetStripeConfigCache } from '../../services/stripeConfig';
import { useToast } from '../../context/ToastContext';

const isValidPublishableKey = (value) => /^pk_(test|live)_[A-Za-z0-9]+$/.test(String(value || '').trim());

export default function StripeConfigPanel() {
  const { toast } = useToast();
  const [setting, setSetting] = useState(null);
  const [draft, setDraft] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminService.settings('financial');
      const items = Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : [];
      const stripe = items.find((item) => item.key === 'stripe_publishable_key');
      setSetting(stripe || null);
      setDraft(String(stripe?.value || ''));
    } catch (error) {
      toast.error(error.message || 'Unable to load Stripe configuration.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event.preventDefault();
    const key = draft.trim();
    if (!isValidPublishableKey(key)) {
      toast.error('Enter a valid Stripe publishable key beginning with pk_test_ or pk_live_.');
      return;
    }
    setSaving(true);
    try {
      await adminService.updateSetting('stripe_publishable_key', key, 'Updated Stripe publishable key from admin console');
      resetStripeConfigCache();
      toast.success('Stripe publishable key updated.');
      setShowKey(false);
      await load();
    } catch (error) {
      toast.error(error.message || 'Unable to update Stripe publishable key.');
    } finally {
      setSaving(false);
    }
  };

  const mode = draft.startsWith('pk_live_') ? 'Live' : draft.startsWith('pk_test_') ? 'Test' : 'Not configured';
  const configured = isValidPublishableKey(draft);

  return (
    <section className="admin-panel">
      <div className="admin-card">
        <div className="admin-toolbar">
          <div>
            <p className="eyebrow">Payments</p>
            <h2>Stripe configuration</h2>
            <p>Manage the browser-safe Stripe publishable key used by checkout. Stripe secret/webhook keys remain server-only deployment secrets.</p>
          </div>
          <button type="button" className="btn btn-quiet btn-sm" onClick={load} disabled={loading || saving}>
            <RiRefreshLine size={16} /> Refresh
          </button>
        </div>

        <div className="admin-stats">
          <div className="admin-stat"><div className="stat-label">Status</div><div className="stat-value" style={{ fontSize: 22 }}>{loading ? '…' : configured ? 'Configured' : 'Missing'}</div></div>
          <div className="admin-stat"><div className="stat-label">Mode</div><div className="stat-value" style={{ fontSize: 22 }}>{mode}</div></div>
          <div className="admin-stat"><div className="stat-label">Storage</div><div className="stat-value" style={{ fontSize: 18 }}>Runtime settings</div></div>
        </div>

        <form onSubmit={save} className="ops-form" style={{ marginTop: 20 }}>
          <label>
            Stripe publishable key
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <RiKey2Line size={16} style={{ position: 'absolute', left: 12, top: 14, opacity: .55 }} aria-hidden="true" />
                <input value={draft} onChange={(event) => setDraft(event.target.value)} type={showKey ? 'text' : 'password'} autoComplete="off" spellCheck="false" placeholder="pk_live_… or pk_test_…" style={{ width: '100%', paddingLeft: 38, boxSizing: 'border-box' }} disabled={loading || saving} />
              </div>
              <button type="button" className="btn btn-quiet" onClick={() => setShowKey((value) => !value)} disabled={loading || saving}>{showKey ? 'Hide' : 'Show'}</button>
            </div>
          </label>

          <div className="admin-page-note">
            <RiShieldCheckLine size={17} />
            Only a Stripe publishable key is accepted here. Never paste a <code>sk_</code> secret key into the admin panel.
            {setting?.updated_at ? ' Last updated ' + new Date(setting.updated_at).toLocaleString() + '.' : ''}
          </div>

          <div className="btn-row ops-form-actions">
            <button className="btn" type="submit" disabled={loading || saving || !configured}>{saving ? 'Saving…' : 'Save Stripe configuration'}</button>
          </div>
        </form>
      </div>
    </section>
  );
}
