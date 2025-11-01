/**
 * Tests for Activity Code utilities
 * Tests code generation, validation, sanitization, and formatting
 */

import {
  generateActivityCode,
  isValidActivityCode,
  sanitizeActivityCode,
  formatActivityCode
} from '@stepzy/shared'

describe('Activity Code Generation', () => {
  describe('generateActivityCode()', () => {
    it('should generate a code with exactly 8 characters', () => {
      const code = generateActivityCode()
      expect(code).toHaveLength(8)
    })

    it('should generate codes with only uppercase letters and numbers', () => {
      const code = generateActivityCode()
      expect(code).toMatch(/^[A-Z0-9]{8}$/)
    })

    it('should generate unique codes', () => {
      const codes = new Set<string>()
      const iterations = 1000

      // Generate 1000 codes and verify uniqueness
      for (let i = 0; i < iterations; i++) {
        codes.add(generateActivityCode())
      }

      // With 8 characters (36^8 possibilities), collisions should be extremely rare
      expect(codes.size).toBe(iterations)
    })

    it('should not generate codes with special characters', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateActivityCode()
        expect(code).not.toMatch(/[^A-Z0-9]/)
      }
    })

    it('should not generate codes with lowercase letters', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateActivityCode()
        expect(code).not.toMatch(/[a-z]/)
      }
    })
  })

  describe('isValidActivityCode()', () => {
    it('should validate correct 8-character uppercase alphanumeric codes', () => {
      expect(isValidActivityCode('A1B2C3D4')).toBe(true)
      expect(isValidActivityCode('ABCDEFGH')).toBe(true)
      expect(isValidActivityCode('12345678')).toBe(true)
      expect(isValidActivityCode('Z9X8Y7W6')).toBe(true)
    })

    it('should reject codes that are too short', () => {
      expect(isValidActivityCode('ABC123')).toBe(false)
      expect(isValidActivityCode('A1B2C3D')).toBe(false)
      expect(isValidActivityCode('')).toBe(false)
    })

    it('should reject codes that are too long', () => {
      expect(isValidActivityCode('A1B2C3D4E')).toBe(false)
      expect(isValidActivityCode('ABCDEFGH12')).toBe(false)
    })

    it('should reject codes with lowercase letters', () => {
      expect(isValidActivityCode('a1b2c3d4')).toBe(false)
      expect(isValidActivityCode('A1b2C3D4')).toBe(false)
    })

    it('should reject codes with special characters', () => {
      expect(isValidActivityCode('A1B2-C3D')).toBe(false)
      expect(isValidActivityCode('A1B2 C3D')).toBe(false)
      expect(isValidActivityCode('A1B2_C3D')).toBe(false)
      expect(isValidActivityCode('A1B2@C3D')).toBe(false)
    })

    it('should reject null and undefined', () => {
      expect(isValidActivityCode(null as any)).toBe(false)
      expect(isValidActivityCode(undefined as any)).toBe(false)
    })
  })

  describe('sanitizeActivityCode()', () => {
    it('should convert lowercase to uppercase', () => {
      expect(sanitizeActivityCode('a1b2c3d4')).toBe('A1B2C3D4')
      expect(sanitizeActivityCode('abcdefgh')).toBe('ABCDEFGH')
    })

    it('should remove spaces', () => {
      expect(sanitizeActivityCode('A1B2 C3D4')).toBe('A1B2C3D4')
      expect(sanitizeActivityCode('A1 B2 C3 D4')).toBe('A1B2C3D4')
      expect(sanitizeActivityCode('  A1B2C3D4  ')).toBe('A1B2C3D4')
    })

    it('should remove special characters', () => {
      expect(sanitizeActivityCode('A1-B2-C3-D4')).toBe('A1B2C3D4')
      expect(sanitizeActivityCode('A1_B2_C3_D4')).toBe('A1B2C3D4')
      expect(sanitizeActivityCode('A1.B2.C3.D4')).toBe('A1B2C3D4')
    })

    it('should handle mixed case and special characters', () => {
      expect(sanitizeActivityCode('a1-b2 c3_d4')).toBe('A1B2C3D4')
      expect(sanitizeActivityCode('  a1B2-c3D4  ')).toBe('A1B2C3D4')
    })

    it('should return empty string for invalid input', () => {
      expect(sanitizeActivityCode('')).toBe('')
      expect(sanitizeActivityCode('   ')).toBe('')
      expect(sanitizeActivityCode('---')).toBe('')
    })
  })

  describe('formatActivityCode()', () => {
    it('should format 8-character code with space in the middle', () => {
      expect(formatActivityCode('A1B2C3D4')).toBe('A1B2 C3D4')
      expect(formatActivityCode('ABCDEFGH')).toBe('ABCD EFGH')
      expect(formatActivityCode('12345678')).toBe('1234 5678')
    })

    it('should handle codes that are already formatted', () => {
      expect(formatActivityCode('A1B2 C3D4')).toBe('A1B2 C3D4')
    })

    it('should return empty string for empty input', () => {
      expect(formatActivityCode('')).toBe('')
    })

    it('should handle short codes gracefully', () => {
      expect(formatActivityCode('ABC')).toBe('ABC')
      expect(formatActivityCode('A1B2')).toBe('A1B2')
    })
  })

  describe('Integration: Code workflow', () => {
    it('should support complete workflow: generate → validate → format', () => {
      // Generate a code
      const code = generateActivityCode()

      // Validate it
      expect(isValidActivityCode(code)).toBe(true)

      // Format it for display
      const formatted = formatActivityCode(code)
      expect(formatted).toMatch(/^[A-Z0-9]{4} [A-Z0-9]{4}$/)
    })

    it('should support user input workflow: input → sanitize → validate', () => {
      // User types with spaces and lowercase
      const userInput = 'a1b2 c3d4'

      // Sanitize
      const sanitized = sanitizeActivityCode(userInput)
      expect(sanitized).toBe('A1B2C3D4')

      // Validate
      expect(isValidActivityCode(sanitized)).toBe(true)
    })

    it('should reject invalid input even after sanitization', () => {
      // User input with only special characters
      const userInput = '---***!!!'

      // Sanitize
      const sanitized = sanitizeActivityCode(userInput)

      // Should be empty or invalid
      expect(isValidActivityCode(sanitized)).toBe(false)
    })
  })
})
