/**
 * Better-auth configuration for Fastify backend
 */

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '../database/prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Désactivé pour simplifier en dev
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 1 jour
    cookieCache: {
      name: 'stepzy.session-token',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax'
    }
  },

  user: {
    additionalFields: {
      pseudo: {
        type: 'string',
        required: true,
        input: true
      },
      avatar: {
        type: 'string',
        required: false,
        input: true
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false
      }
    }
  },

  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-change-in-production',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',

  trustedOrigins: [
    'http://localhost:3000', // web-app dev
    'http://localhost:3002', // admin-app dev
    process.env.WEB_APP_URL,
    process.env.ADMIN_APP_URL
  ].filter(Boolean),

  logger: {
    disabled: process.env.NODE_ENV === 'production'
  },

  rateLimit: {
    enabled: true,
    storage: 'memory',
    rules: [
      {
        pathMatcher: (path: string) => path.includes('/sign-in'),
        max: 5,
        window: 60 * 1000 // 1 minute
      },
      {
        pathMatcher: (path: string) => path.includes('/sign-up'),
        max: 3,
        window: 60 * 1000 // 1 minute
      }
    ]
  },

  advanced: {
    generateId: () => {
      // Génération d'ID personnalisée compatible avec Prisma cuid()
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }
})

// Types pour l'authentification
export interface AuthUser {
  id: string
  email: string
  pseudo: string
  avatar?: string | null
  role: 'user' | 'root'
}

export interface AuthSession {
  user: AuthUser
  session: {
    token: string
    expiresAt: Date
  }
}
