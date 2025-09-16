/**
 * Monitoring Middleware for API Routes
 * Tracks performance, errors, and request metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { metrics } from '../monitoring/metrics'
import { cache, CACHE_KEYS } from '../cache/redis'

interface MonitoringOptions {
  enableMetrics?: boolean
  enableCaching?: boolean
  cacheKey?: string
  cacheTTL?: number
  slowRequestThreshold?: number
  logRequests?: boolean
}

type RouteHandler = (request: NextRequest, context?: any) => Promise<NextResponse>

/**
 * Monitoring wrapper for API routes
 */
export function withMonitoring(
  handler: RouteHandler,
  options: MonitoringOptions = {}
) {
  const {
    enableMetrics = true,
    enableCaching = false,
    cacheKey,
    cacheTTL = 300,
    slowRequestThreshold = 1000,
    logRequests = process.env.NODE_ENV !== 'production'
  } = options

  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now()
    const method = request.method
    const pathname = new URL(request.url).pathname
    const operationId = `${method}:${pathname}-${startTime}`

    // Start timing if metrics enabled
    if (enableMetrics) {
      metrics.startTiming(operationId)
    }

    // Log request start
    if (logRequests) {
      console.log(`📥 ${method} ${pathname}`)
    }

    let response: NextResponse
    let error: Error | null = null
    let userId: string | undefined

    try {
      // Try cache first if enabled
      if (enableCaching && cacheKey && method === 'GET') {
        const cached = await cache.get(cacheKey)
        if (cached) {
          response = NextResponse.json(cached)
          
          // Add cache hit header
          response.headers.set('X-Cache', 'HIT')
          
          // Still record metrics for cached responses
          if (enableMetrics) {
            const duration = metrics.endTiming(operationId, 'api.request.cached')
            metrics.recordHttpRequest(method, pathname, 200, duration, userId)
          }
          
          if (logRequests) {
            console.log(`💨 ${method} ${pathname} - CACHED (${Date.now() - startTime}ms)`)
          }
          
          return response
        }
      }

      // Execute the actual handler
      response = await handler(request, context)
      
      // Extract user ID from context if available
      userId = context?.user?.id

      // Cache successful GET responses if enabled
      if (enableCaching && cacheKey && method === 'GET' && response.status === 200) {
        try {
          const data = await response.clone().json()
          await cache.set(cacheKey, data, cacheTTL)
          response.headers.set('X-Cache', 'MISS')
        } catch (cacheError) {
          console.warn('Failed to cache response:', cacheError)
        }
      }

    } catch (err) {
      error = err as Error
      
      // Create error response
      response = NextResponse.json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error.message
      }, { status: 500 })

      // Record error metrics
      if (enableMetrics) {
        metrics.recordError(error, {
          userId,
          endpoint: pathname,
          additionalTags: { method }
        })
      }
    }

    // Calculate duration and record metrics
    const duration = Date.now() - startTime
    const statusCode = response.status

    if (enableMetrics) {
      metrics.endTiming(operationId, 'api.request', {
        method,
        endpoint: pathname,
        status: statusCode.toString(),
        cached: response.headers.get('X-Cache') === 'HIT' ? 'true' : 'false'
      })
      
      metrics.recordHttpRequest(method, pathname, statusCode, duration, userId)
    }

    // Log slow requests
    if (duration > slowRequestThreshold) {
      console.warn(`🐌 SLOW REQUEST: ${method} ${pathname} took ${duration}ms`)
    }

    // Log request completion
    if (logRequests) {
      const cacheStatus = response.headers.get('X-Cache') || 'N/A'
      const statusEmoji = statusCode >= 200 && statusCode < 300 ? '✅' : '❌'
      console.log(`${statusEmoji} ${method} ${pathname} - ${statusCode} (${duration}ms) [Cache: ${cacheStatus}]`)
    }

    // Add performance headers
    response.headers.set('X-Response-Time', `${duration}ms`)
    response.headers.set('X-Request-ID', operationId)

    return response
  }
}

/**
 * Specific monitoring wrapper for database operations
 */
export function withDatabaseMonitoring<T>(
  operation: () => Promise<T>,
  queryDescription: string
): Promise<T> {
  const operationId = `db:${queryDescription}-${Date.now()}`
  metrics.startTiming(operationId)

  return operation()
    .then(result => {
      const duration = metrics.endTiming(operationId, 'database.query')
      metrics.recordDatabaseQuery(queryDescription, duration, true)
      return result
    })
    .catch(error => {
      const duration = metrics.endTiming(operationId, 'database.query.error')
      metrics.recordDatabaseQuery(queryDescription, duration, false)
      metrics.recordError(error, { 
        endpoint: 'database', 
        additionalTags: { query: queryDescription } 
      })
      throw error
    })
}

/**
 * Cache-aware database query wrapper
 */
export async function cachedDatabaseQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300,
  queryDescription: string = 'cached_query'
): Promise<T> {
  return cache.getOrSet(
    cacheKey,
    () => withDatabaseMonitoring(queryFn, queryDescription),
    ttlSeconds
  )
}

/**
 * Performance monitoring decorator for service methods
 */
export function monitorPerformance(metricName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const operationId = `${metricName}-${Date.now()}`
      metrics.startTiming(operationId)

      try {
        const result = await originalMethod.apply(this, args)
        metrics.endTiming(operationId, metricName, { success: 'true' })
        return result
      } catch (error) {
        metrics.endTiming(operationId, metricName, { success: 'false' })
        metrics.recordError(error as Error, { 
          endpoint: propertyKey,
          additionalTags: { service: target.constructor.name }
        })
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Rate limiting with monitoring
 */
interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
}

export function withRateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyGenerator } = options
  const requests = new Map<string, { count: number; resetTime: number }>()

  return function (handler: RouteHandler): RouteHandler {
    return async (request: NextRequest, context?: any) => {
      const key = keyGenerator ? keyGenerator(request) : 
        request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'anonymous'

      const now = Date.now()
      const windowKey = `${key}:${Math.floor(now / windowMs)}`
      
      const requestData = requests.get(windowKey) || { count: 0, resetTime: now + windowMs }
      
      if (requestData.count >= maxRequests) {
        metrics.incrementCounter('rate_limit.exceeded', 1, { key })
        
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded'
        }, { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': requestData.resetTime.toString()
          }
        })
      }

      // Increment request count
      requestData.count++
      requests.set(windowKey, requestData)

      // Clean up old entries
      for (const [key, data] of requests.entries()) {
        if (data.resetTime < now) {
          requests.delete(key)
        }
      }

      const response = await handler(request, context)
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', (maxRequests - requestData.count).toString())
      response.headers.set('X-RateLimit-Reset', requestData.resetTime.toString())

      return response
    }
  }
}