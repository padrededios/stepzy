/**
 * Admin routes
 * Protected by requireAdmin middleware
 */

import type { FastifyInstance } from 'fastify'
import { AdminService } from '../services/admin.service'
import { prisma } from '../database/prisma'
import { requireAuth } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import { validate, commonSchemas } from '../middleware/validation.middleware'
import { z } from 'zod'

// Validation schemas
const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['user', 'root']).optional()
})

const updateUserSchema = z.object({
  pseudo: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'root']).optional(),
  avatar: z.string().url().optional().nullable()
})

export async function adminRoutes(fastify: FastifyInstance) {
  // GET /api/admin/users - List all users
  fastify.get('/api/admin/users', {
    preHandler: [requireAuth, requireAdmin, validate({ query: getUsersQuerySchema })]
  }, async (request, reply) => {
    try {
      const filters = request.query as z.infer<typeof getUsersQuerySchema>

      const result = await AdminService.getUsers(filters)

      return reply.send({
        success: true,
        data: result
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des utilisateurs'
      })
    }
  })

  // GET /api/admin/users/:id - Get user by ID
  fastify.get('/api/admin/users/:id', {
    preHandler: [requireAuth, requireAdmin, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              activityParticipations: true,
              createdActivities: true
            }
          }
        }
      })

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
        error: 'Erreur lors de la récupération de l\'utilisateur'
      })
    }
  })

  // PUT /api/admin/users/:id - Update user
  fastify.put('/api/admin/users/:id', {
    preHandler: [requireAuth, requireAdmin, validate({ params: commonSchemas.idParam, body: updateUserSchema })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = request.body as z.infer<typeof updateUserSchema>

      const user = await AdminService.updateUser(id, data)

      return reply.send({
        success: true,
        data: { user },
        message: 'Utilisateur mis à jour avec succès'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la mise à jour de l\'utilisateur'
      })
    }
  })

  // DELETE /api/admin/users/:id - Delete user
  fastify.delete('/api/admin/users/:id', {
    preHandler: [requireAuth, requireAdmin, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      // Prevent admin from deleting themselves
      if (id === request.user!.id) {
        return reply.status(400).send({
          success: false,
          error: 'Vous ne pouvez pas supprimer votre propre compte'
        })
      }

      await AdminService.deleteUser(id)

      return reply.send({
        success: true,
        message: 'Utilisateur supprimé avec succès'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la suppression de l\'utilisateur'
      })
    }
  })

  // GET /api/admin/statistics - Get platform statistics
  fastify.get('/api/admin/statistics', {
    preHandler: [requireAuth, requireAdmin]
  }, async (request, reply) => {
    try {
      const stats = await AdminService.getStatistics()

      return reply.send({
        success: true,
        data: stats
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      })
    }
  })

  // GET /api/admin/activity-logs - Get recent activity logs
  fastify.get('/api/admin/activity-logs', {
    preHandler: [requireAuth, requireAdmin]
  }, async (request, reply) => {
    try {
      const { limit } = request.query as { limit?: number }

      const logs = await AdminService.getActivityLogs(limit ? Number(limit) : 50)

      return reply.send({
        success: true,
        data: logs
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des logs'
      })
    }
  })
}
