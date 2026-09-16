import { useEffect, useMemo, useRef, useState } from 'react';
import { RiBuilding4Line, RiContactsLine, RiFileShield2Line, RiImageAddLine, RiRefreshLine, RiSave3Line, RiShieldCheckLine, RiUserStarLine, RiEraserLine, RiUploadCloud2Line } from '@remixicon/react';
import { adminService } from '../../services/admin';
import { useToast } from '../../context/ToastContext';

const FIELDS = [
  { section: 'Business identity', icon: RiBuilding4Line, description: 'The identity used across your storefront and business documents.', items: [
    ['business_brand_name', 'Brand name', 'e.g. Luviio', false],
    ['business_legal_name', 'Legal / business name', 'Name used on legal documents', true],
    ['business_type', 'Business type', 'e.g. Sole proprietor, partnership, company', false],
    ['business_website', 'Website', 'e.g. https://luviio.in', false],
  ]},
  { section: 'Brand assets', icon: RiImageAddLine, description: 'Upload the assets that can appear on newly issued invoices.', items: [] },
  { section: 'Contact details', icon: RiContactsLine, description: 'Primary contact information for your business.', items: [
    ['business_email', 'Business email', 'Primary business email', false],
    ['business_phone', 'Business phone', 'Primary business phone', false],
  ]},
  { section: 'Seller address', icon: RiBuilding4Line, description: 'The seller address used for invoice and tax documents.', items: [
    ['seller_address_line1', 'Address line 1', 'Registered / seller address', true],
    ['seller_address_line2', 'Address line 2', 'Optional', false],
    ['seller_city', 'City', 'e.g. Delhi', true],
    ['seller_district', 'District', 'e.g. Delhi', false],
    ['seller_state', 'State', 'e.g. Delhi', true],
    ['seller_state_code', 'State code', 'GST state code, e.g. DL', true],
    ['seller_pincode', 'Pincode', '6-digit pincode', true],
    ['seller_country', 'Country', 'e.g. India', true],
  ]},
  { section: 'Tax & legal', icon: RiFileShield2Line, description: 'Tax identity used when issuing compliant business invoices.', items: [
    ['seller_gst_registered', 'GST registration', '', true],
    ['seller_gstin', 'GSTIN', 'Required when GST registration is enabled', true],
    ['seller_pan', 'PAN', 'Seller PAN', false],
  ]},
  { section: 'Authorised signatory', icon: RiUserStarLine, description: 'Optional signature identity shown on newly issued invoices.', items: [
    ['business_authorised_signatory_name', 'Signatory name', 'Name printed on the invoice', false],
    ['business_authorised_signatory_designation', 'Designation', 'e.g. Proprietor, Partner, Director', false],
  ]},
];

const initial = () => Object.fromEntries(FIELDS.flatMap((group) => group.items.map(([key]) => [key, ''])));
const unwrap = (res) => res?.data?.data || res?.data || res;

function SignaturePad({ onSaved }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.2;
  }, []);

  const point = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const start = (event) => { event.preventDefault(); drawing.current = true; last.current = point(event); canvasRef.current.setPointerCapture?.(event.pointerId); };
  const move = (event) => {
    if (!drawing.current) return;
    event.preventDefault();
    const p = point(event); const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last.current = p;
  };
  const stop = () => { drawing.current = false; };
  const clear = () => { const c = canvasRef.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); };

  const save = async () => {
    const canvas = canvasRef.current;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    setBusy(true);
    try {
      const file = new File([blob], 'authorised-signature.png', { type: 'image/png' });
      const result = unwrap(await adminService.uploadBusinessSignature(file));
      onSaved(result?.url || result?.setting?.value || '');
    } catch (error) {
      throw error;
    } finally { setBusy(false); }
  };

  return <div className="signature-editor">
    <div className="signature-canvas-wrap"><div className="signature-guide">Sign inside this area</div><canvas ref={canvasRef} onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} /></div>
    <div className="asset-actions"><button className="btn btn-quiet" type="button" onClick={clear}><RiEraserLine size={16}/> Clear</button><button className="btn" type="button" onClick={async () => { try { await save(); } catch (error) { /* parent toast handles upload errors */ } }} disabled={busy}><RiSave3Line size={16}/> {busy ? 'Saving…' : 'Save signature'} </button></div>
  </div>;
}

