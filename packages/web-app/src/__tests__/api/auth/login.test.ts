import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('/api/auth/login API Tests', () => {
  let testUser: any;

  beforeEach(async () => {
    // Nettoyer avant chaque test
    await prisma.verification.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.matchPlayer.deleteMany();
    await prisma.match.deleteMany();
    await prisma.user.deleteMany();

    // Créer un utilisateur de test
    const hashedPassword = await bcrypt.hash('TestPassword123', 12);
    testUser = await prisma.user.create({
      data: {
        email: 'testlogin@example.com',
        password: hashedPassword,
        pseudo: 'LoginTestUser',
        role: 'user',
        avatar: 'https://example.com/avatar.jpg',
      },
    });
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const validCredentials = {
        email: 'testlogin@example.com',
        password: 'TestPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validCredentials),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(
        expect.objectContaining({
          email: validCredentials.email,
          pseudo: 'LoginTestUser',
          role: 'user',
        })
      );
      expect(data.user.password).toBeUndefined(); // Password should not be returned
      expect(data.token).toBeDefined();
      expect(data.expiresAt).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const invalidEmail = {
        email: 'nonexistent@example.com',
        password: 'AnyPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(invalidEmail),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email ou mot de passe incorrect');
    });

    it('should reject invalid password', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const wrongPassword = {
        email: 'testlogin@example.com',
        password: 'WrongPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(wrongPassword),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email ou mot de passe incorrect');
    });

    it('should handle missing email', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const missingEmail = {
        password: 'TestPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(missingEmail),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Email');
    });

    it('should handle missing password', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const missingPassword = {
        email: 'testlogin@example.com',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(missingPassword),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('mot de passe');
    });

    it('should validate email format', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const invalidEmailFormat = {
        email: 'invalid-email',
        password: 'TestPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(invalidEmailFormat),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Format d'email invalide");
    });

    it('should be case insensitive for email', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const uppercaseEmail = {
        email: 'TESTLOGIN@EXAMPLE.COM',
        password: 'TestPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(uppercaseEmail),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('testlogin@example.com'); // Should be normalized
    });

    it('should handle invalid JSON payload', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('JSON');
    });

    it('should create session after successful login', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const validCredentials = {
        email: 'testlogin@example.com',
        password: 'TestPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validCredentials),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.token).toBeDefined();

      // Vérifier que la session a été créée en base
      const session = await prisma.session.findFirst({
        where: { userId: testUser.id },
      });
      expect(session).toBeTruthy();
      expect(session!.token).toBe(data.token);
    });

    it('should handle rate limiting', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const credentials = {
        email: 'testlogin@example.com',
        password: 'WrongPassword123', // Intentionally wrong
      };

      // Faire plusieurs tentatives avec le même IP
      const requests = Array(6)
        .fill(null)
        .map(() => {
          const request = new NextRequest(
            'http://localhost:3000/api/auth/login',
            {
              method: 'POST',
              body: JSON.stringify(credentials),
              headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': '192.168.1.100', // Même IP
              },
            }
          );
          return POST(request);
        });

      const responses = await Promise.all(requests);

      // Les dernières requêtes doivent être rate limitées
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should handle database errors gracefully', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      // Fermer la connexion pour simuler une erreur DB
      await prisma.$disconnect();

      const validCredentials = {
        email: 'testlogin@example.com',
        password: 'TestPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validCredentials),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('erreur');
    });

    it('should differentiate between user and admin roles', async () => {
      // Créer un utilisateur admin
      const hashedPassword = await bcrypt.hash('AdminPass123', 12);
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          pseudo: 'AdminUser',
          role: 'root',
        },
      });

      const { POST } = await import('@/app/api/auth/login/route');

      const adminCredentials = {
        email: 'admin@example.com',
        password: 'AdminPass123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(adminCredentials),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.role).toBe('root');
      expect(data.redirectUrl).toBe('/admin'); // Admin should be redirected to admin panel
    });

    it('should provide correct redirect URL for regular users', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const validCredentials = {
        email: 'testlogin@example.com',
        password: 'TestPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validCredentials),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.redirectUrl).toBe('/dashboard'); // Regular user should go to dashboard
    });

    it('should sanitize user input to prevent injection', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const maliciousInput = {
        email: "test@example.com'; DROP TABLE users; --",
        password: 'TestPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(maliciousInput),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      // Should handle safely without crashing
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Method validation', () => {
    it('should reject non-POST requests', async () => {
      const { GET } = await import('@/app/api/auth/login/route').catch(() => ({
        GET: undefined,
      }));

      if (GET) {
        const request = new NextRequest('http://localhost:3000/api/auth/login');
        const response = await GET(request);

        expect(response.status).toBe(405);

        const data = await response.json();
        expect(data.error).toBe('Method not allowed');
      }
    });
  });
});
