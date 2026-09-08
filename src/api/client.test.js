import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { request, setAccessToken } from './client';

const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('API client', () => {
  beforeEach(() => { setAccessToken(null); vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => vi.restoreAllMocks());

  it('unwraps successful API envelopes', async () => {
    fetch.mockResolvedValueOnce(response({ success: true, data: { id: 7 } }));
    await expect(request('GET', '/products')).resolves.toEqual({ id: 7 });
  });

  it('normalizes validation errors into ApiError', async () => {
    fetch.mockResolvedValueOnce(response({ detail: [{ msg: 'Email is invalid' }] }, 422));
    await expect(request('GET', '/products')).rejects.toMatchObject({ name: 'ApiError', message: 'Email is invalid', status: 422 });
  });

  it('surfaces network failures with a stable code', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(request('GET', '/products')).rejects.toMatchObject({ name: 'ApiError', code: 'NETWORK_ERROR' });
  });
});
