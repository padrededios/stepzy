import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  getAuthContext,
  requireAuth,
  requireAdmin,
  withOptionalAuth,
  hasRole,
  isAdmin,
  canAccessResource,
  checkUserRateLimit,
} from '@/lib/middleware/auth';

const prisma = new PrismaClient();

describe('Auth Middleware Tests', () => {
  let testUser: any;
  let adminUser: any;
  let testSession: any;
  let adminSession: any;

  beforeEach(async () => {
    // Nettoyer avant chaque test
    await prisma.verification.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.matchPlayer.deleteMany();
    await prisma.match.deleteMany();
    await prisma.user.deleteMany();

    // Créer des utilisateurs de test
    const hashedPassword = await bcrypt.hash('TestPass123', 12);

    testUser = await prisma.user.create({
      data: {
        email: 'middleware@example.com',
        password: hashedPassword,
        pseudo: 'MiddlewareUser',
        role: 'user',
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'middlewareadmin@example.com',
        password: hashedPassword,
        pseudo: 'MiddlewareAdmin',
        role: 'root',
      },
    });

    // Créer des sessions
    testSession = await prisma.session.create({
      data: {
        userId: testUser.id,
        token: 'middleware-session-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    adminSession = await prisma.session.create({
      data: {
        userId: adminUser.id,
        token: 'middleware-admin-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('getAuthContext', () => {
    it('should get auth context from cookie', async () => {
      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          Cookie: `futsal.session-token=${testSession.token}`,
        },
      });

      const context = await getAuthContext(request);

      expect(context.user).toBeTruthy();
      expect(context.user!.id).toBe(testUser.id);
      expect(context.user!.email).toBe(testUser.email);
      expect(context.user!.role).toBe('user');
      expect(context.session).toBeTruthy();
      expect(context.session!.token).toBe(testSession.token);
    });

    it('should get auth context from Authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          Authorization: `Bearer ${testSession.token}`,
        },
      });

      const context = await getAuthContext(request);

      expect(context.user).toBeTruthy();
      expect(context.user!.id).toBe(testUser.id);
      expect(context.session!.token).toBe(testSession.token);
    });

    it('should return null context for missing token', async () => {
      const request = new NextRequest('http://localhost:3000/test');

      const context = await getAuthContext(request);

      expect(context.user).toBeNull();
      expect(context.session).toBeNull();
    });

    it('should return null context for invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          Cookie: 'futsal.session-token=invalid-token',
        },
      });

      const context = await getAuthContext(request);

      expect(context.user).toBeNull();
      expect(context.session).toBeNull();
    });

    it('should handle expired sessions', async () => {
      // Créer une session expirée
      const expiredSession = await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'expired-token',
          expiresAt: new Date(Date.now() - 1000), // Expirée
        },
      });

      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          Cookie: `futsal.session-token=${expiredSession.token}`,
        },
      });

      const context = await getAuthContext(request);

      expect(context.user).toBeNull();
      expect(context.session).toBeNull();

      // Vérifier que la session expirée a été supprimée
      const deletedSession = await prisma.session.findUnique({
        where: { id: expiredSession.id },
      });
      expect(deletedSession).toBeNull();
    });
  });

  describe('requireAuth middleware', () => {
    it('should allow authenticated requests', async () => {
      const mockHandler = jest
        .fn()
        .mockResolvedValue(NextResponse.json({ success: true }));

      const request = new NextRequest('http://localhost:3000/protected', {
        headers: {
          Cookie: `futsal.session-token=${testSession.token}`,
        },
      });

      const response = await requireAuth(request, mockHandler);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockHandler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          user: expect.objectContaining({
            id: testUser.id,
            email: testUser.email,
          }),
          session: expect.any(Object),
        })
      );
    });

    it('should reject unauthenticated requests', async () => {
      const mockHandler = jest.fn();

      const request = new NextRequest('http://localhost:3000/protected');

      const response = await requireAuth(request, mockHandler);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
      expect(data.code).toBe('AUTHENTICATION_REQUIRED');
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin middleware', () => {
    it('should allow admin requests', async () => {
      const mockHandler = jest
        .fn()
        .mockResolvedValue(NextResponse.json({ success: true }));

      const request = new NextRequest('http://localhost:3000/admin', {
        headers: {
          Cookie: `futsal.session-token=${adminSession.token}`,
        },
      });

      const response = await requireAdmin(request, mockHandler);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockHandler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          user: expect.objectContaining({
            id: adminUser.id,
            role: 'root',
          }),
        })
      );
    });

    it('should reject non-admin authenticated requests', async () => {
      const mockHandler = jest.fn();

      const request = new NextRequest('http://localhost:3000/admin', {
        headers: {
          Cookie: `futsal.session-token=${testSession.token}`,
        },
      });

      const response = await requireAdmin(request, mockHandler);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('ADMIN_ACCESS_REQUIRED');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', async () => {
      const mockHandler = jest.fn();

      const request = new NextRequest('http://localhost:3000/admin');

      const response = await requireAdmin(request, mockHandler);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('withOptionalAuth middleware', () => {
    it('should provide auth context when available', async () => {
      const mockHandler = jest
        .fn()
        .mockResolvedValue(NextResponse.json({ success: true }));

      const request = new NextRequest('http://localhost:3000/optional', {
        headers: {
          Cookie: `futsal.session-token=${testSession.token}`,
        },
      });

      await withOptionalAuth(request, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          user: expect.objectContaining({
            id: testUser.id,
          }),
          session: expect.any(Object),
        })
      );
    });

    it('should provide null context when not authenticated', async () => {
      const mockHandler = jest
        .fn()
        .mockResolvedValue(NextResponse.json({ success: true }));

      const request = new NextRequest('http://localhost:3000/optional');

      await withOptionalAuth(request, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          user: null,
          session: null,
        })
      );
    });
  });

  describe('Role utilities', () => {
    it('should check user role correctly', () => {
      const user = {
        id: 'test',
        email: 'test@test.com',
        pseudo: 'Test',
        role: 'user' as const,
      };
      const admin = {
        id: 'admin',
        email: 'admin@test.com',
        pseudo: 'Admin',
        role: 'root' as const,
      };

      expect(hasRole(user, 'user')).toBe(true);
      expect(hasRole(user, 'root')).toBe(false);
      expect(hasRole(admin, 'root')).toBe(true);
      expect(hasRole(admin, 'user')).toBe(false);
      expect(hasRole(null, 'user')).toBe(false);
    });

    it('should identify admin users', () => {
      const user = {
        id: 'test',
        email: 'test@test.com',
        pseudo: 'Test',
        role: 'user' as const,
      };
      const admin = {
        id: 'admin',
        email: 'admin@test.com',
        pseudo: 'Admin',
        role: 'root' as const,
      };

      expect(isAdmin(user)).toBe(false);
      expect(isAdmin(admin)).toBe(true);
      expect(isAdmin(null)).toBe(false);
    });

    it('should check resource access permissions', () => {
      const user = {
        id: 'user-1',
        email: 'user@test.com',
        pseudo: 'User',
        role: 'user' as const,
      };
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        pseudo: 'Admin',
        role: 'root' as const,
      };

      // User can access own resources
      expect(canAccessResource(user, 'user-1')).toBe(true);
      expect(canAccessResource(user, 'other-user')).toBe(false);

      // Admin can access any resource
      expect(canAccessResource(admin, 'user-1')).toBe(true);
      expect(canAccessResource(admin, 'other-user')).toBe(true);

      // No user cannot access anything
      expect(canAccessResource(null, 'user-1')).toBe(false);
    });
  });

  describe('Rate limiting', () => {
    it('should allow requests under limit', () => {
      const userId = 'test-user';

      for (let i = 0; i < 5; i++) {
        expect(checkUserRateLimit(userId, 10, 60000)).toBe(true);
      }
    });

    it('should block requests over limit', () => {
      const userId = 'rate-limited-user';

      // Fill up the limit
      for (let i = 0; i < 5; i++) {
        expect(checkUserRateLimit(userId, 5, 60000)).toBe(true);
      }

      // This should be blocked
      expect(checkUserRateLimit(userId, 5, 60000)).toBe(false);
    });

    it('should reset rate limit after window', () => {
      const userId = 'reset-user';

      // Fill up the limit
      for (let i = 0; i < 3; i++) {
        expect(checkUserRateLimit(userId, 3, 100)).toBe(true); // 100ms window
      }

      // Should be blocked
      expect(checkUserRateLimit(userId, 3, 100)).toBe(false);

      // Wait for window to reset
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(checkUserRateLimit(userId, 3, 100)).toBe(true);
          resolve(true);
        }, 150);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully in getAuthContext', async () => {
      // Fermer la connexion pour simuler une erreur
      await prisma.$disconnect();

      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          Cookie: `futsal.session-token=${testSession.token}`,
        },
      });

      const context = await getAuthContext(request);

      // Should return null context instead of throwing
      expect(context.user).toBeNull();
      expect(context.session).toBeNull();
    });
  });
});
