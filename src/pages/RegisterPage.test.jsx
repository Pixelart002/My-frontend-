import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ register: vi.fn(), isAuthenticated: false }) }));
vi.mock('../context/ToastContext', () => ({ useToast: () => ({ toast: { error: vi.fn(), success: vi.fn() } }) }));

describe('RegisterPage', () => {
  it('renders password guidance', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });
});
