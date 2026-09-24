import { describe, expect, it } from 'vitest';

import {
  classifyAdminAccessError,
} from './adminAccess';

describe('admin access error classification', () => {
  it('routes MFA_REQUIRED to the MFA gate', () => {
    expect(
      classifyAdminAccessError({
        status: 403,
        code: 'MFA_REQUIRED',
      }),
    ).toBe('mfa-required');
  });
  
  it('recognizes MFA_REQUIRED regardless of code casing', () => {
    expect(
      classifyAdminAccessError({
        status: '403',
        code: 'mfa_required',
      }),
    ).toBe('mfa-required');
  });
  
  it('routes an MFA-specific 403 message to the MFA gate', () => {
    expect(
      classifyAdminAccessError({
        status: 403,
        message: 'MFA verification required',
      }),
    ).toBe('mfa-required');
  });
  
  it('does not classify a generic 403 as MFA', () => {
    expect(
      classifyAdminAccessError({
        status: 403,
        code: 'FORBIDDEN',
      }),
    ).toBe('denied');
  });
  
  it('routes missing console permission to access denied', () => {
    expect(
      classifyAdminAccessError({
        status: 403,
        code: 'UNAUTHORIZED_ACTION',
      }),
    ).toBe('denied');
  });
  
  it('routes authentication expiry to authentication required', () => {
    expect(
      classifyAdminAccessError({
        status: 401,
        code: 'AUTH_REQUIRED',
      }),
    ).toBe('auth-required');
  });
  
  it('recognizes an unauthenticated error code', () => {
    expect(
      classifyAdminAccessError({
        code: 'UNAUTHENTICATED',
      }),
    ).toBe('auth-required');
  });
  
  it('accepts string HTTP status codes', () => {
    expect(
      classifyAdminAccessError({
        status: '401',
      }),
    ).toBe('auth-required');
  });
  
  it('returns denied for unknown errors', () => {
    expect(
      classifyAdminAccessError({
        status: 500,
        code: 'INTERNAL_ERROR',
      }),
    ).toBe('denied');
  });
  
  it('returns denied for null or malformed errors', () => {
    expect(classifyAdminAccessError(null)).toBe('denied');
    expect(classifyAdminAccessError(undefined)).toBe('denied');
    expect(classifyAdminAccessError({})).toBe('denied');
  });
});