/**
 * Security Logger Service
 * Tracks suspicious activities and security events
 */

interface SecurityLog {
  timestamp: Date
  event: string
  userId?: string
  ip: string
  details: any
}

class SecurityLoggerService {
  private logs: SecurityLog[] = []
  private readonly MAX_LOGS = 1000 // Keep only the latest 1000 logs in memory

  /**
   * Log a security event
   */
  log(event: string, data: {
    userId?: string
    ip: string
    details?: any
  }) {
    const logEntry: SecurityLog = {
      timestamp: new Date(),
      event,
      userId: data.userId,
      ip: data.ip,
      details: data.details
    }

    this.logs.push(logEntry)

    // Keep only latest logs to prevent memory issues
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift()
    }

    // Log to console for now (in production, this would go to a logging service)
    console.warn('[SECURITY]', {
      event,
      timestamp: logEntry.timestamp.toISOString(),
      ...data
    })
  }

  /**
   * Log an invalid activity code attempt
   */
  logInvalidCodeAttempt(data: {
    userId: string
    ip: string
    code: string
    attemptNumber?: number
  }) {
    this.log('INVALID_ACTIVITY_CODE', {
      userId: data.userId,
      ip: data.ip,
      details: {
        code: data.code,
        attemptNumber: data.attemptNumber
      }
    })
  }

  /**
   * Log multiple failed attempts (potential brute force)
   */
  logSuspiciousActivity(data: {
    userId: string
    ip: string
    event: string
    details: any
  }) {
    this.log('SUSPICIOUS_ACTIVITY', {
      userId: data.userId,
      ip: data.ip,
      details: {
        event: data.event,
        ...data.details
      }
    })
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(data: {
    userId?: string
    ip: string
    endpoint: string
    limit: number
  }) {
    this.log('RATE_LIMIT_EXCEEDED', {
      userId: data.userId,
      ip: data.ip,
      details: {
        endpoint: data.endpoint,
        limit: data.limit
      }
    })
  }

  /**
   * Get recent logs for a user (admin only)
   */
  getUserLogs(userId: string, limit: number = 50): SecurityLog[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-limit)
      .reverse()
  }

  /**
   * Get all recent logs (admin only)
   */
  getRecentLogs(limit: number = 100): SecurityLog[] {
    return this.logs.slice(-limit).reverse()
  }

  /**
   * Get logs by event type
   */
  getLogsByEvent(event: string, limit: number = 50): SecurityLog[] {
    return this.logs
      .filter(log => log.event === event)
      .slice(-limit)
      .reverse()
  }

  /**
   * Check if user has too many failed attempts
   * Returns true if suspicious pattern detected
   */
  checkSuspiciousPattern(userId: string, event: string, timeWindowMinutes: number = 5): boolean {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000)

    const recentAttempts = this.logs.filter(log =>
      log.userId === userId &&
      log.event === event &&
      log.timestamp >= cutoffTime
    )

    // If more than 5 failed attempts in the time window, it's suspicious
    return recentAttempts.length > 5
  }
}

export const securityLogger = new SecurityLoggerService()
