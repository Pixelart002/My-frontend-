import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { request, setAccessToken } from './client';

const response = (
  body,
  status = 200,
  headers = { 'Content-Type': 'application/json' }
) =>
  new Response(
    body === null ? null : JSON.stringify(body),
    { status, headers }
  );

describe('API client', () => {
  beforeEach(() => {
    setAccessToken(null);
    vi.stubGlobal('fetch', vi.fn());

    try {
      sessionStorage.clear();
    } catch {
      // Storage may be unavailable in the test environment.
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('unwraps successful API envelopes', async () => {
    fetch.mockResolvedValueOnce(
      response({
        success: true,
        data: { id: 7 },
      })
    );

    await expect(
      request('GET', '/products')
    ).resolves.toEqual({ id: 7 });
  });

  it('preserves response meta when the payload is an object', async () => {
    fetch.mockResolvedValueOnce(
      response({
        success: true,
        data: { items: [] },
        meta: { page: 1, total: 0 },
      })
    );

    await expect(
      request('GET', '/products')
    ).resolves.toEqual({
      items: [],
      meta: { page: 1, total: 0 },
    });
  });

  it('preserves response meta on array payloads', async () => {
    fetch.mockResolvedValueOnce(
      response({
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        meta: { page: 1, total: 2 },
      })
    );

    const result = await request('GET', '/products');

    expect(result).toEqual([
      { id: 1 },
      { id: 2 },
    ]);

    expect(result.meta).toEqual({
      page: 1,
      total: 2,
    });
  });

  it('normalizes validation errors into ApiError', async () => {
    fetch.mockResolvedValueOnce(
      response(
        {
          detail: [
            { msg: 'Email is invalid' },
          ],
        },
        422
      )
    );

    await expect(
      request('GET', '/products')
    ).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Email is invalid',
      status: 422,
    });
  });

  it('joins multiple validation errors', async () => {
    fetch.mockResolvedValueOnce(
      response(
        {
          detail: [
            { msg: 'Email is invalid' },
            { msg: 'Password is too short' },
          ],
        },
        422
      )
    );

    await expect(
      request('GET', '/products')
    ).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Email is invalid; Password is too short',
      status: 422,
    });
  });

  it('surfaces network failures with a stable code', async () => {
    fetch.mockRejectedValue(
      new TypeError('Failed to fetch')
    );

    await expect(
      request('GET', '/products')
    ).rejects.toMatchObject({
      name: 'ApiError',
      code: 'NETWORK_ERROR',
    });
  });

  it('does not retry POST requests after a network failure', async () => {
    fetch.mockRejectedValue(
      new TypeError('Failed to fetch')
    );

    await expect(
      request('POST', '/orders')
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries GET requests after a transient network failure', async () => {
    fetch
      .mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      )
      .mockResolvedValueOnce(
        response({
          success: true,
          data: { ok: true },
        })
      );

    await expect(
      request('GET', '/products')
    ).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns null for 204 responses', async () => {
    fetch.mockResolvedValueOnce(
      response(null, 204)
    );

    await expect(
      request('DELETE', '/account')
    ).resolves.toBeNull();
  });

  it('attaches the access token to protected requests', async () => {
    setAccessToken('access-token-123');

    fetch.mockResolvedValueOnce(
      response({
        success: true,
        data: { ok: true },
      })
    );

    await request('GET', '/orders');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token-123',
        }),
      })
    );
  });

  it('does not attach the bearer token to public requests', async () => {
    setAccessToken('access-token-123');

    fetch.mockResolvedValueOnce(
      response({
        success: true,
        data: [],
      })
    );

    await request('GET', '/products');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.any(String),
        }),
      })
    );
  });

  it('refreshes the token once after a protected 401', async () => {
    setAccessToken('expired-token');

    fetch
      .mockResolvedValueOnce(
        response(
          { detail: 'Token expired' },
          401
        )
      )
      .mockResolvedValueOnce(
        response({
          success: true,
          data: {
            access_token: 'fresh-token',
          },
        })
      )
      .mockResolvedValueOnce(
        response({
          success: true,
          data: { id: 42 },
        })
      );

    await expect(
      request('GET', '/orders')
    ).resolves.toEqual({ id: 42 });

    expect(fetch).toHaveBeenCalledTimes(3);

    expect(fetch.mock.calls[2][1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer fresh-token',
        }),
      })
    );
  });

  it('does not attempt token refresh for public 401 responses', async () => {
    fetch.mockResolvedValueOnce(
      response(
        { detail: 'Unauthorized' },
        401
      )
    );

    await expect(
      request('GET', '/products')
    ).rejects.toMatchObject({
      status: 401,
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns AUTH_REQUIRED when protected token refresh fails', async () => {
    setAccessToken('expired-token');

    fetch
      .mockResolvedValueOnce(
        response(
          { detail: 'Token expired' },
          401
        )
      )
      .mockResolvedValueOnce(
        response(
          { detail: 'Refresh expired' },
          401
        )
      );

    await expect(
      request('GET', '/orders')
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      code: 'AUTH_REQUIRED',
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry a POST after a 401 even when refresh succeeds', async () => {
    setAccessToken('expired-token');

    fetch
      .mockResolvedValueOnce(
        response(
          { detail: 'Token expired' },
          401
        )
      )
      .mockResolvedValueOnce(
        response({
          success: true,
          data: {
            access_token: 'fresh-token',
          },
        })
      )
      .mockResolvedValueOnce(
        response({
          success: true,
          data: { created: true },
        })
      );

    /*
     * A POST is not replayed automatically by the hardened client.
     * The refresh happens, but the original mutation must not be
     * blindly duplicated.
     */
    await expect(
      request('POST', '/orders')
    ).rejects.toMatchObject({
      status: 401,
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('normalizes legacy COD order requests to /orders/cod', async () => {
    fetch.mockResolvedValueOnce(
      response({
        success: true,
        data: { id: 99 },
      })
    );

    await request(
      'POST',
      '/orders',
      {
        payment_method: 'COD',
        address_id: 'addr-1',
      }
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/orders/cod'),
      expect.any(Object)
    );
  });

  it('does not normalize non-COD order requests', async () => {
    fetch.mockResolvedValueOnce(
      response({
        success: true,
        data: { id: 100 },
      })
    );

    await request(
      'POST',
      '/orders',
      {
        payment_method: 'stripe',
      }
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/orders'),
      expect.any(Object)
    );

    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/orders/cod'),
      expect.any(Object)
    );
  });

  it('uses JSON for normal request bodies', async () => {
    fetch.mockResolvedValueOnce(
      response({
        success: true,
        data: { ok: true },
      })
    );

    await request(
      'POST',
      '/auth/login',
      {
        email: 'test@example.com',
        password: 'secret',
      }
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'secret',
        }),
      })
    );
  });
});