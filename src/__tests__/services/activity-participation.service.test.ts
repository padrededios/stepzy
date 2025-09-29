/**
 * Tests pour ActivityParticipationService
 */

import { ActivityParticipationService } from '@/lib/services/activity-participation.service'
import { prisma } from '@/lib/database/prisma'
import { ActivityParticipant, ParticipantStatus } from '@/types/activity'

// Mock Prisma
jest.mock('@/lib/database/prisma', () => ({
  prisma: {
    activityParticipant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    activitySession: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('ActivityParticipationService', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    pseudo: 'TestUser',
    avatar: null,
    role: 'user' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockActivity = {
    id: 'activity-1',
    name: 'Foot entre collègues',
    sport: 'football' as const,
    maxPlayers: 12,
    createdBy: 'creator-1',
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockSession = {
    id: 'session-1',
    activityId: 'activity-1',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
    status: 'active' as const,
    maxPlayers: 12,
    isCancelled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    activity: mockActivity,
    participants: []
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('joinSession', () => {
    it('devrait inscrire un utilisateur avec statut confirmé si des places sont disponibles', async () => {
      const sessionWithParticipants = {
        ...mockSession,
        participants: [
          { status: 'confirmed' },
          { status: 'confirmed' }
        ]
      }

      mockPrisma.activityParticipant.findUnique.mockResolvedValue(null)
      mockPrisma.activitySession.findUnique.mockResolvedValue(sessionWithParticipants as any)
      mockPrisma.activityParticipant.create.mockResolvedValue({
        id: 'participation-1',
        sessionId: 'session-1',
        userId: 'user-1',
        status: 'confirmed',
        joinedAt: new Date(),
        user: mockUser,
        session: mockSession
      } as any)

      const participation = await ActivityParticipationService.joinSession('session-1', 'user-1')

      expect(participation.status).toBe('confirmed')
      expect(mockPrisma.activityParticipant.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-1',
          userId: 'user-1',
          status: 'confirmed'
        },
        include: {
          user: true,
          session: {
            include: {
              activity: true
            }
          }
        }
      })
    })

    it('devrait inscrire un utilisateur en liste d\'attente si la session est complète', async () => {
      const fullSession = {
        ...mockSession,
        participants: Array(12).fill({ status: 'confirmed' })
      }

      mockPrisma.activityParticipant.findUnique.mockResolvedValue(null)
      mockPrisma.activitySession.findUnique.mockResolvedValue(fullSession as any)
      mockPrisma.activityParticipant.create.mockResolvedValue({
        id: 'participation-1',
        sessionId: 'session-1',
        userId: 'user-1',
        status: 'waiting',
        joinedAt: new Date(),
        user: mockUser,
        session: mockSession
      } as any)

      const participation = await ActivityParticipationService.joinSession('session-1', 'user-1')

      expect(participation.status).toBe('waiting')
    })

    it('devrait lever une erreur si l\'utilisateur est déjà inscrit', async () => {
      mockPrisma.activityParticipant.findUnique.mockResolvedValue({
        id: 'existing-participation',
        sessionId: 'session-1',
        userId: 'user-1',
        status: 'confirmed'
      } as any)

      await expect(
        ActivityParticipationService.joinSession('session-1', 'user-1')
      ).rejects.toThrow('Vous êtes déjà inscrit à cette session')
    })

    it('devrait lever une erreur si la session n\'existe pas', async () => {
      mockPrisma.activityParticipant.findUnique.mockResolvedValue(null)
      mockPrisma.activitySession.findUnique.mockResolvedValue(null)

      await expect(
        ActivityParticipationService.joinSession('invalid-session', 'user-1')
      ).rejects.toThrow('Session non trouvée')
    })

    it('devrait lever une erreur si la session est annulée', async () => {
      const cancelledSession = {
        ...mockSession,
        isCancelled: true
      }

      mockPrisma.activityParticipant.findUnique.mockResolvedValue(null)
      mockPrisma.activitySession.findUnique.mockResolvedValue(cancelledSession as any)

      await expect(
        ActivityParticipationService.joinSession('session-1', 'user-1')
      ).rejects.toThrow('Cette session a été annulée')
    })

    it('devrait lever une erreur pour une session passée', async () => {
      const pastSession = {
        ...mockSession,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Hier
      }

      mockPrisma.activityParticipant.findUnique.mockResolvedValue(null)
      mockPrisma.activitySession.findUnique.mockResolvedValue(pastSession as any)

      await expect(
        ActivityParticipationService.joinSession('session-1', 'user-1')
      ).rejects.toThrow('Impossible de s\'inscrire à une session passée')
    })
  })

  describe('leaveSession', () => {
    it('devrait désinscrire un utilisateur', async () => {
      mockPrisma.activityParticipant.findUnique.mockResolvedValue({
        id: 'participation-1',
        sessionId: 'session-1',
        userId: 'user-1',
        status: 'confirmed',
        session: { activity: mockActivity }
      } as any)
      mockPrisma.activityParticipant.delete.mockResolvedValue({} as any)

      const promoteFromWaitingListSpy = jest
        .spyOn(ActivityParticipationService, 'promoteFromWaitingList')
        .mockResolvedValue()

      await ActivityParticipationService.leaveSession('session-1', 'user-1')

      expect(mockPrisma.activityParticipant.delete).toHaveBeenCalledWith({
        where: {
          sessionId_userId: {
            sessionId: 'session-1',
            userId: 'user-1'
          }
        }
      })

      expect(promoteFromWaitingListSpy).toHaveBeenCalledWith('session-1')

      promoteFromWaitingListSpy.mockRestore()
    })

    it('devrait lever une erreur si l\'utilisateur n\'est pas inscrit', async () => {
      mockPrisma.activityParticipant.findUnique.mockResolvedValue(null)

      await expect(
        ActivityParticipationService.leaveSession('session-1', 'user-1')
      ).rejects.toThrow('Vous n\'êtes pas inscrit à cette session')
    })
  })

  describe('promoteFromWaitingList', () => {
    it('devrait promouvoir le premier en liste d\'attente', async () => {
      const waitingParticipant = {
        id: 'participation-waiting',
        sessionId: 'session-1',
        userId: 'user-waiting',
        status: 'waiting',
        joinedAt: new Date(),
        user: mockUser,
        session: { activity: mockActivity }
      }

      mockPrisma.activityParticipant.findFirst.mockResolvedValue(waitingParticipant as any)
      mockPrisma.activityParticipant.update.mockResolvedValue({} as any)

      await ActivityParticipationService.promoteFromWaitingList('session-1')

      expect(mockPrisma.activityParticipant.findFirst).toHaveBeenCalledWith({
        where: {
          sessionId: 'session-1',
          status: 'waiting'
        },
        orderBy: {
          joinedAt: 'asc'
        },
        include: {
          user: true,
          session: {
            include: {
              activity: true
            }
          }
        }
      })

      expect(mockPrisma.activityParticipant.update).toHaveBeenCalledWith({
        where: {
          id: 'participation-waiting'
        },
        data: {
          status: 'confirmed'
        }
      })
    })

    it('ne devrait rien faire si personne n\'est en attente', async () => {
      mockPrisma.activityParticipant.findFirst.mockResolvedValue(null)

      await ActivityParticipationService.promoteFromWaitingList('session-1')

      expect(mockPrisma.activityParticipant.update).not.toHaveBeenCalled()
    })
  })

  describe('getSessionStats', () => {
    it('devrait retourner les statistiques correctes', async () => {
      const sessionWithParticipants = {
        ...mockSession,
        participants: [
          { status: 'confirmed' },
          { status: 'confirmed' },
          { status: 'confirmed' },
          { status: 'waiting' },
          { status: 'waiting' }
        ]
      }

      mockPrisma.activitySession.findUnique.mockResolvedValue(sessionWithParticipants as any)

      const stats = await ActivityParticipationService.getSessionStats('session-1')

      expect(stats).toEqual({
        confirmedCount: 3,
        waitingCount: 2,
        totalCount: 5,
        availableSpots: 9 // 12 - 3
      })
    })

    it('devrait lever une erreur si la session n\'existe pas', async () => {
      mockPrisma.activitySession.findUnique.mockResolvedValue(null)

      await expect(
        ActivityParticipationService.getSessionStats('invalid-session')
      ).rejects.toThrow('Session non trouvée')
    })
  })

  describe('canUserJoinSession', () => {
    it('devrait retourner true si l\'utilisateur peut rejoindre', async () => {
      mockPrisma.activityParticipant.findUnique.mockResolvedValue(null)
      mockPrisma.activitySession.findUnique.mockResolvedValue({
        ...mockSession,
        participants: [{ status: 'confirmed' }]
      } as any)

      const result = await ActivityParticipationService.canUserJoinSession('session-1', 'user-1')

      expect(result).toEqual({
        canJoin: true,
        wouldBeWaiting: false
      })
    })

    it('devrait indiquer que l\'utilisateur sera en attente si la session est complète', async () => {
      mockPrisma.activityParticipant.findUnique.mockResolvedValue(null)
      mockPrisma.activitySession.findUnique.mockResolvedValue({
        ...mockSession,
        participants: Array(12).fill({ status: 'confirmed' })
      } as any)

      const result = await ActivityParticipationService.canUserJoinSession('session-1', 'user-1')

      expect(result).toEqual({
        canJoin: true,
        wouldBeWaiting: true
      })
    })

    it('devrait retourner false si l\'utilisateur est déjà inscrit', async () => {
      mockPrisma.activityParticipant.findUnique.mockResolvedValue({
        id: 'existing',
        sessionId: 'session-1',
        userId: 'user-1'
      } as any)

      const result = await ActivityParticipationService.canUserJoinSession('session-1', 'user-1')

      expect(result).toEqual({
        canJoin: false,
        reason: 'Vous êtes déjà inscrit à cette session',
        wouldBeWaiting: false
      })
    })
  })

  describe('getUserParticipationStatus', () => {
    it('devrait retourner le statut de participation de l\'utilisateur', async () => {
      const mockParticipation = {
        id: 'participation-1',
        sessionId: 'session-1',
        userId: 'user-1',
        status: 'confirmed',
        joinedAt: new Date(),
        user: mockUser,
        session: { activity: mockActivity }
      }

      mockPrisma.activityParticipant.findUnique.mockResolvedValue(mockParticipation as any)

      const result = await ActivityParticipationService.getUserParticipationStatus('session-1', 'user-1')

      expect(result).toEqual(mockParticipation)
    })

    it('devrait retourner null si l\'utilisateur n\'est pas inscrit', async () => {
      mockPrisma.activityParticipant.findUnique.mockResolvedValue(null)

      const result = await ActivityParticipationService.getUserParticipationStatus('session-1', 'user-1')

      expect(result).toBeNull()
    })
  })

  describe('processInterestedParticipants', () => {
    it('devrait promouvoir les participants en attente quand des places se libèrent', async () => {
      const sessionWithParticipants = {
        id: 'session-1',
        maxPlayers: 5,
        participants: [
          { id: 'p1', status: 'confirmed', joinedAt: new Date(2024, 0, 1) },
          { id: 'p2', status: 'confirmed', joinedAt: new Date(2024, 0, 2) },
          { id: 'p3', status: 'waiting', joinedAt: new Date(2024, 0, 3) },
          { id: 'p4', status: 'waiting', joinedAt: new Date(2024, 0, 4) }
        ]
      }

      mockPrisma.activitySession.findUnique.mockResolvedValue(sessionWithParticipants as any)
      mockPrisma.activityParticipant.update.mockResolvedValue({} as any)

      await ActivityParticipationService.processInterestedParticipants('session-1')

      // Devrait promouvoir 3 personnes (5 max - 2 confirmés = 3 places)
      expect(mockPrisma.activityParticipant.update).toHaveBeenCalledTimes(2)
      expect(mockPrisma.activityParticipant.update).toHaveBeenCalledWith({
        where: { id: 'p3' },
        data: { status: 'confirmed' }
      })
      expect(mockPrisma.activityParticipant.update).toHaveBeenCalledWith({
        where: { id: 'p4' },
        data: { status: 'confirmed' }
      })
    })
  })
})