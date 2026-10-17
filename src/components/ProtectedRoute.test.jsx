import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  initializing: false,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));

import ProtectedRoute from './ProtectedRoute';

function LoginDestination() {
  const location = useLocation();

  return (
    <div data-testid="login-route">
      Login form route: {location.state?.from || 'none'}
    </div>
  );
}

function renderRoutes(initialEntry = '/account?tab=security#preferences') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <div data-testid="private-account">Private account</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginDestination />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute authentication fallback', () => {
  beforeEach(() => {
    Object.assign(authState, {
      isAuthenticated: false,
      initializing: false,
    });
  });

  it('redirects to the sign-in route after session restoration fails', () => {
    renderRoutes();

    expect(screen.getByTestId('login-route')).toHaveTextContent(
      '/account?tab=security#preferences',
    );
    expect(screen.queryByTestId('private-account')).not.toBeInTheDocument();
    expect(screen.queryByText(/session could not be restored/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry session/i })).not.toBeInTheDocument();
  });

  it('waits for session bootstrap before redirecting', () => {
    Object.assign(authState, {
      isAuthenticated: false,
      initializing: true,
    });

    renderRoutes();

    expect(screen.getByRole('status')).toHaveTextContent(/loading your session/i);
    expect(screen.queryByTestId('login-route')).not.toBeInTheDocument();
  });

  it('renders the protected page for an authenticated user', () => {
    Object.assign(authState, {
      isAuthenticated: true,
      initializing: false,
    });

    renderRoutes();

    expect(screen.getByTestId('private-account')).toBeInTheDocument();
    expect(screen.queryByTestId('login-route')).not.toBeInTheDocument();
  });
});
