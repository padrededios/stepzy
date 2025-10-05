import { describe, it, expect, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';

// Mock Better Auth avant l'import
const mockSession = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    pseudo: 'TestUser',
    role: 'user',
  },
  session: {
    token: 'session-token',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
};

jest.mock('@/lib/auth/config', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

describe('Auth Utils Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Password Utilities', () => {
    it('should hash password correctly', async () => {
      const { hashPassword } = await import('@/lib/auth/validators');

      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$/);

      // Vérifier que le hash est valide
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should verify password correctly', async () => {
      const { verifyPassword } = await import('@/lib/auth/validators');

      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('wrongPassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });

    it('should validate password strength', async () => {
      const { validatePasswordStrength } = await import(
        '@/lib/auth/validators'
      );

      // Mot de passe valide
      expect(validatePasswordStrength('StrongPass123!')).toEqual({
        isValid: true,
        errors: [],
      });

      // Mot de passe trop court
      expect(validatePasswordStrength('abc')).toEqual({
        isValid: false,
        errors: expect.arrayContaining([
          'Le mot de passe doit contenir au moins 8 caractères',
        ]),
      });

      // Mot de passe sans majuscule
      expect(validatePasswordStrength('password123')).toEqual({
        isValid: false,
        errors: expect.arrayContaining([
          'Le mot de passe doit contenir au moins une majuscule',
        ]),
      });

      // Mot de passe sans chiffre
      expect(validatePasswordStrength('Password')).toEqual({
        isValid: false,
        errors: expect.arrayContaining([
          'Le mot de passe doit contenir au moins un chiffre',
        ]),
      });
    });
  });

  describe('Session Management', () => {
    it('should get current session', async () => {
      const { getCurrentSession } = await import('@/lib/auth/utils');
      const { auth } = await import('@/lib/auth/config');

      (auth.api.getSession as jest.Mock).mockResolvedValue(mockSession);

      const session = await getCurrentSession();

      expect(session).toEqual(mockSession);
      expect(auth.api.getSession).toHaveBeenCalled();
    });

    it('should check if user is authenticated', async () => {
      const { isAuthenticated } = await import('@/lib/auth/utils');
      const { auth } = await import('@/lib/auth/config');

      // Utilisateur connecté
      (auth.api.getSession as jest.Mock).mockResolvedValue(mockSession);
      expect(await isAuthenticated()).toBe(true);

      // Utilisateur non connecté
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      expect(await isAuthenticated()).toBe(false);
    });

    it('should check user role correctly', async () => {
      const { hasRole, isAdmin } = await import('@/lib/auth/utils');
      const { auth } = await import('@/lib/auth/config');

      // Utilisateur normal
      (auth.api.getSession as jest.Mock).mockResolvedValue(mockSession);
      expect(await hasRole('user')).toBe(true);
      expect(await hasRole('root')).toBe(false);
      expect(await isAdmin()).toBe(false);

      // Utilisateur admin
      const adminSession = {
        ...mockSession,
        user: { ...mockSession.user, role: 'root' },
      };
      (auth.api.getSession as jest.Mock).mockResolvedValue(adminSession);
      expect(await hasRole('root')).toBe(true);
      expect(await isAdmin()).toBe(true);
    });

    it('should require authentication', async () => {
      const { requireAuth } = await import('@/lib/auth/utils');
      const { auth } = await import('@/lib/auth/config');

      // Avec session
      (auth.api.getSession as jest.Mock).mockResolvedValue(mockSession);
      const session = await requireAuth();
      expect(session).toEqual(mockSession);

      // Sans session
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(requireAuth()).rejects.toThrow('Authentication required');
    });

    it('should require admin role', async () => {
      const { requireAdmin } = await import('@/lib/auth/utils');
      const { auth } = await import('@/lib/auth/config');

      // Utilisateur admin
      const adminSession = {
        ...mockSession,
        user: { ...mockSession.user, role: 'root' },
      };
      (auth.api.getSession as jest.Mock).mockResolvedValue(adminSession);
      const session = await requireAdmin();
      expect(session).toEqual(adminSession);

      // Utilisateur normal
      (auth.api.getSession as jest.Mock).mockResolvedValue(mockSession);
      await expect(requireAdmin()).rejects.toThrow('Admin access required');

      // Sans session
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      await expect(requireAdmin()).rejects.toThrow('Authentication required');
    });
  });

  describe('User Validation', () => {
    it('should validate email format', async () => {
      const { validateEmail } = await import('@/lib/auth/validators');

      expect(validateEmail('valid@example.com')).toBe(true);
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);

      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@invalid.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should validate pseudo format', async () => {
      const { validatePseudo } = await import('@/lib/auth/validators');

      expect(validatePseudo('ValidPseudo')).toBe(true);
      expect(validatePseudo('User123')).toBe(true);
      expect(validatePseudo('Test_User')).toBe(true);

      expect(validatePseudo('')).toBe(false);
      expect(validatePseudo('ab')).toBe(false); // Trop court
      expect(validatePseudo('a'.repeat(31))).toBe(false); // Trop long
      expect(validatePseudo('user with spaces')).toBe(false);
      expect(validatePseudo('user@invalid')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should format auth errors correctly', async () => {
      const { formatAuthError } = await import('@/lib/auth/validators');

      expect(formatAuthError('INVALID_CREDENTIALS')).toBe(
        'Email ou mot de passe incorrect'
      );

      expect(formatAuthError('EMAIL_ALREADY_EXISTS')).toBe(
        'Un compte avec cet email existe déjà'
      );

      expect(formatAuthError('WEAK_PASSWORD')).toBe(
        'Le mot de passe ne respecte pas les critères de sécurité'
      );

      expect(formatAuthError('UNKNOWN_ERROR')).toBe(
        "Une erreur inattendue s'est produite"
      );
    });
  });

  describe('Avatar Generation', () => {
    it('should generate avatar URL from pseudo', async () => {
      const { generateAvatarUrl } = await import('@/lib/auth/validators');

      const avatarUrl = generateAvatarUrl('TestUser');

      expect(avatarUrl).toContain('dicebear.com');
      expect(avatarUrl).toContain('TestUser');
      expect(avatarUrl).toContain('/svg');
    });

    it('should handle special characters in pseudo for avatar', async () => {
      const { generateAvatarUrl } = await import('@/lib/auth/validators');

      const avatarUrl = generateAvatarUrl('Test User 123!');

      expect(avatarUrl).toBeDefined();
      expect(avatarUrl).toContain('dicebear.com');
    });
  });

  describe('Utility Functions', () => {
    it('should sanitize user data by removing password', async () => {
      const { sanitizeUserData } = await import('@/lib/auth/validators');

      const userData = {
        id: 'user-1',
        email: 'test@example.com',
        pseudo: 'TestUser',
        password: 'secret123',
        role: 'user',
      };

      const sanitized = sanitizeUserData(userData);

      expect(sanitized).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        pseudo: 'TestUser',
        role: 'user',
      });

      expect(sanitized).not.toHaveProperty('password');
    });

    it('should get redirect URL based on role', async () => {
      const { getRedirectUrl } = await import('@/lib/auth/utils');

      // Admin redirect
      expect(getRedirectUrl('root')).toBe('/admin');

      // User redirect
      expect(getRedirectUrl('user')).toBe('/dashboard');

      // With return URL
      expect(getRedirectUrl('user', '/matches')).toBe('/matches');

      // Invalid return URL (potential XSS)
      expect(getRedirectUrl('user', '//evil.com')).toBe('/dashboard');
      expect(getRedirectUrl('user', 'https://evil.com')).toBe('/dashboard');
    });
  });
});
