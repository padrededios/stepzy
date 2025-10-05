/**
 * Validation middleware using Zod
 * Validates request body, params, and query against Zod schemas
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { z, ZodError, type ZodSchema } from 'zod'

interface ValidationSchemas {
  body?: ZodSchema
  params?: ZodSchema
  query?: ZodSchema
}

/**
 * Middleware factory to validate request data against Zod schemas
 */
export function validate(schemas: ValidationSchemas) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        request.body = schemas.body.parse(request.body)
      }

      // Validate params if schema provided
      if (schemas.params) {
        request.params = schemas.params.parse(request.params)
      }

      // Validate query if schema provided
      if (schemas.query) {
        request.query = schemas.query.parse(request.query)
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation échouée',
          details: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
      }

      return reply.status(400).send({
        success: false,
        error: 'Données invalides'
      })
    }
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // ID parameter
  idParam: z.object({
    id: z.string().min(1, 'ID requis')
  }),

  // Pagination query
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50)
  }),

  // Date range query
  dateRange: z.object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
  }),

  // Email
  email: z.string().email('Email invalide'),

  // Password
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),

  // Pseudo
  pseudo: z.string().min(3, 'Le pseudo doit contenir au moins 3 caractères').max(50)
}

/**
 * Helper to create validation error response
 */
export function createValidationError(message: string, details?: unknown) {
  return {
    success: false,
    error: 'Validation échouée',
    message,
    details
  }
}
