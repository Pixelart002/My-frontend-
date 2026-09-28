export function classifyAdminAccessError(error) {
  if (error?.code === 'MFA_REQUIRED' || (error?.status === 403 && /mfa verification required/i.test(error?.message || ''))) {
    return 'mfa-required';
  }
  if (error?.status === 401 || error?.code === 'AUTH_REQUIRED' || error?.code === 'UNAUTHENTICATED') {
    return 'auth-required';
  }
  return 'denied';
}
