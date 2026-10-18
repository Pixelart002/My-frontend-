import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  permissions: vi.fn(),
  togglePermission: vi.fn(),
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../../services/admin', () => ({
  adminService: {
    permissions: mocks.permissions,
    togglePermission: mocks.togglePermission,
  },
  itemsOfList: (value) => Array.isArray(value) ? value : value?.items || [],
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

import OperationsPanel from './OperationsPanel';

const permissionMatrix = {
  effective: {
    manager: {
      'products:update': true,
      'orders:update': false,
    },
    super_admin: {
      'users:delete': true,
    },
  },
};

describe('Roles & permissions radio policy controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.permissions.mockResolvedValue(permissionMatrix);
    mocks.togglePermission.mockResolvedValue({ success: true });
  });

  it('renders each mutable permission as an accessible Allow/Deny radio group', async () => {
    render(<OperationsPanel section="rbac" />);

    const group = await screen.findByRole('group', {
      name: /manager — products:update/i,
    });

    expect(within(group).getByRole('radio', { name: 'Allow' })).toBeChecked();
    expect(within(group).getByRole('radio', { name: 'Deny' })).not.toBeChecked();
    expect(screen.queryByRole('button', { name: /^(allow|deny)$/i })).not.toBeInTheDocument();
  });

  it('writes the selected boolean policy and reloads permissions', async () => {
    render(<OperationsPanel section="rbac" />);

    const group = await screen.findByRole('group', {
      name: /manager — products:update/i,
    });

    fireEvent.click(within(group).getByRole('radio', { name: 'Deny' }));

    await waitFor(() => {
      expect(mocks.togglePermission).toHaveBeenCalledWith(
        'manager',
        'products:update',
        false,
      );
    });
    expect(mocks.permissions).toHaveBeenCalledTimes(2);
  });

  it('keeps super-admin policy immutable and does not render editable radios', async () => {
    render(<OperationsPanel section="rbac" />);

    expect(await screen.findByText('Fixed policy')).toBeInTheDocument();
    expect(
      screen.queryByRole('group', { name: /super_admin — users:delete/i }),
    ).not.toBeInTheDocument();
    expect(mocks.togglePermission).not.toHaveBeenCalled();
  });
});
