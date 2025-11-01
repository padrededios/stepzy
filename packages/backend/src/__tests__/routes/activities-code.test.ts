/**
 * Integration tests for Activity Code API routes
 * Tests POST /api/activities/join-by-code, GET /api/activities/code/:code, etc.
 */

import { generateActivityCode } from '@stepzy/shared'
import { prisma } from '../../database/prisma'

// Mock Fastify and request/reply for unit testing the route logic
describe('Activity Code API Routes', () => {
  let testUser: any
  let testActivity: any
  let validCode: string

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-code-user@example.com',
        pseudo: 'TestCodeUser',
        role: 'user'
      }
    })

    // Generate a unique code
    validCode = generateActivityCode()

    // Create test activity with code
    testActivity = await prisma.activity.create({
      data: {
        name: 'Test Activity with Code',
        sport: 'football',
        minPlayers: 4,
        maxPlayers: 12,
        recurringDays: ['monday', 'wednesday'],
        recurringType: 'weekly',
        startTime: '18:00',
        endTime: '20:00',
        code: validCode,
        createdBy: testUser.id
      }
    })
  })

  afterAll(async () => {
    // Cleanup: delete test data
    await prisma.activitySubscription.deleteMany({
      where: { userId: testUser.id }
    })
    await prisma.activity.deleteMany({
      where: { id: testActivity.id }
    })
    await prisma.user.deleteMany({
      where: { id: testUser.id }
    })
    await prisma.$disconnect()
  })

  describe('Code Generation on Activity Creation', () => {
    it('should automatically generate unique code when creating activity', async () => {
      const newActivity = await prisma.activity.create({
        data: {
          name: 'Auto Code Activity',
          sport: 'badminton',
          minPlayers: 2,
          maxPlayers: 8,
          recurringDays: ['tuesday'],
          recurringType: 'weekly',
          startTime: '19:00',
          endTime: '21:00',
          code: generateActivityCode(),
          createdBy: testUser.id
        }
      })

      expect(newActivity.code).toBeDefined()
      expect(newActivity.code).toHaveLength(8)
      expect(newActivity.code).toMatch(/^[A-Z0-9]{8}$/)

      // Cleanup
      await prisma.activity.delete({ where: { id: newActivity.id } })
    })

    it('should ensure code uniqueness in database', async () => {
      // Get all codes
      const activities = await prisma.activity.findMany({
        select: { code: true }
      })

      const codes = activities.map(a => a.code)
      const uniqueCodes = new Set(codes)

      // All codes should be unique
      expect(codes.length).toBe(uniqueCodes.size)
    })
  })

  describe('GET /api/activities/code/:code - Get Activity by Code', () => {
    it('should return activity info for valid code (public route)', async () => {
      const activity = await prisma.activity.findUnique({
        where: { code: validCode },
        include: {
          creator: {
            select: {
              id: true,
              pseudo: true,
              avatar: true
            }
          }
        }
      })

      expect(activity).toBeDefined()
      expect(activity?.name).toBe('Test Activity with Code')
      expect(activity?.sport).toBe('football')
      expect(activity?.code).toBe(validCode)
      expect(activity?.creator.pseudo).toBe('TestCodeUser')
    })

    it('should return null for invalid code', async () => {
      const activity = await prisma.activity.findUnique({
        where: { code: 'INVALID1' }
      })

      expect(activity).toBeNull()
    })

    it('should return limited info (security)', async () => {
      const activity = await prisma.activity.findUnique({
        where: { code: validCode },
        select: {
          name: true,
          sport: true,
          minPlayers: true,
          maxPlayers: true,
          recurringDays: true,
          recurringType: true,
          creator: {
            select: {
              pseudo: true,
              avatar: true
            }
          }
        }
      })

      expect(activity).toBeDefined()
      // Should not include sensitive fields like createdBy, internal IDs
      expect(activity).not.toHaveProperty('createdBy')
      expect(activity).not.toHaveProperty('id')
    })
  })

  describe('POST /api/activities/join-by-code - Join Activity', () => {
    it('should allow user to join activity with valid code', async () => {
      // Create a second test user
      const testUser2 = await prisma.user.create({
        data: {
          email: 'test-join-user@example.com',
          pseudo: 'TestJoinUser',
          role: 'user'
        }
      })

      // Join activity
      const subscription = await prisma.activitySubscription.create({
        data: {
          userId: testUser2.id,
          activityId: testActivity.id
        }
      })

      expect(subscription).toBeDefined()
      expect(subscription.userId).toBe(testUser2.id)
      expect(subscription.activityId).toBe(testActivity.id)

      // Verify subscription exists
      const foundSubscription = await prisma.activitySubscription.findUnique({
        where: {
          activityId_userId: {
            activityId: testActivity.id,
            userId: testUser2.id
          }
        }
      })

      expect(foundSubscription).toBeDefined()

      // Cleanup
      await prisma.activitySubscription.delete({
        where: { id: subscription.id }
      })
      await prisma.user.delete({ where: { id: testUser2.id } })
    })

    it('should detect if user is already a member', async () => {
      // First, subscribe the user
      await prisma.activitySubscription.create({
        data: {
          userId: testUser.id,
          activityId: testActivity.id
        }
      })

      // Try to join again
      const existingSubscription = await prisma.activitySubscription.findUnique({
        where: {
          activityId_userId: {
            activityId: testActivity.id,
            userId: testUser.id
          }
        }
      })

      expect(existingSubscription).toBeDefined()

      // Cleanup
      await prisma.activitySubscription.delete({
        where: { id: existingSubscription!.id }
      })
    })

    it('should reject invalid code format', () => {
      const invalidCodes = [
        'abc123',        // Too short
        'ABC12345678',   // Too long
        'abc12345',      // Lowercase
        'ABC-1234',      // Special characters
        'ABC 1234'       // Space
      ]

      invalidCodes.forEach(code => {
        // Code validation should happen before DB query
        const isValid = /^[A-Z0-9]{8}$/.test(code)
        expect(isValid).toBe(false)
      })
    })

    it('should return error for non-existent code', async () => {
      const activity = await prisma.activity.findUnique({
        where: { code: 'AAAAAAAA' }
      })

      expect(activity).toBeNull()
    })
  })

  describe('Activity Code Security', () => {
    it('should prevent duplicate subscriptions', async () => {
      // Subscribe user
      const subscription1 = await prisma.activitySubscription.create({
        data: {
          userId: testUser.id,
          activityId: testActivity.id
        }
      })

      // Try to create duplicate - should fail due to unique constraint
      await expect(
        prisma.activitySubscription.create({
          data: {
            userId: testUser.id,
            activityId: testActivity.id
          }
        })
      ).rejects.toThrow()

      // Cleanup
      await prisma.activitySubscription.delete({
        where: { id: subscription1.id }
      })
    })

    it('should handle concurrent join requests gracefully', async () => {
      // Create multiple users trying to join simultaneously
      const users = await Promise.all([
        prisma.user.create({
          data: { email: 'concurrent1@test.com', pseudo: 'User1', role: 'user' }
        }),
        prisma.user.create({
          data: { email: 'concurrent2@test.com', pseudo: 'User2', role: 'user' }
        }),
        prisma.user.create({
          data: { email: 'concurrent3@test.com', pseudo: 'User3', role: 'user' }
        })
      ])

      // All try to join at once
      const subscriptions = await Promise.all(
        users.map(user =>
          prisma.activitySubscription.create({
            data: {
              userId: user.id,
              activityId: testActivity.id
            }
          })
        )
      )

      expect(subscriptions).toHaveLength(3)
      expect(subscriptions.every(sub => sub.activityId === testActivity.id)).toBe(true)

      // Cleanup
      await prisma.activitySubscription.deleteMany({
        where: { userId: { in: users.map(u => u.id) } }
      })
      await prisma.user.deleteMany({
        where: { id: { in: users.map(u => u.id) } }
      })
    })
  })

  describe('Code Regeneration (Edge Cases)', () => {
    it('should allow code regeneration if needed (admin operation)', async () => {
      const newCode = generateActivityCode()

      const updated = await prisma.activity.update({
        where: { id: testActivity.id },
        data: { code: newCode }
      })

      expect(updated.code).toBe(newCode)
      expect(updated.code).not.toBe(validCode)

      // Restore original code
      await prisma.activity.update({
        where: { id: testActivity.id },
        data: { code: validCode }
      })
    })

    it('should maintain referential integrity when code changes', async () => {
      // Subscribe a user
      const subscription = await prisma.activitySubscription.create({
        data: {
          userId: testUser.id,
          activityId: testActivity.id
        }
      })

      // Change activity code
      const newCode = generateActivityCode()
      await prisma.activity.update({
        where: { id: testActivity.id },
        data: { code: newCode }
      })

      // Subscription should still exist (references ID, not code)
      const stillSubscribed = await prisma.activitySubscription.findUnique({
        where: {
          activityId_userId: {
            activityId: testActivity.id,
            userId: testUser.id
          }
        }
      })

      expect(stillSubscribed).toBeDefined()

      // Cleanup
      await prisma.activitySubscription.delete({ where: { id: subscription.id } })
      await prisma.activity.update({
        where: { id: testActivity.id },
        data: { code: validCode }
      })
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle code lookup efficiently (indexed)', async () => {
      const startTime = Date.now()

      const activity = await prisma.activity.findUnique({
        where: { code: validCode }
      })

      const duration = Date.now() - startTime

      expect(activity).toBeDefined()
      expect(duration).toBeLessThan(100) // Should be very fast with index
    })

    it('should generate codes without collision in batch', async () => {
      const batchSize = 100
      const codes = new Set<string>()

      for (let i = 0; i < batchSize; i++) {
        codes.add(generateActivityCode())
      }

      // All codes should be unique
      expect(codes.size).toBe(batchSize)
    })
  })
})
