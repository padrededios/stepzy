/**
 * Rate Limiting Middleware
 * Protects against brute force and abuse
 */

import type { FastifyRequest, FastifyReply } from 'fastify'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 10 * 60 * 1000)

export interface RateLimitOptions {
  /**
   * Maximum number of requests
   */
  max: number

  /**
   * Time window in milliseconds
   */
  window: number

  /**
   * Identifier function (default: IP address)
   */
  keyGenerator?: (request: FastifyRequest) => string

  /**
   * Message when limit is exceeded
   */
  message?: string
}

/**
 * Create a rate limiting middleware
 *
 * @param options - Rate limit configuration
 * @returns Fastify middleware function
 *
 * @example
 * ```typescript
 * // Limit to 10 requests per minute per IP
 * const limiter = rateLimit({
 *   max: 10,
 *   window: 60 * 1000,
 *   message: 'Trop de tentatives, réessayez dans une minute'
 * })
 *
 * fastify.post('/api/activities/join-by-code', {
 *   preHandler: [requireAuth, limiter]
 * }, async (request, reply) => {
 *   // Route handler
 * })
 * ```
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    max,
    window,
    keyGenerator = (request) => {
      // Default: use IP address and user ID (if authenticated)
      const ip = request.ip
      const userId = (request as any).user?.id || 'anonymous'
      return `${ip}:${userId}`
    },
    message = 'Trop de tentatives. Veuillez réessayer plus tard.'
  } = options

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const key = keyGenerator(request)
    const now = Date.now()

    // Initialize or get existing entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + window
      }
    }

    // Increment request count
    store[key].count++

    // Check if limit exceeded
    if (store[key].count > max) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000)

      reply.header('Retry-After', retryAfter.toString())
      reply.header('X-RateLimit-Limit', max.toString())
      reply.header('X-RateLimit-Remaining', '0')
      reply.header('X-RateLimit-Reset', store[key].resetTime.toString())

      return reply.status(429).send({
        success: false,
        error: message,
        retryAfter
      })
    }

    // Add rate limit headers
    reply.header('X-RateLimit-Limit', max.toString())
    reply.header('X-RateLimit-Remaining', (max - store[key].count).toString())
    reply.header('X-RateLimit-Reset', store[key].resetTime.toString())
  }
}

/**
 * Predefined rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Strict rate limit for sensitive operations
   * 5 requests per minute
   */
  strict: () => rateLimit({
    max: 5,
    window: 60 * 1000,
    message: 'Trop de tentatives. Veuillez réessayer dans une minute.'
  }),

  /**
   * Moderate rate limit for normal operations
   * 10 requests per minute
   */
  moderate: () => rateLimit({
    max: 10,
    window: 60 * 1000,
    message: 'Trop de requêtes. Veuillez ralentir.'
  }),

  /**
   * Lenient rate limit for public endpoints
   * 30 requests per minute
   */
  lenient: () => rateLimit({
    max: 30,
    window: 60 * 1000,
    message: 'Limite de requêtes atteinte. Réessayez bientôt.'
  }),

  /**
   * Very strict for join-by-code attempts
   * 10 attempts per 5 minutes to prevent brute force
   */
  joinByCode: () => rateLimit({
    max: 10,
    window: 5 * 60 * 1000,
    message: 'Trop de tentatives de code. Réessayez dans 5 minutes.'
  })
}
