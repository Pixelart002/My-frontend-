import { useEffect, useMemo, useState } from 'react';
import { RiBuilding4Line, RiContactsLine, RiFileShield2Line, RiRefreshLine, RiSave3Line, RiShieldCheckLine } from '@remixicon/react';
import { adminService } from '../../services/admin';
import { useToast } from '../../context/ToastContext';

const FIELDS = [
  { section: 'Business identity', icon: RiBuilding4Line, items: [
    ['business_brand_name', 'Brand name', 'Luviio'],
    ['business_legal_name', 'Legal / business name', 'As used on legal documents'],
    ['business_type', 'Business type', 'Sole proprietor, partnership, company, etc.'],
    ['business_website', 'Website', 'https://luviio.in'],
    ['business_logo_url', 'Logo URL', 'Public logo URL'],
  ]},
  { section: 'Contact', icon: RiContactsLine, items: [
    ['business_email', 'Business email', 'Primary business email'],
    ['business_phone', 'Business phone', 'Primary business phone'],
  ]},
  { section: 'Seller address', icon: RiBuilding4Line, items: [
    ['seller_address_line1', 'Address line 1', 'Registered / seller address'],
    ['seller_address_line2', 'Address line 2', 'Optional'],
    ['seller_city', 'City', 'City'],
    ['seller_district', 'District', 'District'],
    ['seller_state', 'State', 'State'],
    ['seller_state_code', 'State code', 'GST state code, e.g. DL'],
    ['seller_pincode', 'Pincode', '6-digit pincode'],
    ['seller_country', 'Country', 'India'],
  ]},
  { section: 'Tax & legal', icon: RiFileShield2Line, items: [
    ['seller_gst_registered', 'GST registered', 'Enable only when actually GST registered'],
    ['seller_gstin', 'GSTIN', 'Required when GST registered'],
    ['seller_pan', 'PAN', 'Seller PAN'],
  ]},
];

const initial = () => Object.fromEntries(FIELDS.flatMap((group) => group.items.map(([key]) => [key, ''])));

export default function BusinessProfilePanel() {
  const { toast } = useToast();
  const [values, setValues] = useState(initial);
  const [original, setOriginal] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => Object.keys(values).some((key) => String(values[key]) !== String(original[key])), [values, original]);

  const load = async () => {
    setLoading(true);
    try {
      const [general, financial] = await Promise.all([adminService.settings('general'), adminService.settings('financial')]);
      const rows = [
        ...(Array.isArray(general) ? general : (general?.items || general?.results || [])),
        ...(Array.isArray(financial) ? financial : (financial?.items || financial?.results || [])),
      ];
      const next = initial();
      rows.forEach((row) => { if (Object.prototype.hasOwnProperty.call(next, row.key)) next[row.key] = row.value; });
      setValues(next); setOriginal(next);
    } catch (error) { toast.error(error.message || 'Unable to load business profile.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const save = async () => {
    const gst = values.seller_gst_registered === true || values.seller_gst_registered === 'true';
    if (!String(values.business_legal_name || '').trim()) return toast.error('Legal / business name is required.');
    if (!String(values.seller_address_line1 || '').trim() || !String(values.seller_city || '').trim() || !String(values.seller_state || '').trim() || !String(values.seller_pincode || '').trim()) return toast.error('Complete the seller address before saving.');
    if (gst && !String(values.seller_gstin || '').trim()) return toast.error('GSTIN is required when GST registration is enabled.');
    setSaving(true);
    try {
      const changed = Object.keys(values).filter((key) => String(values[key]) !== String(original[key]));
      for (const key of changed) {
        const value = key === 'seller_gst_registered' ? (values[key] === true || values[key] === 'true') : String(values[key] ?? '');
        await adminService.updateSetting(key, value, 'Updated Business Profile from admin console');
      }
      await load();
      toast.success('Business profile saved.');
    } catch (error) { toast.error(error.message || 'Unable to save business profile.'); }
    finally { setSaving(false); }
  };

  if (loading) return <section className="admin-panel"><div className="admin-card"><div className="state spinner"><span className="spin">●</span><span>Loading business profile…</span></div></div></section>;

  return <section className="admin-panel business-profile-panel">
    <div className="admin-card business-profile-hero">
      <div><div className="eyebrow"><RiShieldCheckLine size={15}/> Business identity</div><h2>Business Profile</h2><p>Central seller identity, legal details and invoice-ready information for Luviio.</p></div>
      <div className="btn-row"><button className="btn btn-quiet" type="button" onClick={load} disabled={saving}><RiRefreshLine size={16}/> Refresh</button><button className="btn" type="button" onClick={save} disabled={saving || !dirty}><RiSave3Line size={16}/> {saving ? 'Saving…' : 'Save changes'}</button></div>
    </div>
    <div className="business-profile-notice"><strong>Legal data:</strong> Enter actual business information only. GSTIN/PAN must never be fabricated. Issued invoices use immutable seller snapshots.</div>
    {FIELDS.map(({ section, icon: Icon, items }) => <div className="admin-card business-profile-section" key={section}><div className="business-section-head"><div className="business-section-icon"><Icon size={19}/></div><div><h3>{section}</h3><p>Authoritative business information</p></div></div><div className="business-profile-grid">{items.map(([key, label, hint]) => <label className="business-field" key={key}><span>{label}</span>{key === 'seller_gst_registered' ? <select value={values[key] === true || values[key] === 'true' ? 'true' : 'false'} onChange={(e) => set(key, e.target.value === 'true')}><option value="false">Not registered</option><option value="true">GST registered</option></select> : <input value={values[key] ?? ''} onChange={(e) => set(key, e.target.value)} placeholder={hint} />}</label>)}</div></div>)}
  </section>;
}
