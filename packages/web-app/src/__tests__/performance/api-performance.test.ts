/**
 * Performance Tests for API Endpoints
 * Tests response times and database query optimization
 */

import { prisma } from '../../lib/database/prisma'
import { createTestUser, createTestMatch, loginUser } from '../utils/test-helpers'

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  FAST: 100,      // < 100ms = fast
  ACCEPTABLE: 200, // < 200ms = acceptable
  SLOW: 500       // < 500ms = slow (needs optimization)
}

describe('API Performance Tests', () => {
  let testUser: any
  let authCookie: string

  beforeAll(async () => {
    // Create test user for authenticated requests
    testUser = await createTestUser({
      email: 'perf-test@test.com',
      pseudo: 'PerfTester',
      role: 'user'
    })
    authCookie = await loginUser('perf-test@test.com', 'TestPassword123!')
  })

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'perf-test' } }
    })
  })

  describe('Auth API Performance', () => {
    test('GET /api/auth/me should respond within acceptable time', async () => {
      const start = Date.now()
      
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: { Cookie: authCookie }
      })
      
      const duration = Date.now() - start
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE)
      
      console.log(`🔒 Auth verification: ${duration}ms`)
    })

    test('POST /api/auth/login should respond within acceptable time', async () => {
      const start = Date.now()
      
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'perf-test@test.com',
          password: 'TestPassword123!'
        })
      })
      
      const duration = Date.now() - start

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE)
      
      console.log(`🔑 Login: ${duration}ms`)
    })
  })

  describe('Matches API Performance', () => {
    beforeAll(async () => {
      // Create multiple test matches for performance testing
      const promises = Array.from({ length: 10 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + i)
        date.setHours(12, 0, 0, 0)
        
        return createTestMatch({
          date,
          maxPlayers: 12,
          status: 'open'
        })
      })
      
      await Promise.all(promises)
    })

    test('GET /api/matches should respond within fast time', async () => {
      const start = Date.now()
      
      const response = await fetch('http://localhost:3000/api/matches', {
        headers: { Cookie: authCookie }
      })
      
      const duration = Date.now() - start
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST)
      
      console.log(`⚽ Matches list: ${duration}ms (${result.data.matches.length} matches)`)
    })

    test('GET /api/matches with pagination should be efficient', async () => {
      const start = Date.now()
      
      const response = await fetch('http://localhost:3000/api/matches?limit=5&offset=0', {
        headers: { Cookie: authCookie }
      })
      
      const duration = Date.now() - start
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST)
      expect(result.data.matches.length).toBeLessThanOrEqual(5)
      
      console.log(`📄 Paginated matches: ${duration}ms`)
    })

    test('GET /api/matches/[id] should respond within fast time', async () => {
      // Create a test match to fetch
      const testMatch = await createTestMatch({
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        maxPlayers: 12,
        status: 'open'
      })

      const start = Date.now()
      
      const response = await fetch(`http://localhost:3000/api/matches/${testMatch.id}`, {
        headers: { Cookie: authCookie }
      })
      
      const duration = Date.now() - start

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST)
      
      console.log(`🎯 Match details: ${duration}ms`)
    })
  })

  describe('Database Query Performance', () => {
    test('Complex match query with relations should be optimized', async () => {
      const start = Date.now()
      
      // This simulates our most complex query (match with all relations)
      const matches = await prisma.match.findMany({
        where: {
          date: {
            gte: new Date(),
            lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  pseudo: true,
                  avatar: true
                }
              }
            },
            orderBy: {
              joinedAt: 'asc'
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      })
      
      const duration = Date.now() - start

      expect(matches).toBeDefined()
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE)
      
      console.log(`🔍 Complex query: ${duration}ms (${matches.length} matches with relations)`)
    })

    test('User statistics query should be efficient', async () => {
      const start = Date.now()
      
      const stats = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: {
          matchPlayers: {
            include: {
              match: {
                select: {
                  id: true,
                  date: true,
                  status: true
                }
              }
            }
          }
        }
      })
      
      const duration = Date.now() - start

      expect(stats).toBeDefined()
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST)
      
      console.log(`📊 User stats: ${duration}ms`)
    })
  })

  describe('Load Testing Simulation', () => {
    test('Concurrent requests to /api/matches should handle load', async () => {
      const concurrentRequests = 10
      const start = Date.now()
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        fetch('http://localhost:3000/api/matches', {
          headers: { Cookie: authCookie }
        })
      )
      
      const responses = await Promise.all(promises)
      const duration = Date.now() - start
      const averageTime = duration / concurrentRequests

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE)
      
      console.log(`🚀 Load test: ${concurrentRequests} concurrent requests in ${duration}ms (avg: ${averageTime}ms)`)
    })
  })
})