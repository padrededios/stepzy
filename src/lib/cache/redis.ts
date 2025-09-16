/**
 * Redis Cache Implementation - Redis v4+ Client
 * 
 * This file provides a comprehensive caching layer using Redis client.
 * 
 * Available Redis client methods (from 'redis' package):
 * - createClient(): Create new Redis client instance
 * - client.connect(): Connect to Redis server
 * - client.disconnect(): Disconnect from Redis server
 * - client.quit(): Gracefully close connection
 * - client.get(): Get string value by key
 * - client.set(): Set string value with key
 * - client.setEx(): Set value with expiration time
 * - client.del(): Delete one or more keys
 * - client.exists(): Check if key exists
 * - client.keys(): Find keys matching pattern
 * - client.expire(): Set expiration time for key
 * - client.ttl(): Get time to live for key
 * - client.flushAll(): Delete all keys from all databases
 * - client.flushDb(): Delete all keys from current database
 * - client.info(): Get server information
 * - client.ping(): Test connection
 * - client.eval(): Execute Lua script
 * - client.multi(): Begin transaction
 * - client.exec(): Execute transaction
 * - client.watch(): Watch keys for changes
 * - client.unwatch(): Unwatch all keys
 * 
 * Hash operations:
 * - client.hGet(): Get field value from hash
 * - client.hSet(): Set field value in hash  
 * - client.hGetAll(): Get all fields and values from hash
 * - client.hDel(): Delete fields from hash
 * - client.hExists(): Check if hash field exists
 * - client.hKeys(): Get all field names in hash
 * - client.hVals(): Get all values in hash
 * 
 * List operations:
 * - client.lPush(): Push element to list head
 * - client.rPush(): Push element to list tail
 * - client.lPop(): Pop element from list head
 * - client.rPop(): Pop element from list tail
 * - client.lRange(): Get range of elements from list
 * - client.lLen(): Get list length
 * 
 * Set operations:
 * - client.sAdd(): Add member to set
 * - client.sRem(): Remove member from set
 * - client.sMembers(): Get all members of set
 * - client.sIsMember(): Check if member exists in set
 * - client.sCard(): Get number of members in set
 * 
 * Custom CacheManager provides:
 * - Automatic JSON serialization/deserialization
 * - Memory fallback for development
 * - Error handling and reconnection
 * - TTL management
 * - Pattern-based key deletion
 * - Get-or-set pattern for cache-aside
 * - Predefined cache keys and TTL constants
 */

import { createClient, RedisClientType } from 'redis'

class CacheManager {
  private client: RedisClientType | null = null
  private isConnected = false

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.isConnected) return

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000
        }
      })

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err)
        this.isConnected = false
      })

      this.client.on('connect', () => {
        console.log('✅ Redis connected')
        this.isConnected = true
      })

      this.client.on('disconnect', () => {
        console.log('❌ Redis disconnected')
        this.isConnected = false
      })

      await this.client.connect()
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      // Fallback to memory cache in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Falling back to memory cache')
        this.client = null
      } else {
        throw error
      }
    }
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.client || !this.isConnected) {
        return this.memoryGet(key)
      }

      const value = await this.client.get(key)
      if (!value) return null

      return JSON.parse(value)
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set cached value with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)

      if (!this.client || !this.isConnected) {
        this.memorySet(key, value, ttlSeconds)
        return true
      }

      await this.client.setEx(key, ttlSeconds, serialized)
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return this.memoryCache.delete(key)
      }

      const result = await this.client.del(key)
      return result > 0
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  /**
   * Clear all cached values matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      if (!this.client || !this.isConnected) {
        return this.memoryDeletePattern(pattern)
      }

      const keys = await this.client.keys(pattern)
      if (keys.length === 0) return 0

      const result = await this.client.del(keys)
      return result
    } catch (error) {
      console.error('Cache delete pattern error:', error)
      return 0
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return this.memoryCache.has(key)
      }

      const result = await this.client.exists(key)
      return result > 0
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  /**
   * Get or Set pattern - execute function if cache miss
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const fresh = await fetchFunction()
    await this.set(key, fresh, ttlSeconds)
    return fresh
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit()
      this.isConnected = false
    }
  }

  // Memory cache fallback for development
  private memoryCache = new Map<string, { value: any; expires: number }>()

  private memoryCacheCleanup = () => {
    const now = Date.now()
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expires < now) {
        this.memoryCache.delete(key)
      }
    }
  }

  private memoryGet(key: string): any | null {
    this.memoryCacheCleanup()
    const entry = this.memoryCache.get(key)
    if (!entry || entry.expires < Date.now()) {
      return null
    }
    return entry.value
  }

  private memorySet(key: string, value: any, ttlSeconds: number): void {
    const expires = Date.now() + (ttlSeconds * 1000)
    this.memoryCache.set(key, { value, expires })
  }

  private memoryDelete(key: string): boolean {
    return this.memoryCache.delete(key)
  }

  private memoryHas(key: string): boolean {
    this.memoryCacheCleanup()
    const entry = this.memoryCache.get(key)
    return entry ? entry.expires >= Date.now() : false
  }

  private memoryDeletePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    let count = 0
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key)
        count++
      }
    }
    return count
  }
}

// Cache keys constants
export const CACHE_KEYS = {
  // Matches
  MATCHES_LIST: 'matches:list',
  MATCH_DETAIL: (id: string) => `match:${id}`,
  MATCHES_UPCOMING: 'matches:upcoming',
  MATCHES_USER: (userId: string) => `matches:user:${userId}`,

  // Users
  USER_PROFILE: (id: string) => `user:${id}`,
  USER_STATS: (id: string) => `user:stats:${id}`,
  USERS_LIST: 'users:list',

  // Statistics
  ADMIN_STATS: 'admin:stats',
  MATCH_STATS: 'match:stats',

  // Notifications
  NOTIFICATIONS_COUNT: (userId: string) => `notifications:count:${userId}`,
  NOTIFICATIONS_LIST: (userId: string) => `notifications:list:${userId}`,
} as const

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 1800,     // 30 minutes
  VERY_LONG: 3600 // 1 hour
} as const

// Create singleton instance
const cache = new CacheManager()

// Initialize cache on import
cache.connect().catch(console.error)

export { cache }
export type { RedisClientType }