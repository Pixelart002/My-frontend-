const MFA_REQUIRED_CODE = 'MFA_REQUIRED';
const AUTH_REQUIRED_CODES = new Set([
  'AUTH_REQUIRED',
  'UNAUTHENTICATED',
]);

const MFA_REQUIRED_MESSAGE =
  /mfa\s+(?:verification|required)|multi[-\s]?factor\s+authentication/i;

function normalizeStatus(status) {
  const value = Number(status);
  
  return Number.isFinite(value) ?
    value :
    null;
}

function normalizeCode(code) {
  return typeof code === 'string' ?
    code.trim().toUpperCase() :
    '';
}

function getErrorMessage(error) {
  return typeof error?.message === 'string' ?
    error.message.trim() :
    '';
}

export function classifyAdminAccessError(
  error,
) {
  const status = normalizeStatus(
    error?.status,
  );
  
  const code = normalizeCode(
    error?.code,
  );
  
  const message =
    getErrorMessage(error);
  
  /*
   * MFA is a more specific authorization
   * state than generic 403 access denial.
   */
  if (
    code === MFA_REQUIRED_CODE ||
    (
      status === 403 &&
      MFA_REQUIRED_MESSAGE.test(
        message,
      )
    )
  ) {
    return 'mfa-required';
  }
  
  if (
    status === 401 ||
    AUTH_REQUIRED_CODES.has(code)
  ) {
    return 'auth-required';
  }
  
  return 'denied';
}