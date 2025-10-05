/**
 * Activities routes
 */

import type { FastifyInstance } from 'fastify'
import { ActivityService } from '../services/activity.service'
import { ActivitySessionService } from '../services/activity-session.service'
import { requireAuth } from '../middleware/auth.middleware'
import { validate, commonSchemas } from '../middleware/validation.middleware'
import { z } from 'zod'
import type { SportType, DayOfWeek, RecurringType } from '@stepzy/shared'

// Validation schemas
const createActivitySchema = z.object({
  name: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
  description: z.string().optional(),
  sport: z.enum(['football', 'badminton', 'volley', 'pingpong', 'rugby'] as const),
  minPlayers: z.number().min(2, 'Le nombre minimum de joueurs doit être au moins 2'),
  maxPlayers: z.number().min(2).max(100, 'Le nombre maximum de joueurs ne peut pas dépasser 100'),
  recurringDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const)),
  recurringType: z.enum(['weekly', 'monthly'] as const),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)')
}).refine(data => data.minPlayers <= data.maxPlayers, {
  message: 'Le nombre minimum de joueurs ne peut pas être supérieur au nombre maximum',
  path: ['minPlayers']
}).refine(data => data.startTime < data.endTime, {
  message: 'L\'heure de fin doit être après l\'heure de début',
  path: ['endTime']
})

const updateActivitySchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  minPlayers: z.number().min(2).optional(),
  maxPlayers: z.number().min(2).max(100).optional(),
  recurringDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const)).optional(),
  recurringType: z.enum(['weekly', 'monthly'] as const).optional()
})

const activityFiltersSchema = z.object({
  sport: z.string().optional(),
  createdBy: z.string().optional(),
  isPublic: z.string().transform(val => val === 'true').optional(),
  recurringType: z.enum(['weekly', 'monthly'] as const).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
})

export async function activitiesRoutes(fastify: FastifyInstance) {
  // GET /api/activities - Get all activities with filters
  fastify.get('/api/activities', {
    preHandler: [requireAuth, validate({ query: activityFiltersSchema })]
  }, async (request, reply) => {
    try {
      const query = request.query as z.infer<typeof activityFiltersSchema>
      const { page, limit, ...filters } = query

      const result = await ActivityService.findMany(
        request.user!.id,
        filters as any, // Cast to ActivityFilters
        { page, limit }
      )

      return reply.send({
        success: true,
        data: result
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des activités'
      })
    }
  })

  // POST /api/activities - Create activity
  fastify.post('/api/activities', {
    preHandler: [requireAuth, validate({ body: createActivitySchema })]
  }, async (request, reply) => {
    try {
      const data = request.body as z.infer<typeof createActivitySchema>

      // Create activity
      const activity = await ActivityService.create(request.user!.id, data)

      // Generate sessions (2 weeks ahead)
      await ActivitySessionService.generateSessions(activity.id, new Date(), 2)

      // Fetch activity with sessions
      const activityWithSessions = await ActivityService.findById(activity.id, request.user!.id)

      return reply.status(201).send({
        success: true,
        data: activityWithSessions,
        message: `Activité "${activity.name}" créée avec succès`
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création de l\'activité'
      })
    }
  })

  // GET /api/activities/:id - Get activity by ID
  fastify.get('/api/activities/:id', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const activity = await ActivityService.findById(id, request.user!.id)

      if (!activity) {
        return reply.status(404).send({
          success: false,
          error: 'Activité non trouvée'
        })
      }

      return reply.send({
        success: true,
        data: activity
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération de l\'activité'
      })
    }
  })

  // PUT /api/activities/:id - Update activity
  fastify.put('/api/activities/:id', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam, body: updateActivitySchema })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = request.body as z.infer<typeof updateActivitySchema>

      const activity = await ActivityService.update(id, request.user!.id, data)

      return reply.send({
        success: true,
        data: activity,
        message: 'Activité mise à jour avec succès'
      })
    } catch (error) {
      request.log.error(error)

      if (error instanceof Error && error.message.includes('autorisé')) {
        return reply.status(403).send({
          success: false,
          error: error.message
        })
      }

      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'activité'
      })
    }
  })

  // DELETE /api/activities/:id - Delete activity
  fastify.delete('/api/activities/:id', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      await ActivityService.delete(id, request.user!.id)

      return reply.send({
        success: true,
        message: 'Activité supprimée avec succès'
      })
    } catch (error) {
      request.log.error(error)

      if (error instanceof Error && error.message.includes('autorisé')) {
        return reply.status(403).send({
          success: false,
          error: error.message
        })
      }

      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'activité'
      })
    }
  })

  // POST /api/activities/:id/subscribe - Subscribe to activity
  fastify.post('/api/activities/:id/subscribe', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      await ActivityService.subscribe(id, request.user!.id)

      return reply.send({
        success: true,
        message: 'Vous êtes maintenant abonné à cette activité'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'abonnement'
      })
    }
  })

  // DELETE /api/activities/:id/subscribe - Unsubscribe from activity
  fastify.delete('/api/activities/:id/subscribe', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      await ActivityService.unsubscribe(id, request.user!.id)

      return reply.send({
        success: true,
        message: 'Vous n\'êtes plus abonné à cette activité'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors du désabonnement'
      })
    }
  })

  // GET /api/activities/my-created - Get user's created activities
  fastify.get('/api/activities/my-created', {
    preHandler: requireAuth
  }, async (request, reply) => {
    try {
      const activities = await ActivityService.findByCreator(request.user!.id)

      return reply.send({
        success: true,
        data: activities
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération de vos activités'
      })
    }
  })

  // GET /api/activities/my-participations - Get user's participations
  fastify.get('/api/activities/my-participations', {
    preHandler: requireAuth
  }, async (request, reply) => {
    try {
      const activities = await ActivityService.findUserParticipations(request.user!.id)

      return reply.send({
        success: true,
        data: activities
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération de vos participations'
      })
    }
  })

  // GET /api/activities/upcoming-sessions - Get upcoming sessions
  fastify.get('/api/activities/upcoming-sessions', {
    preHandler: requireAuth
  }, async (request, reply) => {
    try {
      const sessions = await ActivitySessionService.getUpcomingSessions(20, request.user!.id)

      return reply.send({
        success: true,
        data: sessions
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des sessions à venir'
      })
    }
  })
}
