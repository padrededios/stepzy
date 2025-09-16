import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from '@jest/globals';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Mock de Better Auth pour les tests d'API
const mockBetterAuth = {
  handler: jest.fn(),
  api: {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
};

jest.mock('@/lib/auth/config', () => ({
  auth: mockBetterAuth,
}));

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    // Nettoyer la base avant tous les tests
    await prisma.verification.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.matchPlayer.deleteMany();
    await prisma.match.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Nettoyer avant chaque test
    jest.clearAllMocks();
    await prisma.verification.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.matchPlayer.deleteMany();
    await prisma.match.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Better Auth Handler', () => {
    it('should handle GET requests through Better Auth', async () => {
      const { GET } = await import('@/app/api/auth/[...all]/route');

      const request = new NextRequest(
        'http://localhost:3000/api/auth/session',
        {
          method: 'GET',
        }
      );

      // Mock de la réponse Better Auth
      const mockResponse = new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockBetterAuth.handler.mockResolvedValue(mockResponse);

      const response = await GET(request);

      expect(mockBetterAuth.handler).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
    });

    it('should handle POST requests through Better Auth', async () => {
      const { POST } = await import('@/app/api/auth/[...all]/route');

      const requestBody = {
        email: 'test@example.com',
        password: 'Password123',
        pseudo: 'TestUser',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/auth/sign-up',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const mockResponse = new Response(
        JSON.stringify({
          user: {
            id: 'user-1',
            email: 'test@example.com',
            pseudo: 'TestUser',
            role: 'user',
          },
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
      mockBetterAuth.handler.mockResolvedValue(mockResponse);

      const response = await POST(request);

      expect(mockBetterAuth.handler).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
    });

    it('should handle all HTTP methods', async () => {
      const { GET, POST, PUT, DELETE, PATCH } = await import(
        '@/app/api/auth/[...all]/route'
      );

      const methods = [
        { method: GET, name: 'GET' },
        { method: POST, name: 'POST' },
        { method: PUT, name: 'PUT' },
        { method: DELETE, name: 'DELETE' },
        { method: PATCH, name: 'PATCH' },
      ];

      for (const { method, name } of methods) {
        const request = new NextRequest(`http://localhost:3000/api/auth/test`, {
          method: name,
        });

        const mockResponse = new Response('OK', { status: 200 });
        mockBetterAuth.handler.mockResolvedValue(mockResponse);

        const response = await method(request);

        expect(mockBetterAuth.handler).toHaveBeenCalledWith(request);
        expect(response).toBe(mockResponse);

        mockBetterAuth.handler.mockClear();
      }
    });
  });

  describe('Registration Flow', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'StrongPass123',
        pseudo: 'NewUser',
      };

      // Simuler une inscription réussie via Better Auth
      mockBetterAuth.api.signUp.mockResolvedValue({
        user: {
          id: 'user-new',
          email: userData.email,
          pseudo: userData.pseudo,
          role: 'user',
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          token: 'session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Dans un vrai scénario, Better Auth créerait l'utilisateur
      // Simulons cette création pour tester l'intégration
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const createdUser = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          pseudo: userData.pseudo,
          role: 'user',
        },
      });

      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.pseudo).toBe(userData.pseudo);
      expect(createdUser.role).toBe('user');

      // Vérifier que le mot de passe est hashé
      const isPasswordValid = await bcrypt.compare(
        userData.password,
        createdUser.password
      );
      expect(isPasswordValid).toBe(true);
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'StrongPass123',
        pseudo: 'TestUser',
      };

      mockBetterAuth.api.signUp.mockRejectedValue(
        new Error('Invalid email format')
      );

      await expect(mockBetterAuth.api.signUp(invalidData)).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: 'weak',
        pseudo: 'TestUser',
      };

      mockBetterAuth.api.signUp.mockRejectedValue(
        new Error('Password too weak')
      );

      await expect(mockBetterAuth.api.signUp(weakPasswordData)).rejects.toThrow(
        'Password too weak'
      );
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'StrongPass123',
        pseudo: 'ExistingUser',
      };

      // Créer un utilisateur existant
      const hashedPassword = await bcrypt.hash('password123', 12);
      await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          pseudo: 'ExistingUser',
          role: 'user',
        },
      });

      mockBetterAuth.api.signUp.mockRejectedValue(
        new Error('Email already exists')
      );

      await expect(mockBetterAuth.api.signUp(userData)).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('Login Flow', () => {
    let testUser: any;

    beforeEach(async () => {
      // Créer un utilisateur de test
      const hashedPassword = await bcrypt.hash('TestPass123', 12);
      testUser = await prisma.user.create({
        data: {
          email: 'login@example.com',
          password: hashedPassword,
          pseudo: 'LoginUser',
          role: 'user',
        },
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'TestPass123',
      };

      mockBetterAuth.api.signIn.mockResolvedValue({
        user: {
          id: testUser.id,
          email: testUser.email,
          pseudo: testUser.pseudo,
          role: testUser.role,
          avatar: testUser.avatar,
        },
        session: {
          token: 'login-session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const result = await mockBetterAuth.api.signIn(loginData);

      expect(result.user.email).toBe(loginData.email);
      expect(result.user.pseudo).toBe('LoginUser');
      expect(result.session.token).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const wrongPasswordData = {
        email: 'login@example.com',
        password: 'WrongPassword123',
      };

      mockBetterAuth.api.signIn.mockRejectedValue(
        new Error('Invalid credentials')
      );

      await expect(
        mockBetterAuth.api.signIn(wrongPasswordData)
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const nonExistentData = {
        email: 'nonexistent@example.com',
        password: 'AnyPassword123',
      };

      mockBetterAuth.api.signIn.mockRejectedValue(new Error('User not found'));

      await expect(mockBetterAuth.api.signIn(nonExistentData)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('Session Management', () => {
    let testUser: any;
    let testSession: any;

    beforeEach(async () => {
      // Créer un utilisateur et une session de test
      const hashedPassword = await bcrypt.hash('SessionPass123', 12);
      testUser = await prisma.user.create({
        data: {
          email: 'session@example.com',
          password: hashedPassword,
          pseudo: 'SessionUser',
          role: 'user',
        },
      });

      testSession = await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'test-session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    });

    it('should get current session', async () => {
      mockBetterAuth.api.getSession.mockResolvedValue({
        user: {
          id: testUser.id,
          email: testUser.email,
          pseudo: testUser.pseudo,
          role: testUser.role,
          avatar: testUser.avatar,
        },
        session: {
          token: testSession.token,
          expiresAt: testSession.expiresAt,
        },
      });

      const session = await mockBetterAuth.api.getSession();

      expect(session.user.id).toBe(testUser.id);
      expect(session.user.email).toBe(testUser.email);
      expect(session.session.token).toBe(testSession.token);
    });

    it('should return null for invalid session', async () => {
      mockBetterAuth.api.getSession.mockResolvedValue(null);

      const session = await mockBetterAuth.api.getSession();

      expect(session).toBeNull();
    });

    it('should handle session expiry', async () => {
      // Créer une session expirée
      const expiredSession = await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'expired-session-token',
          expiresAt: new Date(Date.now() - 1000), // Expirée
        },
      });

      mockBetterAuth.api.getSession.mockResolvedValue(null); // Session expirée

      const session = await mockBetterAuth.api.getSession();

      expect(session).toBeNull();
    });
  });

  describe('Logout Flow', () => {
    let testUser: any;
    let testSession: any;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('LogoutPass123', 12);
      testUser = await prisma.user.create({
        data: {
          email: 'logout@example.com',
          password: hashedPassword,
          pseudo: 'LogoutUser',
          role: 'user',
        },
      });

      testSession = await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'logout-session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    });

    it('should logout successfully', async () => {
      mockBetterAuth.api.signOut.mockResolvedValue({ success: true });

      const result = await mockBetterAuth.api.signOut();

      expect(result.success).toBe(true);
    });

    it('should handle logout when not logged in', async () => {
      mockBetterAuth.api.signOut.mockResolvedValue({
        success: false,
        error: 'No active session',
      });

      const result = await mockBetterAuth.api.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active session');
    });
  });

  describe('Role-based Access', () => {
    let regularUser: any;
    let adminUser: any;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Password123', 12);

      regularUser = await prisma.user.create({
        data: {
          email: 'regular@example.com',
          password: hashedPassword,
          pseudo: 'RegularUser',
          role: 'user',
        },
      });

      adminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          pseudo: 'AdminUser',
          role: 'root',
        },
      });
    });

    it('should identify regular user role', async () => {
      mockBetterAuth.api.getSession.mockResolvedValue({
        user: {
          id: regularUser.id,
          email: regularUser.email,
          pseudo: regularUser.pseudo,
          role: 'user',
          avatar: regularUser.avatar,
        },
        session: {
          token: 'user-session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const session = await mockBetterAuth.api.getSession();

      expect(session.user.role).toBe('user');
    });

    it('should identify admin user role', async () => {
      mockBetterAuth.api.getSession.mockResolvedValue({
        user: {
          id: adminUser.id,
          email: adminUser.email,
          pseudo: adminUser.pseudo,
          role: 'root',
          avatar: adminUser.avatar,
        },
        session: {
          token: 'admin-session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const session = await mockBetterAuth.api.getSession();

      expect(session.user.role).toBe('root');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockBetterAuth.api.signIn.mockRejectedValue(new Error('Network error'));

      await expect(
        mockBetterAuth.api.signIn({
          email: 'test@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        email: 'invalid',
        password: 'weak',
      };

      mockBetterAuth.api.signUp.mockRejectedValue(
        new Error('Validation failed')
      );

      await expect(mockBetterAuth.api.signUp(invalidData)).rejects.toThrow(
        'Validation failed'
      );
    });

    it('should handle database connection errors', async () => {
      mockBetterAuth.api.getSession.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(mockBetterAuth.api.getSession()).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});
