import { describe, it, expect, beforeEach } from '@jest/globals';
import { matchService } from '@/lib/services/match';
import type { CreateMatchData, JoinMatchData } from '@/types';

// Mock Prisma client
const mockPrisma = {
  match: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  matchPlayer: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
} as any;

jest.mock('@/lib/services/match');

describe('Match Model Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Match Creation', () => {
    it('should create a match with valid date', async () => {
      const matchData: CreateMatchData = {
        date: new Date('2024-12-10T12:00:00Z'),
        status: 'scheduled',
      };

      const expectedMatch = {
        id: 'match-1',
        date: matchData.date,
        status: matchData.status,
        createdAt: new Date(),
        updatedAt: new Date(),
        players: [],
      };

      mockPrisma.match.create.mockResolvedValue(expectedMatch);

      const result = await matchService.createMatch(matchData);

      expect(mockPrisma.match.create).toHaveBeenCalledWith({
        data: {
          date: matchData.date,
          status: matchData.status,
        },
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

      expect(result).toEqual(expectedMatch);
    });

    it('should prevent creating match in the past', async () => {
      const pastDate = new Date('2023-01-01T12:00:00Z');
      const matchData: CreateMatchData = {
        date: pastDate,
      };

      await expect(matchService.createMatch(matchData)).rejects.toThrow(
        'Impossible de créer un match dans le passé'
      );
    });

    it('should prevent creating match on weekend', async () => {
      const weekendDate = new Date('2024-12-14T12:00:00Z'); // Samedi
      const matchData: CreateMatchData = {
        date: weekendDate,
      };

      await expect(matchService.createMatch(matchData)).rejects.toThrow(
        'Les matchs ne peuvent être créés que du lundi au vendredi'
      );
    });

    it('should prevent creating match outside lunch hours', async () => {
      const morningDate = new Date('2024-12-10T10:00:00Z'); // 10h
      const matchData: CreateMatchData = {
        date: morningDate,
      };

      await expect(matchService.createMatch(matchData)).rejects.toThrow(
        'Les matchs doivent être programmés entre 12h et 14h'
      );
    });
  });

  describe('Match Player Management', () => {
    it('should allow user to join match with available slots', async () => {
      const joinData: JoinMatchData = {
        userId: 'user-1',
        matchId: 'match-1',
      };

      // Mock : 5 joueurs déjà inscrits (< 12)
      mockPrisma.matchPlayer.count.mockResolvedValue(5);
      mockPrisma.matchPlayer.create.mockResolvedValue({
        id: 'mp-1',
        userId: joinData.userId,
        matchId: joinData.matchId,
        status: 'titulaire',
        joinedAt: new Date(),
      });

      const result = await matchService.joinMatch(joinData);

      expect(mockPrisma.matchPlayer.count).toHaveBeenCalledWith({
        where: { matchId: joinData.matchId },
      });

      expect(mockPrisma.matchPlayer.create).toHaveBeenCalledWith({
        data: {
          userId: joinData.userId,
          matchId: joinData.matchId,
          status: 'titulaire',
        },
      });

      expect(result.status).toBe('titulaire');
    });

    it('should put user on waiting list when match is full (12 players)', async () => {
      const joinData: JoinMatchData = {
        userId: 'user-13',
        matchId: 'match-1',
      };

      // Mock : 12 joueurs déjà inscrits
      mockPrisma.matchPlayer.count.mockResolvedValue(12);
      mockPrisma.matchPlayer.create.mockResolvedValue({
        id: 'mp-13',
        userId: joinData.userId,
        matchId: joinData.matchId,
        status: 'remplaçant',
        joinedAt: new Date(),
      });

      const result = await matchService.joinMatch(joinData);

      expect(result.status).toBe('remplaçant');
    });

    it('should prevent user from joining same match twice', async () => {
      const joinData: JoinMatchData = {
        userId: 'user-1',
        matchId: 'match-1',
      };

      mockPrisma.matchPlayer.create.mockRejectedValue({
        code: 'P2002', // Contrainte unique violée
        meta: { target: ['userId', 'matchId'] },
      });

      await expect(matchService.joinMatch(joinData)).rejects.toThrow(
        'Vous êtes déjà inscrit à ce match'
      );
    });

    it('should promote first substitute when player leaves', async () => {
      const matchId = 'match-1';
      const leavingUserId = 'user-5';

      // Mock : joueur qui part est titulaire
      const leavingPlayer = {
        id: 'mp-5',
        userId: leavingUserId,
        matchId,
        status: 'titulaire',
      };

      // Mock : il y a des remplaçants
      const waitingPlayers = [
        {
          id: 'mp-13',
          userId: 'user-13',
          matchId,
          status: 'remplaçant',
          joinedAt: new Date('2024-01-01T10:00:00Z'),
        },
      ];

      mockPrisma.matchPlayer.findUnique = jest
        .fn()
        .mockResolvedValue(leavingPlayer);
      mockPrisma.matchPlayer.findMany.mockResolvedValue(waitingPlayers);
      mockPrisma.matchPlayer.delete.mockResolvedValue(leavingPlayer);
      mockPrisma.matchPlayer.update.mockResolvedValue({
        ...waitingPlayers[0],
        status: 'titulaire',
      });

      const result = await matchService.leaveMatch(leavingUserId, matchId);

      expect(mockPrisma.matchPlayer.delete).toHaveBeenCalledWith({
        where: {
          userId_matchId: {
            userId: leavingUserId,
            matchId,
          },
        },
      });

      expect(mockPrisma.matchPlayer.update).toHaveBeenCalledWith({
        where: { id: waitingPlayers[0].id },
        data: { status: 'titulaire' },
      });

      expect(result.promoted).toEqual(waitingPlayers[0]);
    });

    it('should not promote when substitute leaves', async () => {
      const matchId = 'match-1';
      const leavingUserId = 'user-13';

      const leavingPlayer = {
        id: 'mp-13',
        userId: leavingUserId,
        matchId,
        status: 'remplaçant',
      };

      mockPrisma.matchPlayer.findUnique = jest
        .fn()
        .mockResolvedValue(leavingPlayer);
      mockPrisma.matchPlayer.delete.mockResolvedValue(leavingPlayer);

      const result = await matchService.leaveMatch(leavingUserId, matchId);

      expect(result.promoted).toBeNull();
    });
  });

  describe('Match Queries', () => {
    it('should get matches for current and next week', async () => {
      const now = new Date('2024-12-09T10:00:00Z'); // Lundi
      const currentWeekStart = new Date('2024-12-09T00:00:00Z');
      const nextWeekEnd = new Date('2024-12-20T23:59:59Z');

      const mockMatches = [
        {
          id: 'match-1',
          date: new Date('2024-12-10T12:00:00Z'),
          status: 'scheduled',
          players: [],
        },
        {
          id: 'match-2',
          date: new Date('2024-12-17T13:00:00Z'),
          status: 'scheduled',
          players: [],
        },
      ];

      mockPrisma.match.findMany.mockResolvedValue(mockMatches);

      const result = await matchService.getUpcomingMatches(now);

      expect(mockPrisma.match.findMany).toHaveBeenCalledWith({
        where: {
          date: {
            gte: currentWeekStart,
            lte: nextWeekEnd,
          },
          status: {
            not: 'cancelled',
          },
        },
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
            orderBy: {
              joinedAt: 'asc',
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      expect(result).toEqual(mockMatches);
    });

    it('should get match details with players', async () => {
      const matchId = 'match-1';
      const mockMatch = {
        id: matchId,
        date: new Date('2024-12-10T12:00:00Z'),
        status: 'scheduled',
        players: [
          {
            id: 'mp-1',
            status: 'titulaire',
            user: { id: 'user-1', pseudo: 'Player1', avatar: 'avatar1.jpg' },
          },
          {
            id: 'mp-2',
            status: 'remplaçant',
            user: { id: 'user-2', pseudo: 'Player2', avatar: null },
          },
        ],
      };

      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);

      const result = await matchService.getMatchById(matchId);

      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: matchId },
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
            orderBy: {
              joinedAt: 'asc',
            },
          },
        },
      });

      expect(result).toEqual(mockMatch);
    });
  });
});
