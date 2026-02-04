/**
 * Sessions routes
 */

import type { FastifyInstance } from 'fastify'
import { ActivitySessionService } from '../services/activity-session.service'
import { requireAuth } from '../middleware/auth.middleware'
import { validate, commonSchemas } from '../middleware/validation.middleware'
import { z } from 'zod'

// Validation schemas
const updateSessionSchema = z.object({
  maxPlayers: z.number().min(2).max(100).optional(),
  isCancelled: z.boolean().optional()
})

export async function sessionsRoutes(fastify: FastifyInstance) {
  // GET /api/sessions/:id - Get session by ID
  fastify.get('/api/sessions/:id', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const session = await ActivitySessionService.findById(id)

      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'Session non trouvée'
        })
      }

      return reply.send({
        success: true,
        data: session
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération de la session'
      })
    }
  })

  // PUT /api/sessions/:id - Update session
  fastify.put('/api/sessions/:id', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam, body: updateSessionSchema })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = request.body as z.infer<typeof updateSessionSchema>

      const session = await ActivitySessionService.update(id, data)

      return reply.send({
        success: true,
        data: session,
        message: 'Session mise à jour avec succès'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la session'
      })
    }
  })

  // POST /api/sessions/:id/join - Join session
  fastify.post('/api/sessions/:id/join', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const participant = await ActivitySessionService.joinSession(id, request.user!.id)

      const message = participant.status === 'confirmed'
        ? 'Vous avez rejoint la session avec succès'
        : 'Vous êtes sur liste d\'attente pour cette session'

      return reply.send({
        success: true,
        data: participant,
        message
      })
    } catch (error) {
      request.log.error(error)

      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          error: error.message
        })
      }

      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de l\'inscription à la session'
      })
    }
  })

  // POST /api/sessions/:id/swap-players - Swap a field player with a substitute
  fastify.post('/api/sessions/:id/swap-players', {
    preHandler: [requireAuth, validate({
      params: commonSchemas.idParam,
      body: z.object({
        fieldPlayerId: z.string().min(1),
        substitutePlayerId: z.string().min(1)
      })
    })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { fieldPlayerId, substitutePlayerId } = request.body as {
        fieldPlayerId: string
        substitutePlayerId: string
      }

      const session = await ActivitySessionService.swapPlayers(
        id,
        fieldPlayerId,
        substitutePlayerId,
        request.user!.id
      )

      return reply.send({
        success: true,
        data: session,
        message: 'Joueurs échangés avec succès'
      })
    } catch (error) {
      request.log.error(error)

      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          error: error.message
        })
      }

      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de l\'échange des joueurs'
      })
    }
  })

  // POST /api/sessions/:id/leave - Leave session
  fastify.post('/api/sessions/:id/leave', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      await ActivitySessionService.leaveSession(id, request.user!.id)

      return reply.send({
        success: true,
        message: 'Vous avez quitté la session avec succès'
      })
    } catch (error) {
      request.log.error(error)

      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          error: error.message
        })
      }

      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la désinscription de la session'
      })
    }
  })
}
