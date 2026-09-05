import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { userService } from '../services/users';
import { useToast } from '../context/ToastContext';
import { Spinner, ErrorState, EmptyState } from '../components/ui/States';

function AddressForm({ onSaved, onCancel, defaultCountry = 'IN', isDefault = false }) {
  const [values, setValues] = useState({
    line1: '', line2: '', city: '', state: '', postal_code: '',
    country: defaultCountry, full_name: '', phone: '', is_default: isDefault,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => {
    const v = k === 'is_default' ? e.target.checked : e.target.value;
    setValues((prev) => ({ ...prev, [k]: v }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!values.line1 || !values.city || !values.postal_code) {
      return setError('Street, city and postal code are required.');
    }
    setSaving(true);
    try {
      await userService.addAddress({
        line1: values.line1,
        line2: values.line2 || undefined,
        city: values.city,
        state: values.state || undefined,
        postal_code: values.postal_code,
        country: values.country.toUpperCase(),
        full_name: values.full_name || undefined,
        phone: values.phone || undefined,
        is_default: values.is_default,
      });
      onSaved();
    } catch (err) {
      setError(err.message || 'Unable to save this address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="address-form" onSubmit={onSubmit}>
      {error && <div className="form-error">{error}</div>}
      <div className="field-grid">
        <div className="field">
          <label htmlFor="af-name">Full name (recipient)</label>
          <input id="af-name" value={values.full_name} onChange={set('full_name')} />
        </div>
        <div className="field">
          <label htmlFor="af-phone">Phone</label>
          <input id="af-phone" value={values.phone} onChange={set('phone')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="af-line1">Street address *</label>
        <input id="af-line1" value={values.line1} onChange={set('line1')} placeholder="House no, street" />
      </div>
      <div className="field">
        <label htmlFor="af-line2">Apartment / area</label>
        <input id="af-line2" value={values.line2} onChange={set('line2')} />
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="af-city">City *</label>
          <input id="af-city" value={values.city} onChange={set('city')} />
        </div>
        <div className="field">
          <label htmlFor="af-state">State</label>
          <input id="af-state" value={values.state} onChange={set('state')} />
        </div>
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="af-postal">Postal code *</label>
          <input id="af-postal" value={values.postal_code} onChange={set('postal_code')} />
        </div>
        <div className="field">
          <label htmlFor="af-country">Country (2-letter)</label>
          <input id="af-country" maxLength="2" value={values.country} onChange={set('country')} />
        </div>
      </div>
      <label className="check-line">
        <input type="checkbox" checked={values.is_default} onChange={set('is_default')} />
        Set as default address
      </label>
      <div className="btn-row">
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save address'}</button>
        <button className="btn btn-quiet" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function AddressesPage() {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setError('');
    userService
      .getAddresses()
      .then((list) => setAddresses(Array.isArray(list) ? list : []))
      .catch((err) => setError(err.message || 'Unable to load your addresses.'));
  }, []);

  useEffect(load, [load]);

  const onDelete = async (id) => {
    if (!window.confirm('Remove this address?')) return;
    try {
      await userService.deleteAddress(id);
      toast.success('Address removed.');
      load();
    } catch (err) {
      toast.error(err.message || 'Unable to remove this address.');
    }
  };

  return (
    <div className="page container">
      <Link className="back-link" to="/account"><ArrowLeft size={15} /> Back to profile</Link>
      <div className="page-heading compact">
        <p className="eyebrow">Your account</p>
        <h1>Addresses.</h1>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : addresses === null ? (
        <Spinner label="Loading addresses…" />
      ) : (
        <div className="address-list manage">
          {addresses.length === 0 && !showForm && (
            <EmptyState title="No addresses yet" message="Add a delivery address for checkout." />
          )}
          {addresses.map((addr) => (
            <div className="address-card-manage" key={addr.id}>
              <div>
                <strong>{addr.full_name || 'Delivery'}</strong>
                {addr.is_default && <span className="chip chip-sm">Default</span>}
                <p>
                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}
                  {addr.state ? `, ${addr.state}` : ''} — {addr.postal_code}, {addr.country}
                </p>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(addr.id)} aria-label="Delete address">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {showForm ? (
            <AddressForm onSaved={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} isDefault={addresses.length === 0} />
          ) : (
            <button className="btn btn-quiet" onClick={() => setShowForm(true)}><Plus size={15} /> Add address</button>
          )}
        </div>
      )}
    </div>
  );
}
