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

describe('LoginForm Component - Simple Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render login form', () => {
    render(<LoginForm />);

    expect(
      screen.getByRole('heading', { name: /connexion/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /se connecter/i })
    ).toBeInTheDocument();
  });

  it('should accept user input', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput =
      screen.getByRole('textbox', { hidden: true }) ||
      (screen.getByDisplayValue('') as HTMLInputElement);

    await user.type(emailInput, 'test@example.com');

    expect(emailInput.value).toBe('test@example.com');
  });

  it('should submit with valid credentials', async () => {
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
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    await user.type(emailInput, 'test@example.com');

    // Find password input by its id since there's only one
    const passwordInput = screen.getByDisplayValue('');
    if (passwordInput.getAttribute('type') === 'password') {
      await user.type(passwordInput, 'TestPass123');
    }

    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
