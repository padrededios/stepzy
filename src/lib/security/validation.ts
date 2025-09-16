/**
 * Enhanced Security Validation System
 * Provides comprehensive input validation and security checks
 */

import { NextRequest } from 'next/server'
import { logger } from '../logging/logger'

// Common regex patterns
const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  PSEUDO: /^[a-zA-Z0-9._-]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  SQL_INJECTION: /(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)/i,
  XSS: /(<script|javascript:|vbscript:|onload|onerror|onclick|onmouseover|onfocus|onblur)/i,
  PATH_TRAVERSAL: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i
}

// Validation errors
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    public attackType?: string
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}

// Input sanitization functions
export const sanitize = {
  /**
   * Sanitize string input - remove/escape dangerous characters
   */
  string: (input: string, maxLength: number = 1000): string => {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string')
    }

    // Check for security patterns
    if (PATTERNS.SQL_INJECTION.test(input)) {
      logger.security('SQL injection attempt detected', 'high', { input })
      throw new SecurityError('Potential SQL injection detected', 'high', 'sql_injection')
    }

    if (PATTERNS.XSS.test(input)) {
      logger.security('XSS attempt detected', 'high', { input })
      throw new SecurityError('Potential XSS detected', 'high', 'xss')
    }

    if (PATTERNS.PATH_TRAVERSAL.test(input)) {
      logger.security('Path traversal attempt detected', 'medium', { input })
      throw new SecurityError('Path traversal attempt detected', 'medium', 'path_traversal')
    }

    // Trim and limit length
    const trimmed = input.trim()
    if (trimmed.length > maxLength) {
      throw new ValidationError(`Input too long (max ${maxLength} characters)`)
    }

    // Escape HTML entities
    return trimmed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  },

  /**
   * Sanitize email input
   */
  email: (input: string): string => {
    const clean = sanitize.string(input, 254).toLowerCase()
    if (!PATTERNS.EMAIL.test(clean)) {
      throw new ValidationError('Invalid email format', 'email')
    }
    return clean
  },

  /**
   * Sanitize UUID input
   */
  uuid: (input: string, fieldName: string = 'id'): string => {
    const clean = sanitize.string(input, 36)
    if (!PATTERNS.UUID.test(clean)) {
      throw new ValidationError('Invalid UUID format', fieldName)
    }
    return clean
  },

  /**
   * Sanitize pseudo input
   */
  pseudo: (input: string): string => {
    const clean = sanitize.string(input, 20)
    if (!PATTERNS.PSEUDO.test(clean)) {
      throw new ValidationError('Invalid pseudo format (3-20 chars, alphanumeric, ., _, -)', 'pseudo')
    }
    return clean
  },

  /**
   * Validate password strength (don't sanitize, just validate)
   */
  password: (input: string): string => {
    if (typeof input !== 'string') {
      throw new ValidationError('Password must be a string', 'password')
    }

    if (input.length < 8) {
      throw new ValidationError('Password must be at least 8 characters', 'password')
    }

    if (input.length > 128) {
      throw new ValidationError('Password too long (max 128 characters)', 'password')
    }

    if (!PATTERNS.PASSWORD.test(input)) {
      throw new ValidationError(
        'Password must contain at least one uppercase, one lowercase, one digit, and one special character',
        'password'
      )
    }

    return input
  },

  /**
   * Sanitize integer input
   */
  integer: (input: any, min?: number, max?: number, fieldName?: string): number => {
    const num = parseInt(input, 10)
    
    if (isNaN(num)) {
      throw new ValidationError('Must be a valid integer', fieldName)
    }

    if (min !== undefined && num < min) {
      throw new ValidationError(`Must be at least ${min}`, fieldName)
    }

    if (max !== undefined && num > max) {
      throw new ValidationError(`Must be at most ${max}`, fieldName)
    }

    return num
  },

  /**
   * Sanitize date input
   */
  date: (input: any, fieldName?: string): Date => {
    const date = new Date(input)
    
    if (isNaN(date.getTime())) {
      throw new ValidationError('Invalid date format', fieldName)
    }

    // Reasonable date range (not too far in past/future)
    const now = new Date()
    const hundredYearsAgo = new Date(now.getFullYear() - 100, 0, 1)
    const tenYearsFromNow = new Date(now.getFullYear() + 10, 11, 31)

    if (date < hundredYearsAgo || date > tenYearsFromNow) {
      throw new ValidationError('Date out of reasonable range', fieldName)
    }

    return date
  }
}

