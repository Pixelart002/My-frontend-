import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  mfaStatus: vi.fn(),
  authState: {
    user: { id: 'admin-1', role: 'super_admin' },
    logout: vi.fn(),
    initializing: false,
    isAuthenticated: true,
    token: 'test-admin-token',
  },
  listUsers: vi.fn(),
  userActions: vi.fn(),
  setUserAction: vi.fn(),
  removeUserAction: vi.fn(),
  listProducts: vi.fn(),
  categories: vi.fn(),
  measurementCatalog: vi.fn(),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../../services/admin', () => ({
  adminService: {
    verify: mocks.verify,
    mfaStatus: mocks.mfaStatus,
    listUsers: mocks.listUsers,
    userActions: mocks.userActions,
    setUserAction: mocks.setUserAction,
    removeUserAction: mocks.removeUserAction,
    listProducts: mocks.listProducts,
    categories: mocks.categories,
    measurementCatalog: mocks.measurementCatalog,
  },
  itemsOfList: (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.items)) return result.items;
    if (Array.isArray(result?.results)) return result.results;
    if (Array.isArray(result?.data)) return result.data;
    if (result?.data && typeof result.data === 'object') {
      return Array.isArray(result.data.items) ? result.data.items : [];
    }
    return [];
  },
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mocks.authState,
}));

import UsersPanel from './UsersPanel';
import ProductsPanel from './ProductsPanel';
import OperationsPanel from './OperationsPanel';
import AdminPage from './AdminPage';

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="current-location">
      {location.pathname}{location.search}
    </output>
  );
}

describe('admin panel routing and search', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.verify.mockResolvedValue({
      profile: { id: 'admin-1', role: 'super_admin' },
    });

    mocks.mfaStatus.mockResolvedValue({
      privileged_mfa_required: false,
      aal: 'aal2',
    });

    mocks.listUsers.mockResolvedValue([
      {
        id: 'user-123',
        email: 'customer@example.test',
        full_name: 'Test Customer',
        role: 'customer',
        is_active: true,
        created_at: '2026-10-17T10:00:00Z',
      },
    ]);

    mocks.userActions.mockResolvedValue({
      all_actions: ['checkout'],
      controls: [{ action: 'checkout', enabled: true }],
    });

    mocks.listProducts.mockResolvedValue([
      {
        id: 'product-1',
        name: 'Floor drainer square ring',
        slug: 'floor-drainer-square-ring',
        sku: 'FD-100',
        price: 299,
        stock: 8,
        is_active: true,
      },
      {
        id: 'product-2',
        name: 'Sink basket strainer',
        slug: 'sink-basket-strainer',
        sku: 'SB-200',
        price: 149,
        stock: 15,
        is_active: true,
      },
    ]);

    mocks.categories.mockResolvedValue([]);
    mocks.measurementCatalog.mockResolvedValue({ types: [], units: [] });
  });

  it('routes a user row action directly to that customer in User Actions', async () => {
    render(
      <MemoryRouter initialEntries={['/admin?panel=users']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <>
                <UsersPanel capabilities={{ userUpdate: true }} />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    const actionButton = await screen.findByRole('button', {
      name: 'Manage actions for customer@example.test',
    });
    fireEvent.click(actionButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(
        '/admin?panel=user-actions&user_id=user-123',
      );
    });
  });

  it('switches the visible admin panel when a user action deep link changes the query', async () => {
    render(
      <MemoryRouter initialEntries={['/admin?panel=users']}>
        <AdminPage />
      </MemoryRouter>,
    );

    const actionButton = await screen.findByRole('button', {
      name: 'Manage actions for customer@example.test',
    });
    fireEvent.click(actionButton);

    expect(await screen.findByText('checkout')).toBeInTheDocument();
    await waitFor(() => {
      expect(mocks.userActions).toHaveBeenCalledWith('user-123');
    });
    expect(screen.getByRole('heading', { name: 'User actions' })).toBeInTheDocument();
  });

  it('loads the selected customer when User Actions is opened by URL', async () => {
    render(
      <MemoryRouter initialEntries={['/admin?panel=user-actions&user_id=user-123']}>
        <OperationsPanel section="user-actions" />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mocks.userActions).toHaveBeenCalledWith('user-123');
    });

    expect(await screen.findByText('checkout')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disable' })).toBeInTheDocument();
  });

  it('keeps product search usable and filters catalogue rows while typing', async () => {
    render(
      <MemoryRouter>
        <ProductsPanel capabilities={{}} />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Floor drainer square ring')).toBeInTheDocument();
    expect(screen.getByText('Sink basket strainer')).toBeInTheDocument();

    const search = screen.getByRole('searchbox', {
      name: 'Search products by name, SKU or slug',
    });
    fireEvent.change(search, { target: { value: 'square' } });

    expect(screen.getByText('Floor drainer square ring')).toBeInTheDocument();
    expect(screen.queryByText('Sink basket strainer')).not.toBeInTheDocument();
  });
});
