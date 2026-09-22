import { useCallback, useEffect, useMemo, useState } from 'react';
import { RiShieldKeyholeLine, RiRefreshLine } from '@remixicon/react';
import { setAccessToken } from '../../api/client';
import { adminService } from '../../services/admin';
import { useToast } from '../../context/ToastContext';

function totpFactors(factors) {
  const totp = Array.isArray(factors?.totp) ? factors.totp : [];
  const all = Array.isArray(factors?.all) ? factors.all : [];
  return [...totp, ...all].filter((factor, index, list) => (
    factor?.factor_type === 'totp' && list.findIndex((item) => item?.id === factor?.id) === index
  ));
}

function factorIdOf(value) {
  return value?.id || value?.factor?.id || value?.totp?.factor_id || value?.totp?.id || '';
}

export function qrCodeImageSource(value) {
  if (typeof value !== 'string') return '';
  const qr = value.trim();
  if (!qr) return '';
  if (/^data:image\//i.test(qr)) return qr;
  if (/^<svg(?:\s|>)/i.test(qr) || /^<\?xml[\s\S]*<svg(?:\s|>)/i.test(qr)) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`;
  }
  return qr;
}

export default function AdminMfaGate({ role, onVerified }) {
  const { toast } = useToast();
  const [state, setState] = useState('loading');
  const [factor, setFactor] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const factorId = useMemo(() => factorIdOf(factor) || factorIdOf(enrollment), [factor, enrollment]);

  const loadStatus = useCallback(async () => {
    setError('');
    setState('loading');
    try {
      const data = await adminService.mfaStatus();
      if (data?.aal === 'aal2') {
        onVerified();
        return;
      }

      const factors = totpFactors(data?.factors);
      const verified = factors.find((item) => item?.status === 'verified') || null;
      const pending = factors.find((item) => item?.status !== 'verified') || null;

      setFactor(verified || pending);
      setState(verified || pending ? 'verify' : 'setup');

      if (pending && !verified) {
        setError('An existing authenticator setup is waiting for verification. Enter the current code from that setup.');
      }
    } catch (err) {
      setError(err?.message || 'Unable to load MFA status.');
      setState('error');
    }
  }, [onVerified]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const startEnrollment = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await adminService.mfaEnroll('Luviio Admin');
      const nextId = factorIdOf(data);
      if (!nextId) throw new Error('MFA enrollment did not return a factor ID.');
      setEnrollment(data);
      setFactor(null);
      setCode('');
      setState('verify');
      toast.success('MFA setup started. Scan the QR code, then enter the 6-digit code.');
    } catch (err) {
      setError(err?.message || 'Unable to start MFA setup.');
    } finally {
      setBusy(false);
    }
  };

  const resetPendingEnrollment = async () => {
    if (!factorId || factor?.status === 'verified') return;
    setBusy(true);
    setError('');
    try {
      await adminService.mfaUnenroll(factorId);
      setFactor(null);
      setEnrollment(null);
      setCode('');
      setState('setup');
      toast.success('Pending MFA setup removed. You can start a fresh authenticator setup.');
    } catch (err) {
      setError(err?.message || 'Unable to reset the pending MFA setup.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    if (!factorId || !/^\d{6,8}$/.test(code)) {
      setError('Enter the current 6–8 digit authenticator code.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await adminService.mfaVerify(factorId, code);
      const access = data?.access_token;
      if (!access) throw new Error('MFA verification succeeded but no access session was returned.');
      setAccessToken(access);
      try {
        if (window.__setToken) window.__setToken(access);
      } catch {
        /* noop */
      }
      toast.success('MFA verified. Opening admin console…');
      await onVerified();
    } catch (err) {
      setError(err?.message || 'Invalid MFA code. Please try again.');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  if (state === 'loading') {
    return <div className="admin-mfa-gate"><span className="spin">●</span><p>Checking admin MFA…</p></div>;
  }

  if (state === 'error') {
    return (
      <div className="admin-mfa-gate">
        <RiShieldKeyholeLine size={42} />
        <h1>Admin MFA unavailable</h1>
        <p>{error}</p>
        <button className="btn" type="button" onClick={loadStatus}><RiRefreshLine size={16} /> Try again</button>
      </div>
    );
  }

  const qrCode = qrCodeImageSource(enrollment?.totp?.qr_code || enrollment?.qr_code || '');
  const secret = enrollment?.totp?.secret || enrollment?.secret || '';

  return (
    <div className="admin-mfa-gate">
      <RiShieldKeyholeLine size={42} />
      <p className="eyebrow">Privileged access</p>
      <h1>Verify admin MFA</h1>
      <p>
        {role || 'Staff'} console access requires a second authentication factor.
        {factor?.status === 'verified'
          ? ' Enter the current code from your authenticator app.'
          : factor
            ? ' An existing authenticator setup was found. Enter its current code to finish verification.'
            : ' Set up an authenticator app to continue.'}
      </p>

      {!factor && !enrollment && (
        <button className="btn" type="button" onClick={startEnrollment} disabled={busy}>
          {busy ? 'Starting MFA setup…' : 'Set up authenticator'}
        </button>
      )}

      {enrollment && qrCode && (
        <div className="admin-mfa-setup">
          <img className="admin-mfa-qr" src={qrCode} alt="Scan this QR code with your authenticator app" />
          {secret && <code className="admin-mfa-secret">{secret}</code>}
        </div>
      )}

      {(factor || enrollment) && (
        <form onSubmit={verify} className="admin-mfa-form">
          <label htmlFor="admin-mfa-code">Authenticator code</label>
          <input
            id="admin-mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,8}"
            maxLength={8}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="123456"
            autoFocus
          />
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-block" type="submit" disabled={busy || !factorId}>
            {busy ? 'Verifying…' : 'Verify & open console'}
          </button>
          {factor?.status !== 'verified' && !enrollment && (
            <button
              className="btn btn-quiet btn-block"
              type="button"
              onClick={resetPendingEnrollment}
              disabled={busy || !factorId}
            >
              {busy ? 'Resetting…' : 'Reset pending setup'}
            </button>
          )}
        </form>
      )}

      <p className="admin-mfa-note">Your admin role remains unchanged; MFA only upgrades this session to privileged access.</p>
    </div>
  );
}
