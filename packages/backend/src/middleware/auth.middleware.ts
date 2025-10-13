/**
 * Authentication middleware using Better-auth
 * Verifies user session and attaches user to request
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { auth } from '../lib/auth'

// Extend Fastify request type to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email: string
      pseudo: string
      avatar?: string | null
      role: 'user' | 'root'
    }
    session?: {
      token: string
      expiresAt: Date
    }
  }
}

/**
 * Middleware to verify authentication
 * Checks Better-auth session and attaches user to request
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Get session from Better-auth using request headers
    const session = await auth.api.getSession({
      headers: request.headers as unknown as Headers
    })

    if (!session) {
      return reply.status(401).send({
        success: false,
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      })
    }

    // Attach user and session to request
    request.user = {
      id: session.user.id,
      email: session.user.email,
      pseudo: (session.user as any).pseudo || session.user.name || '',
      avatar: (session.user as any).avatar || session.user.image || null,
      role: ((session.user as any).role as 'user' | 'root') || 'user'
    }

    request.session = {
      token: session.session.token,
      expiresAt: new Date(session.session.expiresAt)
    }

    // Continue to next handler
  } catch (error) {
    request.log.error(error, 'Authentication error')
    return reply.status(401).send({
      success: false,
      error: 'Session invalide',
      message: 'Votre session a expiré ou est invalide'
    })
  }
}

/**
 * Optional authentication middleware
 * Attaches user if authenticated, but doesn't require it
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as unknown as Headers
    })

    if (session) {
      request.user = {
        id: session.user.id,
        email: session.user.email,
        pseudo: (session.user as any).pseudo || session.user.name || '',
        avatar: (session.user as any).avatar || session.user.image || null,
        role: ((session.user as any).role as 'user' | 'root') || 'user'
      }

      request.session = {
        token: session.session.token,
        expiresAt: new Date(session.session.expiresAt)
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    request.log.debug(error, 'Optional auth failed')
  }
}
