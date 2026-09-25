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
const ENROLLMENT_NAME = 'Luviio Admin';

function totpFactors(factors) {
  const sources = [
    ...(Array.isArray(factors?.totp)
      ? factors.totp
      : []),
    ...(Array.isArray(factors?.all)
      ? factors.all
      : []),
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
    typeof error?.message === 'string' &&
    error.message.trim()
      ? error.message.trim()
      : fallback
  );
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

export default function AdminMfaGate({
  role,
  onVerified,
}) {
  const { token } = useAuth();
  const { toast } = useToast();

  const [state, setState] = useState('loading');
  const [factor, setFactor] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const codeInputRef = useRef(null);

  const factorId = useMemo(
    () =>
      factorIdOf(factor) ||
      factorIdOf(enrollment),
    [factor, enrollment],
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const loadStatus = useCallback(async () => {
    const requestId =
      ++requestIdRef.current;

    setError('');
    setState('loading');

    /*
     * Admin verification already proved that this AAL1 access token
     * exists. Synchronize it explicitly before every MFA request so
     * the privileged flow cannot depend on a stale API-client bridge.
     */
    if (!token) {
      setError(
        'Your admin session is not ready. Please sign in again.',
      );
      setState('error');
      return;
    }

    setAccessToken(token);

    try {
      const data =
        await adminService.mfaStatus();

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      if (data?.aal === 'aal2') {
        await onVerified();
        return;
      }

      const factors =
        totpFactors(data?.factors);

      const verified =
        factors.find(
          (item) =>
            item?.status === 'verified',
        ) || null;

      const pending =
        factors.find(
          (item) =>
            item?.status !== 'verified',
        ) || null;

      const activeFactor =
        verified || pending;

      setFactor(activeFactor);
      setEnrollment(null);
      setCode('');

      setState(
        activeFactor
          ? 'verify'
          : 'setup',
      );

      if (
        pending &&
        !verified
      ) {
        setError(
          'An existing authenticator setup is waiting for verification. Enter the current code from that setup.',
        );
      }
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setError(
        errorMessage(
          err,
          'Unable to load MFA status.',
        ),
      );
      setState('error');
    }
  }, [onVerified, token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const startEnrollment =
    useCallback(async () => {
      if (busy) return;

      setBusy(true);
      setError('');

      if (!token) {
        setError(
          'Your admin session is not ready. Please sign in again.',
        );
        setBusy(false);
        return;
      }

      setAccessToken(token);

      try {
        const data =
          await adminService.mfaEnroll(
            ENROLLMENT_NAME,
          );

        if (!mountedRef.current) {
          return;
        }

        const nextId =
          factorIdOf(data);

        if (!nextId) {
          throw new Error(
            'MFA enrollment did not return a factor ID.',
          );
        }

        setEnrollment(data);
        setFactor(null);
        setCode('');
        setState('verify');

        toast.success(
          'MFA setup started. Scan the QR code, then enter the 6-digit code.',
        );
      } catch (err) {
        if (!mountedRef.current) return;

        setError(
          errorMessage(
            err,
            'Unable to start MFA setup.',
          ),
        );
      } finally {
        if (mountedRef.current) {
          setBusy(false);
        }
      }
    }, [busy, toast, token]);

  const resetPendingEnrollment =
    useCallback(async () => {
      if (
        busy ||
        !factorId ||
        factor?.status === 'verified'
      ) {
        return;
      }

      setBusy(true);
      setError('');

      if (!token) {
        setError(
          'Your admin session is not ready. Please sign in again.',
        );
        setBusy(false);
        return;
      }

      setAccessToken(token);

      try {
        await adminService.mfaUnenroll(
          factorId,
        );

        if (!mountedRef.current) {
          return;
        }

        setFactor(null);
        setEnrollment(null);
        setCode('');
        setState('setup');

        toast.success(
          'Pending MFA setup removed. You can start a fresh authenticator setup.',
        );
      } catch (err) {
        if (!mountedRef.current) return;

        setError(
          errorMessage(
            err,
            'Unable to reset the pending MFA setup.',
          ),
        );
      } finally {
        if (mountedRef.current) {
          setBusy(false);
        }
      }
    }, [
      busy,
      factor?.status,
      factorId,
      toast,
      token,
    ]);

  const verify =
    useCallback(
      async (event) => {
        event.preventDefault();

        if (busy) return;

        const normalizedCode =
          code.replace(/\D/g, '');

        if (
          !factorId ||
          !MFA_CODE_PATTERN.test(
            normalizedCode,
          )
        ) {
          setError(
            'Enter the current 6–8 digit authenticator code.',
          );
          codeInputRef.current?.focus();
          return;
        }

        setBusy(true);
        setError('');

        if (!token) {
          setError(
            'Your admin session is not ready. Please sign in again.',
          );
          setBusy(false);
          return;
        }

        setAccessToken(token);

        try {
          const data =
            await adminService.mfaVerify(
              normalizedCode,
            );

          const access =
            data?.access_token;

          if (!access) {
            throw new Error(
              'MFA verification succeeded but no access session was returned.',
            );
          }

          if (!mountedRef.current) {
            return;
          }

          setAccessToken(access);

          try {
            window.__setToken?.(access);
          } catch {
            // Token context synchronization is
            // best-effort; API client already has it.
          }

          toast.success(
            'MFA verified. Opening admin console…',
          );

          await onVerified(access);
        } catch (err) {
          if (!mountedRef.current) {
            return;
          }

          setError(
            errorMessage(
              err,
              'Invalid MFA code. Please try again.',
            ),
          );
          setCode('');
          codeInputRef.current?.focus();
        } finally {
          if (mountedRef.current) {
            setBusy(false);
          }
        }
      },
      [
        busy,
        code,
        factorId,
        onVerified,
        toast,
        token,
      ],
    );

  if (state === 'loading') {
    return (
      <section
        className="admin-mfa-gate"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <RiShieldKeyholeLine
          size={42}
          aria-hidden="true"
        />

        <p>
          Checking admin MFA…
        </p>

        <span
          className="spin admin-mfa-spinner"
          aria-hidden="true"
        />
      </section>
    );
  }

  if (state === 'error') {
    return (
      <section
        className="admin-mfa-gate"
        aria-labelledby="admin-mfa-error-title"
      >
        <RiShieldKeyholeLine
          size={42}
          aria-hidden="true"
        />

        <p className="eyebrow">
          Privileged access
        </p>

        <h1 id="admin-mfa-error-title">
          Admin MFA unavailable
        </h1>

        <p
          className="form-error"
          role="alert"
        >
          {error}
        </p>

        <button
          className="btn"
          type="button"
          onClick={loadStatus}
          disabled={busy}
        >
          <RiRefreshLine
            size={16}
            aria-hidden="true"
          />
          <span>Try again</span>
        </button>
      </section>
    );
  }

  const qrCode = qrCodeImageSource(
    enrollment?.totp?.qr_code ||
      enrollment?.qr_code ||
      '',
  );

  const secret =
    enrollment?.totp?.secret ||
    enrollment?.secret ||
    '';

  const hasFactor =
    Boolean(factor || enrollment);

  return (
    <section
      className="admin-mfa-gate"
      aria-labelledby="admin-mfa-title"
    >
      <RiShieldKeyholeLine
        size={42}
        aria-hidden="true"
      />

      <p className="eyebrow">
        Privileged access
      </p>

      <h1 id="admin-mfa-title">
        Verify admin MFA
      </h1>

      <p>
        {role || 'Staff'} console access
        requires a second authentication
        factor.
        {factor?.status === 'verified'
          ? ' Enter the current code from your authenticator app.'
          : factor
            ? ' An existing authenticator setup was found. Enter its current code to finish verification.'
            : ' Set up an authenticator app to continue.'}
      </p>

      {!factor && !enrollment && (
        <button
          className="btn"
          type="button"
          onClick={startEnrollment}
          disabled={busy}
          aria-busy={busy}
        >
          {busy
            ? 'Starting MFA setup…'
            : 'Set up authenticator'}
        </button>
      )}

      {enrollment && qrCode && (
        <div
          className="admin-mfa-setup"
          aria-label="Authenticator setup"
        >
          <img
            className="admin-mfa-qr"
            src={qrCode}
            alt="Scan this QR code with your authenticator app"
          />

          {secret && (
            <code className="admin-mfa-secret">
              {secret}
            </code>
          )}
        </div>
      )}

      {hasFactor && (
        <form
          onSubmit={verify}
          className="admin-mfa-form"
          noValidate
        >
          <label htmlFor="admin-mfa-code">
            Authenticator code
          </label>

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
              setCode(
                event.target.value
                  .replace(/\D/g, '')
                  .slice(0, 8),
              );

              if (error) {
                setError('');
              }
            }}
            placeholder="123456"
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? 'admin-mfa-error'
                : undefined
            }
            disabled={busy}
            autoFocus
          />

          {error && (
            <div
              id="admin-mfa-error"
              className="form-error"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <button
            className="btn btn-block"
            type="submit"
            disabled={
              busy ||
              !factorId ||
              !MFA_CODE_PATTERN.test(code)
            }
            aria-busy={busy}
          >
            {busy
              ? 'Verifying…'
              : 'Verify & open console'}
          </button>

          {factor?.status !== 'verified' &&
            !enrollment && (
              <button
                className="btn btn-quiet btn-block"
                type="button"
                onClick={
                  resetPendingEnrollment
                }
                disabled={
                  busy || !factorId
                }
              >
                {busy
                  ? 'Resetting…'
                  : 'Reset pending setup'}
              </button>
            )}
        </form>
      )}

      <p className="admin-mfa-note">
        Your admin role remains unchanged;
        MFA only upgrades this session to
        privileged access.
      </p>
    </section>
  );
}