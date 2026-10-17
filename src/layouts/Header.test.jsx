import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  focusTrapOptions: null,
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
  useFocusTrap: vi.fn((options) => {
    mocks.focusTrapOptions = options;
  }),
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
    mocks.focusTrapOptions = null;
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


describe('Header hamburger navigation', () => {
  beforeEach(() => {
    mocks.auth.isAuthenticated = false;
    mocks.auth.user = null;
    mocks.cart.itemCount = 0;
    mocks.focusTrapOptions = null;
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    vi.clearAllMocks();
  });

  it('opens the navigation drawer and closes it from its close button', () => {
    const { container } = renderHeader();
    const trigger = screen.getByRole('button', { name: /open menu/i });
    const navigation = container.querySelector('#mobile-navigation');

    fireEvent.click(trigger);

    expect(navigation).toHaveAttribute('aria-hidden', 'false');
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(container.querySelector('.mobile-nav-close'));

    expect(navigation).toHaveAttribute('aria-hidden', 'true');
    expect(document.body.style.overflow).toBe('');
  });

  it('closes the drawer when the backdrop is pressed', () => {
    const { container } = renderHeader();
    const trigger = screen.getByRole('button', { name: /open menu/i });
    const navigation = container.querySelector('#mobile-navigation');

    fireEvent.click(trigger);
    fireEvent.click(container.querySelector('.mobile-menu-backdrop'));

    expect(navigation).toHaveAttribute('aria-hidden', 'true');
    expect(document.body.style.overflow).toBe('');
  });

  it('restores keyboard focus to the hamburger trigger after Escape dismisses the drawer', async () => {
    renderHeader();
    const trigger = screen.getByRole('button', { name: /open menu/i });

    fireEvent.click(trigger);

    expect(mocks.focusTrapOptions?.enabled).toBe(true);
    act(() => {
      mocks.focusTrapOptions?.onEscape?.();
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
