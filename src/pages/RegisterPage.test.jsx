import { describe, expect, it, vi } from 'vitest';
import {
  fireEvent,
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
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'weakpassword' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'weakpassword' },
    });
    
    const submitButton =
      screen.getByRole('button', {
        name: /create account/i,
      });
    
    expect(submitButton).toBeDisabled();
    expect(registerMock).not.toHaveBeenCalled();
  });
  
  it('allows submission when password requirements are satisfied', async () => {
    registerMock.mockResolvedValueOnce({});
    
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'TEST@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'StrongPass1' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongPass1' },
    });
    
    const submitButton =
      screen.getByRole('button', {
        name: /create account/i,
      });
    
    expect(submitButton).toBeEnabled();
    
    fireEvent.click(submitButton);
    
    expect(registerMock).toHaveBeenCalledWith(
      'test@example.com',
      'StrongPass1',
      'Test User',
    );
  });
});