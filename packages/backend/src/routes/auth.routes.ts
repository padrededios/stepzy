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

    const webRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers as HeadersInit,
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? JSON.stringify(request.body)
        : undefined
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
