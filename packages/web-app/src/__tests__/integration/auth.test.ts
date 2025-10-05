import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Authentication Integration Tests', () => {
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
    await prisma.verification.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.matchPlayer.deleteMany();
    await prisma.match.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('User Registration Flow', () => {
    it('should create user with hashed password and additional fields', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: await bcrypt.hash('Password123', 10),
        pseudo: 'NewUser',
        avatar: 'https://example.com/avatar.jpg',
        role: 'user',
      };

      const user = await prisma.user.create({
        data: userData,
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.pseudo).toBe(userData.pseudo);
      expect(user.avatar).toBe(userData.avatar);
      expect(user.role).toBe('user');
      expect(user.password).toBe(userData.password);

      // Vérifier que le mot de passe est bien hashé
      expect(user.password).not.toBe('Password123');
      const isPasswordValid = await bcrypt.compare(
        'Password123',
        user.password
      );
      expect(isPasswordValid).toBe(true);
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: await bcrypt.hash('Password123', 10),
        pseudo: 'User1',
        role: 'user',
      };

      // Créer le premier utilisateur
      await prisma.user.create({ data: userData });

      // Tentative de création avec le même email
      await expect(
        prisma.user.create({
          data: {
            ...userData,
            pseudo: 'User2',
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce unique pseudo constraint if it exists', async () => {
      const baseData = {
        password: await bcrypt.hash('Password123', 10),
        role: 'user',
      };

      // Créer le premier utilisateur
      await prisma.user.create({
        data: {
          ...baseData,
          email: 'user1@example.com',
          pseudo: 'UniqueUser',
        },
      });

      // Different email but same pseudo should work (no unique constraint on pseudo)
      const user2 = await prisma.user.create({
        data: {
          ...baseData,
          email: 'user2@example.com',
          pseudo: 'UniqueUser', // Same pseudo
        },
      });

      expect(user2).toBeDefined();
      expect(user2.pseudo).toBe('UniqueUser');
    });

    it('should create user with default values', async () => {
      const userData = {
        email: 'default@example.com',
        password: await bcrypt.hash('Password123', 10),
        pseudo: 'DefaultUser',
        // role should default to 'user'
        // avatar should default to null
      };

      const user = await prisma.user.create({
        data: userData,
      });

      expect(user.role).toBe('user');
      expect(user.avatar).toBeNull();
    });
  });

  describe('User Authentication Flow', () => {
    let testUser: any;

    beforeEach(async () => {
      // Créer un utilisateur de test
      testUser = await prisma.user.create({
        data: {
          email: 'authtest@example.com',
          password: await bcrypt.hash('TestPassword123', 10),
          pseudo: 'AuthTestUser',
          role: 'user',
        },
      });
    });

    it('should authenticate user with correct credentials', async () => {
      const foundUser = await prisma.user.findUnique({
        where: { email: 'authtest@example.com' },
      });

      expect(foundUser).toBeTruthy();
      expect(foundUser!.email).toBe('authtest@example.com');

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(
        'TestPassword123',
        foundUser!.password
      );
      expect(isPasswordValid).toBe(true);
    });

    it('should reject authentication with wrong password', async () => {
      const foundUser = await prisma.user.findUnique({
        where: { email: 'authtest@example.com' },
      });

      expect(foundUser).toBeTruthy();

      // Vérifier avec un mauvais mot de passe
      const isPasswordValid = await bcrypt.compare(
        'WrongPassword',
        foundUser!.password
      );
      expect(isPasswordValid).toBe(false);
    });

    it('should not find non-existent user', async () => {
      const foundUser = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      expect(foundUser).toBeNull();
    });
  });

  describe('Role-based Access', () => {
    let regularUser: any;
    let adminUser: any;

    beforeEach(async () => {
      regularUser = await prisma.user.create({
        data: {
          email: 'regular@example.com',
          password: await bcrypt.hash('Password123', 10),
          pseudo: 'RegularUser',
          role: 'user',
        },
      });

      adminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: await bcrypt.hash('AdminPass123', 10),
          pseudo: 'AdminUser',
          role: 'root',
        },
      });
    });

    it('should differentiate between user roles', async () => {
      expect(regularUser.role).toBe('user');
      expect(adminUser.role).toBe('root');
    });

    it('should allow querying users by role', async () => {
      const users = await prisma.user.findMany({
        where: { role: 'user' },
      });

      const admins = await prisma.user.findMany({
        where: { role: 'root' },
      });

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('regular@example.com');

      expect(admins).toHaveLength(1);
      expect(admins[0].email).toBe('admin@example.com');
    });
  });

  describe('Session Management', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'session@example.com',
          password: await bcrypt.hash('SessionPass123', 10),
          pseudo: 'SessionUser',
          role: 'user',
        },
      });
    });

    it('should create session for authenticated user', async () => {
      const sessionData = {
        userId: testUser.id,
        token: 'session-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      };

      const session = await prisma.session.create({
        data: sessionData,
      });

      expect(session.userId).toBe(testUser.id);
      expect(session.token).toBe(sessionData.token);
      expect(session.expiresAt).toEqual(sessionData.expiresAt);
    });

    it('should link session to user', async () => {
      const sessionData = {
        userId: testUser.id,
        token: 'session-token-456',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      await prisma.session.create({
        data: sessionData,
      });

      const sessionWithUser = await prisma.session.findFirst({
        where: { token: 'session-token-456' },
        include: { user: true },
      });

      expect(sessionWithUser).toBeTruthy();
      expect(sessionWithUser!.user.email).toBe('session@example.com');
      expect(sessionWithUser!.user.pseudo).toBe('SessionUser');
    });

    it('should delete expired sessions', async () => {
      // Créer une session expirée
      const expiredSession = await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'expired-token',
          expiresAt: new Date(Date.now() - 1000), // Expirée depuis 1 seconde
        },
      });

      // Supprimer les sessions expirées
      const deletedSessions = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      expect(deletedSessions.count).toBe(1);

      // Vérifier que la session a été supprimée
      const foundSession = await prisma.session.findUnique({
        where: { id: expiredSession.id },
      });

      expect(foundSession).toBeNull();
    });
  });

  describe('Account Management', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'account@example.com',
          password: await bcrypt.hash('AccountPass123', 10),
          pseudo: 'AccountUser',
          role: 'user',
        },
      });
    });

    it('should update user profile information', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: {
          pseudo: 'UpdatedPseudo',
          avatar: 'https://new-avatar.com/image.jpg',
        },
      });

      expect(updatedUser.pseudo).toBe('UpdatedPseudo');
      expect(updatedUser.avatar).toBe('https://new-avatar.com/image.jpg');
      expect(updatedUser.email).toBe('account@example.com'); // Should remain unchanged
    });

    it('should update user password', async () => {
      const newPassword = await bcrypt.hash('NewPassword123', 10);

      await prisma.user.update({
        where: { id: testUser.id },
        data: { password: newPassword },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });

      expect(updatedUser).toBeTruthy();

      // Vérifier que l'ancien mot de passe ne fonctionne plus
      const oldPasswordValid = await bcrypt.compare(
        'AccountPass123',
        updatedUser!.password
      );
      expect(oldPasswordValid).toBe(false);

      // Vérifier que le nouveau mot de passe fonctionne
      const newPasswordValid = await bcrypt.compare(
        'NewPassword123',
        updatedUser!.password
      );
      expect(newPasswordValid).toBe(true);
    });

    it('should delete user and cascade related data', async () => {
      // Créer une session pour cet utilisateur
      await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'user-session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Supprimer l'utilisateur
      await prisma.user.delete({
        where: { id: testUser.id },
      });

      // Vérifier que l'utilisateur a été supprimé
      const deletedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(deletedUser).toBeNull();

      // Vérifier que les sessions liées ont été supprimées (si cascade est configuré)
      const orphanSessions = await prisma.session.findMany({
        where: { userId: testUser.id },
      });
      expect(orphanSessions).toHaveLength(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate email format in application logic', async () => {
      const { validateEmail } = await import('@/lib/auth/validators');

      expect(validateEmail('valid@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should validate pseudo format in application logic', async () => {
      const { validatePseudo } = await import('@/lib/auth/validators');

      expect(validatePseudo('ValidPseudo')).toBe(true);
      expect(validatePseudo('User123')).toBe(true);
      expect(validatePseudo('')).toBe(false);
      expect(validatePseudo('ab')).toBe(false); // Too short
    });

    it('should validate password strength', async () => {
      const { validatePasswordStrength } = await import(
        '@/lib/auth/validators'
      );

      const strongPassword = validatePasswordStrength('StrongPass123');
      expect(strongPassword.isValid).toBe(true);

      const weakPassword = validatePasswordStrength('weak');
      expect(weakPassword.isValid).toBe(false);
      expect(weakPassword.errors.length).toBeGreaterThan(0);
    });
  });
});