// Request validation functions
export const validateRequest = {
  /**
   * Validate request body against schema
   */
  body: async <T>(request: NextRequest, schema: Record<string, any>): Promise<T> => {
    let body: any
    
    try {
      body = await request.json()
    } catch (error) {
      throw new ValidationError('Invalid JSON body')
    }

    if (!body || typeof body !== 'object') {
      throw new ValidationError('Request body must be an object')
    }

    const validated: any = {}

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field]

      // Required field validation
      if (rules.required && (value === undefined || value === null || value === '')) {
        throw new ValidationError(`Field '${field}' is required`, field)
      }

      // Skip validation if field is optional and not provided
      if (!rules.required && (value === undefined || value === null)) {
        continue
      }

      // Type-specific validation
      try {
        switch (rules.type) {
          case 'string':
            validated[field] = sanitize.string(value, rules.maxLength)
            break
          case 'email':
            validated[field] = sanitize.email(value)
            break
          case 'uuid':
            validated[field] = sanitize.uuid(value, field)
            break
          case 'pseudo':
            validated[field] = sanitize.pseudo(value)
            break
          case 'password':
            validated[field] = sanitize.password(value)
            break
          case 'integer':
            validated[field] = sanitize.integer(value, rules.min, rules.max, field)
            break
          case 'date':
            validated[field] = sanitize.date(value, field)
            break
          case 'boolean':
            validated[field] = Boolean(value)
            break
          case 'enum':
            if (!rules.values.includes(value)) {
              throw new ValidationError(`Invalid value for ${field}. Must be one of: ${rules.values.join(', ')}`, field)
            }
            validated[field] = value
            break
          default:
            validated[field] = value
        }
      } catch (error) {
        if (error instanceof ValidationError || error instanceof SecurityError) {
          throw error
        }
        throw new ValidationError(`Invalid value for field '${field}'`, field)
      }
    }

    return validated as T
  },

  /**
   * Validate query parameters
   */
  query: (request: NextRequest, schema: Record<string, any>): Record<string, any> => {
    const url = new URL(request.url)
    const validated: any = {}

    for (const [field, rules] of Object.entries(schema)) {
      const value = url.searchParams.get(field)

      if (rules.required && !value) {
        throw new ValidationError(`Query parameter '${field}' is required`, field)
      }

      if (!value && !rules.required) {
        continue
      }

      try {
        switch (rules.type) {
          case 'string':
            validated[field] = sanitize.string(value!, rules.maxLength)
            break
          case 'integer':
            validated[field] = sanitize.integer(value, rules.min, rules.max, field)
            break
          case 'boolean':
            validated[field] = value === 'true'
            break
          case 'enum':
            if (!rules.values.includes(value)) {
              throw new ValidationError(`Invalid value for ${field}`, field)
            }
            validated[field] = value
            break
          default:
            validated[field] = value
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error
        }
        throw new ValidationError(`Invalid query parameter '${field}'`, field)
      }
    }

    return validated
  },

  /**
   * Validate route parameters
   */
  params: async (params: Promise<any>, schema: Record<string, any>): Promise<Record<string, any>> => {
    const resolvedParams = await params
    const validated: any = {}

    for (const [field, rules] of Object.entries(schema)) {
      const value = resolvedParams[field]

      if (rules.required && !value) {
        throw new ValidationError(`Route parameter '${field}' is required`, field)
      }

      if (!value && !rules.required) {
        continue
      }

      try {
        switch (rules.type) {
          case 'uuid':
            validated[field] = sanitize.uuid(value, field)
            break
          case 'string':
            validated[field] = sanitize.string(value, rules.maxLength)
            break
          case 'integer':
            validated[field] = sanitize.integer(value, rules.min, rules.max, field)
            break
          default:
            validated[field] = value
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error
        }
        throw new ValidationError(`Invalid route parameter '${field}'`, field)
      }
    }

    return validated
  }
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiting validation
 */
export const rateLimit = {
  /**
   * Check if request exceeds rate limit
   */
  check: (
    key: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now()
    const windowKey = `${key}:${Math.floor(now / windowMs)}`
    
    const current = rateLimitStore.get(windowKey) || { count: 0, resetTime: now + windowMs }
    
    if (current.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime }
    }

    current.count++
    rateLimitStore.set(windowKey, current)

    // Cleanup old entries
    if (rateLimitStore.size > 1000) {
      for (const [key, data] of rateLimitStore.entries()) {
        if (data.resetTime < now) {
          rateLimitStore.delete(key)
        }
      }
    }

    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime
    }
  },

  /**
   * Generate rate limit key from request
   */
  generateKey: (request: NextRequest, prefix: string = 'global'): string => {
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown'
    return `${prefix}:${ip}`
  }
}

// Security headers
export const securityHeaders = {
  /**
   * Get recommended security headers
   */
  getHeaders: (): Record<string, string> => ({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  })
}