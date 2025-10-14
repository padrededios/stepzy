/**
 * Authentication routes using Better-auth
 * Handles all /api/auth/* requests
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { auth } from '../lib/auth'

export async function authRoutes(fastify: FastifyInstance) {
  // Better-auth catch-all route
  // Handles all /api/auth/* requests and delegates to Better-auth
  fastify.all('/api/auth/*', async (request: FastifyRequest, reply: FastifyReply) => {
    // Convert Fastify request to Web Request format for Better-auth
    const url = new URL(request.url, `http://${request.headers.host}`)

    // Get body content
    let bodyContent: string | undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // Fastify parses JSON automatically, so request.body is already an object
      // We need to stringify it for the Web Request
      if (request.body !== null && request.body !== undefined) {
        try {
          bodyContent = typeof request.body === 'string'
            ? request.body
            : JSON.stringify(request.body)
        } catch (error) {
          fastify.log.error('Error stringifying request body:', error)
          return reply.status(400).send({ error: 'Invalid request body' })
        }
      }
    }

    try {
      const webRequest = new Request(url.toString(), {
        method: request.method,
        headers: request.headers as HeadersInit,
        body: bodyContent
      })

      // Call Better-auth handler
      const response = await auth.handler(webRequest)

      // Set response headers
      response.headers.forEach((value, key) => {
        reply.header(key, value)
      })

      // Set status code
      reply.status(response.status)

      // Return response body
      const body = await response.text()

      // If response is JSON, parse and send
      if (response.headers.get('content-type')?.includes('application/json')) {
        return reply.send(JSON.parse(body))
      }

      // Otherwise send as text
      return reply.send(body)
    } catch (error) {
      fastify.log.error('Better-auth handler error:', error)
      return reply.status(500).send({
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Health check for auth system
  fastify.get('/api/auth/health', async () => {
    return {
      status: 'ok',
      service: 'authentication',
      provider: 'better-auth'
    }
  })
}