export default function BusinessProfilePanel() {
  const { toast } = useToast();
  const [values, setValues] = useState(initial);
  const [original, setOriginal] = useState(initial);
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assetBusy, setAssetBusy] = useState(false);
  const logoInput = useRef(null);
  const dirty = useMemo(() => Object.keys(values).some((key) => String(values[key]) !== String(original[key])), [values, original]);
  const gstRegistered = values.seller_gst_registered === true || values.seller_gst_registered === 'true';

  const load = async () => {
    setLoading(true);
    try {
      const [general, financial] = await Promise.all([adminService.settings('general'), adminService.settings('financial')]);
      const rows = [
        ...(Array.isArray(general) ? general : (general?.items || general?.results || general?.data?.items || [])),
        ...(Array.isArray(financial) ? financial : (financial?.items || financial?.results || financial?.data?.items || [])),
      ];
      const next = initial();
      let nextLogo = ''; let nextSignature = '';
      rows.forEach((row) => {
        if (Object.prototype.hasOwnProperty.call(next, row.key)) next[row.key] = row.value;
        if (row.key === 'business_logo_url') nextLogo = row.value || '';
        if (row.key === 'business_signature_url') nextSignature = row.value || '';
      });
      setValues(next); setOriginal(next); setLogoUrl(nextLogo); setSignatureUrl(nextSignature);
    } catch (error) { toast.error(error.message || 'Unable to load business profile.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!String(values.business_legal_name || '').trim()) return toast.error('Legal / business name is required.');
    if (!String(values.seller_address_line1 || '').trim() || !String(values.seller_city || '').trim() || !String(values.seller_state || '').trim() || !String(values.seller_pincode || '').trim() || !String(values.seller_country || '').trim()) return toast.error('Complete the required seller address fields before saving.');
    if (gstRegistered && !String(values.seller_gstin || '').trim()) return toast.error('GSTIN is required when GST registration is enabled.');
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

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file.');
    if (file.size > 5 * 1024 * 1024) return toast.error('Logo must be 5 MB or smaller.');
    setAssetBusy(true);
    try {
      const result = unwrap(await adminService.uploadBusinessLogo(file));
      const url = result?.url || result?.setting?.value || '';
      if (url) setLogoUrl(url);
      toast.success('Business logo uploaded.');
    } catch (error) { toast.error(error.message || 'Unable to upload logo.'); }
    finally { setAssetBusy(false); }
  };

  if (loading) return <section className="admin-panel"><div className="admin-card"><div className="state spinner"><span className="spin">●</span><span>Loading business profile…</span></div></div></section>;

  return <section className="admin-panel business-profile-panel">
    <div className="admin-card business-profile-hero">
      <div><div className="eyebrow"><RiShieldCheckLine size={15}/> Business settings</div><h2>Business Profile</h2><p>Manage the business identity used for invoices, seller information and optional invoice branding.</p></div>
      <div className="btn-row"><button className="btn btn-quiet" type="button" onClick={load} disabled={saving || assetBusy}><RiRefreshLine size={16}/> Refresh</button><button className="btn" type="button" onClick={save} disabled={saving || !dirty}><RiSave3Line size={16}/> {saving ? 'Saving…' : 'Save changes'}</button></div>
    </div>
    <div className="business-profile-notice"><strong>Before saving:</strong> Use your real legal information. GSTIN/PAN must be entered only when applicable. Logo and signature are uploaded directly from your device; no URL is required.</div>

    {FIELDS.map(({ section, icon: Icon, description, items }) => <div className="admin-card business-profile-section" key={section}>
      <div className="business-section-head"><div className="business-section-icon"><Icon size={19}/></div><div><h3>{section}</h3><p>{description}</p></div></div>
      {section === 'Brand assets' ? <div className="brand-assets-grid">
        <div className="asset-card">
          <div><div className="asset-card-title">Business logo</div><p className="asset-help">Shown on newly generated invoices when uploaded.</p></div>
          <div className="asset-preview logo-preview">{logoUrl ? <img src={logoUrl} alt="Business logo" /> : <span>No logo uploaded</span>}</div>
          <input ref={logoInput} className="asset-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} />
          <button className="btn" type="button" onClick={() => logoInput.current?.click()} disabled={assetBusy}><RiUploadCloud2Line size={16}/>{assetBusy ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload from device'}</button>
          <small>PNG, JPG or WebP · max 5 MB</small>
        </div>
        <div className="asset-card">
          <div><div className="asset-card-title">Authorised signature</div><p className="asset-help">Optional. Appears on newly issued invoices when saved.</p></div>
          {signatureUrl ? <div className="asset-preview signature-preview"><img src={signatureUrl} alt="Saved authorised signature" /></div> : <div className="asset-preview signature-preview empty-signature"><span>No signature saved</span></div>}
          <SignaturePad onSaved={(url) => { if (url) { setSignatureUrl(url); toast.success('Authorised signature saved.'); } }} />
          <small>Sign with your finger, then save. You can clear and redraw before saving.</small>
        </div>
      </div> : <div className="business-profile-grid">{items.map(([key, label, hint, required]) => {
        if (key === 'seller_gstin' && !gstRegistered) return null;
        return <label className="business-field" key={key}>
          <span>{label}{required && <em>Required</em>}</span>
          {key === 'seller_gst_registered' ? <select value={gstRegistered ? 'true' : 'false'} onChange={(e) => set(key, e.target.value === 'true')}><option value="false">Not registered</option><option value="true">GST registered</option></select> : <input value={values[key] ?? ''} onChange={(e) => set(key, e.target.value)} placeholder={hint} />}
          {key === 'seller_gstin' && gstRegistered && <small>Enter the 15-character GSTIN exactly as issued.</small>}
        </label>;
      })}</div>}
    </div>)}
  </section>;
}
