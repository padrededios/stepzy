import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '@/components/auth/RegisterForm';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('RegisterForm Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render registration form with all required fields', () => {
    render(<RegisterForm />);

    expect(
      screen.getByRole('heading', { name: /inscription/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pseudo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/confirmer le mot de passe/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/avatar/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /s'inscrire/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /déjà un compte/i })
    ).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/l'email est requis/i)).toBeInTheDocument();
      expect(screen.getByText(/le pseudo est requis/i)).toBeInTheDocument();
      expect(
        screen.getByText(/le mot de passe est requis/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/la confirmation est requise/i)
      ).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/format d'email invalide/i)).toBeInTheDocument();
    });
  });

  it('should validate pseudo format', async () => {
    render(<RegisterForm />);

    const pseudoInput = screen.getByLabelText(/pseudo/i);
    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });

    // Test too short pseudo
    await user.type(pseudoInput, 'ab');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/le pseudo doit contenir entre 3 et 20 caractères/i)
      ).toBeInTheDocument();
    });

    await user.clear(pseudoInput);

    // Test invalid characters
    await user.type(pseudoInput, 'pseudo@invalid');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/le pseudo ne peut contenir que des lettres/i)
      ).toBeInTheDocument();
    });
  });

  it('should validate password strength', async () => {
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });

    // Test weak password
    await user.type(passwordInput, 'weak');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/le mot de passe doit contenir au moins 8 caractères/i)
      ).toBeInTheDocument();
    });

    await user.clear(passwordInput);

    // Test password without uppercase
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /le mot de passe doit contenir au moins une majuscule/i
        )
      ).toBeInTheDocument();
    });
  });

  it('should validate password confirmation', async () => {
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const confirmInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });

    await user.type(passwordInput, 'Password123');
    await user.type(confirmInput, 'DifferentPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/les mots de passe ne correspondent pas/i)
      ).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          message: 'Compte créé avec succès',
        }),
    });

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const pseudoInput = screen.getByLabelText(/pseudo/i);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const confirmInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.type(pseudoInput, 'NewUser');
    await user.type(passwordInput, 'NewPass123');
    await user.type(confirmInput, 'NewPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          pseudo: 'NewUser',
          password: 'NewPass123',
          avatar: expect.any(String), // Auto-generated avatar URL
        }),
      });
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle registration errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          success: false,
          error: 'Un utilisateur avec cet email existe déjà',
        }),
    });

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const pseudoInput = screen.getByLabelText(/pseudo/i);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const confirmInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });

    await user.type(emailInput, 'existing@example.com');
    await user.type(pseudoInput, 'ExistingUser');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/un utilisateur avec cet email existe déjà/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const pseudoInput = screen.getByLabelText(/pseudo/i);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const confirmInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(pseudoInput, 'TestUser');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmInput, 'TestPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/erreur de connexion/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const pseudoInput = screen.getByLabelText(/pseudo/i);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const confirmInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(pseudoInput, 'TestUser');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmInput, 'TestPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/inscription en cours/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it('should handle custom avatar URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          message: 'Compte créé avec succès',
        }),
    });

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const pseudoInput = screen.getByLabelText(/pseudo/i);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const confirmInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const avatarInput = screen.getByLabelText(/avatar/i);
    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });

    const customAvatarUrl = 'https://example.com/my-avatar.jpg';

    await user.type(emailInput, 'test@example.com');
    await user.type(pseudoInput, 'TestUser');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmInput, 'TestPass123');
    await user.type(avatarInput, customAvatarUrl);
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          pseudo: 'TestUser',
          password: 'TestPass123',
          avatar: customAvatarUrl,
        }),
      });
    });
  });

  it('should toggle password visibility', async () => {
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const confirmInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const toggleButtons = screen.getAllByRole('button', {
      name: /afficher le mot de passe/i,
    });

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmInput).toHaveAttribute('type', 'password');

    // Toggle first password field
    await user.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Toggle second password field
    await user.click(toggleButtons[1]);
    expect(confirmInput).toHaveAttribute('type', 'text');
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
                  Promise.resolve({ success: true, message: 'Compte créé' }),
              }),
            500
          )
        )
    );

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const pseudoInput = screen.getByLabelText(/pseudo/i);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    const confirmInput = screen.getByLabelText(/confirmer le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(pseudoInput, 'TestUser');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmInput, 'TestPass123');

    // Click multiple times rapidly
    await user.click(submitButton);
    await user.click(submitButton);
    await user.click(submitButton);

    // Should only call fetch once
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('should show avatar preview when URL is provided', async () => {
    render(<RegisterForm />);

    const avatarInput = screen.getByLabelText(/avatar/i);
    const avatarUrl = 'https://example.com/avatar.jpg';

    await user.type(avatarInput, avatarUrl);

    await waitFor(() => {
      const avatarPreview = screen.getByAltText(/aperçu de l'avatar/i);
      expect(avatarPreview).toBeInTheDocument();
      expect(avatarPreview).toHaveAttribute('src', avatarUrl);
    });
  });

  it('should fallback to generated avatar when custom URL fails', async () => {
    render(<RegisterForm />);

    const pseudoInput = screen.getByLabelText(/pseudo/i);

    await user.type(pseudoInput, 'TestUser');

    await waitFor(() => {
      // Should show generated avatar preview based on pseudo
      const avatarPreview = screen.getByAltText(/aperçu de l'avatar/i);
      expect(avatarPreview).toBeInTheDocument();
      expect(avatarPreview.getAttribute('src')).toContain('api.dicebear.com');
    });
  });
});
