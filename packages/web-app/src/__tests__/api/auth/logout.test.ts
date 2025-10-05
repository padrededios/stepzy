import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('/api/auth/logout API Tests', () => {
  let testUser: any;
  let testSession: any;

  beforeEach(async () => {
    // Nettoyer avant chaque test
    await prisma.verification.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.matchPlayer.deleteMany();
    await prisma.match.deleteMany();
    await prisma.user.deleteMany();

    // Créer un utilisateur et une session de test
    const hashedPassword = await bcrypt.hash('LogoutTest123', 12);
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
        token: 'test-session-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        ipAddress: '192.168.1.1',
        userAgent: 'Test User Agent',
      },
    });
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid session token', async () => {
      const { POST } = await import('@/app/api/auth/logout/route');

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `futsal.session-token=${testSession.token}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Déconnexion réussie');

      // Vérifier que la session a été supprimée de la base
      const deletedSession = await prisma.session.findUnique({
        where: { id: testSession.id },
      });
      expect(deletedSession).toBeNull();

      // Vérifier que le cookie a été supprimé
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('futsal.session-token=');
      expect(cookies).toContain('Max-Age=0');
    });

    it('should handle logout with session token in Authorization header', async () => {
      const { POST } = await import('@/app/api/auth/logout/route');

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testSession.token}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Vérifier que la session a été supprimée
      const deletedSession = await prisma.session.findUnique({
        where: { token: testSession.token },
      });
      expect(deletedSession).toBeNull();
    });

    it('should handle logout with no active session gracefully', async () => {
      const { POST } = await import('@/app/api/auth/logout/route');

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // No session token provided
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200); // Still success, no error for missing session
      expect(data.success).toBe(true);
      expect(data.message).toContain('Aucune session active');
    });

    it('should handle invalid session token', async () => {
      const { POST } = await import('@/app/api/auth/logout/route');

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'futsal.session-token=invalid-token-123',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Aucune session active');
    });

    it('should handle expired session token', async () => {
      // Créer une session expirée
      const expiredSession = await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'expired-token-123',
          expiresAt: new Date(Date.now() - 1000), // Expirée
          ipAddress: '192.168.1.1',
        },
      });

      const { POST } = await import('@/app/api/auth/logout/route');

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `futsal.session-token=${expiredSession.token}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // La session expirée doit quand même être nettoyée
      const deletedExpiredSession = await prisma.session.findUnique({
        where: { id: expiredSession.id },
      });
      expect(deletedExpiredSession).toBeNull();
    });

    it('should logout from all devices when requested', async () => {
      // Créer plusieurs sessions pour le même utilisateur
      const session2 = await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'test-session-token-456',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          ipAddress: '192.168.1.2',
        },
      });

      const { POST } = await import('@/app/api/auth/logout/route');

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ logoutFromAllDevices: true }),
        headers: {
          'Content-Type': 'application/json',
          Cookie: `futsal.session-token=${testSession.token}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('tous les appareils');

      // Vérifier que toutes les sessions de l'utilisateur ont été supprimées
      const remainingSessions = await prisma.session.findMany({
        where: { userId: testUser.id },
      });
      expect(remainingSessions).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      const { POST } = await import('@/app/api/auth/logout/route');

      // Fermer la connexion pour simuler une erreur DB
      await prisma.$disconnect();

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `futsal.session-token=${testSession.token}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('erreur');
    });

    it('should clean up expired sessions during logout', async () => {
      // Créer des sessions expirées
      await prisma.session.createMany({
        data: [
          {
            userId: testUser.id,
            token: 'expired-1',
            expiresAt: new Date(Date.now() - 60000),
            ipAddress: '192.168.1.3',
          },
          {
            userId: testUser.id,
            token: 'expired-2',
            expiresAt: new Date(Date.now() - 120000),
            ipAddress: '192.168.1.4',
          },
        ],
      });

      const { POST } = await import('@/app/api/auth/logout/route');

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `futsal.session-token=${testSession.token}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Vérifier que les sessions expirées ont été nettoyées
      const expiredSessions = await prisma.session.findMany({
        where: {
          userId: testUser.id,
          expiresAt: { lt: new Date() },
        },
      });
      expect(expiredSessions).toHaveLength(0);
    });

    it('should handle malformed cookie gracefully', async () => {
      const { POST } = await import('@/app/api/auth/logout/route');

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie:
            'futsal.session-token=malformed-cookie-data-with-special-chars-!@#$%',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Aucune session active');
    });

    it('should handle JSON parsing errors', async () => {
      const { POST } = await import('@/app/api/auth/logout/route');

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        body: 'invalid-json-data',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `futsal.session-token=${testSession.token}`,
        },
      });

      const response = await POST(request);

      // Should still logout successfully even with malformed body
      expect(response.status).toBe(200);
    });

    it('should include user info in logout response for audit', async () => {
      const { POST } = await import('@/app/api/auth/logout/route');

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `futsal.session-token=${testSession.token}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(
        expect.objectContaining({
          pseudo: testUser.pseudo,
          email: testUser.email,
        })
      );
      expect(data.user.password).toBeUndefined();
    });
  });

  describe('Method validation', () => {
    it('should reject non-POST requests', async () => {
      const { GET } = await import('@/app/api/auth/logout/route').catch(() => ({
        GET: undefined,
      }));

      if (GET) {
        const request = new NextRequest(
          'http://localhost:3000/api/auth/logout'
        );
        const response = await GET(request);

        expect(response.status).toBe(405);

        const data = await response.json();
        expect(data.error).toBe('Method not allowed');
      }
    });
  });
});
