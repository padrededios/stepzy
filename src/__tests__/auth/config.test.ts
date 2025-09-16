import { describe, it, expect, jest } from '@jest/globals';

// Mock Better Auth avant l'import
jest.mock('better-auth', () => ({
  betterAuth: jest.fn(() => ({
    handler: jest.fn(),
    api: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
  })),
}));

describe('Auth Configuration Tests', () => {
  describe('Better Auth Setup', () => {
    it('should configure Better Auth with correct providers', async () => {
      // Mock de la configuration auth
      const mockConfig = {
        database: expect.objectContaining({
          provider: 'prisma',
        }),
        emailAndPassword: expect.objectContaining({
          enabled: true,
        }),
        session: expect.objectContaining({
          expiresIn: expect.any(Number),
          updateAge: expect.any(Number),
        }),
        user: expect.objectContaining({
          additionalFields: expect.objectContaining({
            pseudo: expect.any(Object),
            avatar: expect.any(Object),
            role: expect.any(Object),
          }),
        }),
      };

      // Dynamically import to ensure mock is applied
      const { authConfig } = await import('@/lib/auth/config');

      expect(authConfig).toBeDefined();
      // Vérifier que la configuration contient les éléments essentiels
      expect(authConfig).toEqual(
        expect.objectContaining({
          database: expect.any(Object),
          plugins: expect.arrayContaining([
            expect.any(Object), // emailAndPassword plugin
          ]),
        })
      );
    });

    it('should validate required environment variables', () => {
      const requiredEnvVars = [
        'BETTER_AUTH_SECRET',
        'BETTER_AUTH_URL',
        'DATABASE_URL',
      ];

      requiredEnvVars.forEach((envVar) => {
        expect(process.env[envVar]).toBeDefined();
      });
    });

    it('should have secure session configuration', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      // Vérifier la sécurité des sessions
      expect(authConfig.session).toEqual(
        expect.objectContaining({
          expiresIn: expect.any(Number),
          updateAge: expect.any(Number),
        })
      );

      // Vérifier que l'expiration n'est pas trop longue (max 7 jours)
      const maxExpiration = 7 * 24 * 60 * 60; // 7 jours en secondes
      expect(authConfig.session.expiresIn).toBeLessThanOrEqual(maxExpiration);
    });
  });

  describe('User Model Integration', () => {
    it('should configure additional fields for User model', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      expect(authConfig.user.additionalFields).toEqual(
        expect.objectContaining({
          pseudo: expect.objectContaining({
            type: 'string',
            required: true,
          }),
          avatar: expect.objectContaining({
            type: 'string',
            required: false,
          }),
          role: expect.objectContaining({
            type: 'string',
            defaultValue: 'user',
          }),
        })
      );
    });
  });

  describe('Database Integration', () => {
    it('should configure Prisma adapter correctly', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      expect(authConfig.database).toEqual(
        expect.objectContaining({
          provider: 'prisma',
          url: process.env.DATABASE_URL,
        })
      );
    });
  });

  describe('Security Configuration', () => {
    it('should have strong password requirements', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      // Vérifier les règles de mot de passe
      const emailPasswordPlugin = authConfig.plugins.find(
        (plugin: any) => plugin.id === 'email-password'
      );

      expect(emailPasswordPlugin).toBeDefined();
      expect(emailPasswordPlugin.password).toEqual(
        expect.objectContaining({
          minLength: expect.any(Number),
          requireUppercase: expect.any(Boolean),
          requireNumbers: expect.any(Boolean),
        })
      );
    });

    it('should configure secure cookies', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      expect(authConfig.session.cookieCache).toEqual(
        expect.objectContaining({
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          sameSite: 'lax',
        })
      );
    });
  });

  describe('Role-based Access', () => {
    it('should support user and root roles', async () => {
      const { authConfig } = await import('@/lib/auth/config');

      const roleField = authConfig.user.additionalFields.role;
      expect(roleField.type).toBe('string');
      expect(roleField.defaultValue).toBe('user');
    });
  });
});
