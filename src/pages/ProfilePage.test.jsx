import {
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
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  user: {
    id: 'user-123',
    email: 'customer@example.com',
    full_name: 'Old Name',
    phone: '9876543210',
    role: 'customer',
  },
  updateMe: vi.fn(),
  applyProfileUpdate: vi.fn(),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../services/users', () => ({
  userService: {
    updateMe: mocks.updateMe,
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mocks.user,
    applyProfileUpdate: mocks.applyProfileUpdate,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    toast: mocks.toast,
  }),
}));

import ProfilePage from './ProfilePage';

function renderProfile() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

describe('ProfilePage save confirmation', () => {
  beforeEach(() => {
    mocks.user = {
      id: 'user-123',
      email: 'customer@example.com',
      full_name: 'Old Name',
      phone: '9876543210',
      role: 'customer',
    };
    mocks.updateMe.mockReset();
    mocks.applyProfileUpdate.mockReset();
    mocks.applyProfileUpdate.mockImplementation((profile) => {
      mocks.user = {
        ...mocks.user,
        full_name: profile.full_name,
        phone: profile.phone,
      };
    });
    mocks.toast.success.mockReset();
    mocks.toast.error.mockReset();
  });

  it('shows success and updates shared profile state only when the server returns the saved name', async () => {
    const savedProfile = {
      id: 'user-123',
      email: 'customer@example.com',
      full_name: 'Updated Name',
      phone: '9876543210',
      role: 'customer',
    };
    mocks.updateMe.mockResolvedValueOnce(savedProfile);

    renderProfile();

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Updated Name' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mocks.updateMe).toHaveBeenCalledWith({
        full_name: 'Updated Name',
      });
      expect(mocks.applyProfileUpdate).toHaveBeenCalledWith(savedProfile);
      expect(mocks.toast.success).toHaveBeenCalledWith('Profile updated.');
    });

    expect(screen.getByText('Updated Name')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
  });

  it('does not show a success toast when the server responds with the old name', async () => {
    mocks.updateMe.mockResolvedValueOnce({
      id: 'user-123',
      email: 'customer@example.com',
      full_name: 'Old Name',
      phone: '9876543210',
      role: 'customer',
    });

    renderProfile();

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Updated Name' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /name was not confirmed as saved/i,
    );
    expect(mocks.toast.success).not.toHaveBeenCalled();
    expect(mocks.applyProfileUpdate).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('does not send a blank replacement for an existing name', async () => {
    renderProfile();

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/full name is required/i);
    expect(mocks.updateMe).not.toHaveBeenCalled();
    expect(mocks.toast.success).not.toHaveBeenCalled();
  });

  it('sends null when clearing an optional phone number', async () => {
    mocks.updateMe.mockResolvedValueOnce({
      id: 'user-123',
      email: 'customer@example.com',
      full_name: 'Old Name',
      phone: null,
      role: 'customer',
    });

    renderProfile();

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    fireEvent.change(screen.getByLabelText(/^phone$/i), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mocks.updateMe).toHaveBeenCalledWith({ phone: null });
      expect(mocks.applyProfileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ phone: null }),
      );
      expect(mocks.toast.success).toHaveBeenCalledWith('Profile updated.');
    });
  });
});
