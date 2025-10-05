/**
 * Logger Tests
 * Tests the structured logging system
 */

import { logger, loggerUtils } from '../../../lib/logging/logger'

// Mock console methods to avoid spam during tests
const consoleSpy = {
  debug: jest.spyOn(console, 'debug').mockImplementation(),
  info: jest.spyOn(console, 'info').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
}

describe('Logging System', () => {
  beforeEach(() => {
    // Clear logs before each test
    logger['logs'] = []
    // Clear all console spy calls
    Object.values(consoleSpy).forEach(spy => spy.mockClear())
  })

  afterAll(() => {
    // Restore console methods
    Object.values(consoleSpy).forEach(spy => spy.mockRestore())
  })

  describe('Basic Logging Levels', () => {
    test('should log debug messages', () => {
      logger.debug('Debug message', { component: 'test' })
      
      const logs = logger.getRecentLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('debug')
      expect(logs[0].message).toBe('Debug message')
      expect(logs[0].context.component).toBe('test')
    })

    test('should log info messages', () => {
      logger.info('Info message', { userId: 'user123' })
      
      const logs = logger.getRecentLogs()
      expect(logs[0].level).toBe('info')
      expect(logs[0].message).toBe('Info message')
      expect(logs[0].context.userId).toBe('user123')
    })

    test('should log warning messages', () => {
      logger.warn('Warning message')
      
      const logs = logger.getRecentLogs()
      expect(logs[0].level).toBe('warn')
      expect(logs[0].message).toBe('Warning message')
    })

    test('should log error messages', () => {
      const error = new Error('Test error')
      error.stack = 'Error stack trace'
      
      logger.error('Error occurred', error, { endpoint: '/api/test' })
      
      const logs = logger.getRecentLogs()
      expect(logs[0].level).toBe('error')
      expect(logs[0].message).toBe('Error occurred')
      expect(logs[0].error?.message).toBe('Test error')
      expect(logs[0].error?.stack).toBe('Error stack trace')
      expect(logs[0].context.endpoint).toBe('/api/test')
    })

    test('should log fatal messages', () => {
      const criticalError = new Error('Critical system failure')
      
      logger.fatal('System failure', criticalError)
      
      const logs = logger.getRecentLogs()
      expect(logs[0].level).toBe('fatal')
      expect(logs[0].message).toBe('System failure')
      expect(logs[0].error?.message).toBe('Critical system failure')
    })
  })

  describe('Specialized Logging Methods', () => {
    test('should log HTTP requests', () => {
      logger.httpRequest('GET', '/api/matches', 200, 150, 'user123', 'req-456')
      
      const logs = logger.getRecentLogs()
      expect(logs[0].level).toBe('info')
      expect(logs[0].message).toBe('HTTP GET /api/matches')
      expect(logs[0].context.method).toBe('GET')
      expect(logs[0].context.statusCode).toBe(200)
      expect(logs[0].context.duration).toBe(150)
      expect(logs[0].context.userId).toBe('user123')
      expect(logs[0].context.requestId).toBe('req-456')
    })

    test('should log HTTP errors as error level', () => {
      logger.httpRequest('POST', '/api/matches', 500, 300)
      
      const logs = logger.getRecentLogs()
      expect(logs[0].level).toBe('error')
    })

    test('should log database operations', () => {
      logger.database('SELECT', 'users', 25, true, { query: 'user lookup' })
      
      const logs = logger.getRecentLogs()
      expect(logs[0].level).toBe('debug')
      expect(logs[0].message).toBe('DB SELECT on users')
      expect(logs[0].context.operation).toBe('SELECT')
      expect(logs[0].context.table).toBe('users')
      expect(logs[0].context.duration).toBe(25)
      expect(logs[0].context.success).toBe(true)
    })

    test('should log failed database operations as errors', () => {
      logger.database('INSERT', 'matches', 100, false)
      
      const logs = logger.getRecentLogs()
      expect(logs[0].level).toBe('error')
    })

    test('should log business events', () => {
      logger.business('user.registered', { source: 'web', userId: 'user123' })
      
      const logs = logger.getRecentLogs()
      expect(logs[0].level).toBe('info')
      expect(logs[0].message).toBe('Business event: user.registered')
      expect(logs[0].context.eventType).toBe('business')
      expect(logs[0].context.event).toBe('user.registered')
      expect(logs[0].context.source).toBe('web')
    })

    test('should log security events with severity', () => {
      logger.security('failed.login.attempt', 'high', { 
        userId: 'user123', 
        ip: '192.168.1.100' 
      })
      
      const logs = logger.getRecentLogs()
      expect(logs[0].level).toBe('error')
      expect(logs[0].message).toBe('Security event: failed.login.attempt')
      expect(logs[0].context.severity).toBe('high')
      expect(logs[0].context.eventType).toBe('security')
    })

    test('should log cache operations', () => {
      logger.cache('hit', 'matches:list', { ttl: 300 })
      
      const logs = logger.getRecentLogs()
      expect(logs[0].level).toBe('debug')
      expect(logs[0].message).toBe('Cache hit: matches:list')
      expect(logs[0].context.cacheOperation).toBe('hit')
      expect(logs[0].context.cacheKey).toBe('matches:list')
    })
  })

  describe('Log Retrieval and Filtering', () => {
    beforeEach(() => {
      // Add some test logs
      logger.info('Info message 1', { userId: 'user1' })
      logger.warn('Warning message', { userId: 'user1' })
      logger.error('Error message', new Error('Test'))
      logger.info('Info message 2', { userId: 'user2' })
      logger.debug('Debug message')
    })

    test('should get recent logs with limit', () => {
      const logs = logger.getRecentLogs(3)
      expect(logs).toHaveLength(3)
      // Should be in reverse chronological order
      expect(logs[0].message).toBe('Debug message')
      expect(logs[1].message).toBe('Info message 2')
      expect(logs[2].message).toBe('Error message')
    })

    test('should filter logs by minimum level', () => {
      const errorLogs = logger.getRecentLogs(100, 'error')
      expect(errorLogs).toHaveLength(1)
      expect(errorLogs[0].level).toBe('error')
    })

    test('should get logs by context filter', () => {
      const user1Logs = logger.getLogsByContext({ userId: 'user1' })
      expect(user1Logs).toHaveLength(2)
      expect(user1Logs.every(log => log.context.userId === 'user1')).toBe(true)
    })

    test('should get error summary', () => {
      const summary = logger.getErrorSummary(24)
      
      expect(summary.totalErrors).toBe(1)
      expect(summary.recentErrors).toHaveLength(1)
      expect(summary.recentErrors[0].message).toBe('Error message')
      expect(summary.errorsByType.Error).toBe(1)
    })
  })

  describe('Log Export', () => {
    beforeEach(() => {
      logger.info('Export test', { userId: 'user1', duration: 100 })
      logger.error('Export error', new Error('Test error'))
    })

    test('should export logs as JSON', () => {
      const exported = logger.exportLogs('json', 10)
      const parsed = JSON.parse(exported)
      
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].message).toBe('Export test')
    })

    test('should export logs as CSV', () => {
      const exported = logger.exportLogs('csv', 10)
      const lines = exported.split('\n')
      
      expect(lines[0]).toContain('timestamp,level,message')
      expect(lines[1]).toContain('Export test')
      expect(lines[2]).toContain('Export error')
    })
  })

  describe('Logger Utilities', () => {
    test('should log request start', () => {
      loggerUtils.requestStart('GET', '/api/test', 'req123', 'user456')
      
      const logs = logger.getRecentLogs()
      expect(logs[0].message).toBe('Request started: GET /api/test')
      expect(logs[0].context.requestId).toBe('req123')
      expect(logs[0].context.userId).toBe('user456')
      expect(logs[0].context.phase).toBe('start')
    })

    test('should log request end', () => {
      loggerUtils.requestEnd('POST', '/api/matches', 201, 200, 'req123', 'user456')
      
      const logs = logger.getRecentLogs()
      expect(logs[0].context.statusCode).toBe(201)
      expect(logs[0].context.duration).toBe(200)
    })

    test('should log user actions', () => {
      loggerUtils.userAction('match.joined', 'user123', { matchId: 'match456' })
      
      const logs = logger.getRecentLogs()
      expect(logs[0].message).toBe('Business event: User action: match.joined')
      expect(logs[0].context.action).toBe('match.joined')
      expect(logs[0].context.matchId).toBe('match456')
    })

    test('should log slow queries', () => {
      loggerUtils.slowQuery('SELECT * FROM matches WHERE date > ?', 2500, 'matches')
      
      const logs = logger.getRecentLogs()
      expect(logs[0].level).toBe('warn')
      expect(logs[0].message).toContain('Slow database query')
      expect(logs[0].context.duration).toBe(2500)
      expect(logs[0].context.performance).toBe('slow')
    })
  })

  describe('Log Management', () => {
    test('should cleanup old logs when limit exceeded', () => {
      // Set a low limit for testing
      logger['maxLogs'] = 5
      
      // Add more logs than the limit
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`)
      }
      
      const logs = logger.getRecentLogs()
      expect(logs.length).toBeLessThanOrEqual(5)
      
      // Restore original limit
      logger['maxLogs'] = 1000
    })

    test('should handle timestamps correctly', () => {
      logger.info('Timestamp test')
      
      const logs = logger.getRecentLogs()
      const timestamp = new Date(logs[0].timestamp)
      
      expect(timestamp).toBeInstanceOf(Date)
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('Production vs Development', () => {
    test('should respect minimum log level', () => {
      // In test environment, debug should be logged
      logger.debug('Debug in test')
      expect(logger.getRecentLogs()).toHaveLength(1)
    })

    test('should not output to external service in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      logger.error('Test error for external service', new Error('Test'))
      
      // Should not throw or cause issues
      expect(logger.getRecentLogs()).toHaveLength(1)
      
      process.env.NODE_ENV = originalEnv
    })
  })
})