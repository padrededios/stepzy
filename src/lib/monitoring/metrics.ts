/**
 * Application Metrics and Monitoring
 * Tracks performance, errors, and business metrics
 */

interface Metric {
  name: string
  value: number
  timestamp: Date
  tags?: Record<string, string>
}

interface TimingMetric extends Metric {
  duration: number
  endpoint?: string
  method?: string
  status?: number
}

interface ErrorMetric extends Metric {
  error: string
  stack?: string
  userId?: string
  endpoint?: string
}

class MetricsCollector {
  private metrics: Metric[] = []
  private timings: Map<string, number> = new Map()
  private counters: Map<string, number> = new Map()
  private isProduction = process.env.NODE_ENV === 'production'

  /**
   * Start timing an operation
   */
  startTiming(operationId: string): void {
    this.timings.set(operationId, Date.now())
  }

  /**
   * End timing and record metric
   */
  endTiming(
    operationId: string, 
    metricName: string, 
    tags?: Record<string, string>
  ): number {
    const startTime = this.timings.get(operationId)
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationId}`)
      return 0
    }

    const duration = Date.now() - startTime
    this.timings.delete(operationId)

    const metric: TimingMetric = {
      name: metricName,
      value: 1,
      timestamp: new Date(),
      duration,
      tags
    }

    this.recordMetric(metric)
    return duration
  }

  /**
   * Record a counter metric
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const currentValue = this.counters.get(name) || 0
    this.counters.set(name, currentValue + value)

    this.recordMetric({
      name,
      value: currentValue + value,
      timestamp: new Date(),
      tags
    })
  }

  /**
   * Record a gauge metric (point-in-time value)
   */
  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      timestamp: new Date(),
      tags
    })
  }

  /**
   * Record an error metric
   */
  recordError(
    error: Error, 
    context?: {
      userId?: string
      endpoint?: string
      additionalTags?: Record<string, string>
    }
  ): void {
    const errorMetric: ErrorMetric = {
      name: 'error',
      value: 1,
      timestamp: new Date(),
      error: error.message,
      stack: error.stack,
      userId: context?.userId,
      endpoint: context?.endpoint,
      tags: context?.additionalTags
    }

    this.recordMetric(errorMetric)

    // Also increment error counter
    this.incrementCounter('errors.total', 1, {
      error_type: error.name,
      endpoint: context?.endpoint || 'unknown',
      ...context?.additionalTags
    })
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    userId?: string
  ): void {
    const metric: TimingMetric = {
      name: 'http.request',
      value: 1,
      timestamp: new Date(),
      duration,
      method,
      endpoint,
      status: statusCode,
      tags: {
        method,
        endpoint: endpoint.replace(/\/\d+/g, '/:id'), // Normalize dynamic routes
        status: statusCode.toString(),
        status_class: `${Math.floor(statusCode / 100)}xx`,
        user_id: userId || 'anonymous'
      }
    }

    this.recordMetric(metric)

    // Update counters
    this.incrementCounter('http.requests.total', 1, metric.tags)
    
    if (statusCode >= 400) {
      this.incrementCounter('http.requests.errors', 1, metric.tags)
    }
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(
    query: string,
    duration: number,
    success: boolean = true
  ): void {
    const metric: TimingMetric = {
      name: 'database.query',
      value: 1,
      timestamp: new Date(),
      duration,
      tags: {
        query_type: this.extractQueryType(query),
        success: success.toString()
      }
    }

    this.recordMetric(metric)
    this.incrementCounter('database.queries.total', 1, metric.tags)
  }

  /**
   * Record business metrics
   */
  recordBusinessMetric(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    this.recordMetric({
      name: `business.${name}`,
      value,
      timestamp: new Date(),
      tags
    })
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): {
    totalRequests: number
    errorRate: number
    averageResponseTime: number
    counters: Record<string, number>
    recentErrors: ErrorMetric[]
  } {
    const httpMetrics = this.metrics.filter(m => m.name === 'http.request') as TimingMetric[]
    const errorMetrics = this.metrics.filter(m => m.name === 'error') as ErrorMetric[]
    
    const totalRequests = httpMetrics.length
    const errorCount = this.counters.get('http.requests.errors') || 0
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0
    
    const avgResponseTime = httpMetrics.length > 0
      ? httpMetrics.reduce((sum, m) => sum + m.duration, 0) / httpMetrics.length
      : 0

    // Get recent errors (last 10)
    const recentErrors = errorMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    return {
      totalRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: Math.round(avgResponseTime * 100) / 100,
      counters: Object.fromEntries(this.counters.entries()),
      recentErrors
    }
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  cleanupOldMetrics(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff)
  }

  /**
   * Export metrics in Prometheus format (for production monitoring)
   */
  exportPrometheusMetrics(): string {
    if (!this.isProduction) {
      return '# Metrics export only available in production'
    }

    const lines: string[] = []
    
    // Add counter metrics
    for (const [name, value] of this.counters.entries()) {
      lines.push(`# TYPE ${name.replace(/\./g, '_')} counter`)
      lines.push(`${name.replace(/\./g, '_')} ${value}`)
    }

    // Add recent timing metrics as histograms
    const timingMetrics = this.metrics.filter(m => 'duration' in m) as TimingMetric[]
    const grouped = new Map<string, number[]>()
    
    timingMetrics.forEach(m => {
      const key = m.name.replace(/\./g, '_')
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(m.duration)
    })

    for (const [name, durations] of grouped.entries()) {
      lines.push(`# TYPE ${name}_duration_ms summary`)
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length
      const p95 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)]
      
      lines.push(`${name}_duration_ms_count ${durations.length}`)
      lines.push(`${name}_duration_ms_sum ${durations.reduce((a, b) => a + b, 0)}`)
      lines.push(`${name}_duration_ms{quantile="0.5"} ${avg}`)
      lines.push(`${name}_duration_ms{quantile="0.95"} ${p95 || 0}`)
    }

    return lines.join('\n')
  }

  private recordMetric(metric: Metric): void {
    this.metrics.push(metric)

    // Log to console in development
    if (!this.isProduction) {
      if (metric.name === 'error') {
        console.error('🚨 Error metric:', metric)
      } else if ('duration' in metric) {
        const timing = metric as TimingMetric
        console.log(`⏱️  ${timing.name}: ${timing.duration}ms`, timing.tags || {})
      }
    }

    // Cleanup old metrics periodically
    if (this.metrics.length > 1000) {
      this.cleanupOldMetrics()
    }
  }

  private extractQueryType(query: string): string {
    const trimmed = query.trim().toLowerCase()
    if (trimmed.startsWith('select')) return 'select'
    if (trimmed.startsWith('insert')) return 'insert'
    if (trimmed.startsWith('update')) return 'update'
    if (trimmed.startsWith('delete')) return 'delete'
    if (trimmed.startsWith('create')) return 'create'
    return 'other'
  }
}

// Singleton instance
export const metrics = new MetricsCollector()

// Helper decorators and middleware
export const withMetrics = (metricName: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const operationId = `${target.constructor.name}.${propertyKey}-${Date.now()}`
      metrics.startTiming(operationId)

      try {
        const result = await originalMethod.apply(this, args)
        const duration = metrics.endTiming(operationId, metricName)
        return result
      } catch (error) {
        metrics.endTiming(operationId, metricName, { error: 'true' })
        metrics.recordError(error as Error, { endpoint: propertyKey })
        throw error
      }
    }
  }
}

// Business metrics helpers
export const BusinessMetrics = {
  userRegistered: () => metrics.recordBusinessMetric('user.registered', 1),
  matchCreated: () => metrics.recordBusinessMetric('match.created', 1),
  matchJoined: () => metrics.recordBusinessMetric('match.joined', 1),
  matchCancelled: () => metrics.recordBusinessMetric('match.cancelled', 1),
  notificationSent: (type: string) => 
    metrics.recordBusinessMetric('notification.sent', 1, { type }),
  waitingListPromotion: () => 
    metrics.recordBusinessMetric('waiting_list.promotion', 1)
}