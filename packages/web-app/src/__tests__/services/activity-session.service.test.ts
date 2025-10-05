/**
 * Tests pour ActivitySessionService
 */

import { ActivitySessionService } from '@/lib/services/activity-session.service'
import { prisma } from '@/lib/database/prisma'
import { Activity, RecurringType, DayOfWeek } from '@/types/activity'
import { addWeeks, addDays, startOfDay } from 'date-fns'

// Mock Prisma
jest.mock('@/lib/database/prisma', () => ({
  prisma: {
    activity: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    activitySession: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn()
    }
  }
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('ActivitySessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateSessions', () => {
    const mockActivity: Activity = {
      id: 'activity-1',
      name: 'Foot entre collègues',
      description: 'Match de foot hebdomadaire',
      sport: 'football',
      maxPlayers: 12,
      createdBy: 'user-1',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      recurringDays: ['monday', 'wednesday'] as DayOfWeek[],
      recurringType: 'weekly' as RecurringType,
      creator: {
        id: 'user-1',
        email: 'user@example.com',
        pseudo: 'TestUser',
        avatar: null,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    it('devrait générer des sessions hebdomadaires', async () => {
      const startDate = new Date('2024-01-01') // Lundi

      mockPrisma.activity.findUnique.mockResolvedValue(mockActivity)
      mockPrisma.activitySession.findFirst.mockResolvedValue(null)
      mockPrisma.activitySession.create.mockImplementation(({ data }) =>
        Promise.resolve({
          id: `session-${Math.random()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any)
      )

      const sessions = await ActivitySessionService.generateSessions('activity-1', startDate, 2)

      // Devrait créer 4 sessions (lundi et mercredi pour 2 semaines)
      expect(sessions.length).toBe(4)
      expect(mockPrisma.activitySession.create).toHaveBeenCalledTimes(4)

      // Vérifier les dates générées
      const createdSessions = mockPrisma.activitySession.create.mock.calls.map(call => call[0].data)

      // Premier lundi
      expect(createdSessions[0].date).toEqual(new Date('2024-01-01T12:00:00.000Z'))
      // Premier mercredi
      expect(createdSessions[1].date).toEqual(new Date('2024-01-03T12:00:00.000Z'))
      // Deuxième lundi
      expect(createdSessions[2].date).toEqual(new Date('2024-01-08T12:00:00.000Z'))
      // Deuxième mercredi
      expect(createdSessions[3].date).toEqual(new Date('2024-01-10T12:00:00.000Z'))
    })

    it('ne devrait pas créer de sessions si elles existent déjà', async () => {
      const startDate = new Date('2024-01-01')

      mockPrisma.activity.findUnique.mockResolvedValue(mockActivity)
      mockPrisma.activitySession.findFirst.mockResolvedValue({
        id: 'existing-session',
        activityId: 'activity-1',
        date: new Date('2024-01-01T12:00:00'),
        status: 'active',
        maxPlayers: 12,
        isCancelled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      const sessions = await ActivitySessionService.generateSessions('activity-1', startDate, 1)

      expect(sessions.length).toBe(0)
      expect(mockPrisma.activitySession.create).not.toHaveBeenCalled()
    })

    it('devrait lever une erreur si l\'activité n\'existe pas', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(null)

      await expect(
        ActivitySessionService.generateSessions('invalid-activity', new Date(), 2)
      ).rejects.toThrow('Activity not found')
    })
  })

  describe('getUpcomingSessions', () => {
    it('devrait récupérer les sessions à venir pour une activité', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          activityId: 'activity-1',
          date: addDays(new Date(), 1),
          status: 'active',
          maxPlayers: 12,
          isCancelled: false,
          participants: [],
          activity: mockActivity
        }
      ]

      mockPrisma.activitySession.findMany.mockResolvedValue(mockSessions as any)

      const sessions = await ActivitySessionService.getUpcomingSessions('activity-1', 2)

      expect(sessions).toEqual(mockSessions)
      expect(mockPrisma.activitySession.findMany).toHaveBeenCalledWith({
        where: {
          activityId: 'activity-1',
          date: {
            gte: expect.any(Date),
            lte: expect.any(Date)
          },
          status: 'active',
          isCancelled: false
        },
        include: {
          participants: {
            include: {
              user: true
            }
          },
          activity: true
        },
        orderBy: {
          date: 'asc'
        }
      })
    })
  })

  describe('getUserUpcomingSessions', () => {
    it('devrait récupérer les sessions à venir d\'un utilisateur', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          date: addDays(new Date(), 1),
          status: 'active',
          participants: [{ userId: 'user-1' }]
        }
      ]

      mockPrisma.activitySession.findMany.mockResolvedValue(mockSessions as any)

      const sessions = await ActivitySessionService.getUserUpcomingSessions('user-1', 2)

      expect(sessions).toEqual(mockSessions)
      expect(mockPrisma.activitySession.findMany).toHaveBeenCalledWith({
        where: {
          date: {
            gte: expect.any(Date),
            lte: expect.any(Date)
          },
          status: 'active',
          isCancelled: false,
          participants: {
            some: {
              userId: 'user-1'
            }
          }
        },
        include: {
          participants: {
            include: {
              user: true
            }
          },
          activity: {
            include: {
              creator: true
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      })
    })
  })

  describe('getAvailableSessions', () => {
    it('devrait récupérer les sessions avec places disponibles', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          maxPlayers: 12,
          participants: [
            { status: 'confirmed' },
            { status: 'confirmed' },
            { status: 'waiting' }
          ]
        },
        {
          id: 'session-2',
          maxPlayers: 10,
          participants: Array(10).fill({ status: 'confirmed' })
        }
      ]

      mockPrisma.activitySession.findMany.mockResolvedValue(mockSessions as any)

      const sessions = await ActivitySessionService.getAvailableSessions(2)

      // Devrait retourner seulement la première session (10 places libres)
      expect(sessions).toHaveLength(1)
      expect(sessions[0].id).toBe('session-1')
    })

    it('devrait filtrer par sport si spécifié', async () => {
      mockPrisma.activitySession.findMany.mockResolvedValue([])

      await ActivitySessionService.getAvailableSessions(2, 'football')

      expect(mockPrisma.activitySession.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          activity: {
            sport: 'football'
          }
        }),
        include: expect.any(Object),
        orderBy: { date: 'asc' }
      })
    })
  })

  describe('updateCompletedSessions', () => {
    it('devrait mettre à jour les sessions terminées', async () => {
      mockPrisma.activitySession.updateMany.mockResolvedValue({ count: 5 })

      await ActivitySessionService.updateCompletedSessions()

      expect(mockPrisma.activitySession.updateMany).toHaveBeenCalledWith({
        where: {
          date: {
            lt: expect.any(Date)
          },
          status: 'active'
        },
        data: {
          status: 'completed'
        }
      })
    })
  })

  describe('cleanupOldSessions', () => {
    it('devrait supprimer les sessions anciennes', async () => {
      mockPrisma.activitySession.deleteMany.mockResolvedValue({ count: 10 })

      await ActivitySessionService.cleanupOldSessions()

      expect(mockPrisma.activitySession.deleteMany).toHaveBeenCalledWith({
        where: {
          date: {
            lt: expect.any(Date)
          },
          status: 'completed'
        }
      })
    })
  })

  describe('generateAllUpcomingSessions', () => {
    it('devrait générer des sessions pour toutes les activités actives', async () => {
      const mockActivities = [
        { ...mockActivity, id: 'activity-1' },
        { ...mockActivity, id: 'activity-2' }
      ]

      mockPrisma.activity.findMany.mockResolvedValue(mockActivities as any)

      // Mock la méthode statique generateSessions
      const generateSessionsSpy = jest.spyOn(ActivitySessionService, 'generateSessions')
      generateSessionsSpy.mockResolvedValue([])

      await ActivitySessionService.generateAllUpcomingSessions(2)

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith({
        where: {
          isPublic: true
        }
      })

      expect(generateSessionsSpy).toHaveBeenCalledTimes(2)
      expect(generateSessionsSpy).toHaveBeenCalledWith('activity-1', expect.any(Date), 2)
      expect(generateSessionsSpy).toHaveBeenCalledWith('activity-2', expect.any(Date), 2)

      generateSessionsSpy.mockRestore()
    })

    it('devrait continuer même si une activité échoue', async () => {
      const mockActivities = [
        { ...mockActivity, id: 'activity-1' },
        { ...mockActivity, id: 'activity-2' }
      ]

      mockPrisma.activity.findMany.mockResolvedValue(mockActivities as any)

      const generateSessionsSpy = jest.spyOn(ActivitySessionService, 'generateSessions')
      generateSessionsSpy
        .mockRejectedValueOnce(new Error('Error for activity-1'))
        .mockResolvedValueOnce([])

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await ActivitySessionService.generateAllUpcomingSessions(2)

      expect(generateSessionsSpy).toHaveBeenCalledTimes(2)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la génération des sessions pour l\'activité activity-1:',
        expect.any(Error)
      )

      generateSessionsSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })
})