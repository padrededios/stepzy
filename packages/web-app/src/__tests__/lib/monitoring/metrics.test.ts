/**
 * Metrics System Tests
 * Tests the application monitoring and metrics collection
 */

import { metrics, BusinessMetrics } from '../../../lib/monitoring/metrics'

describe('Metrics System', () => {
  beforeEach(() => {
    // Clear metrics before each test
    metrics['metrics'] = []
    metrics['counters'] = new Map()
    metrics['timings'] = new Map()
  })

  describe('Timing Metrics', () => {
    test('should track operation timing', () => {
      const operationId = 'test-operation'
      
      metrics.startTiming(operationId)
      
      // Simulate some work
      const duration = metrics.endTiming(operationId, 'test.operation')
      
      expect(duration).toBeGreaterThan(0)
      expect(duration).toBeLessThan(100) // Should be very fast
    })

    test('should handle missing start time gracefully', () => {
      const duration = metrics.endTiming('non-existent', 'test.operation')
      expect(duration).toBe(0)
    })

    test('should clean up timing after end', () => {
      const operationId = 'cleanup-test'
      
      metrics.startTiming(operationId)
      metrics.endTiming(operationId, 'test.operation')
      
      // Trying to end again should return 0
      const duration = metrics.endTiming(operationId, 'test.operation')
      expect(duration).toBe(0)
    })
  })

  describe('Counter Metrics', () => {
    test('should increment counters', () => {
      metrics.incrementCounter('test.counter', 5)
      metrics.incrementCounter('test.counter', 3)
      
      const summary = metrics.getMetricsSummary()
      expect(summary.counters['test.counter']).toBe(8)
    })

    test('should increment by 1 by default', () => {
      metrics.incrementCounter('test.default')
      
      const summary = metrics.getMetricsSummary()
      expect(summary.counters['test.default']).toBe(1)
    })

    test('should handle negative increments', () => {
      metrics.incrementCounter('test.negative', -5)
      
      const summary = metrics.getMetricsSummary()
      expect(summary.counters['test.negative']).toBe(-5)
    })
  })

  describe('Gauge Metrics', () => {
    test('should record gauge values', () => {
      metrics.recordGauge('test.gauge', 42.5)
      
      // Gauges are recorded as regular metrics
      // We can verify by checking the metrics array
      expect(metrics['metrics'].length).toBe(1)
      expect(metrics['metrics'][0].name).toBe('test.gauge')
      expect(metrics['metrics'][0].value).toBe(42.5)
    })
  })

  describe('Error Metrics', () => {
    test('should record error metrics', () => {
      const error = new Error('Test error')
      error.stack = 'Error stack trace'
      
      metrics.recordError(error, {
        userId: 'user123',
        endpoint: '/api/test'
      })
      
      const summary = metrics.getMetricsSummary()
      expect(summary.counters['errors.total']).toBe(1)
      expect(summary.recentErrors.length).toBe(1)
      expect(summary.recentErrors[0].error).toBe('Test error')
    })

    test('should handle errors without context', () => {
      const error = new Error('Simple error')
      
      metrics.recordError(error)
      
      const summary = metrics.getMetricsSummary()
      expect(summary.counters['errors.total']).toBe(1)
    })
  })

  describe('HTTP Request Metrics', () => {
    test('should record HTTP request metrics', () => {
      metrics.recordHttpRequest('GET', '/api/matches', 200, 150, 'user123')
      
      const summary = metrics.getMetricsSummary()
      expect(summary.totalRequests).toBe(1)
      expect(summary.averageResponseTime).toBe(150)
      expect(summary.errorRate).toBe(0)
    })

    test('should calculate error rates correctly', () => {
      // Record successful and failed requests
      metrics.recordHttpRequest('GET', '/api/matches', 200, 100)
      metrics.recordHttpRequest('POST', '/api/matches', 500, 200)
      metrics.recordHttpRequest('GET', '/api/users', 404, 50)
      
      const summary = metrics.getMetricsSummary()
      expect(summary.totalRequests).toBe(3)
      expect(summary.errorRate).toBe(66.67) // 2 out of 3 are errors
    })

    test('should track different status code classes', () => {
      metrics.recordHttpRequest('GET', '/test', 200, 100)
      metrics.recordHttpRequest('POST', '/test', 404, 100)
      metrics.recordHttpRequest('PUT', '/test', 500, 100)
      
      const summary = metrics.getMetricsSummary()
      expect(summary.counters['http.requests.total']).toBe(3)
      expect(summary.counters['http.requests.errors']).toBe(2)
    })
  })

  describe('Database Query Metrics', () => {
    test('should record successful database queries', () => {
      metrics.recordDatabaseQuery('SELECT * FROM users', 25, true)
      
      const summary = metrics.getMetricsSummary()
      expect(summary.counters['database.queries.total']).toBe(1)
    })

    test('should record failed database queries', () => {
      metrics.recordDatabaseQuery('INSERT INTO users', 100, false)
      
      const summary = metrics.getMetricsSummary()
      expect(summary.counters['database.queries.total']).toBe(1)
    })

    test('should extract query types correctly', () => {
      const queries = [
        'SELECT * FROM matches',
        'INSERT INTO users VALUES',
        'UPDATE matches SET',
        'DELETE FROM sessions',
        'CREATE TABLE test'
      ]
      
      queries.forEach(query => {
        metrics.recordDatabaseQuery(query, 50, true)
      })
      
      expect(metrics['metrics'].length).toBe(5)
    })
  })

  describe('Business Metrics', () => {
    test('should record business metrics with prefix', () => {
      metrics.recordBusinessMetric('user.signup', 1, { source: 'web' })
      
      expect(metrics['metrics'].length).toBe(1)
      expect(metrics['metrics'][0].name).toBe('business.user.signup')
      expect(metrics['metrics'][0].tags?.source).toBe('web')
    })
  })

  describe('Business Metrics Helpers', () => {
    test('should record user registration', () => {
      BusinessMetrics.userRegistered()
      
      expect(metrics['metrics'].some(m => 
        m.name === 'business.user.registered' && m.value === 1
      )).toBe(true)
    })

    test('should record match events', () => {
      BusinessMetrics.matchCreated()
      BusinessMetrics.matchJoined()
      BusinessMetrics.matchCancelled()
      
      expect(metrics['metrics'].filter(m => 
        m.name.startsWith('business.match')
      ).length).toBe(3)
    })

    test('should record notification events', () => {
      BusinessMetrics.notificationSent('email')
      BusinessMetrics.waitingListPromotion()
      
      const notificationMetrics = metrics['metrics'].filter(m => 
        m.name.includes('notification') || m.name.includes('waiting_list')
      )
      expect(notificationMetrics.length).toBe(2)
    })
  })

  describe('Metrics Summary', () => {
    test('should provide comprehensive summary', () => {
      // Generate some test data
      metrics.recordHttpRequest('GET', '/api/test', 200, 100)
      metrics.recordHttpRequest('POST', '/api/test', 500, 200)
      metrics.recordError(new Error('Test error'))
      metrics.incrementCounter('custom.counter', 5)
      
      const summary = metrics.getMetricsSummary()
      
      expect(summary).toHaveProperty('totalRequests')
      expect(summary).toHaveProperty('errorRate')
      expect(summary).toHaveProperty('averageResponseTime')
      expect(summary).toHaveProperty('counters')
      expect(summary).toHaveProperty('recentErrors')
      
      expect(summary.totalRequests).toBe(2)
      expect(summary.errorRate).toBe(50)
      expect(summary.averageResponseTime).toBe(150)
      expect(summary.recentErrors.length).toBe(1)
    })

    test('should handle empty metrics', () => {
      const summary = metrics.getMetricsSummary()
      
      expect(summary.totalRequests).toBe(0)
      expect(summary.errorRate).toBe(0)
      expect(summary.averageResponseTime).toBe(0)
      expect(summary.recentErrors).toEqual([])
    })
  })

  describe('Metrics Cleanup', () => {
    test('should cleanup old metrics', () => {
      // Add many metrics to trigger cleanup
      for (let i = 0; i < 1100; i++) {
        metrics.recordGauge(`test.metric.${i}`, i)
      }
      
      // Should have triggered cleanup at 1000 metrics
      expect(metrics['metrics'].length).toBeLessThanOrEqual(1000)
    })

    test('should cleanup metrics by age', () => {
      // Add a metric
      metrics.recordGauge('old.metric', 1)
      
      // Cleanup metrics older than 0ms (should remove all)
      metrics.cleanupOldMetrics(0)
      
      expect(metrics['metrics'].length).toBe(0)
    })
  })

  describe('Prometheus Export', () => {
    test('should export in production format', () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      metrics.incrementCounter('test.counter', 5)
      metrics.recordHttpRequest('GET', '/test', 200, 100)
      
      const prometheusData = metrics.exportPrometheusMetrics()
      
      expect(prometheusData).toContain('# TYPE')
      expect(prometheusData).toContain('test_counter')
      
      // Restore environment
      process.env.NODE_ENV = originalEnv
    })

    test('should not export in development', () => {
      const prometheusData = metrics.exportPrometheusMetrics()
      expect(prometheusData).toContain('Metrics export only available in production')
    })
  })
})