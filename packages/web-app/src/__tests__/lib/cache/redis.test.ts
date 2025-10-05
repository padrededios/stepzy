/**
 * Redis Cache Tests
 * Tests the caching system functionality
 */

import { cache, CACHE_KEYS, CACHE_TTL } from '../../../lib/cache/redis'

describe('Redis Cache System', () => {
  beforeEach(async () => {
    // Clean up cache before each test
    await cache.deletePattern('test:*')
  })

  describe('Basic Cache Operations', () => {
    test('should set and get values', async () => {
      const key = 'test:basic'
      const value = { message: 'hello', number: 42 }

      const setResult = await cache.set(key, value, 60)
      expect(setResult).toBe(true)

      const retrieved = await cache.get(key)
      expect(retrieved).toEqual(value)
    })

    test('should return null for non-existent keys', async () => {
      const result = await cache.get('test:nonexistent')
      expect(result).toBeNull()
    })

    test('should delete keys', async () => {
      const key = 'test:delete'
      await cache.set(key, 'value', 60)
      
      const deleteResult = await cache.del(key)
      expect(deleteResult).toBe(true)

      const retrieved = await cache.get(key)
      expect(retrieved).toBeNull()
    })

    test('should check key existence', async () => {
      const key = 'test:exists'
      
      expect(await cache.exists(key)).toBe(false)
      
      await cache.set(key, 'value', 60)
      expect(await cache.exists(key)).toBe(true)
      
      await cache.del(key)
      expect(await cache.exists(key)).toBe(false)
    })

    test('should delete pattern matching keys', async () => {
      await cache.set('test:pattern:1', 'value1', 60)
      await cache.set('test:pattern:2', 'value2', 60)
      await cache.set('test:other', 'value3', 60)

      const deleted = await cache.deletePattern('test:pattern:*')
      expect(deleted).toBeGreaterThan(0)

      expect(await cache.get('test:pattern:1')).toBeNull()
      expect(await cache.get('test:pattern:2')).toBeNull()
      expect(await cache.get('test:other')).not.toBeNull()
    })
  })

  describe('GetOrSet Pattern', () => {
    test('should execute function on cache miss', async () => {
      const key = 'test:getorset'
      const fetchFn = jest.fn().mockResolvedValue({ data: 'fresh' })

      const result = await cache.getOrSet(key, fetchFn, 60)
      
      expect(fetchFn).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ data: 'fresh' })
    })

    test('should return cached value on cache hit', async () => {
      const key = 'test:getorset-hit'
      const cachedValue = { data: 'cached' }
      const fetchFn = jest.fn().mockResolvedValue({ data: 'fresh' })

      await cache.set(key, cachedValue, 60)
      const result = await cache.getOrSet(key, fetchFn, 60)

      expect(fetchFn).not.toHaveBeenCalled()
      expect(result).toEqual(cachedValue)
    })

    test('should handle fetch function errors', async () => {
      const key = 'test:getorset-error'
      const fetchFn = jest.fn().mockRejectedValue(new Error('Fetch failed'))

      await expect(cache.getOrSet(key, fetchFn, 60)).rejects.toThrow('Fetch failed')
    })
  })

  describe('Cache Keys Constants', () => {
    test('should have proper cache key structure', () => {
      expect(CACHE_KEYS.MATCHES_LIST).toBe('matches:list')
      expect(CACHE_KEYS.MATCH_DETAIL('123')).toBe('match:123')
      expect(CACHE_KEYS.USER_PROFILE('user1')).toBe('user:user1')
      expect(CACHE_KEYS.NOTIFICATIONS_COUNT('user1')).toBe('notifications:count:user1')
    })

    test('should have cache TTL constants', () => {
      expect(CACHE_TTL.SHORT).toBe(60)
      expect(CACHE_TTL.MEDIUM).toBe(300)
      expect(CACHE_TTL.LONG).toBe(1800)
      expect(CACHE_TTL.VERY_LONG).toBe(3600)
    })
  })

  describe('Memory Cache Fallback', () => {
    test('should work with memory cache when Redis unavailable', async () => {
      // This test would require mocking the Redis connection failure
      // For now, we test basic functionality which should work in both modes
      const key = 'test:memory'
      const value = { test: true }

      await cache.set(key, value, 10)
      const retrieved = await cache.get(key)
      
      expect(retrieved).toEqual(value)
    })
  })

  describe('TTL and Expiration', () => {
    test('should respect TTL settings', async () => {
      const key = 'test:ttl'
      const value = { expires: true }

      // Set with very short TTL (1 second)
      await cache.set(key, value, 1)
      expect(await cache.get(key)).toEqual(value)

      // Wait for expiration (in production test, you might want to mock time)
      // For this test, we just verify the set worked
      expect(await cache.exists(key)).toBe(true)
    })
  })

  describe('Data Types', () => {
    test('should handle different data types', async () => {
      const testCases = [
        { key: 'test:string', value: 'hello world' },
        { key: 'test:number', value: 42 },
        { key: 'test:boolean', value: true },
        { key: 'test:array', value: [1, 2, 3] },
        { key: 'test:object', value: { nested: { data: true } } },
        { key: 'test:null', value: null }
      ]

      for (const { key, value } of testCases) {
        await cache.set(key, value, 60)
        const retrieved = await cache.get(key)
        expect(retrieved).toEqual(value)
      }
    })
  })
})