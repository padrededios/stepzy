/**
 * Users routes
 */

import type { FastifyInstance } from 'fastify'
import { UserService } from '../services/user.service'
import { requireAuth } from '../middleware/auth.middleware'
import { requireAdminOrOwner } from '../middleware/admin.middleware'
import { validate, commonSchemas } from '../middleware/validation.middleware'
import { z } from 'zod'

// Validation schemas
const updateProfileSchema = z.object({
  pseudo: z.string().min(3, 'Le pseudo doit contenir au moins 3 caractères').max(50),
  email: z.string().email('Email invalide'),
  avatar: z.string().url().optional().nullable()
})

const updatePreferencesSchema = z.object({
  notifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional()
})

export async function usersRoutes(fastify: FastifyInstance) {
  // GET /api/users/me - Get current user profile
  fastify.get('/api/users/me', {
    preHandler: requireAuth
  }, async (request, reply) => {
    try {
      const user = await UserService.findById(request.user!.id)

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'Utilisateur non trouvé'
        })
      }

      return reply.send({
        success: true,
        data: { user }
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération du profil'
      })
    }
  })

  // GET /api/users/:id - Get user by ID
  fastify.get('/api/users/:id', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const user = await UserService.findById(id)

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'Utilisateur non trouvé'
        })
      }

      return reply.send({
        success: true,
        data: { user }
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération du profil'
      })
    }
  })

  // PUT /api/users/profile - Update current user profile
  fastify.put('/api/users/profile', {
    preHandler: [requireAuth, validate({ body: updateProfileSchema })]
  }, async (request, reply) => {
    try {
      const data = request.body as z.infer<typeof updateProfileSchema>

      const user = await UserService.updateProfile(request.user!.id, data)

      return reply.send({
        success: true,
        data: { user },
        message: 'Profil mis à jour avec succès'
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
        error: 'Erreur lors de la mise à jour du profil'
      })
    }
  })

  // GET /api/users/:id/stats - Get user statistics
  fastify.get('/api/users/:id/stats', {
    preHandler: [
      requireAuth,
      validate({ params: commonSchemas.idParam }),
      requireAdminOrOwner((request) => (request.params as { id: string }).id)
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const stats = await UserService.getStats(id)

      return reply.send({
        success: true,
        data: { stats }
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      })
    }
  })

  // GET /api/users/:id/activities - Get user's activities
  fastify.get('/api/users/:id/activities', {
    preHandler: [
      requireAuth,
      validate({ params: commonSchemas.idParam }),
      requireAdminOrOwner((request) => (request.params as { id: string }).id)
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const sessions = await UserService.getUserActivities(id)

      return reply.send({
        success: true,
        data: { sessions }
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des activités'
      })
    }
  })

  // PUT /api/users/preferences - Update user preferences
  fastify.put('/api/users/preferences', {
    preHandler: [requireAuth, validate({ body: updatePreferencesSchema })]
  }, async (request, reply) => {
    try {
      const preferences = request.body

      const result = await UserService.updatePreferences(request.user!.id, preferences)

      return reply.send({
        success: true,
        data: result,
        message: 'Préférences mises à jour avec succès'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la mise à jour des préférences'
      })
    }
  })
}
