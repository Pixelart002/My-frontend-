import { describe, expect, it } from 'vitest';
import { classifyAdminAccessError } from './adminAccess';

describe('admin access error classification', () => {
  it('routes MFA_REQUIRED to the MFA gate', () => {
    expect(classifyAdminAccessError({ status: 403, code: 'MFA_REQUIRED' })).toBe('mfa-required');
  });

  it('routes missing console permission to access denied', () => {
    expect(classifyAdminAccessError({ status: 403, code: 'UNAUTHORIZED_ACTION' })).toBe('denied');
  });

  it('does not misclassify authentication expiry as an admin-role denial', () => {
    expect(classifyAdminAccessError({ status: 401, code: 'AUTH_REQUIRED' })).toBe('auth-required');
  });
});
