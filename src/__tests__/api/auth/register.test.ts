import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('/api/auth/register API Tests', () => {
  beforeEach(async () => {
    // Nettoyer avant chaque test
    await prisma.verification.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.matchPlayer.deleteMany();
    await prisma.match.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const validData = {
        email: 'newplayer@example.com',
        password: 'StrongPass123',
        pseudo: 'NewPlayer',
        avatar: 'https://example.com/avatar.jpg',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(validData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(
        expect.objectContaining({
          email: validData.email,
          pseudo: validData.pseudo,
          role: 'user',
        })
      );
      expect(data.user.password).toBeUndefined(); // Password should not be returned

      // Vérifier que l'utilisateur a été créé en base
      const createdUser = await prisma.user.findUnique({
        where: { email: validData.email },
      });
      expect(createdUser).toBeTruthy();
      expect(createdUser!.pseudo).toBe(validData.pseudo);
    });

    it('should generate avatar automatically if not provided', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const dataWithoutAvatar = {
        email: 'noavatar@example.com',
        password: 'StrongPass123',
        pseudo: 'NoAvatarUser',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(dataWithoutAvatar),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.avatar).toContain('dicebear.com');
      expect(data.user.avatar).toContain('NoAvatarUser');
    });

    it('should reject invalid email format', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const invalidEmailData = {
        email: 'invalid-email',
        password: 'StrongPass123',
        pseudo: 'TestUser',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(invalidEmailData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Format d'email invalide");
    });

    it('should reject weak passwords', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const weakPasswordData = {
        email: 'test@example.com',
        password: 'weak',
        pseudo: 'TestUser',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(weakPasswordData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Le mot de passe');
    });

    it('should reject invalid pseudo format', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const invalidPseudoData = {
        email: 'test@example.com',
        password: 'StrongPass123',
        pseudo: 'ab', // Too short
      };

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(invalidPseudoData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('pseudo');
    });

    it('should reject duplicate email', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      // Créer un utilisateur existant
      await prisma.user.create({
        data: {
          email: 'existing@example.com',
          password: 'hashedpassword',
          pseudo: 'ExistingUser',
          role: 'user',
        },
      });

      const duplicateEmailData = {
        email: 'existing@example.com',
        password: 'StrongPass123',
        pseudo: 'NewUser',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(duplicateEmailData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Un compte avec cet email existe déjà');
    });

    it('should handle missing required fields', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const incompleteData = {
        email: 'test@example.com',
        // Missing password and pseudo
      };

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(incompleteData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('mot de passe'),
          expect.stringContaining('pseudo'),
        ])
      );
    });

    it('should handle invalid JSON payload', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          body: 'invalid-json',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('JSON');
    });

    it('should handle database connection errors', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      // Fermer la connexion Prisma pour simuler une erreur
      await prisma.$disconnect();

      const validData = {
        email: 'test@example.com',
        password: 'StrongPass123',
        pseudo: 'TestUser',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(validData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('erreur');
    });

    it('should return rate limit error when called too frequently', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const validData = {
        email: 'ratelimit@example.com',
        password: 'StrongPass123',
        pseudo: 'RateLimitUser',
      };

      // Simuler plusieurs requêtes rapidement
      const requests = Array(5)
        .fill(null)
        .map((_, i) => {
          const request = new NextRequest(
            'http://localhost:3000/api/auth/register',
            {
              method: 'POST',
              body: JSON.stringify({
                ...validData,
                email: `ratelimit${i}@example.com`,
              }),
              headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': '192.168.1.1', // Même IP
              },
            }
          );
          return POST(request);
        });

      const responses = await Promise.all(requests);

      // Au moins une réponse devrait être rate limitée
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should sanitize user input to prevent XSS', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const xssData = {
        email: 'xss@example.com',
        password: 'StrongPass123',
        pseudo: '<script>alert("xss")</script>User',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(xssData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);

      // Should reject malicious pseudo
      expect(response.status).toBe(400);
    });
  });

  describe('Method validation', () => {
    it('should reject non-POST requests', async () => {
      const { GET } = await import('@/app/api/auth/register/route').catch(
        () => ({ GET: undefined })
      );

      if (GET) {
        const request = new NextRequest(
          'http://localhost:3000/api/auth/register'
        );
        const response = await GET(request);

        expect(response.status).toBe(405);

        const data = await response.json();
        expect(data.error).toBe('Method not allowed');
      }
    });
  });
});
