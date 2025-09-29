/**
 * Tests d'intégration pour les APIs des activités
 */

import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/activities/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'
import { ActivitySessionService } from '@/lib/services/activity-session.service'

// Mock des dépendances
jest.mock('@/lib/auth')
jest.mock('@/lib/database/prisma')
jest.mock('@/lib/services/activity-session.service')

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockActivitySessionService = ActivitySessionService as jest.Mocked<typeof ActivitySessionService>

describe('/api/activities', () => {
  const mockUser = {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      pseudo: 'TestUser',
      role: 'user'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/activities', () => {
    const validActivityData = {
      name: 'Foot entre collègues',
      description: 'Match de foot hebdomadaire',
      sport: 'football',
      maxPlayers: 12,
      recurringDays: ['monday', 'wednesday'],
      recurringType: 'weekly'
    }

    it('devrait créer une activité avec succès', async () => {
      mockAuth.mockResolvedValue(mockUser as any)

      const mockCreatedActivity = {
        id: 'activity-1',
        ...validActivityData,
        createdBy: 'user-1',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'user-1',
          pseudo: 'TestUser',
          avatar: null
        }
      }

      mockPrisma.activity.create.mockResolvedValue(mockCreatedActivity as any)
      mockActivitySessionService.generateSessions.mockResolvedValue([])
      mockPrisma.activity.findUnique.mockResolvedValue({
        ...mockCreatedActivity,
        sessions: []
      } as any)

      const request = new NextRequest('http://localhost:3000/api/activities', {
        method: 'POST',
        body: JSON.stringify(validActivityData)
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.name).toBe(validActivityData.name)
      expect(responseData.message).toContain('créée avec succès')

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          name: validActivityData.name,
          description: validActivityData.description,
          sport: validActivityData.sport,
          maxPlayers: validActivityData.maxPlayers,
          createdBy: 'user-1',
          recurringDays: validActivityData.recurringDays,
          recurringType: validActivityData.recurringType,
          isPublic: true
        },
        include: {
          creator: {
            select: {
              id: true,
              pseudo: true,
              avatar: true
            }
          }
        }
      })

      expect(mockActivitySessionService.generateSessions).toHaveBeenCalledWith(
        'activity-1',
        expect.any(Date),
        2
      )
    })

    it('devrait retourner 401 si non authentifié', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/activities', {
        method: 'POST',
        body: JSON.stringify(validActivityData)
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Non authentifié')
    })

    it('devrait valider les données d\'entrée', async () => {
      mockAuth.mockResolvedValue(mockUser as any)

      const invalidData = {
        name: 'AB', // Trop court
        sport: 'invalid-sport',
        maxPlayers: 50, // Trop élevé
        recurringDays: [],
        recurringType: 'invalid'
      }

      const request = new NextRequest('http://localhost:3000/api/activities', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBeDefined()
    })

    it('devrait rejeter si aucun jour de récurrence n\'est sélectionné', async () => {
      mockAuth.mockResolvedValue(mockUser as any)

      const invalidData = {
        ...validActivityData,
        recurringDays: []
      }

      const request = new NextRequest('http://localhost:3000/api/activities', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Vous devez sélectionner au moins un jour de la semaine')
    })
  })

  describe('GET /api/activities', () => {
    const mockActivities = [
      {
        id: 'activity-1',
        name: 'Foot collègues',
        sport: 'football',
        creator: { id: 'user-1', pseudo: 'TestUser', avatar: null },
        sessions: [
          {
            id: 'session-1',
            date: new Date(),
            participants: [
              { status: 'confirmed' },
              { status: 'confirmed' },
              { status: 'waiting' }
            ]
          }
        ],
        _count: { sessions: 5 }
      }
    ]

    it('devrait récupérer les activités avec pagination', async () => {
      mockAuth.mockResolvedValue(mockUser as any)
      mockPrisma.activity.findMany.mockResolvedValue(mockActivities as any)
      mockPrisma.activity.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/activities?page=1&limit=10')

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.activities).toHaveLength(1)
      expect(responseData.data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1
      })
    })

    it('devrait filtrer par sport', async () => {
      mockAuth.mockResolvedValue(mockUser as any)
      mockPrisma.activity.findMany.mockResolvedValue(mockActivities as any)
      mockPrisma.activity.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/activities?sport=football')

      const response = await GET(request)

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith({
        where: { sport: 'football' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      })
    })

    it('devrait enrichir les données avec les statistiques', async () => {
      mockAuth.mockResolvedValue(mockUser as any)
      mockPrisma.activity.findMany.mockResolvedValue(mockActivities as any)
      mockPrisma.activity.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/activities')

      const response = await GET(request)
      const responseData = await response.json()

      const enrichedActivity = responseData.data.activities[0]
      expect(enrichedActivity).toHaveProperty('upcomingSessionsCount')
      expect(enrichedActivity).toHaveProperty('totalSessionsCount')
      expect(enrichedActivity).toHaveProperty('nextSessionDate')
      expect(enrichedActivity.sessions[0]).toHaveProperty('confirmedParticipants', 2)
      expect(enrichedActivity.sessions[0]).toHaveProperty('totalParticipants', 3)
    })

    it('devrait retourner 401 si non authentifié', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/activities')

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Non authentifié')
    })
  })
})