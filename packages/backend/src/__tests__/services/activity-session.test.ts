/**
 * Unit tests for ActivitySessionService
 * Tests getUpcomingSessions filtering logic
 */

import { prisma } from '../../database/prisma'
import { ActivitySessionService } from '../../services/activity-session.service'
import { generateActivityCode } from '@stepzy/shared'

describe('ActivitySessionService', () => {
  let testUser1: any
  let testUser2: any
  let testActivity1: any
  let testActivity2: any
  let testSession1: any
  let testSession2: any
  let testSession3: any

  beforeAll(async () => {
    // Cleanup any existing test data first
    await prisma.user.deleteMany({
      where: {
        email: { in: ['session-test-user1@example.com', 'session-test-user2@example.com'] }
      }
    })

    // Create test users
    testUser1 = await prisma.user.create({
      data: {
        email: 'session-test-user1@example.com',
        pseudo: 'SessionTestUser1',
        role: 'user'
      }
    })

    testUser2 = await prisma.user.create({
      data: {
        email: 'session-test-user2@example.com',
        pseudo: 'SessionTestUser2',
        role: 'user'
      }
    })

    // Create test activities
    testActivity1 = await prisma.activity.create({
      data: {
        name: 'Football du mardi',
        sport: 'football',
        minPlayers: 4,
        maxPlayers: 12,
        recurringDays: ['tuesday'],
        recurringType: 'weekly',
        startTime: '18:00',
        endTime: '20:00',
        code: generateActivityCode(),
        createdBy: testUser1.id
      }
    })

    testActivity2 = await prisma.activity.create({
      data: {
        name: 'Badminton du jeudi',
        sport: 'badminton',
        minPlayers: 2,
        maxPlayers: 4,
        recurringDays: ['thursday'],
        recurringType: 'weekly',
        startTime: '19:00',
        endTime: '21:00',
        code: generateActivityCode(),
        createdBy: testUser1.id
      }
    })

    // Create test sessions (future dates)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(18, 0, 0, 0)

    const dayAfterTomorrow = new Date()
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
    dayAfterTomorrow.setHours(19, 0, 0, 0)

    const in3Days = new Date()
    in3Days.setDate(in3Days.getDate() + 3)
    in3Days.setHours(18, 0, 0, 0)

    testSession1 = await prisma.activitySession.create({
      data: {
        activityId: testActivity1.id,
        date: tomorrow,
        maxPlayers: 12,
        status: 'active'
      }
    })

    testSession2 = await prisma.activitySession.create({
      data: {
        activityId: testActivity2.id,
        date: dayAfterTomorrow,
        maxPlayers: 4,
        status: 'active'
      }
    })

    testSession3 = await prisma.activitySession.create({
      data: {
        activityId: testActivity1.id,
        date: in3Days,
        maxPlayers: 12,
        status: 'active'
      }
    })
  })

  afterAll(async () => {
    // Cleanup: delete test data
    await prisma.activityParticipant.deleteMany({
      where: {
        userId: { in: [testUser1.id, testUser2.id] }
      }
    })
    await prisma.activitySubscription.deleteMany({
      where: {
        userId: { in: [testUser1.id, testUser2.id] }
      }
    })
    await prisma.activitySession.deleteMany({
      where: {
        id: { in: [testSession1.id, testSession2.id, testSession3.id] }
      }
    })
    await prisma.activity.deleteMany({
      where: {
        id: { in: [testActivity1.id, testActivity2.id] }
      }
    })
    await prisma.user.deleteMany({
      where: {
        id: { in: [testUser1.id, testUser2.id] }
      }
    })
  })

  describe('getUpcomingSessions', () => {
    it('should return empty array when user has no subscriptions', async () => {
      const sessions = await ActivitySessionService.getUpcomingSessions(20, testUser2.id)

      expect(Array.isArray(sessions)).toBe(true)
      expect(sessions).toHaveLength(0)
    })

    it('should return sessions only from subscribed activities', async () => {
      // Subscribe testUser2 to testActivity1 only
      await prisma.activitySubscription.create({
        data: {
          userId: testUser2.id,
          activityId: testActivity1.id
        }
      })

      const sessions = await ActivitySessionService.getUpcomingSessions(20, testUser2.id)

      expect(sessions).toHaveLength(2) // Only sessions from testActivity1
      expect(sessions.every((s: any) => s.activity.id === testActivity1.id)).toBe(true)
      expect(sessions.find((s: any) => s.activity.id === testActivity2.id)).toBeUndefined()
    })

    it('should return sessions from all subscribed activities', async () => {
      // Subscribe testUser2 to testActivity2 as well
      await prisma.activitySubscription.create({
        data: {
          userId: testUser2.id,
          activityId: testActivity2.id
        }
      })

      const sessions = await ActivitySessionService.getUpcomingSessions(20, testUser2.id)

      expect(sessions).toHaveLength(3) // All 3 sessions
      expect(sessions.find((s: any) => s.activity.id === testActivity1.id)).toBeDefined()
      expect(sessions.find((s: any) => s.activity.id === testActivity2.id)).toBeDefined()
    })

    it('should not return sessions user is already participating in', async () => {
      // Make testUser2 join testSession1
      await prisma.activityParticipant.create({
        data: {
          sessionId: testSession1.id,
          userId: testUser2.id,
          status: 'confirmed'
        }
      })

      const sessions = await ActivitySessionService.getUpcomingSessions(20, testUser2.id)

      // Should return 2 sessions (testSession2 and testSession3), not testSession1
      expect(sessions).toHaveLength(2)
      expect(sessions.find((s: any) => s.id === testSession1.id)).toBeUndefined()
      expect(sessions.find((s: any) => s.id === testSession2.id)).toBeDefined()
      expect(sessions.find((s: any) => s.id === testSession3.id)).toBeDefined()
    })

    it('should respect the limit parameter', async () => {
      const sessions = await ActivitySessionService.getUpcomingSessions(1, testUser2.id)

      // Should return at most 1 session, even if more are available
      expect(sessions.length).toBeLessThanOrEqual(1)
    })

    it('should include userStatus and stats in each session', async () => {
      const sessions = await ActivitySessionService.getUpcomingSessions(20, testUser2.id)

      expect(sessions.length).toBeGreaterThan(0)

      const session = sessions[0]
      expect(session).toHaveProperty('userStatus')
      expect(session.userStatus).toHaveProperty('isParticipant')
      expect(session.userStatus).toHaveProperty('canJoin')
      expect(session).toHaveProperty('stats')
      expect(session.stats).toHaveProperty('confirmedCount')
      expect(session.stats).toHaveProperty('availableSpots')
    })
  })
})
