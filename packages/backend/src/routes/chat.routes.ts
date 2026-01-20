/**
 * Chat routes
 */

import type { FastifyInstance } from 'fastify'
import { ChatService } from '../services/chat.service'
import { requireAuth } from '../middleware/auth.middleware'
import { validate } from '../middleware/validation.middleware'
import { z } from 'zod'

// Validation schemas
const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000, 'Le message ne peut pas dépasser 2000 caractères')
})

const getMessagesSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  before: z.string().optional() // ISO date string
})

const roomIdParam = z.object({
  roomId: z.string().min(1, 'Room ID requis')
})

const activityIdParam = z.object({
  activityId: z.string().min(1, 'Activity ID requis')
})

export async function chatRoutes(fastify: FastifyInstance) {
  // GET /api/chat/rooms - Get user's accessible chat rooms
  fastify.get('/api/chat/rooms', {
    preHandler: requireAuth
  }, async (request, reply) => {
    try {
      const rooms = await ChatService.getUserRooms(request.user!.id)

      return reply.send({
        success: true,
        data: rooms
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des salons'
      })
    }
  })

  // GET /api/chat/unread - Get unread message counts
  fastify.get('/api/chat/unread', {
    preHandler: requireAuth
  }, async (request, reply) => {
    try {
      const unreadCounts = await ChatService.getUnreadCounts(request.user!.id)
      const totalUnread = unreadCounts.reduce((sum, room) => sum + room.unreadCount, 0)

      return reply.send({
        success: true,
        data: {
          rooms: unreadCounts,
          total: totalUnread
        }
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des messages non lus'
      })
    }
  })

  // GET /api/chat/rooms/:roomId - Get room details
  fastify.get('/api/chat/rooms/:roomId', {
    preHandler: [requireAuth, validate({ params: roomIdParam })]
  }, async (request, reply) => {
    try {
      const { roomId } = request.params as { roomId: string }

      const room = await ChatService.getRoomById(roomId, request.user!.id)

      if (!room) {
        return reply.status(404).send({
          success: false,
          error: 'Salon non trouvé'
        })
      }

      return reply.send({
        success: true,
        data: room
      })
    } catch (error) {
      request.log.error(error)

      if (error instanceof Error && error.message.includes('accès')) {
        return reply.status(403).send({
          success: false,
          error: error.message
        })
      }

      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération du salon'
      })
    }
  })

  // GET /api/chat/rooms/:roomId/messages - Get messages for a room
  fastify.get('/api/chat/rooms/:roomId/messages', {
    preHandler: [requireAuth, validate({ params: roomIdParam, query: getMessagesSchema })]
  }, async (request, reply) => {
    try {
      const { roomId } = request.params as { roomId: string }
      const query = request.query as z.infer<typeof getMessagesSchema>

      const messages = await ChatService.getMessages(roomId, request.user!.id, {
        limit: query.limit,
        before: query.before
      })

      return reply.send({
        success: true,
        data: messages
      })
    } catch (error) {
      request.log.error(error)

      if (error instanceof Error && error.message.includes('accès')) {
        return reply.status(403).send({
          success: false,
          error: error.message
        })
      }

      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération des messages'
      })
    }
  })

  // POST /api/chat/rooms/:roomId/messages - Send a message
  fastify.post('/api/chat/rooms/:roomId/messages', {
    preHandler: [requireAuth, validate({ params: roomIdParam, body: sendMessageSchema })]
  }, async (request, reply) => {
    try {
      const { roomId } = request.params as { roomId: string }
      const { content } = request.body as z.infer<typeof sendMessageSchema>

      const message = await ChatService.sendMessage(roomId, request.user!.id, content)

      return reply.status(201).send({
        success: true,
        data: message
      })
    } catch (error) {
      request.log.error(error)

      if (error instanceof Error && error.message.includes('accès')) {
        return reply.status(403).send({
          success: false,
          error: error.message
        })
      }

      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de l\'envoi du message'
      })
    }
  })

  // PUT /api/chat/rooms/:roomId/read - Mark room as read
  fastify.put('/api/chat/rooms/:roomId/read', {
    preHandler: [requireAuth, validate({ params: roomIdParam })]
  }, async (request, reply) => {
    try {
      const { roomId } = request.params as { roomId: string }

      await ChatService.markAsRead(roomId, request.user!.id)

      return reply.send({
        success: true,
        message: 'Salon marqué comme lu'
      })
    } catch (error) {
      request.log.error(error)

      if (error instanceof Error && error.message.includes('accès')) {
        return reply.status(403).send({
          success: false,
          error: error.message
        })
      }

      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la mise à jour'
      })
    }
  })

  // GET /api/chat/activity/:activityId/room - Get or create room for an activity
  fastify.get('/api/chat/activity/:activityId/room', {
    preHandler: [requireAuth, validate({ params: activityIdParam })]
  }, async (request, reply) => {
    try {
      const { activityId } = request.params as { activityId: string }

      // Verify user has access to this activity
      const room = await ChatService.getOrCreateRoom(activityId)

      // Verify user can access this room
      const hasAccess = await ChatService.canAccessRoom(room.id, request.user!.id)
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          error: 'Vous devez être inscrit à cette activité pour accéder au salon'
        })
      }

      return reply.send({
        success: true,
        data: room
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: 'Erreur lors de la récupération du salon'
      })
    }
  })
}
