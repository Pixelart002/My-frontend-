import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { setAccessToken } from '../api/client';
import { userService } from '../services/users';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../api/client', () => ({
  setAccessToken: vi.fn(),
}));

vi.mock('../services/auth', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../services/users', () => ({
  userService: {
    getMe: vi.fn(),
  },
}));

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function SessionProbe() {
  const auth = useAuth();

  return (
    <section>
      <output data-testid="initializing">
        {String(auth.initializing)}
      </output>
      <output data-testid="restore-error">
        {String(auth.restoreError)}
      </output>
      <output data-testid="authenticated">
        {String(auth.isAuthenticated)}
      </output>
      <output data-testid="user-email">
        {auth.user?.email || 'none'}
      </output>
      <button type="button" onClick={auth.retrySession}>
        Retry session
      </button>
    </section>
  );
}

function renderSession() {
  return render(
    <AuthProvider>
      <SessionProbe />
    </AuthProvider>,
  );
}

describe('AuthContext session restoration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('restores the cookie session after a transient backend 503', async () => {
    fetch
      .mockResolvedValueOnce(
        response({ detail: 'Temporarily unavailable' }, 503),
      )
      .mockResolvedValueOnce(
        response({
          success: true,
          data: { access_token: 'restored-access-token' },
        }),
      );
    userService.getMe.mockResolvedValue({
      id: 'customer-1',
      email: 'customer@luviio.in',
    });

    renderSession();

    await waitFor(
      () => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user-email')).toHaveTextContent(
          'customer@luviio.in',
        );
        expect(screen.getByTestId('initializing')).toHaveTextContent('false');
      },
      { timeout: 4000 },
    );

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0][0]).toContain('/auth/refresh');
    expect(fetch.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    expect(setAccessToken).toHaveBeenCalledWith('restored-access-token');
    expect(sessionStorage.getItem('__lv_has_session')).toBe('1');
  });

  it('clears a definitively expired session without retrying', async () => {
    sessionStorage.setItem('__lv_has_session', '1');
    fetch.mockResolvedValueOnce(
      response({ detail: 'Refresh session expired' }, 401),
    );

    renderSession();

    await waitFor(() => {
      expect(screen.getByTestId('initializing')).toHaveTextContent('false');
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('restore-error')).toHaveTextContent('false');
    expect(sessionStorage.getItem('__lv_has_session')).toBeNull();
    expect(setAccessToken).toHaveBeenLastCalledWith(null);
  });

  it('keeps session recovery available after repeated network failures', async () => {
    fetch
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    userService.getMe.mockResolvedValue({
      id: 'customer-2',
      email: 'retry@luviio.in',
    });

    renderSession();

    await waitFor(
      () => {
        expect(screen.getByTestId('restore-error')).toHaveTextContent('true');
        expect(screen.getByTestId('initializing')).toHaveTextContent('false');
      },
      { timeout: 5000 },
    );

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(sessionStorage.getItem('__lv_has_session')).toBeNull();

    fetch.mockResolvedValueOnce(
      response({
        success: true,
        data: { access_token: 'retry-access-token' },
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: /retry session/i }));

    await waitFor(
      () => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user-email')).toHaveTextContent(
          'retry@luviio.in',
        );
        expect(screen.getByTestId('restore-error')).toHaveTextContent('false');
        expect(screen.getByTestId('initializing')).toHaveTextContent('false');
      },
      { timeout: 4000 },
    );

    expect(fetch).toHaveBeenCalledTimes(4);
    expect(setAccessToken).toHaveBeenLastCalledWith('retry-access-token');
    expect(sessionStorage.getItem('__lv_has_session')).toBe('1');
  }, 8000);
});
