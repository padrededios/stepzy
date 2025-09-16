/**
 * Health Check API Endpoint
 * Provides system status for monitoring and load balancers
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/database/prisma'
import { cache } from '../../../lib/cache/redis'
import { metrics } from '../../../lib/monitoring/metrics'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
      cache: 'unknown',
      memory: 'unknown'
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      responseTime: 0
    }
  }

  try {
    // Database health check
    const dbStartTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbResponseTime = Date.now() - dbStartTime
    
    health.checks.database = dbResponseTime < 1000 ? 'healthy' : 'slow'
    
    // Cache health check
    const cacheStartTime = Date.now()
    await cache.set('health_check', { timestamp: Date.now() }, 10)
    const cacheResult = await cache.get('health_check')
    const cacheResponseTime = Date.now() - cacheStartTime
    
    health.checks.cache = cacheResult && cacheResponseTime < 500 ? 'healthy' : 'degraded'

    // Memory check (warn if > 80% usage)
    const memoryUsage = process.memoryUsage()
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    health.checks.memory = memoryUsagePercent < 80 ? 'healthy' : 'warning'

    // Add detailed metrics if requested
    const includeMetrics = request.nextUrl.searchParams.get('metrics') === 'true'
    if (includeMetrics) {
      const metricsSummary = metrics.getMetricsSummary()
      health.metrics = {
        ...health.metrics,
        database: {
          responseTime: dbResponseTime,
          status: health.checks.database
        },
        cache: {
          responseTime: cacheResponseTime,
          status: health.checks.cache
        },
        api: {
          totalRequests: metricsSummary.totalRequests,
          errorRate: metricsSummary.errorRate,
          averageResponseTime: metricsSummary.averageResponseTime
        }
      }
    }

  } catch (error) {
    console.error('Health check failed:', error)
    
    health.status = 'unhealthy'
    health.checks.database = 'error'
    
    // Return 503 for unhealthy status
    const responseTime = Date.now() - startTime
    health.metrics.responseTime = responseTime
    
    return NextResponse.json(health, { status: 503 })
  }

  // Calculate total response time
  health.metrics.responseTime = Date.now() - startTime

  // Determine overall status
  const hasErrors = Object.values(health.checks).includes('error')
  const hasWarnings = Object.values(health.checks).includes('warning') || 
                     Object.values(health.checks).includes('slow') ||
                     Object.values(health.checks).includes('degraded')

  if (hasErrors) {
    health.status = 'unhealthy'
    return NextResponse.json(health, { status: 503 })
  } else if (hasWarnings) {
    health.status = 'degraded'
  }

  return NextResponse.json(health, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Check': health.status
    }
  })
}