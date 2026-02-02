/**
 * Notifications routes
 */

import type { FastifyInstance } from 'fastify'
import { NotificationService } from '../services/notification.service'
import { requireAuth } from '../middleware/auth.middleware'
import { validate, commonSchemas } from '../middleware/validation.middleware'
import { z } from 'zod'

// Validation schemas
const notificationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  unreadOnly: z.string().transform(val => val === 'true').optional()
})

const markAsReadSchema = z.object({
  action: z.literal('mark_read')
})

const markAllAsReadSchema = z.object({
  action: z.literal('mark_all_read')
})

const deleteMultipleSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional()
}).refine(data => data.ids || data.all, {
  message: 'Either "ids" array or "all: true" must be provided'
})

export async function notificationsRoutes(fastify: FastifyInstance) {
  // GET /api/notifications - Get user's notifications
  fastify.get('/api/notifications', {
    preHandler: [requireAuth, validate({ query: notificationQuerySchema })]
  }, async (request, reply) => {
    try {
      const query = request.query as z.infer<typeof notificationQuerySchema>

      const result = await NotificationService.findMany(request.user!.id, {
        limit: query.limit,
        offset: query.offset,
        unreadOnly: query.unreadOnly
      })

      return reply.send({
        success: true,
        data: result
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des notifications'
      })
    }
  })

  // GET /api/notifications/count - Get unread count
  fastify.get('/api/notifications/count', {
    preHandler: requireAuth
  }, async (request, reply) => {
    try {
      const count = await NotificationService.getUnreadCount(request.user!.id)

      return reply.send({
        success: true,
        data: { count }
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors du comptage des notifications'
      })
    }
  })

  // PUT /api/notifications/:id - Mark single notification as read
  fastify.put('/api/notifications/:id', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam, body: markAsReadSchema })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      await NotificationService.markAsRead(id, request.user!.id)

      return reply.send({
        success: true,
        message: 'Notification marquée comme lue'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la mise à jour de la notification'
      })
    }
  })

  // PUT /api/notifications - Mark all as read
  fastify.put('/api/notifications', {
    preHandler: [requireAuth, validate({ body: markAllAsReadSchema })]
  }, async (request, reply) => {
    try {
      await NotificationService.markAllAsRead(request.user!.id)

      return reply.send({
        success: true,
        message: 'Toutes les notifications ont été marquées comme lues'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la mise à jour des notifications'
      })
    }
  })

  // DELETE /api/notifications/:id - Delete single notification
  fastify.delete('/api/notifications/:id', {
    preHandler: [requireAuth, validate({ params: commonSchemas.idParam })]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      await NotificationService.delete(id, request.user!.id)

      return reply.send({
        success: true,
        message: 'Notification supprimée'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la suppression de la notification'
      })
    }
  })

  // DELETE /api/notifications - Delete multiple or all notifications
  fastify.delete('/api/notifications', {
    preHandler: [requireAuth, validate({ body: deleteMultipleSchema })]
  }, async (request, reply) => {
    try {
      const body = request.body as z.infer<typeof deleteMultipleSchema>

      if (body.all) {
        await NotificationService.deleteAll(request.user!.id)
        return reply.send({
          success: true,
          message: 'Toutes les notifications ont été supprimées'
        })
      }

      if (body.ids && body.ids.length > 0) {
        await NotificationService.deleteMultiple(body.ids, request.user!.id)
        return reply.send({
          success: true,
          message: `${body.ids.length} notification(s) supprimée(s)`
        })
      }

      return reply.status(400).send({
        success: false,
        error: 'Aucune notification à supprimer'
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la suppression des notifications'
      })
    }
  })
}
