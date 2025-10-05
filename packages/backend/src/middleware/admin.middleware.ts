/**
 * Admin authorization middleware
 * Verifies user has admin/root role
 */

import type { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Middleware to verify admin role
 * Must be used AFTER requireAuth middleware
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Check if user is attached (should be done by requireAuth)
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: 'Non authentifié',
      message: 'Vous devez être connecté pour accéder à cette ressource'
    })
  }

  // Check if user has admin role
  if (request.user.role !== 'root') {
    return reply.status(403).send({
      success: false,
      error: 'Accès refusé',
      message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource'
    })
  }

  // User is admin, continue
}

/**
 * Helper function to check if user is admin
 */
export function isAdmin(user?: { role: string }): boolean {
  return user?.role === 'root'
}

/**
 * Helper function to check if user owns resource
 */
export function isOwner(userId: string, resourceUserId: string): boolean {
  return userId === resourceUserId
}

/**
 * Middleware to verify user is admin or owns the resource
 */
export function requireAdminOrOwner(resourceUserIdGetter: (request: FastifyRequest) => string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Non authentifié'
      })
    }

    const resourceUserId = resourceUserIdGetter(request)
    const userIsAdmin = isAdmin(request.user)
    const userIsOwner = isOwner(request.user.id, resourceUserId)

    if (!userIsAdmin && !userIsOwner) {
      return reply.status(403).send({
        success: false,
        error: 'Accès refusé',
        message: 'Vous n\'avez pas les permissions nécessaires'
      })
    }
  }
}
