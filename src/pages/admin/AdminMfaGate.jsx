import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  RiRefreshLine,
  RiShieldKeyholeLine,
} from '@remixicon/react';

import { setAccessToken } from '../../api/client';
import { adminService } from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const MFA_CODE_PATTERN = /^\d{6,8}$/;

function totpFactors(factors) {
  const sources = [
    ...(Array.isArray(factors?.totp) ? factors.totp : []),
    ...(Array.isArray(factors?.all) ? factors.all : []),
  ];
  const seen = new Set();

  return sources.filter((factor) => {
    if (factor?.factor_type !== 'totp') {
      return false;
    }

    const id = factor?.id;
    if (!id) {
      return true;
    }
    if (seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

function factorIdOf(value) {
  return (
    value?.id ||
    value?.factor?.id ||
    value?.totp?.factor_id ||
    value?.totp?.id ||
    ''
  );
}

function errorMessage(error, fallback) {
  return (
    typeof error?.message === 'string' && error.message.trim()
      ? error.message.trim()
      : fallback
  );
}

function cleanLabel(value) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, 80)
    : '';
}

/**
 * The authenticator label is derived from the authenticated user's profile.
 * It never writes to or changes the user's profile data.
 */
export function authenticatorFriendlyName(displayName, user) {
  const candidates = [
    displayName,
    user?.full_name,
    user?.name,
    user?.email,
  ];

  for (const candidate of candidates) {
    const label = cleanLabel(candidate);
    if (label) {
      return label;
    }
  }

  return 'Authenticator';
}

export function qrCodeImageSource(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const qr = value.trim();
  if (!qr) {
    return '';
  }

  if (/^data:image\//i.test(qr)) {
    return qr;
  }

  if (
    /^<svg(?:\s|>)/i.test(qr) ||
    /^<\?xml[\s\S]*<svg(?:\s|>)/i.test(qr)
  ) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`;
  }

  return qr;
}

function roleLabel(role) {
  const normalized = String(role || 'staff')
    .replace(/[_-]+/g, ' ')
    .trim();

  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function accountInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return 'A';
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function AdminMfaGate({
  role,
  displayName,
  onVerified,
}) {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const accountName =
    cleanLabel(displayName) ||
    cleanLabel(user?.full_name) ||
    cleanLabel(user?.name) ||
    cleanLabel(user?.email) ||
    'Admin account';
  const authenticatorName = useMemo(
    () => authenticatorFriendlyName(accountName, user),
    [accountName, user],
  );
  const readableRole = roleLabel(role);
  const initials = accountInitials(accountName);

  const [state, setState] = useState('loading');
  const [factor, setFactor] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reconfigureMode, setReconfigureMode] = useState(false);
  const [replacingFactorId, setReplacingFactorId] = useState('');
  const [elevatedToken, setElevatedToken] = useState('');
  const [cleanupPending, setCleanupPending] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState('');

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const codeInputRef = useRef(null);

  const factorId = useMemo(
    () => factorIdOf(factor) || factorIdOf(enrollment),
    [factor, enrollment],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const loadStatus = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError('');
    setState('loading');

    if (!token) {
      setError('Your admin session is not ready. Please sign in again.');
      setState('error');
      return;
    }

    setAccessToken(token);

    try {
      const data = await adminService.mfaStatus();

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      if (data?.aal === 'aal2') {
        const accepted = await onVerified(token);
        if (accepted === false && mountedRef.current) {
          setError('The privileged session could not be confirmed. Please retry.');
          setState('error');
        }
        return;
      }

      const factors = totpFactors(data?.factors);
      const verified = factors.find(
        (item) => item?.status === 'verified',
      ) || null;
      const pending = factors.find(
        (item) => item?.status !== 'verified',
      ) || null;
      const activeFactor = verified || pending;

      setFactor(activeFactor);
      setEnrollment(null);
      setCode('');
      setReconfigureMode(false);
      setReplacingFactorId('');
      setElevatedToken('');
      setCleanupPending(false);
      setCleanupMessage('');
      setState(activeFactor ? 'verify' : 'setup');

      if (pending && !verified) {
        setError(
          'An authenticator setup is already in progress. Enter the current code from that setup to finish it, or reset the pending setup below.',
        );
      }
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setError(errorMessage(err, 'Unable to load MFA status.'));
      setState('error');
    }
  }, [onVerified, token]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const startEnrollment = useCallback(async () => {
    if (busy) {
      return;
    }

    const requestToken = elevatedToken || token;
    setBusy(true);
    setError('');

    if (!requestToken) {
      setError('Your admin session is not ready. Please sign in again.');
      setBusy(false);
      return;
    }

    setAccessToken(requestToken);

    try {
      const data = await adminService.mfaEnroll(authenticatorName);

      if (!mountedRef.current) {
        return;
      }

      if (!factorIdOf(data)) {
        throw new Error('MFA enrollment did not return a factor ID.');
      }

      setEnrollment(data);
      setFactor(null);
      setCode('');
      setState('verify');

      toast.success('Authenticator setup started. Scan the QR code, then enter its current code.');
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setError(errorMessage(err, 'Unable to start authenticator setup.'));
    } finally {
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }, [authenticatorName, busy, elevatedToken, toast, token]);

  const resetPendingEnrollment = useCallback(async () => {
    if (
      busy ||
      !factorId ||
      factor?.status === 'verified'
    ) {
      return;
    }

    const requestToken = elevatedToken || token;
    setBusy(true);
    setError('');

    if (!requestToken) {
      setError('Your admin session is not ready. Please sign in again.');
      setBusy(false);
      return;
    }

    setAccessToken(requestToken);

    try {
      await adminService.mfaUnenroll(factorId);

      if (!mountedRef.current) {
        return;
      }

      setFactor(null);
      setEnrollment(null);
      setCode('');
      setState('setup');

      toast.success('Pending setup removed. You can start a fresh authenticator setup.');
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setError(errorMessage(err, 'Unable to reset the pending setup.'));
    } finally {
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }, [busy, elevatedToken, factor?.status, factorId, toast, token]);

  const finishReconfiguration = useCallback(async () => {
    if (busy || !replacingFactorId || !elevatedToken) {
      return;
    }

    setBusy(true);
    setError('');
    setAccessToken(elevatedToken);

    try {
      await adminService.mfaUnenroll(replacingFactorId);

      if (!mountedRef.current) {
        return;
      }

      setReplacingFactorId('');
      setCleanupPending(false);
      setCleanupMessage('');

      const accepted = await onVerified(elevatedToken);
      if (accepted === false) {
        throw new Error('The new authenticator is active, but the admin session could not be confirmed. Verify the new code again.');
      }

      toast.success('Authenticator reconfigured successfully.');
    } catch (err) {
      if (mountedRef.current) {
        setError(errorMessage(err, 'Unable to remove the previous authenticator. Retry the secure cleanup.'));
      }
    } finally {
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }, [busy, elevatedToken, onVerified, replacingFactorId, toast]);

  const verify = useCallback(async (event) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    const normalizedCode = code.replace(/\D/g, '');
    if (!factorId || !MFA_CODE_PATTERN.test(normalizedCode)) {
      setError('Enter the current 6–8 digit authenticator code.');
      codeInputRef.current?.focus();
      return;
    }

    const requestToken = elevatedToken || token;
    setBusy(true);
    setError('');

    if (!requestToken) {
      setError('Your admin session is not ready. Please sign in again.');
      setBusy(false);
      return;
    }

    setAccessToken(requestToken);

    try {
      // Reconfiguration starts only after the current factor has successfully
      // elevated the session. The old factor remains enrolled until the new
      // authenticator has been verified.
      if (reconfigureMode && factor?.status === 'verified' && !enrollment) {
        const currentResult = await adminService.mfaVerify(normalizedCode, factorId);
        const currentAccess = currentResult?.access_token;

        if (!currentAccess) {
          throw new Error('Current authenticator verification did not return an elevated session.');
        }

        setAccessToken(currentAccess);
        setElevatedToken(currentAccess);
        setReplacingFactorId(factorId);

        const nextEnrollment = await adminService.mfaEnroll(authenticatorName);
        if (!factorIdOf(nextEnrollment)) {
          throw new Error('The new authenticator setup did not return a factor ID.');
        }

        if (!mountedRef.current) {
          return;
        }

        setEnrollment(nextEnrollment);
        setFactor(null);
        setCode('');
        setReconfigureMode(false);
        setError('');
        toast.success('Current authenticator verified. Scan the new QR code; the existing factor stays active until the new one is confirmed.');
        return;
      }

      const result = await adminService.mfaVerify(normalizedCode, factorId);
      const access = result?.access_token;

      if (!access) {
        throw new Error('MFA verification succeeded but no elevated access session was returned.');
      }

      setAccessToken(access);

      if (replacingFactorId && replacingFactorId !== factorId) {
        try {
          await adminService.mfaUnenroll(replacingFactorId);
          setReplacingFactorId('');
        } catch {
          if (!mountedRef.current) {
            return;
          }

          // Keep the new factor active and offer a retry; never remove the old
          // factor before a replacement has been successfully verified.
          setElevatedToken(access);
          setFactor({
            id: factorId,
            factor_type: 'totp',
            status: 'verified',
            friendly_name: authenticatorName,
          });
          setEnrollment(null);
          setCode('');
          setCleanupPending(true);
          setCleanupMessage('Your new authenticator is verified, but the previous factor could not be removed. Retry the cleanup before finishing.');
          setError('');
          toast.error('New authenticator verified. The previous factor is still enrolled and needs cleanup.');
          return;
        }
      }

      const accepted = await onVerified(access);
      if (accepted === false) {
        throw new Error('The authenticator code was accepted, but the elevated admin session could not be confirmed. Please retry.');
      }

      toast.success(
        replacingFactorId
          ? 'Authenticator reconfigured. Opening admin console…'
          : 'MFA verified. Opening admin console…',
      );
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setError(errorMessage(err, 'Invalid authenticator code. Please try again.'));
      setCode('');
      codeInputRef.current?.focus();
    } finally {
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }, [
    authenticatorName,
    busy,
    code,
    elevatedToken,
    factor?.status,
    factorId,
    enrollment,
    onVerified,
    reconfigureMode,
    replacingFactorId,
    toast,
    token,
  ]);

  const qrCode = qrCodeImageSource(
    enrollment?.totp?.qr_code ||
      enrollment?.qr_code ||
      '',
  );
  const secret =
    enrollment?.totp?.secret ||
    enrollment?.secret ||
    '';
  const hasFactor = Boolean(factor || enrollment);

  if (state === 'loading') {
    return (
      <section
        className="admin-mfa-gate admin-mfa-gate--loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-labelledby="admin-mfa-loading-title"
      >
        <span className="admin-mfa-emblem" aria-hidden="true">
          <RiShieldKeyholeLine size={28} />
        </span>
        <p className="eyebrow">Privileged access</p>
        <h1 id="admin-mfa-loading-title">Checking your security</h1>
        <p>Confirming your authenticator status before opening the console.</p>
        <div className="admin-mfa-identity" aria-label="Signed-in account">
          <span className="admin-mfa-avatar" aria-hidden="true">{initials}</span>
          <span className="admin-mfa-account-copy">
            <span>Signed in as</span>
            <strong title={accountName}>{accountName}</strong>
          </span>
          <span className="admin-mfa-role">{readableRole}</span>
        </div>
        <span className="admin-mfa-spinner" aria-hidden="true" />
      </section>
    );
  }

  if (state === 'error') {
    return (
      <section
        className="admin-mfa-gate"
        aria-labelledby="admin-mfa-error-title"
      >
        <span className="admin-mfa-emblem" aria-hidden="true">
          <RiShieldKeyholeLine size={28} />
        </span>
        <p className="eyebrow">Privileged access</p>
        <h1 id="admin-mfa-error-title">Security check unavailable</h1>
        <p>Your admin console stays locked until the MFA status can be verified.</p>
        <div className="admin-mfa-identity" aria-label="Signed-in account">
          <span className="admin-mfa-avatar" aria-hidden="true">{initials}</span>
          <span className="admin-mfa-account-copy">
            <span>Signed in as</span>
            <strong title={accountName}>{accountName}</strong>
          </span>
          <span className="admin-mfa-role">{readableRole}</span>
        </div>
        {error && (
          <div className="admin-mfa-error" role="alert" aria-live="polite">
            {error}
          </div>
        )}
        <button className="btn admin-mfa-retry" type="button" onClick={loadStatus} disabled={busy}>
          <RiRefreshLine size={16} aria-hidden="true" />
          <span>Try again</span>
        </button>
      </section>
    );
  }

  return (
    <section
      className="admin-mfa-gate"
      aria-labelledby="admin-mfa-title"
    >
      <span className="admin-mfa-emblem" aria-hidden="true">
        <RiShieldKeyholeLine size={28} />
      </span>
      <p className="eyebrow">Privileged access</p>
      <h1 id="admin-mfa-title">Verify admin access</h1>
      <p className="admin-mfa-intro">
        {factor?.status === 'verified'
          ? 'Enter the current code from your authenticator app to continue.'
          : factor
            ? 'Finish the authenticator setup already in progress using its current code.'
            : 'Set up an authenticator app before opening the console.'}
      </p>

      <div className="admin-mfa-identity" aria-label="Signed-in account">
        <span className="admin-mfa-avatar" aria-hidden="true">{initials}</span>
        <span className="admin-mfa-account-copy">
          <span>Signed in as</span>
          <strong title={accountName}>{accountName}</strong>
        </span>
        <span className="admin-mfa-role">{readableRole}</span>
      </div>

      {enrollment && qrCode && (
        <div className="admin-mfa-setup" aria-label="Authenticator setup">
          <div className="admin-mfa-setup-copy">
            <strong>Connect your authenticator</strong>
            <span>Scan the QR code with your authenticator app, then enter the current code below.</span>
          </div>
          <img
            className="admin-mfa-qr"
            src={qrCode}
            alt="QR code for this authenticator setup"
          />
          {secret && (
            <div className="admin-mfa-secret-wrap">
              <span>Manual setup key</span>
              <code className="admin-mfa-secret">{secret}</code>
            </div>
          )}
          {replacingFactorId && (
            <p className="admin-mfa-setup-note">
              Your existing authenticator remains active until this new setup is verified.
            </p>
          )}
        </div>
      )}

      {state === 'setup' && !hasFactor && (
        <button
          className="btn btn-block admin-mfa-primary-action"
          type="button"
          onClick={startEnrollment}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? 'Preparing secure setup…' : 'Set up authenticator'}
        </button>
      )}

      {cleanupPending && (
        <div className="admin-mfa-cleanup" role="status" aria-live="polite">
          <strong>New authenticator verified</strong>
          <p>{cleanupMessage}</p>
          <button
            className="btn btn-block admin-mfa-primary-action"
            type="button"
            onClick={finishReconfiguration}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? 'Finishing secure cleanup…' : 'Finish reconfiguration'}
          </button>
        </div>
      )}

      {hasFactor && !cleanupPending && (
        <form onSubmit={verify} className="admin-mfa-form" noValidate>
          <label htmlFor="admin-mfa-code">
            {reconfigureMode
              ? 'Current authenticator code'
              : enrollment
                ? 'New authenticator code'
                : 'Authenticator code'}
          </label>

          {reconfigureMode && (
            <div className="admin-mfa-reconfigure-copy">
              Verify your current factor first. The existing authenticator will stay active until the replacement code is confirmed.
              <button
                type="button"
                className="admin-mfa-text-action"
                onClick={() => {
                  setReconfigureMode(false);
                  setCode('');
                  setError('');
                }}
                disabled={busy}
              >
                Cancel reconfiguration
              </button>
            </div>
          )}

          <input
            ref={codeInputRef}
            id="admin-mfa-code"
            name="mfa-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,8}"
            minLength={6}
            maxLength={8}
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, '').slice(0, 8));
              if (error) {
                setError('');
              }
            }}
            placeholder="123456"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'admin-mfa-error' : undefined}
            disabled={busy}
            autoFocus
          />

          <button
            className="btn btn-block admin-mfa-primary-action"
            type="submit"
            disabled={busy || !factorId || !MFA_CODE_PATTERN.test(code)}
            aria-busy={busy}
          >
            {busy
              ? (reconfigureMode ? 'Verifying current factor…' : 'Verifying code…')
              : reconfigureMode
                ? 'Verify & reconfigure'
                : replacingFactorId
                  ? 'Verify new authenticator'
                  : 'Verify & open console'}
          </button>

          {factor?.status !== 'verified' && !enrollment && (
            <button
              className="btn btn-quiet btn-block admin-mfa-secondary-action"
              type="button"
              onClick={resetPendingEnrollment}
              disabled={busy || !factorId}
            >
              {busy ? 'Resetting setup…' : 'Reset pending setup'}
            </button>
          )}
        </form>
      )}

      {factor?.status === 'verified' && !enrollment && !cleanupPending && !reconfigureMode && (
        <div className="admin-mfa-reconfigure">
          <span>Your authenticator is connected to this account.</span>
          <button
            className="admin-mfa-text-action"
            type="button"
            onClick={() => {
              setReconfigureMode(true);
              setCode('');
              setError('');
            }}
            disabled={busy}
          >
            Reconfigure authenticator
          </button>
        </div>
      )}

      {error && (
        <div
          id="admin-mfa-error"
          className="admin-mfa-error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <p className="admin-mfa-note">
        Your account role and profile data are unchanged. MFA is checked before the console is rendered.
      </p>
    </section>
  );
}
