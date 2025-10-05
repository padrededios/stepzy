/**
 * Time Constraints Utilities for Match Creation
 * Handles business rules for futsal match scheduling (12h-14h, weekdays only, advance booking limits)
 */

export interface MatchCreationData {
  date: Date
  maxPlayers: number
  description: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export type RecurringFrequency = 'day' | 'week' | 'month'

/**
 * Validates if a time string has valid format (any hour allowed)
 */
export function isValidMatchTime(timeString: string): boolean {
  if (!timeString || typeof timeString !== 'string') {
    return false
  }

  const timeRegex = /^([0-1]?\d|2[0-3]):([0-5]?\d)$/
  const match = timeString.match(timeRegex)
  
  return match !== null
}

/**
 * Validates if a date is valid for match creation
 * - Must be weekday (Monday-Friday)
 * - Must be at least 4h in advance
 * - Must not be more than 2 weeks in advance
 */
export function isValidMatchDate(date: Date, referenceDate?: Date): boolean {
  const now = referenceDate || new Date()
  const matchDate = new Date(date)
  
  // Check if it's a weekday (1 = Monday, 5 = Friday)
  const dayOfWeek = matchDate.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
    return false
  }
  
  // Check minimum advance booking (4 hours)
  const diffInMs = matchDate.getTime() - now.getTime()
  const diffInHours = diffInMs / (1000 * 60 * 60)
  
  if (diffInHours < 4) {
    return false
  }
  
  // Check maximum advance booking (2 weeks = 14 days)
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
  if (diffInDays > 14) {
    return false
  }
  
  return true
}

/**
 * Returns available time slots for match creation (every 15 minutes from 6:00 to 23:00)
 */
export function getAvailableTimeSlots(): string[] {
  const slots: string[] = []
  
  for (let hour = 6; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(timeString)
    }
  }
  
  return slots
}

/**
 * Returns available duration options in minutes
 */
export function getAvailableDurations(): { value: number; label: string }[] {
  return [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 heure' },
    { value: 90, label: '1h30' },
    { value: 120, label: '2 heures' }
  ]
}

/**
 * Validates complete match creation data
 */
export function validateMatchCreation(data: MatchCreationData): ValidationResult {
  const errors: string[] = []
  
  // Validate date constraints
  if (!isValidMatchDate(data.date)) {
    const dayOfWeek = data.date.getDay()
    const now = new Date()
    const diffInMs = data.date.getTime() - now.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      errors.push('Les matchs ne peuvent avoir lieu que du lundi au vendredi')
    }
    
    if (diffInHours < 4) {
      errors.push('Le match doit être créé au moins 4h à l\'avance')
    }
    
    if (diffInDays > 14) {
      errors.push('Le match ne peut pas être créé plus de 2 semaines à l\'avance')
    }
  }
  
  // Validate time constraints
  const timeString = data.date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
  
  if (!isValidMatchTime(timeString)) {
    errors.push('L\'heure saisie n\'est pas valide')
  }
  
  // Validate player constraints
  if (data.maxPlayers < 2) {
    errors.push('Il faut au moins 2 joueurs pour un match')
  }
  
  if (data.maxPlayers > 12) {
    errors.push('Le nombre maximum de joueurs ne peut pas dépasser 12')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calculates recurring dates based on frequency and count
 */
export function calculateRecurringDates(
  startDate: Date, 
  frequency: RecurringFrequency, 
  count: number
): Date[] {
  const dates: Date[] = []
  let currentDate = new Date(startDate)
  const now = new Date()
  
  for (let i = 0; i < count; i++) {
    // Ensure date is still within 2-week limit
    const diffInMs = currentDate.getTime() - now.getTime()
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
    
    if (diffInDays > 14) {
      break // Stop if we exceed the 2-week limit
    }
    
    // Ensure it's a weekday
    let adjustedDate = new Date(currentDate)
    while (adjustedDate.getDay() === 0 || adjustedDate.getDay() === 6) {
      adjustedDate.setDate(adjustedDate.getDate() + 1)
    }
    
    dates.push(new Date(adjustedDate))
    
    // Calculate next date based on frequency
    switch (frequency) {
      case 'day':
        // Skip to next weekday
        do {
          currentDate.setDate(currentDate.getDate() + 1)
        } while (currentDate.getDay() === 0 || currentDate.getDay() === 6)
        break
        
      case 'week':
        currentDate.setDate(currentDate.getDate() + 7)
        break
        
      case 'month':
        currentDate.setMonth(currentDate.getMonth() + 1)
        break
    }
  }
  
  return dates
}

/**
 * Formats a date for HTML date input (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Formats a date for HTML time input (HH:MM)
 */
export function formatTimeForInput(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}

/**
 * Creates a Date object from date and time strings
 */
export function createDateFromInputs(dateString: string, timeString: string): Date {
  return new Date(`${dateString}T${timeString}:00.000Z`)
}

/**
 * Gets quick preset dates for common scenarios
 */
export function getQuickPresets() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const dayAfterTomorrow = new Date(now)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
  
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  
  return {
    today: now,
    tomorrow,
    dayAfterTomorrow,
    nextWeek
  }
}

/**
 * Validates if a match conflicts with existing matches
 */
export function hasTimeConflict(
  newMatchDate: Date,
  existingMatches: Array<{ date: Date }>
): boolean {
  const newMatchTime = newMatchDate.getTime()
  const bufferMs = 30 * 60 * 1000 // 30 minutes buffer
  
  return existingMatches.some(match => {
    const existingTime = match.date.getTime()
    return Math.abs(newMatchTime - existingTime) < bufferMs
  })
}