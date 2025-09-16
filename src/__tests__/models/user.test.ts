import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { userService } from '@/lib/services/user';
import type { CreateUserData } from '@/types';

// Mock Prisma client pour les tests
jest.mock('@prisma/client');

const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as any;

// Mock du service utilisateur
jest.mock('@/lib/services/user');

describe('User Model Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Creation', () => {
    it('should create a user with hashed password', async () => {
      const userData: CreateUserData = {
        email: 'test@example.com',
        password: 'password123',
        pseudo: 'TestUser',
        avatar: 'avatar.jpg',
        role: 'user',
      };

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const expectedUser = {
        id: 'user-1',
        email: userData.email,
        pseudo: userData.pseudo,
        avatar: userData.avatar,
        role: userData.role,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(expectedUser);

      const result = await userService.createUser(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          password: expect.any(String), // Le mot de passe doit être hashé
          pseudo: userData.pseudo,
          avatar: userData.avatar,
          role: userData.role,
        },
      });

      expect(result).toEqual(expectedUser);
    });

    it('should create a root user', async () => {
      const rootData: CreateUserData = {
        email: 'admin@example.com',
        password: 'adminpass123',
        pseudo: 'Admin',
        role: 'root',
      };

      const expectedRootUser = {
        id: 'user-root',
        email: rootData.email,
        pseudo: rootData.pseudo,
        avatar: null,
        role: 'root',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(expectedRootUser);

      const result = await userService.createUser(rootData);

      expect(result.role).toBe('root');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should require pseudo and avatar for regular users', async () => {
      const invalidUserData = {
        email: 'test@example.com',
        password: 'password123',
        // pseudo manquant
      };

      await expect(
        userService.createUser(invalidUserData as CreateUserData)
      ).rejects.toThrow('Pseudo est requis pour les utilisateurs');
    });

    it('should prevent duplicate emails', async () => {
      const userData: CreateUserData = {
        email: 'existing@example.com',
        password: 'password123',
        pseudo: 'TestUser',
        role: 'user',
      };

      mockPrisma.user.create.mockRejectedValue({
        code: 'P2002', // Code d'erreur Prisma pour contrainte unique
        meta: { target: ['email'] },
      });

      await expect(userService.createUser(userData)).rejects.toThrow(
        'Un utilisateur avec cet email existe déjà'
      );
    });
  });

  describe('User Authentication', () => {
    it('should authenticate user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const mockUser = {
        id: 'user-1',
        email,
        password: hashedPassword,
        pseudo: 'TestUser',
        role: 'user',
        avatar: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.authenticateUser(email, password);

      expect(result).toBeTruthy();
      expect(result?.id).toBe(mockUser.id);
      expect(result?.password).toBeUndefined(); // Le mot de passe ne doit pas être retourné
    });

    it('should reject authentication with wrong password', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const hashedPassword = await bcrypt.hash('correctpassword', 10);

      const mockUser = {
        id: 'user-1',
        email,
        password: hashedPassword,
        pseudo: 'TestUser',
        role: 'user',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.authenticateUser(email, password);

      expect(result).toBeNull();
    });

    it('should reject authentication for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.authenticateUser(
        'nonexistent@example.com',
        'password'
      );

      expect(result).toBeNull();
    });
  });

  describe('User Queries', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-1',
        email,
        pseudo: 'TestUser',
        role: 'user',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.findUserByEmail(email);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should get all users (admin only)', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          pseudo: 'User1',
          role: 'user',
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          pseudo: 'User2',
          role: 'user',
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          pseudo: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockUsers);
    });
  });
});
