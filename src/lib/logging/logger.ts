/**
 * Structured Logging System
 * Provides consistent logging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogContext {
  userId?: string
  matchId?: string
  endpoint?: string
  method?: string
  requestId?: string
  duration?: number
  [key: string]: any
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production'
  private minLevel: LogLevel = this.isProduction ? 'info' : 'debug'
  private logs: LogEntry[] = []
  private maxLogs = 1000

  private levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  }

  /**
   * Debug level logging
   */
  debug(message: string, context: LogContext = {}): void {
    this.log('debug', message, context)
  }

  /**
   * Info level logging
   */
  info(message: string, context: LogContext = {}): void {
    this.log('info', message, context)
  }

  /**
   * Warning level logging
   */
  warn(message: string, context: LogContext = {}): void {
    this.log('warn', message, context)
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context: LogContext = {}): void {
    const errorInfo = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined

    this.log('error', message, context, errorInfo)
  }

  /**
   * Fatal level logging (critical errors)
   */
  fatal(message: string, error?: Error, context: LogContext = {}): void {
    const errorInfo = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined

    this.log('fatal', message, context, errorInfo)
  }

  /**
   * Log HTTP requests
   */
  httpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    requestId?: string
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : 
                           statusCode >= 400 ? 'warn' : 'info'
    
    this.log(level, `HTTP ${method} ${path}`, {
      method,
      endpoint: path,
      statusCode,
      duration,
      userId,
      requestId
    })
  }

  /**
   * Log database operations
   */
  database(
    operation: string,
    table: string,
    duration: number,
    success: boolean = true,
    context: LogContext = {}
  ): void {
    const level = success ? 'debug' : 'error'
    this.log(level, `DB ${operation} on ${table}`, {
      ...context,
      operation,
      table,
      duration,
      success
    })
  }

  /**
   * Log business events
   */
  business(event: string, context: LogContext = {}): void {
    this.log('info', `Business event: ${event}`, {
      ...context,
      eventType: 'business',
      event
    })
  }

  /**
   * Log security events
   */
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context: LogContext = {}): void {
    const level: LogLevel = severity === 'critical' || severity === 'high' ? 'error' : 
                           severity === 'medium' ? 'warn' : 'info'
    
    this.log(level, `Security event: ${event}`, {
      ...context,
      eventType: 'security',
      severity,
      event
    })
  }

  /**
   * Log cache operations
   */
  cache(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, context: LogContext = {}): void {
    this.log('debug', `Cache ${operation}: ${key}`, {
      ...context,
      cacheOperation: operation,
      cacheKey: key
    })
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100, minLevel?: LogLevel): LogEntry[] {
    const minLevelNum = minLevel ? this.levels[minLevel] : 0
    
    return this.logs
      .filter(log => this.levels[log.level] >= minLevelNum)
      .slice(-limit)
      .reverse()
  }

  /**
   * Get logs by context filter
   */
  getLogsByContext(filter: Partial<LogContext>, limit: number = 100): LogEntry[] {
    return this.logs
      .filter(log => {
        return Object.entries(filter).every(([key, value]) => 
          log.context[key] === value
        )
      })
      .slice(-limit)
      .reverse()
  }

  /**
   * Get error logs summary
   */
  getErrorSummary(hours: number = 24): {
    totalErrors: number
    errorsByType: Record<string, number>
    errorsByEndpoint: Record<string, number>
    recentErrors: LogEntry[]
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    const errorLogs = this.logs.filter(log => 
      log.level === 'error' || log.level === 'fatal'
    ).filter(log => 
      new Date(log.timestamp) > cutoff
    )

    const errorsByType: Record<string, number> = {}
    const errorsByEndpoint: Record<string, number> = {}

    errorLogs.forEach(log => {
      if (log.error?.name) {
        errorsByType[log.error.name] = (errorsByType[log.error.name] || 0) + 1
      }
      if (log.context.endpoint) {
        errorsByEndpoint[log.context.endpoint] = (errorsByEndpoint[log.context.endpoint] || 0) + 1
      }
    })

    return {
      totalErrors: errorLogs.length,
      errorsByType,
      errorsByEndpoint,
      recentErrors: errorLogs.slice(-10).reverse()
    }
  }

  /**
   * Export logs for external systems
   */
  exportLogs(format: 'json' | 'csv' = 'json', limit: number = 1000): string {
    const logs = this.logs.slice(-limit)
    
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'message', 'userId', 'endpoint', 'duration', 'error']
      const rows = logs.map(log => [
        log.timestamp,
        log.level,
        `"${log.message.replace(/"/g, '""')}"`,
        log.context.userId || '',
        log.context.endpoint || '',
        log.context.duration?.toString() || '',
        log.error ? `"${log.error.message.replace(/"/g, '""')}"` : ''
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
    
    return JSON.stringify(logs, null, 2)
  }

  /**
   * Clear old logs to prevent memory leaks
   */
  private cleanup(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs / 2)
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: { name: string; message: string; stack?: string }
  ): void {
    if (this.levels[level] < this.levels[this.minLevel]) {
      return
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...context },
      ...(error && { error })
    }

    // Store in memory
    this.logs.push(logEntry)
    this.cleanup()

    // Console output with appropriate formatting
    this.outputToConsole(logEntry)

    // In production, you might want to send to external logging service
    if (this.isProduction && (level === 'error' || level === 'fatal')) {
      this.sendToExternalService(logEntry)
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const { timestamp, level, message, context, error } = entry
    const time = new Date(timestamp).toLocaleTimeString()
    
    // Color codes for different levels
    const colors = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
      fatal: '\x1b[35m'  // magenta
    }
    const reset = '\x1b[0m'
    const color = colors[level] || reset

    // Format context for display
    const contextStr = Object.keys(context).length > 0 
      ? ` ${JSON.stringify(context)}` 
      : ''

    // Format error for display
    const errorStr = error 
      ? ` ERROR: ${error.name}: ${error.message}` 
      : ''

    const logLine = `${color}[${time}] ${level.toUpperCase()}${reset} ${message}${contextStr}${errorStr}`

    switch (level) {
      case 'debug':
        console.debug(logLine)
        break
      case 'info':
        console.info(logLine)
        break
      case 'warn':
        console.warn(logLine)
        break
      case 'error':
      case 'fatal':
        console.error(logLine)
        if (error?.stack && !this.isProduction) {
          console.error(error.stack)
        }
        break
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // In a real application, you would send this to services like:
    // - Sentry for error tracking
    // - DataDog for logging
    // - CloudWatch for AWS
    // - Google Cloud Logging
    // etc.
    
    // For now, we'll just log that it would be sent
    if (!this.isProduction) {
      console.debug('Would send to external logging service:', entry)
    }
  }
}

// Create singleton logger instance
export const logger = new Logger()

// Convenience functions for common logging patterns
export const loggerUtils = {
  /**
   * Log API request start
   */
  requestStart: (method: string, path: string, requestId: string, userId?: string) => {
    logger.info(`Request started: ${method} ${path}`, {
      method,
      endpoint: path,
      requestId,
      userId,
      phase: 'start'
    })
  },

  /**
   * Log API request end
   */
  requestEnd: (
    method: string, 
    path: string, 
    statusCode: number, 
    duration: number, 
    requestId: string, 
    userId?: string
  ) => {
    logger.httpRequest(method, path, statusCode, duration, userId, requestId)
  },

  /**
   * Log user action
   */
  userAction: (action: string, userId: string, details?: any) => {
    logger.business(`User action: ${action}`, {
      userId,
      action,
      ...details
    })
  },

  /**
   * Log database performance issue
   */
  slowQuery: (query: string, duration: number, table?: string) => {
    logger.warn(`Slow database query detected (${duration}ms)`, {
      query,
      duration,
      table,
      performance: 'slow'
    })
  }
}