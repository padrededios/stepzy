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

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Nettoyer la base avant tous les tests
    await prisma.matchPlayer.deleteMany();
    await prisma.match.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Nettoyer avant chaque test
    await prisma.matchPlayer.deleteMany();
    await prisma.match.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('User CRUD Operations', () => {
    it('should create a user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        pseudo: 'TestUser',
        avatar: 'avatar.jpg',
        role: 'user' as const,
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
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a root user', async () => {
      const rootData = {
        email: 'admin@example.com',
        password: await bcrypt.hash('adminpass123', 10),
        pseudo: 'Admin',
        role: 'root' as const,
      };

      const rootUser = await prisma.user.create({
        data: rootData,
      });

      expect(rootUser.role).toBe('root');
      expect(rootUser.pseudo).toBe('Admin');
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: await bcrypt.hash('password123', 10),
        pseudo: 'User1',
        role: 'user' as const,
      };

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

    it('should find user by email', async () => {
      const userData = {
        email: 'find@example.com',
        password: await bcrypt.hash('password123', 10),
        pseudo: 'FindMe',
        role: 'user' as const,
      };

      await prisma.user.create({ data: userData });

      const foundUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(foundUser).toBeTruthy();
      expect(foundUser?.email).toBe(userData.email);
      expect(foundUser?.pseudo).toBe(userData.pseudo);
    });
  });

  describe('Match CRUD Operations', () => {
    it('should create a match', async () => {
      const matchData = {
        date: new Date('2024-12-10T12:00:00Z'),
        status: 'scheduled' as const,
      };

      const match = await prisma.match.create({
        data: matchData,
      });

      expect(match.id).toBeDefined();
      expect(match.date).toEqual(matchData.date);
      expect(match.status).toBe('scheduled');
      expect(match.createdAt).toBeInstanceOf(Date);
      expect(match.updatedAt).toBeInstanceOf(Date);
    });

    it('should get matches with players', async () => {
      // Créer un utilisateur
      const user = await prisma.user.create({
        data: {
          email: 'player@example.com',
          password: await bcrypt.hash('password123', 10),
          pseudo: 'Player',
          role: 'user',
        },
      });

      // Créer un match
      const match = await prisma.match.create({
        data: {
          date: new Date('2024-12-10T12:00:00Z'),
          status: 'scheduled',
        },
      });

      // Inscrire le joueur
      await prisma.matchPlayer.create({
        data: {
          userId: user.id,
          matchId: match.id,
          status: 'titulaire',
        },
      });

      // Récupérer le match avec les joueurs
      const matchWithPlayers = await prisma.match.findUnique({
        where: { id: match.id },
        include: {
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  pseudo: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      expect(matchWithPlayers).toBeTruthy();
      expect(matchWithPlayers!.players).toHaveLength(1);
      expect(matchWithPlayers!.players[0].user.pseudo).toBe('Player');
      expect(matchWithPlayers!.players[0].status).toBe('titulaire');
    });
  });

  describe('MatchPlayer Relations', () => {
    let user1: any, user2: any, match: any;

    beforeEach(async () => {
      // Créer des utilisateurs et un match pour les tests
      user1 = await prisma.user.create({
        data: {
          email: 'user1@example.com',
          password: await bcrypt.hash('password123', 10),
          pseudo: 'User1',
          role: 'user',
        },
      });

      user2 = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          password: await bcrypt.hash('password123', 10),
          pseudo: 'User2',
          role: 'user',
        },
      });

      match = await prisma.match.create({
        data: {
          date: new Date('2024-12-10T12:00:00Z'),
          status: 'scheduled',
        },
      });
    });

    it('should allow user to join match', async () => {
      const matchPlayer = await prisma.matchPlayer.create({
        data: {
          userId: user1.id,
          matchId: match.id,
          status: 'titulaire',
        },
      });

      expect(matchPlayer.userId).toBe(user1.id);
      expect(matchPlayer.matchId).toBe(match.id);
      expect(matchPlayer.status).toBe('titulaire');
      expect(matchPlayer.joinedAt).toBeInstanceOf(Date);
    });

    it('should enforce unique constraint on userId and matchId', async () => {
      // Premier enregistrement
      await prisma.matchPlayer.create({
        data: {
          userId: user1.id,
          matchId: match.id,
          status: 'titulaire',
        },
      });

      // Tentative de double inscription
      await expect(
        prisma.matchPlayer.create({
          data: {
            userId: user1.id,
            matchId: match.id,
            status: 'remplaçant',
          },
        })
      ).rejects.toThrow();
    });

    it('should allow multiple users to join same match', async () => {
      await prisma.matchPlayer.create({
        data: {
          userId: user1.id,
          matchId: match.id,
          status: 'titulaire',
        },
      });

      await prisma.matchPlayer.create({
        data: {
          userId: user2.id,
          matchId: match.id,
          status: 'titulaire',
        },
      });

      const players = await prisma.matchPlayer.findMany({
        where: { matchId: match.id },
      });

      expect(players).toHaveLength(2);
    });

    it('should cascade delete when user is deleted', async () => {
      await prisma.matchPlayer.create({
        data: {
          userId: user1.id,
          matchId: match.id,
          status: 'titulaire',
        },
      });

      // Supprimer l'utilisateur
      await prisma.user.delete({
        where: { id: user1.id },
      });

      // Vérifier que l'inscription a été supprimée
      const players = await prisma.matchPlayer.findMany({
        where: { matchId: match.id },
      });

      expect(players).toHaveLength(0);
    });

    it('should cascade delete when match is deleted', async () => {
      await prisma.matchPlayer.create({
        data: {
          userId: user1.id,
          matchId: match.id,
          status: 'titulaire',
        },
      });

      // Supprimer le match
      await prisma.match.delete({
        where: { id: match.id },
      });

      // Vérifier que l'inscription a été supprimée
      const players = await prisma.matchPlayer.findMany({
        where: { userId: user1.id },
      });

      expect(players).toHaveLength(0);
    });
  });

  describe('Complex Queries', () => {
    it('should get upcoming matches in date range', async () => {
      const now = new Date('2024-12-09T10:00:00Z');
      const match1 = await prisma.match.create({
        data: {
          date: new Date('2024-12-10T12:00:00Z'), // Cette semaine
          status: 'scheduled',
        },
      });

      const match2 = await prisma.match.create({
        data: {
          date: new Date('2024-12-17T13:00:00Z'), // Semaine suivante
          status: 'scheduled',
        },
      });

      const match3 = await prisma.match.create({
        data: {
          date: new Date('2024-12-24T12:00:00Z'), // Trop loin
          status: 'scheduled',
        },
      });

      // Requête pour semaine courante et suivante (14 jours)
      const currentWeekStart = new Date('2024-12-09T00:00:00Z');
      const nextWeekEnd = new Date('2024-12-20T23:59:59Z');

      const upcomingMatches = await prisma.match.findMany({
        where: {
          date: {
            gte: currentWeekStart,
            lte: nextWeekEnd,
          },
          status: {
            not: 'cancelled',
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      expect(upcomingMatches).toHaveLength(2);
      expect(upcomingMatches[0].id).toBe(match1.id);
      expect(upcomingMatches[1].id).toBe(match2.id);
    });

    it('should count players per match status', async () => {
      const user1 = await prisma.user.create({
        data: {
          email: 'counter1@example.com',
          password: await bcrypt.hash('password123', 10),
          pseudo: 'Counter1',
          role: 'user',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          email: 'counter2@example.com',
          password: await bcrypt.hash('password123', 10),
          pseudo: 'Counter2',
          role: 'user',
        },
      });

      const match = await prisma.match.create({
        data: {
          date: new Date('2024-12-10T12:00:00Z'),
          status: 'scheduled',
        },
      });

      await prisma.matchPlayer.create({
        data: {
          userId: user1.id,
          matchId: match.id,
          status: 'titulaire',
        },
      });

      await prisma.matchPlayer.create({
        data: {
          userId: user2.id,
          matchId: match.id,
          status: 'remplaçant',
        },
      });

      // Compter les titulaires
      const titulaires = await prisma.matchPlayer.count({
        where: {
          matchId: match.id,
          status: 'titulaire',
        },
      });

      // Compter les remplaçants
      const remplaçants = await prisma.matchPlayer.count({
        where: {
          matchId: match.id,
          status: 'remplaçant',
        },
      });

      expect(titulaires).toBe(1);
      expect(remplaçants).toBe(1);
    });
  });
});
