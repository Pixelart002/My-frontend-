import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  auth: {
    isAuthenticated: false,
    user: null,
    logout: vi.fn(),
  },
  cart: {
    itemCount: 0,
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mocks.auth,
}));

vi.mock('../context/CartContext', () => ({
  useCart: () => mocks.cart,
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => mocks.toast,
}));

vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

import Header from './Header';

function LoginDestination() {
  const location = useLocation();

  return (
    <div data-testid="login-destination">
      {location.pathname}
      <output data-testid="return-to">
        {location.state?.from || 'none'}
      </output>
    </div>
  );
}

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/*"
          element={
            <>
              <Header />
              <LoginDestination />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Header signed-out account action', () => {
  beforeEach(() => {
    mocks.auth.isAuthenticated = false;
    mocks.auth.user = null;
    mocks.cart.itemCount = 0;
    vi.clearAllMocks();
  });

  it('opens the login form directly and preserves the account return path', () => {
    renderHeader();

    fireEvent.click(
      screen.getByRole('link', { name: /sign in to your account/i }),
    );

    expect(screen.getByTestId('login-destination')).toHaveTextContent('/login');
    expect(screen.getByTestId('return-to')).toHaveTextContent('/account');
    expect(
      screen.queryByText(/session could not be restored/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /retry session/i }),
    ).not.toBeInTheDocument();
  });
});
