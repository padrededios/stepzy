/**
 * Stepzy Backend API
 * Fastify server with Better-auth authentication
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001
const HOST = process.env.HOST || '0.0.0.0'

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
})

// Register plugins
await fastify.register(cors, {
  origin: [
    'http://localhost:3000', // web-app dev
    'http://localhost:3002', // admin-app dev
    process.env.WEB_APP_URL || '',
    process.env.ADMIN_APP_URL || ''
  ].filter(Boolean),
  credentials: true
})

await fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'stepzy-secret-change-in-production',
  hook: 'onRequest'
})

// Health check route
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }
})

// Register WebSocket
const { registerWebSocket } = await import('./websocket/index.js')
await registerWebSocket(fastify)

// Register routes
const { authRoutes } = await import('./routes/auth.routes.js')
const { activitiesRoutes } = await import('./routes/activities.routes.js')
const { sessionsRoutes } = await import('./routes/sessions.routes.js')
const { usersRoutes } = await import('./routes/users.routes.js')
const { adminRoutes } = await import('./routes/admin.routes.js')
const { notificationsRoutes } = await import('./routes/notifications.routes.js')
const { chatRoutes } = await import('./routes/chat.routes.js')

await fastify.register(authRoutes)
await fastify.register(activitiesRoutes)
await fastify.register(sessionsRoutes)
await fastify.register(usersRoutes)
await fastify.register(adminRoutes)
await fastify.register(notificationsRoutes)
await fastify.register(chatRoutes)

// API info endpoint
fastify.get('/api', async () => {
  return {
    name: 'Stepzy API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      activities: '/api/activities',
      sessions: '/api/sessions',
      users: '/api/users',
      admin: '/api/admin',
      notifications: '/api/notifications',
      chat: '/api/chat',
      api: '/api'
    },
    websocket: {
      chat: '/ws/chat/:roomId',
      notifications: '/ws/notifications'
    }
  }
})

// Start background jobs
const { startReminderJob } = await import('./jobs/reminder.job.js')
startReminderJob()

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST })
    console.log(`🚀 Backend API running on http://${HOST}:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
