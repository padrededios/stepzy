/**
 * Security Validation Tests
 * Tests input validation and security measures
 */

import { sanitize, validateRequest, rateLimit, ValidationError, SecurityError } from '../../../lib/security/validation'
import { NextRequest } from 'next/server'

describe('Security Validation System', () => {
  describe('Input Sanitization', () => {
    describe('String Sanitization', () => {
      test('should sanitize basic strings', () => {
        expect(sanitize.string('  hello world  ')).toBe('hello world')
      })

      test('should escape HTML entities', () => {
        expect(sanitize.string('<script>alert("xss")</script>'))
          .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
      })

      test('should enforce length limits', () => {
        const longString = 'a'.repeat(1001)
        expect(() => sanitize.string(longString, 1000))
          .toThrow('Input too long')
      })

      test('should detect SQL injection attempts', () => {
        const sqlInjection = "'; DROP TABLE users; --"
        expect(() => sanitize.string(sqlInjection))
          .toThrow(SecurityError)
      })

      test('should detect XSS attempts', () => {
        const xssAttempt = '<script>alert("xss")</script>'
        expect(() => sanitize.string(xssAttempt))
          .toThrow(SecurityError)
      })

      test('should detect path traversal attempts', () => {
        const pathTraversal = '../../../etc/passwd'
        expect(() => sanitize.string(pathTraversal))
          .toThrow(SecurityError)
      })

      test('should reject non-string inputs', () => {
        expect(() => sanitize.string(123 as any))
          .toThrow('Input must be a string')
      })
    })

    describe('Email Sanitization', () => {
      test('should validate and normalize email addresses', () => {
        expect(sanitize.email('  TEST@EXAMPLE.COM  '))
          .toBe('test@example.com')
      })

      test('should reject invalid email formats', () => {
        expect(() => sanitize.email('invalid-email'))
          .toThrow('Invalid email format')
      })

      test('should reject emails that are too long', () => {
        const longEmail = 'a'.repeat(250) + '@example.com'
        expect(() => sanitize.email(longEmail))
          .toThrow('Input too long')
      })
    })

    describe('UUID Sanitization', () => {
      test('should validate proper UUID format', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000'
        expect(sanitize.uuid(validUuid)).toBe(validUuid)
      })

      test('should reject invalid UUID format', () => {
        expect(() => sanitize.uuid('not-a-uuid'))
          .toThrow('Invalid UUID format')
      })

      test('should be case insensitive', () => {
        const mixedCaseUuid = '123E4567-e89b-12D3-a456-426614174000'
        expect(sanitize.uuid(mixedCaseUuid)).toBe(mixedCaseUuid)
      })
    })

    describe('Pseudo Sanitization', () => {
      test('should validate proper pseudo format', () => {
        expect(sanitize.pseudo('user123')).toBe('user123')
        expect(sanitize.pseudo('test_user')).toBe('test_user')
        expect(sanitize.pseudo('user.name')).toBe('user.name')
        expect(sanitize.pseudo('user-123')).toBe('user-123')
      })

      test('should reject invalid pseudo formats', () => {
        expect(() => sanitize.pseudo('a')).toThrow('Invalid pseudo format')
        expect(() => sanitize.pseudo('user@')).toThrow('Invalid pseudo format')
        expect(() => sanitize.pseudo('user space')).toThrow('Invalid pseudo format')
        expect(() => sanitize.pseudo('a'.repeat(21))).toThrow('Invalid pseudo format')
      })
    })

    describe('Password Validation', () => {
      test('should validate strong passwords', () => {
        const strongPassword = 'StrongP@ssw0rd'
        expect(sanitize.password(strongPassword)).toBe(strongPassword)
      })

      test('should reject weak passwords', () => {
        expect(() => sanitize.password('weak'))
          .toThrow('Password must be at least 8 characters')
        expect(() => sanitize.password('nouppercase'))
          .toThrow('Password must contain at least one uppercase')
        expect(() => sanitize.password('NOLOWERCASE'))
          .toThrow('Password must contain at least one uppercase')
        expect(() => sanitize.password('NoNumbers!'))
          .toThrow('Password must contain at least one uppercase')
        expect(() => sanitize.password('NoSpecial1'))
          .toThrow('Password must contain at least one uppercase')
      })

      test('should reject passwords that are too long', () => {
        const tooLong = 'A'.repeat(129) + 'a1!'
        expect(() => sanitize.password(tooLong))
          .toThrow('Password too long')
      })
    })

    describe('Integer Sanitization', () => {
      test('should parse valid integers', () => {
        expect(sanitize.integer('42')).toBe(42)
        expect(sanitize.integer('-10')).toBe(-10)
        expect(sanitize.integer(123)).toBe(123)
      })

      test('should enforce min/max constraints', () => {
        expect(() => sanitize.integer('5', 10, 20))
          .toThrow('Must be at least 10')
        expect(() => sanitize.integer('25', 10, 20))
          .toThrow('Must be at most 20')
      })

      test('should reject non-integers', () => {
        expect(() => sanitize.integer('not-a-number'))
          .toThrow('Must be a valid integer')
        expect(() => sanitize.integer('12.5'))
          .toThrow('Must be a valid integer')
      })
    })

    describe('Date Sanitization', () => {
      test('should parse valid dates', () => {
        const date = sanitize.date('2024-01-15')
        expect(date).toBeInstanceOf(Date)
        expect(date.getFullYear()).toBe(2024)
      })

      test('should reject invalid dates', () => {
        expect(() => sanitize.date('invalid-date'))
          .toThrow('Invalid date format')
      })

      test('should reject dates out of reasonable range', () => {
        expect(() => sanitize.date('1800-01-01'))
          .toThrow('Date out of reasonable range')
        expect(() => sanitize.date('2100-01-01'))
          .toThrow('Date out of reasonable range')
      })
    })
  })

  describe('Request Validation', () => {
    describe('Body Validation', () => {
      test('should validate request body against schema', async () => {
        const mockRequest = new NextRequest('http://localhost/api/test', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            pseudo: 'testuser',
            age: 25
          })
        })

        const schema = {
          email: { type: 'email', required: true },
          pseudo: { type: 'pseudo', required: true },
          age: { type: 'integer', required: false, min: 0, max: 120 }
        }

        const validated = await validateRequest.body(mockRequest, schema)
        
        expect(validated.email).toBe('test@example.com')
        expect(validated.pseudo).toBe('testuser')
        expect(validated.age).toBe(25)
      })

      test('should reject missing required fields', async () => {
        const mockRequest = new NextRequest('http://localhost/api/test', {
          method: 'POST',
          body: JSON.stringify({ pseudo: 'testuser' })
        })

        const schema = {
          email: { type: 'email', required: true },
          pseudo: { type: 'pseudo', required: true }
        }

        await expect(validateRequest.body(mockRequest, schema))
          .rejects.toThrow("Field 'email' is required")
      })

      test('should handle invalid JSON', async () => {
        const mockRequest = new NextRequest('http://localhost/api/test', {
          method: 'POST',
          body: 'invalid json'
        })

        await expect(validateRequest.body(mockRequest, {}))
          .rejects.toThrow('Invalid JSON body')
      })

      test('should validate enum values', async () => {
        const mockRequest = new NextRequest('http://localhost/api/test', {
          method: 'POST',
          body: JSON.stringify({ status: 'invalid' })
        })

        const schema = {
          status: { type: 'enum', values: ['active', 'inactive'], required: true }
        }

        await expect(validateRequest.body(mockRequest, schema))
          .rejects.toThrow('Invalid value for status')
      })
    })

    describe('Query Parameter Validation', () => {
      test('should validate query parameters', () => {
        const mockRequest = new NextRequest('http://localhost/api/test?limit=10&offset=0&active=true')

        const schema = {
          limit: { type: 'integer', required: false, min: 1, max: 100 },
          offset: { type: 'integer', required: false, min: 0 },
          active: { type: 'boolean', required: false }
        }

        const validated = validateRequest.query(mockRequest, schema)
        
        expect(validated.limit).toBe(10)
        expect(validated.offset).toBe(0)
        expect(validated.active).toBe(true)
      })

      test('should reject invalid query parameters', () => {
        const mockRequest = new NextRequest('http://localhost/api/test?limit=invalid')

        const schema = {
          limit: { type: 'integer', required: true }
        }

        expect(() => validateRequest.query(mockRequest, schema))
          .toThrow('Invalid query parameter')
      })
    })

    describe('Route Parameter Validation', () => {
      test('should validate route parameters', async () => {
        const mockParams = Promise.resolve({
          id: '123e4567-e89b-12d3-a456-426614174000',
          page: '1'
        })

        const schema = {
          id: { type: 'uuid', required: true },
          page: { type: 'integer', required: false, min: 1 }
        }

        const validated = await validateRequest.params(mockParams, schema)
        
        expect(validated.id).toBe('123e4567-e89b-12d3-a456-426614174000')
        expect(validated.page).toBe(1)
      })
    })
  })

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Clear rate limit store before each test
      rateLimit['rateLimitStore'].clear()
    })

    test('should allow requests within limit', () => {
      const result1 = rateLimit.check('test-key', 5, 60000)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(4)

      const result2 = rateLimit.check('test-key', 5, 60000)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(3)
    })

    test('should block requests over limit', () => {
      // Make requests up to limit
      for (let i = 0; i < 5; i++) {
        rateLimit.check('test-key', 5, 60000)
      }

      // Next request should be blocked
      const result = rateLimit.check('test-key', 5, 60000)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    test('should generate keys from request', () => {
      const mockRequest = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' }
      })

      const key = rateLimit.generateKey(mockRequest, 'api')
      expect(key).toBe('api:192.168.1.1')
    })

    test('should handle missing IP headers', () => {
      const mockRequest = new NextRequest('http://localhost/api/test')
      const key = rateLimit.generateKey(mockRequest)
      expect(key).toBe('global:unknown')
    })
  })

  describe('Error Types', () => {
    test('should create ValidationError with field', () => {
      const error = new ValidationError('Invalid input', 'email', 'INVALID_FORMAT')
      expect(error.message).toBe('Invalid input')
      expect(error.field).toBe('email')
      expect(error.code).toBe('INVALID_FORMAT')
      expect(error.name).toBe('ValidationError')
    })

    test('should create SecurityError with severity', () => {
      const error = new SecurityError('Security violation', 'high', 'xss_attempt')
      expect(error.message).toBe('Security violation')
      expect(error.severity).toBe('high')
      expect(error.attackType).toBe('xss_attempt')
      expect(error.name).toBe('SecurityError')
    })
  })
})