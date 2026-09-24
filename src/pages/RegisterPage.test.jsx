import { describe, expect, it, vi } from 'vitest';
import {
  render,
  screen,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';

const registerMock = vi.fn();

const toastMock = {
  error: vi.fn(),
  success: vi.fn(),
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    register: registerMock,
    isAuthenticated: false,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  it('renders the registration form', () => {
    renderRegisterPage();
    
    expect(
      screen.getByRole('heading', {
        name: /create account/i,
      }),
    ).toBeInTheDocument();
    
    expect(
      screen.getByLabelText(/full name/i),
    ).toBeInTheDocument();
    
    expect(
      screen.getByLabelText(/email/i),
    ).toBeInTheDocument();
    
    expect(
      screen.getByLabelText(/^password$/i),
    ).toBeInTheDocument();
    
    expect(
      screen.getByLabelText(/confirm password/i),
    ).toBeInTheDocument();
  });
  
  it('renders password guidance', () => {
    renderRegisterPage();
    
    expect(
      screen.getByText(
        /use 8–128 characters with upper, lower and a number/i,
      ),
    ).toBeInTheDocument();
  });
  
  it('keeps create account disabled until required fields are valid', () => {
    renderRegisterPage();
    
    const submitButton =
      screen.getByRole('button', {
        name: /create account/i,
      });
    
    expect(submitButton).toBeDisabled();
  });
  
  it('does not call register with an invalid password', async () => {
    const user = (
      await import('@testing-library/user-event')
    ).default.setup();
    
    renderRegisterPage();
    
    await user.type(
      screen.getByLabelText(/full name/i),
      'Test User',
    );
    
    await user.type(
      screen.getByLabelText(/email/i),
      'test@example.com',
    );
    
    await user.type(
      screen.getByLabelText(/^password$/i),
      'weakpassword',
    );
    
    await user.type(
      screen.getByLabelText(/confirm password/i),
      'weakpassword',
    );
    
    const submitButton =
      screen.getByRole('button', {
        name: /create account/i,
      });
    
    expect(submitButton).toBeDisabled();
    expect(registerMock).not.toHaveBeenCalled();
  });
  
  it('allows submission when password requirements are satisfied', async () => {
    registerMock.mockResolvedValueOnce({});
    
    const user = (
      await import('@testing-library/user-event')
    ).default.setup();
    
    renderRegisterPage();
    
    await user.type(
      screen.getByLabelText(/full name/i),
      'Test User',
    );
    
    await user.type(
      screen.getByLabelText(/email/i),
      'TEST@example.com',
    );
    
    await user.type(
      screen.getByLabelText(/^password$/i),
      'StrongPass1',
    );
    
    await user.type(
      screen.getByLabelText(/confirm password/i),
      'StrongPass1',
    );
    
    const submitButton =
      screen.getByRole('button', {
        name: /create account/i,
      });
    
    expect(submitButton).toBeEnabled();
    
    await user.click(submitButton);
    
    expect(registerMock).toHaveBeenCalledWith(
      'test@example.com',
      'StrongPass1',
      'Test User',
    );
  });
});