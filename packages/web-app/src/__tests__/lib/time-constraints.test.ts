import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { 
  isValidMatchTime, 
  isValidMatchDate, 
  getAvailableTimeSlots,
  validateMatchCreation,
  calculateRecurringDates
} from '../../lib/utils/time-constraints'

describe('Time Constraints Validation', () => {
  beforeEach(() => {
    // Reset date mock
    jest.restoreAllMocks()
  })

  describe('isValidMatchTime', () => {
    it('should accept valid times between 12:00 and 14:00', () => {
      expect(isValidMatchTime('12:00')).toBe(true)
      expect(isValidMatchTime('12:30')).toBe(true)
      expect(isValidMatchTime('13:00')).toBe(true)
      expect(isValidMatchTime('13:30')).toBe(true)
    })

    it('should reject times outside 12:00-14:00 range', () => {
      expect(isValidMatchTime('11:59')).toBe(false)
      expect(isValidMatchTime('14:01')).toBe(false)
      expect(isValidMatchTime('08:00')).toBe(false)
      expect(isValidMatchTime('16:00')).toBe(false)
    })

    it('should reject invalid time formats', () => {
      expect(isValidMatchTime('25:00')).toBe(false)
      expect(isValidMatchTime('12:61')).toBe(false)
      expect(isValidMatchTime('12')).toBe(false)
      expect(isValidMatchTime('not-time')).toBe(false)
    })
  })

  describe('isValidMatchDate', () => {
    it('should accept weekdays only', () => {
      const mockNow = new Date('2025-01-13T10:00:00.000Z') // Monday 10:00
      
      // Monday to Friday in January 2025 (future dates)
      expect(isValidMatchDate(new Date('2025-01-15T12:00:00.000Z'), mockNow)).toBe(true) // Wednesday
      expect(isValidMatchDate(new Date('2025-01-16T12:00:00.000Z'), mockNow)).toBe(true) // Thursday
      expect(isValidMatchDate(new Date('2025-01-17T12:00:00.000Z'), mockNow)).toBe(true) // Friday
      expect(isValidMatchDate(new Date('2025-01-20T12:00:00.000Z'), mockNow)).toBe(true) // Monday
      expect(isValidMatchDate(new Date('2025-01-21T12:00:00.000Z'), mockNow)).toBe(true) // Tuesday
    })

    it('should reject weekends', () => {
      const mockNow = new Date('2025-01-13T10:00:00.000Z') // Monday 10:00
      
      expect(isValidMatchDate(new Date('2025-01-18T12:00:00.000Z'), mockNow)).toBe(false) // Saturday
      expect(isValidMatchDate(new Date('2025-01-19T12:00:00.000Z'), mockNow)).toBe(false) // Sunday
      expect(isValidMatchDate(new Date('2025-01-25T12:00:00.000Z'), mockNow)).toBe(false) // Saturday
      expect(isValidMatchDate(new Date('2025-01-26T12:00:00.000Z'), mockNow)).toBe(false) // Sunday
    })

    it('should validate minimum 24h advance booking', () => {
      const mockNow = new Date('2025-01-15T10:00:00.000Z') // Wednesday 10:00

      // Same day - should be rejected
      expect(isValidMatchDate(new Date('2025-01-15T12:00:00.000Z'), mockNow)).toBe(false)
      
      // Next day - should be accepted
      expect(isValidMatchDate(new Date('2025-01-16T12:00:00.000Z'), mockNow)).toBe(true)
      
      // 23 hours later - should be rejected
      expect(isValidMatchDate(new Date('2025-01-16T09:00:00.000Z'), mockNow)).toBe(false)
      
      // 25 hours later - should be accepted
      expect(isValidMatchDate(new Date('2025-01-16T11:00:00.000Z'), mockNow)).toBe(true)
    })

    it('should validate maximum 2 weeks advance booking', () => {
      const mockNow = new Date('2025-01-01T12:00:00.000Z') // Wednesday

      // 14 days later - should be accepted (still weekday)
      expect(isValidMatchDate(new Date('2025-01-15T12:00:00.000Z'), mockNow)).toBe(true)
      
      // 15 days later - should be rejected (exceeds 2 weeks)
      expect(isValidMatchDate(new Date('2025-01-16T12:00:00.000Z'), mockNow)).toBe(false)
      
      // 13 days later but weekend - should be rejected for being weekend
      expect(isValidMatchDate(new Date('2025-01-12T12:00:00.000Z'), mockNow)).toBe(false) // Sunday
    })
  })

  describe('getAvailableTimeSlots', () => {
    it('should return all valid time slots', () => {
      const slots = getAvailableTimeSlots()
      
      expect(slots).toContain('12:00')
      expect(slots).toContain('12:30')
      expect(slots).toContain('13:00')
      expect(slots).toContain('13:30')
      expect(slots).not.toContain('11:30')
      expect(slots).not.toContain('14:00')
      expect(slots).not.toContain('14:30')
    })

    it('should return slots in chronological order', () => {
      const slots = getAvailableTimeSlots()
      
      expect(slots[0]).toBe('12:00')
      expect(slots[1]).toBe('12:30')
      expect(slots[2]).toBe('13:00')
      expect(slots[3]).toBe('13:30')
    })
  })

  describe('validateMatchCreation', () => {
    it('should validate complete match creation data', () => {
      // Use a fixed reference date for predictable testing
      const mockNow = new Date('2025-01-15T10:00:00.000Z') // Wednesday 10:00
      
      const validMatch = {
        date: new Date('2025-01-17T12:30:00.000Z'), // Friday 12:30 (2 days later)
        maxPlayers: 12,
        description: 'Test match'
      }

      // Mock Date globally just for this validation
      const originalDate = global.Date
      global.Date = jest.fn(() => mockNow) as any
      global.Date.now = originalDate.now
      
      const result = validateMatchCreation(validMatch)
      
      // Restore original Date
      global.Date = originalDate
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return errors for invalid data', () => {
      const mockNow = new Date('2025-01-15T10:00:00.000Z')
      
      const invalidMatch = {
        date: new Date('2025-01-18T15:00:00.000Z'), // Saturday 15:00 (weekend + invalid time)
        maxPlayers: 15, // Too many players
        description: ''
      }

      // Mock Date temporarily
      const originalDate = global.Date
      global.Date = jest.fn(() => mockNow) as any
      global.Date.now = originalDate.now

      const result = validateMatchCreation(invalidMatch)
      
      // Restore original Date
      global.Date = originalDate
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Les matchs ne peuvent avoir lieu que du lundi au vendredi')
      expect(result.errors).toContain('L\'heure doit être entre 12h00 et 14h00')
      expect(result.errors).toContain('Le nombre maximum de joueurs ne peut pas dépasser 12')
    })

    it('should validate minimum players requirement', () => {
      const mockNow = new Date('2025-01-15T10:00:00.000Z')
      
      const invalidMatch = {
        date: new Date('2025-01-17T12:30:00.000Z'),
        maxPlayers: 1, // Too few players
        description: ''
      }

      const originalDate = global.Date
      global.Date = jest.fn(() => mockNow) as any
      global.Date.now = originalDate.now

      const result = validateMatchCreation(invalidMatch)
      
      global.Date = originalDate
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Il faut au moins 2 joueurs pour un match')
    })

    it('should validate advance booking constraints', () => {
      const mockNow = new Date('2025-01-15T10:00:00.000Z')
      
      const tooEarlyMatch = {
        date: new Date('2025-01-15T12:30:00.000Z'), // Same day
        maxPlayers: 12,
        description: ''
      }

      const originalDate = global.Date
      global.Date = jest.fn(() => mockNow) as any
      global.Date.now = originalDate.now

      const result = validateMatchCreation(tooEarlyMatch)
      
      global.Date = originalDate
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Le match doit être créé au moins 24h à l\'avance')
    })

    it('should validate maximum advance booking', () => {
      const mockNow = new Date('2025-01-15T10:00:00.000Z')
      
      const tooLateMatch = {
        date: new Date('2025-02-01T12:30:00.000Z'), // More than 2 weeks
        maxPlayers: 12,
        description: ''
      }

      const originalDate = global.Date
      global.Date = jest.fn(() => mockNow) as any
      global.Date.now = originalDate.now

      const result = validateMatchCreation(tooLateMatch)
      
      global.Date = originalDate
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Le match ne peut pas être créé plus de 2 semaines à l\'avance')
    })
  })

  describe('calculateRecurringDates', () => {
    it('should calculate weekly recurring dates correctly', () => {
      const startDate = new Date('2024-01-15T12:30:00.000Z') // Monday
      const dates = calculateRecurringDates(startDate, 'week', 3)
      
      expect(dates).toHaveLength(3)
      expect(dates[0]).toEqual(new Date('2024-01-15T12:30:00.000Z')) // Week 1
      expect(dates[1]).toEqual(new Date('2024-01-22T12:30:00.000Z')) // Week 2
      expect(dates[2]).toEqual(new Date('2024-01-29T12:30:00.000Z')) // Week 3
    })

    it('should calculate daily recurring dates for weekdays only', () => {
      const startDate = new Date('2024-01-15T12:30:00.000Z') // Monday
      const dates = calculateRecurringDates(startDate, 'day', 5)
      
      expect(dates).toHaveLength(5)
      expect(dates[0]).toEqual(new Date('2024-01-15T12:30:00.000Z')) // Monday
      expect(dates[1]).toEqual(new Date('2024-01-16T12:30:00.000Z')) // Tuesday
      expect(dates[2]).toEqual(new Date('2024-01-17T12:30:00.000Z')) // Wednesday
      expect(dates[3]).toEqual(new Date('2024-01-18T12:30:00.000Z')) // Thursday
      expect(dates[4]).toEqual(new Date('2024-01-19T12:30:00.000Z')) // Friday
    })

    it('should skip weekends in daily recurring dates', () => {
      const startDate = new Date('2024-01-17T12:30:00.000Z') // Wednesday
      const dates = calculateRecurringDates(startDate, 'day', 5)
      
      expect(dates).toHaveLength(5)
      expect(dates[0]).toEqual(new Date('2024-01-17T12:30:00.000Z')) // Wednesday
      expect(dates[1]).toEqual(new Date('2024-01-18T12:30:00.000Z')) // Thursday
      expect(dates[2]).toEqual(new Date('2024-01-19T12:30:00.000Z')) // Friday
      expect(dates[3]).toEqual(new Date('2024-01-22T12:30:00.000Z')) // Monday (skip weekend)
      expect(dates[4]).toEqual(new Date('2024-01-23T12:30:00.000Z')) // Tuesday
    })

    it('should handle monthly recurring dates', () => {
      const startDate = new Date('2024-01-15T12:30:00.000Z') // Monday
      const dates = calculateRecurringDates(startDate, 'month', 3)
      
      expect(dates).toHaveLength(3)
      expect(dates[0]).toEqual(new Date('2024-01-15T12:30:00.000Z')) // Month 1
      expect(dates[1]).toEqual(new Date('2024-02-15T12:30:00.000Z')) // Month 2
      expect(dates[2]).toEqual(new Date('2024-03-15T12:30:00.000Z')) // Month 3
    })

    it('should adjust monthly dates to weekdays if they fall on weekends', () => {
      const startDate = new Date('2024-01-13T12:30:00.000Z') // Saturday (should not happen, but test adjustment)
      const dates = calculateRecurringDates(startDate, 'month', 2)
      
      // Should be adjusted to nearest weekday
      expect(dates).toHaveLength(2)
      dates.forEach(date => {
        const dayOfWeek = date.getDay()
        expect(dayOfWeek >= 1 && dayOfWeek <= 5).toBe(true) // Monday to Friday
      })
    })

    it('should respect maximum 2 weeks advance constraint', () => {
      const mockNow = new Date('2025-01-15T10:00:00.000Z')
      
      // Temporarily mock the global Date for calculateRecurringDates
      const originalDate = global.Date
      global.Date = jest.fn((args?: any) => {
        if (args) return new originalDate(args)
        return mockNow
      }) as any
      global.Date.now = originalDate.now

      const startDate = new Date('2025-01-16T12:30:00.000Z') // Tomorrow
      const dates = calculateRecurringDates(startDate, 'week', 5) // 5 weeks would exceed limit
      
      // Restore original Date
      global.Date = originalDate
      
      // Should filter out dates beyond 2 weeks
      const validDates = dates.filter(date => {
        const diffInMs = date.getTime() - mockNow.getTime()
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
        return diffInDays <= 14
      })
      
      expect(validDates.length).toBeLessThan(5)
      expect(dates.length).toBe(validDates.length) // Function should already filter
    })
  })
})