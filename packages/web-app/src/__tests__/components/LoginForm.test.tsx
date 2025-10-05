import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/LoginForm';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('LoginForm Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render login form with all required fields', () => {
    render(<LoginForm />);

    expect(
      screen.getByRole('heading', { name: /connexion/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /se connecter/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /pas encore de compte/i })
    ).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/l'email est requis/i)).toBeInTheDocument();
      expect(
        screen.getByText(/le mot de passe est requis/i)
      ).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/format d'email invalide/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          redirectTo: '/dashboard',
        }),
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPass123',
        }),
      });
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle login errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: () =>
        Promise.resolve({
          success: false,
          error: 'Email ou mot de passe invalide',
        }),
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'WrongPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/email ou mot de passe invalide/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/erreur de connexion/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/connexion en cours/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it('should handle redirect parameter from URL', async () => {
    const mockGet = jest.fn().mockReturnValue('/protected');
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
      }),
      useSearchParams: () => ({
        get: mockGet,
      }),
    }));
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          redirectTo: '/dashboard',
        }),
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/protected');
    });
  });

  it('should toggle password visibility', async () => {
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const toggleButton = screen.getByRole('button', {
      name: /afficher le mot de passe/i,
    });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should prevent multiple simultaneous submissions', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({ success: true, redirectTo: '/dashboard' }),
              }),
            500
          )
        )
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');

    // Click multiple times rapidly
    await user.click(submitButton);
    await user.click(submitButton);
    await user.click(submitButton);

    // Should only call fetch once
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
