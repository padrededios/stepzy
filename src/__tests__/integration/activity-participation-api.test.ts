/**
 * Tests d'intégration pour les APIs de participation aux sessions
 */

import { NextRequest } from 'next/server'
import { POST, DELETE } from '@/app/api/activities/sessions/[sessionId]/join/route'
import { auth } from '@/lib/auth'
import { ActivityParticipationService } from '@/lib/services/activity-participation.service'

// Mock des dépendances
jest.mock('@/lib/auth')
jest.mock('@/lib/services/activity-participation.service')

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockParticipationService = ActivityParticipationService as jest.Mocked<typeof ActivityParticipationService>

describe('/api/activities/sessions/[sessionId]/join', () => {
  const mockUser = {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      pseudo: 'TestUser',
      role: 'user'
    }
  }

  const mockSession = {
    id: 'session-1',
    date: new Date(),
    maxPlayers: 12,
    participants: []
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST - Rejoindre une session', () => {
    it('devrait inscrire l\'utilisateur avec succès', async () => {
      mockAuth.mockResolvedValue(mockUser as any)

      mockParticipationService.canUserJoinSession.mockResolvedValue({
        canJoin: true,
        wouldBeWaiting: false
      })

      const mockParticipation = {
        id: 'participation-1',
        status: 'confirmed' as const,
        joinedAt: new Date()
      }

      mockParticipationService.joinSession.mockResolvedValue(mockParticipation as any)
      mockParticipationService.getSessionStats.mockResolvedValue({
        confirmedCount: 1,
        waitingCount: 0,
        totalCount: 1,
        availableSpots: 11
      })

      const request = new NextRequest('http://localhost:3000/api/activities/sessions/session-1/join', {
        method: 'POST'
      })

      const response = await POST(request, { params: { sessionId: 'session-1' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.participation.status).toBe('confirmed')
      expect(responseData.data.message).toBe('Inscription confirmée !')
      expect(responseData.data.sessionStats.confirmedCount).toBe(1)

      expect(mockParticipationService.canUserJoinSession).toHaveBeenCalledWith('session-1', 'user-1')
      expect(mockParticipationService.joinSession).toHaveBeenCalledWith('session-1', 'user-1')
      expect(mockParticipationService.getSessionStats).toHaveBeenCalledWith('session-1')
    })

    it('devrait indiquer quand l\'utilisateur est ajouté à la liste d\'attente', async () => {
      mockAuth.mockResolvedValue(mockUser as any)

      mockParticipationService.canUserJoinSession.mockResolvedValue({
        canJoin: true,
        wouldBeWaiting: true
      })

      const mockParticipation = {
        id: 'participation-1',
        status: 'waiting' as const,
        joinedAt: new Date()
      }

      mockParticipationService.joinSession.mockResolvedValue(mockParticipation as any)
      mockParticipationService.getSessionStats.mockResolvedValue({
        confirmedCount: 12,
        waitingCount: 1,
        totalCount: 13,
        availableSpots: 0
      })

      const request = new NextRequest('http://localhost:3000/api/activities/sessions/session-1/join', {
        method: 'POST'
      })

      const response = await POST(request, { params: { sessionId: 'session-1' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.participation.status).toBe('waiting')
      expect(responseData.data.message).toBe('Ajouté à la liste d\'attente')
    })

    it('devrait retourner 400 si l\'utilisateur ne peut pas rejoindre', async () => {
      mockAuth.mockResolvedValue(mockUser as any)

      mockParticipationService.canUserJoinSession.mockResolvedValue({
        canJoin: false,
        reason: 'Vous êtes déjà inscrit à cette session',
        wouldBeWaiting: false
      })

      const request = new NextRequest('http://localhost:3000/api/activities/sessions/session-1/join', {
        method: 'POST'
      })

      const response = await POST(request, { params: { sessionId: 'session-1' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Vous êtes déjà inscrit à cette session')
    })

    it('devrait retourner 401 si non authentifié', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/activities/sessions/session-1/join', {
        method: 'POST'
      })

      const response = await POST(request, { params: { sessionId: 'session-1' } })
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Non authentifié')
    })

    it('devrait gérer les erreurs du service', async () => {
      mockAuth.mockResolvedValue(mockUser as any)

      mockParticipationService.canUserJoinSession.mockResolvedValue({
        canJoin: true,
        wouldBeWaiting: false
      })

      mockParticipationService.joinSession.mockRejectedValue(new Error('Session non trouvée'))

      const request = new NextRequest('http://localhost:3000/api/activities/sessions/session-1/join', {
        method: 'POST'
      })

      const response = await POST(request, { params: { sessionId: 'session-1' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Session non trouvée')
    })
  })

  describe('DELETE - Quitter une session', () => {
    it('devrait désinscrire l\'utilisateur avec succès', async () => {
      mockAuth.mockResolvedValue(mockUser as any)

      mockParticipationService.leaveSession.mockResolvedValue()
      mockParticipationService.getSessionStats.mockResolvedValue({
        confirmedCount: 10,
        waitingCount: 2,
        totalCount: 12,
        availableSpots: 2
      })

      const request = new NextRequest('http://localhost:3000/api/activities/sessions/session-1/join', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { sessionId: 'session-1' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.message).toBe('Désinscription réussie')
      expect(responseData.data.sessionStats.confirmedCount).toBe(10)

      expect(mockParticipationService.leaveSession).toHaveBeenCalledWith('session-1', 'user-1')
      expect(mockParticipationService.getSessionStats).toHaveBeenCalledWith('session-1')
    })

    it('devrait retourner 400 si l\'utilisateur n\'est pas inscrit', async () => {
      mockAuth.mockResolvedValue(mockUser as any)

      mockParticipationService.leaveSession.mockRejectedValue(
        new Error('Vous n\'êtes pas inscrit à cette session')
      )

      const request = new NextRequest('http://localhost:3000/api/activities/sessions/session-1/join', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { sessionId: 'session-1' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Vous n\'êtes pas inscrit à cette session')
    })

    it('devrait retourner 401 si non authentifié', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/activities/sessions/session-1/join', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { sessionId: 'session-1' } })
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Non authentifié')
    })

    it('devrait gérer les erreurs inattendues', async () => {
      mockAuth.mockResolvedValue(mockUser as any)

      mockParticipationService.leaveSession.mockRejectedValue(
        new Error('Erreur de base de données')
      )

      const request = new NextRequest('http://localhost:3000/api/activities/sessions/session-1/join', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { sessionId: 'session-1' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Erreur de base de données')
    })
  })
})