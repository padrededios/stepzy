/**
 * CORS configuration for multi-frontend support
 * Already configured in main server via @fastify/cors
 * This file exports the configuration for documentation
 */

/**
 * Allowed origins for CORS
 * Includes development and production URLs for web-app and admin-app
 */
export const allowedOrigins = [
  'http://localhost:3000', // web-app dev
  'http://localhost:3002', // admin-app dev
  process.env.WEB_APP_URL,
  process.env.ADMIN_APP_URL
].filter(Boolean) as string[]

/**
 * CORS configuration options
 */
export const corsOptions = {
  origin: allowedOrigins,
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Cookie'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true // Allow requests with no origin (e.g., mobile apps)
  return allowedOrigins.includes(origin)
}
