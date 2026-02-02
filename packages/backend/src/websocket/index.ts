/**
 * WebSocket Server Configuration
 * Handles real-time chat and notifications
 */

import type { FastifyInstance } from 'fastify'
import websocket from '@fastify/websocket'
import { ChatService } from '../services/chat.service'
import { auth } from '../lib/auth'

// Store active connections by room
const chatConnections = new Map<string, Set<any>>()

// Store notification connections by user
const notificationConnections = new Map<string, Set<any>>()

interface WSMessage {
  type: 'message' | 'typing' | 'read' | 'error' | 'notification'
  data?: any
}

export async function registerWebSocket(fastify: FastifyInstance) {
  // Register WebSocket plugin
  await fastify.register(websocket)

  /**
   * WebSocket route for chat rooms
   * /ws/chat/:roomId
   */
  fastify.get('/ws/chat/:roomId', { websocket: true }, async (connection, req) => {
    const socket = connection.socket
    const { roomId } = req.params as { roomId: string }

    try {
      // Try to get token from query params or cookies
      const query = req.query as { token?: string }
      const token = query.token

      let session
      if (token) {
        // Authenticate using token from URL
        const headers = {
          ...req.headers,
          cookie: `better-auth.session_token=${token}`
        }
        session = await auth.api.getSession({ headers })
      } else {
        // Authenticate using cookies from headers
        session = await auth.api.getSession({ headers: req.headers })
      }

      if (!session?.user?.id) {
        socket.send(JSON.stringify({
          type: 'error',
          data: { message: 'Non authentifié' }
        }))
        socket.close()
        return
      }

      const userId = session.user.id

      // Verify user has access to this room
      const hasAccess = await ChatService.canAccessRoom(roomId, userId)
      if (!hasAccess) {
        socket.send(JSON.stringify({
          type: 'error',
          data: { message: 'Accès refusé à ce salon' }
        }))
        socket.close()
        return
      }

      // Add connection to room
      if (!chatConnections.has(roomId)) {
        chatConnections.set(roomId, new Set())
      }
      chatConnections.get(roomId)!.add(socket)

      console.log(`[WebSocket] User ${userId} joined room ${roomId}`)

      // Mark room as read when user connects
      await ChatService.markAsRead(roomId, userId).catch(err => {
        console.error('[WebSocket] Error marking room as read:', err)
      })

      // Handle incoming messages
      socket.on('message', async (rawMessage: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(rawMessage.toString())

          switch (message.type) {
            case 'message':
              // Send message
              const chatMessage = await ChatService.sendMessage(
                roomId,
                userId,
                message.data.content
              )

              // Broadcast to all room members
              broadcastToRoom(roomId, {
                type: 'message',
                data: chatMessage
              })
              break

            case 'typing':
              // Broadcast typing indicator to room (except sender)
              broadcastToRoom(roomId, {
                type: 'typing',
                data: {
                  userId,
                  pseudo: session.user.pseudo,
                  isTyping: message.data.isTyping
                }
              }, socket)
              break

            case 'read':
              // Mark room as read
              await ChatService.markAsRead(roomId, userId)
              break

            default:
              console.warn('[WebSocket] Unknown message type:', message.type)
          }
        } catch (error) {
          console.error('[WebSocket] Error handling message:', error)
          socket.send(JSON.stringify({
            type: 'error',
            data: { message: 'Erreur lors du traitement du message' }
          }))
        }
      })

      // Handle disconnection
      socket.on('close', () => {
        console.log(`[WebSocket] User ${userId} left room ${roomId}`)
        chatConnections.get(roomId)?.delete(socket)

        // Clean up empty room sets
        if (chatConnections.get(roomId)?.size === 0) {
          chatConnections.delete(roomId)
        }
      })

      socket.on('error', (error) => {
        console.error('[WebSocket] Socket error:', error)
        chatConnections.get(roomId)?.delete(socket)
      })

    } catch (error) {
      console.error('[WebSocket] Error in chat connection:', error)
      socket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Erreur de connexion' }
      }))
      socket.close()
    }
  })

  /**
   * WebSocket route for notifications
   * /ws/notifications
   */
  fastify.get('/ws/notifications', { websocket: true }, async (connection, req) => {
    const socket = connection.socket

    try {
      console.log('[WebSocket] Notification connection attempt')

      // Try to get token from query params or cookies
      const query = req.query as { token?: string }
      const token = query.token

      let session
      if (token) {
        // Authenticate using token from URL
        console.log('[WebSocket] Using token from URL')
        const headers = {
          ...req.headers,
          cookie: `better-auth.session_token=${token}`
        }
        session = await auth.api.getSession({ headers })
      } else {
        // Authenticate using cookies from headers
        console.log('[WebSocket] Using cookies from headers')
        session = await auth.api.getSession({ headers: req.headers })
      }

      console.log('[WebSocket] Session result:', session ? `Found user ${session.user?.id}` : 'Not found')

      if (!session?.user?.id) {
        console.log('[WebSocket] Authentication failed - closing connection')
        socket.send(JSON.stringify({
          type: 'error',
          data: { message: 'Non authentifié' }
        }))
        socket.close()
        return
      }

      const userId = session.user.id

      // Add connection to notification connections
      if (!notificationConnections.has(userId)) {
        notificationConnections.set(userId, new Set())
      }
      notificationConnections.get(userId)!.add(socket)

      console.log(`[WebSocket] User ${userId} connected to notifications`)

      // Send welcome message
      socket.send(JSON.stringify({
        type: 'connected',
        data: { message: 'Connecté aux notifications en temps réel' }
      }))

      // Handle disconnection
      socket.on('close', () => {
        console.log(`[WebSocket] User ${userId} disconnected from notifications`)
        notificationConnections.get(userId)?.delete(socket)

        // Clean up empty user sets
        if (notificationConnections.get(userId)?.size === 0) {
          notificationConnections.delete(userId)
        }
      })

      socket.on('error', (error) => {
        console.error('[WebSocket] Notification socket error:', error)
        notificationConnections.get(userId)?.delete(socket)
      })

    } catch (error) {
      console.error('[WebSocket] Error in notification connection:', error)
      socket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Erreur de connexion' }
      }))
      socket.close()
    }
  })

  console.log('[WebSocket] WebSocket routes registered')
}

/**
 * Broadcast message to all connections in a room
 */
function broadcastToRoom(roomId: string, message: WSMessage, except?: any) {
  const connections = chatConnections.get(roomId)
  if (!connections) return

  const messageStr = JSON.stringify(message)

  connections.forEach(socket => {
    if (socket !== except && socket.readyState === 1) { // 1 = OPEN
      socket.send(messageStr)
    }
  })
}

/**
 * Send notification to a specific user
 */
export function sendNotificationToUser(userId: string, notification: any) {
  const connections = notificationConnections.get(userId)
  if (!connections) return

  const message = JSON.stringify({
    type: 'notification',
    data: notification
  })

  connections.forEach(socket => {
    if (socket.readyState === 1) { // 1 = OPEN
      socket.send(message)
    }
  })
}

/**
 * Broadcast chat message to room (for use by services)
 */
export function broadcastChatMessage(roomId: string, message: any) {
  broadcastToRoom(roomId, {
    type: 'message',
    data: message
  })
}
