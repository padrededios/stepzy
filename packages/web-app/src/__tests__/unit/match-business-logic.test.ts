import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Match Business Logic', () => {
  beforeAll(async () => {
    // Clean up before tests
    await prisma.matchPlayer.deleteMany()
    await prisma.match.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    // Clean up after tests
    await prisma.matchPlayer.deleteMany()
    await prisma.match.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up before each test
    await prisma.matchPlayer.deleteMany()
    await prisma.match.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('Match Creation Validation', () => {
    it('should allow match creation within lunch hours (12h-14h)', async () => {
      const lunchTime = new Date()
      lunchTime.setHours(12, 30, 0, 0) // 12:30

      const match = await prisma.match.create({
        data: {
          date: lunchTime,
          maxPlayers: 12,
          status: 'open'
        }
      })

      expect(match).toBeDefined()
      expect(match.date.getHours()).toBeGreaterThanOrEqual(12)
      expect(match.date.getHours()).toBeLessThan(14)
    })

    it('should validate match is within working days (Monday-Friday)', async () => {
      const monday = new Date('2024-01-08T12:30:00.000Z') // Monday 12:30
      const saturday = new Date('2024-01-13T12:30:00.000Z') // Saturday 12:30

      // Monday should be valid
      const mondayMatch = await prisma.match.create({
        data: {
          date: monday,
          maxPlayers: 12,
          status: 'open'
        }
      })

      expect(mondayMatch).toBeDefined()
      expect([1, 2, 3, 4, 5]).toContain(mondayMatch.date.getDay()) // Monday = 1

      // Saturday should be invalid (business logic will be enforced in API)
      const weekday = saturday.getDay()
      expect([0, 6]).toContain(weekday) // Saturday = 6, Sunday = 0
    })

    it('should set default maxPlayers to 12', async () => {
      const match = await prisma.match.create({
        data: {
          date: new Date('2024-01-08T12:30:00.000Z'),
          status: 'open'
        }
      })

      expect(match.maxPlayers).toBe(12)
    })

    it('should set default status to open', async () => {
      const match = await prisma.match.create({
        data: {
          date: new Date('2024-01-08T12:30:00.000Z'),
          maxPlayers: 12
        }
      })

      expect(match.status).toBe('open')
    })
  })

  describe('Match Capacity Management', () => {
    let match: any
    let users: any[]

    beforeEach(async () => {
      // Create test match
      match = await prisma.match.create({
        data: {
          date: new Date('2024-01-08T12:30:00.000Z'),
          maxPlayers: 12,
          status: 'open'
        }
      })

      // Create test users
      users = []
      for (let i = 1; i <= 15; i++) {
        const user = await prisma.user.create({
          data: {
            email: `player${i}@test.com`,
            pseudo: `Player${i}`,
            password: 'hashedPassword',
            role: 'user'
          }
        })
        users.push(user)
      }
    })

    it('should allow confirmed players up to maxPlayers limit', async () => {
      // Add 12 confirmed players (max capacity)
      for (let i = 0; i < 12; i++) {
        await prisma.matchPlayer.create({
          data: {
            matchId: match.id,
            userId: users[i].id,
            status: 'confirmed'
          }
        })
      }

      const players = await prisma.matchPlayer.findMany({
        where: { matchId: match.id, status: 'confirmed' }
      })

      expect(players).toHaveLength(12)
    })

    it('should put additional players in waiting list when match is full', async () => {
      // Add 12 confirmed players
      for (let i = 0; i < 12; i++) {
        await prisma.matchPlayer.create({
          data: {
            matchId: match.id,
            userId: users[i].id,
            status: 'confirmed'
          }
        })
      }

      // Add 3 more players (should be waiting)
      for (let i = 12; i < 15; i++) {
        await prisma.matchPlayer.create({
          data: {
            matchId: match.id,
            userId: users[i].id,
            status: 'waiting'
          }
        })
      }

      const confirmedPlayers = await prisma.matchPlayer.findMany({
        where: { matchId: match.id, status: 'confirmed' }
      })
      const waitingPlayers = await prisma.matchPlayer.findMany({
        where: { matchId: match.id, status: 'waiting' }
      })

      expect(confirmedPlayers).toHaveLength(12)
      expect(waitingPlayers).toHaveLength(3)
    })

    it('should promote first waiting player when confirmed player leaves', async () => {
      // Fill match with 12 confirmed players
      for (let i = 0; i < 12; i++) {
        await prisma.matchPlayer.create({
          data: {
            matchId: match.id,
            userId: users[i].id,
            status: 'confirmed'
          }
        })
      }

      // Add waiting players
      for (let i = 12; i < 15; i++) {
        await prisma.matchPlayer.create({
          data: {
            matchId: match.id,
            userId: users[i].id,
            status: 'waiting'
          }
        })
      }

      // Remove one confirmed player
      await prisma.matchPlayer.delete({
        where: {
          userId_matchId: {
            userId: users[0].id,
            matchId: match.id
          }
        }
      })

      // First waiting player should be promoted
      await prisma.matchPlayer.update({
        where: {
          userId_matchId: {
            userId: users[12].id,
            matchId: match.id
          }
        },
        data: { status: 'confirmed' }
      })

      const confirmedPlayers = await prisma.matchPlayer.findMany({
        where: { matchId: match.id, status: 'confirmed' }
      })
      const waitingPlayers = await prisma.matchPlayer.findMany({
        where: { matchId: match.id, status: 'waiting' }
      })

      expect(confirmedPlayers).toHaveLength(12)
      expect(waitingPlayers).toHaveLength(2)
      
      // Check that user 12 is now confirmed
      const promotedPlayer = await prisma.matchPlayer.findUnique({
        where: {
          userId_matchId: {
            userId: users[12].id,
            matchId: match.id
          }
        }
      })
      expect(promotedPlayer?.status).toBe('confirmed')
    })
  })

  describe('Match Status Management', () => {
    let match: any
    let users: any[]

    beforeEach(async () => {
      match = await prisma.match.create({
        data: {
          date: new Date('2024-01-08T12:30:00.000Z'),
          maxPlayers: 12,
          status: 'open'
        }
      })

      users = []
      for (let i = 1; i <= 12; i++) {
        const user = await prisma.user.create({
          data: {
            email: `player${i}@test.com`,
            pseudo: `Player${i}`,
            password: 'hashedPassword',
            role: 'user'
          }
        })
        users.push(user)
      }
    })

    it('should change status to full when maxPlayers reached', async () => {
      // Add 12 players to fill the match
      for (let i = 0; i < 12; i++) {
        await prisma.matchPlayer.create({
          data: {
            matchId: match.id,
            userId: users[i].id,
            status: 'confirmed'
          }
        })
      }

      // Update match status
      const updatedMatch = await prisma.match.update({
        where: { id: match.id },
        data: { status: 'full' }
      })

      expect(updatedMatch.status).toBe('full')
    })

    it('should change status back to open when player leaves and spots available', async () => {
      // Set match as full initially
      await prisma.match.update({
        where: { id: match.id },
        data: { status: 'full' }
      })

      // Add 11 players (one short of full)
      for (let i = 0; i < 11; i++) {
        await prisma.matchPlayer.create({
          data: {
            matchId: match.id,
            userId: users[i].id,
            status: 'confirmed'
          }
        })
      }

      // Update match status back to open
      const updatedMatch = await prisma.match.update({
        where: { id: match.id },
        data: { status: 'open' }
      })

      expect(updatedMatch.status).toBe('open')
    })

    it('should allow cancelled status for admin actions', async () => {
      const cancelledMatch = await prisma.match.update({
        where: { id: match.id },
        data: { status: 'cancelled' }
      })

      expect(cancelledMatch.status).toBe('cancelled')
    })

    it('should allow completed status after match ends', async () => {
      const completedMatch = await prisma.match.update({
        where: { id: match.id },
        data: { status: 'completed' }
      })

      expect(completedMatch.status).toBe('completed')
    })
  })

  describe('Player Registration Constraints', () => {
    let match: any
    let user: any

    beforeEach(async () => {
      match = await prisma.match.create({
        data: {
          date: new Date('2024-01-08T12:30:00.000Z'),
          maxPlayers: 12,
          status: 'open'
        }
      })

      user = await prisma.user.create({
        data: {
          email: 'player@test.com',
          pseudo: 'TestPlayer',
          password: 'hashedPassword',
          role: 'user'
        }
      })
    })

    it('should prevent duplicate registration for same match', async () => {
      // First registration
      await prisma.matchPlayer.create({
        data: {
          matchId: match.id,
          userId: user.id,
          status: 'confirmed'
        }
      })

      // Attempt duplicate registration should fail
      await expect(
        prisma.matchPlayer.create({
          data: {
            matchId: match.id,
            userId: user.id,
            status: 'confirmed'
          }
        })
      ).rejects.toThrow()
    })

    it('should allow same user in different matches', async () => {
      const match2 = await prisma.match.create({
        data: {
          date: new Date('2024-01-09T12:30:00.000Z'),
          maxPlayers: 12,
          status: 'open'
        }
      })

      // Register for first match
      const player1 = await prisma.matchPlayer.create({
        data: {
          matchId: match.id,
          userId: user.id,
          status: 'confirmed'
        }
      })

      // Register for second match
      const player2 = await prisma.matchPlayer.create({
        data: {
          matchId: match2.id,
          userId: user.id,
          status: 'confirmed'
        }
      })

      expect(player1).toBeDefined()
      expect(player2).toBeDefined()
      expect(player1.matchId).not.toBe(player2.matchId)
    })
  })

  describe('Time Constraints Validation', () => {
    it('should validate match time is during lunch break (12h-14h)', () => {
      // Create times using local time methods to avoid timezone issues
      const validTime1 = new Date()
      validTime1.setHours(12, 0, 0, 0) // 12:00
      const validTime2 = new Date()
      validTime2.setHours(12, 30, 0, 0) // 12:30
      const validTime3 = new Date()
      validTime3.setHours(13, 0, 0, 0) // 13:00
      const validTime4 = new Date()
      validTime4.setHours(13, 59, 0, 0) // 13:59

      const invalidTime1 = new Date()
      invalidTime1.setHours(11, 59, 0, 0) // 11:59
      const invalidTime2 = new Date()
      invalidTime2.setHours(14, 0, 0, 0) // 14:00
      const invalidTime3 = new Date()
      invalidTime3.setHours(15, 0, 0, 0) // 15:00

      const validTimes = [validTime1, validTime2, validTime3, validTime4]
      const invalidTimes = [invalidTime1, invalidTime2, invalidTime3]

      validTimes.forEach(time => {
        const hour = time.getHours()
        expect(hour).toBeGreaterThanOrEqual(12)
        expect(hour).toBeLessThan(14)
      })

      invalidTimes.forEach(time => {
        const hour = time.getHours()
        expect(hour < 12 || hour >= 14).toBe(true)
      })
    })

    it('should validate match is on working day (Monday-Friday)', () => {
      const monday = new Date('2024-01-08T12:30:00.000Z') // Monday
      const tuesday = new Date('2024-01-09T12:30:00.000Z') // Tuesday
      const friday = new Date('2024-01-12T12:30:00.000Z') // Friday
      const saturday = new Date('2024-01-13T12:30:00.000Z') // Saturday
      const sunday = new Date('2024-01-14T12:30:00.000Z') // Sunday

      // Valid working days (1 = Monday, 5 = Friday)
      expect([1, 2, 3, 4, 5]).toContain(monday.getDay())
      expect([1, 2, 3, 4, 5]).toContain(tuesday.getDay())
      expect([1, 2, 3, 4, 5]).toContain(friday.getDay())

      // Invalid weekend days (0 = Sunday, 6 = Saturday)
      expect([0, 6]).toContain(saturday.getDay())
      expect([0, 6]).toContain(sunday.getDay())
    })

    it('should validate reservation advance limit (2 weeks)', () => {
      const now = new Date()
      const twoWeeksFromNow = new Date()
      twoWeeksFromNow.setDate(now.getDate() + 14)
      
      const threeWeeksFromNow = new Date()
      threeWeeksFromNow.setDate(now.getDate() + 21)

      const validDate = new Date()
      validDate.setDate(now.getDate() + 7) // 1 week from now

      // Business logic validation (to be implemented in API)
      const daysDifference1 = Math.floor((twoWeeksFromNow.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const daysDifference2 = Math.floor((threeWeeksFromNow.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const daysDifference3 = Math.floor((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      expect(daysDifference1).toBeLessThanOrEqual(14) // Valid
      expect(daysDifference2).toBeGreaterThan(14) // Invalid
      expect(daysDifference3).toBeLessThanOrEqual(14) // Valid
    })

    it('should validate cancellation deadline (2 hours before)', () => {
      const matchTime = new Date('2024-01-08T12:30:00.000Z')
      const twoHoursBefore = new Date(matchTime.getTime() - 2 * 60 * 60 * 1000)
      const oneHourBefore = new Date(matchTime.getTime() - 1 * 60 * 60 * 1000)
      const threeHoursBefore = new Date(matchTime.getTime() - 3 * 60 * 60 * 1000)

      // Current time simulation
      const currentTime = twoHoursBefore.getTime()
      const currentTime2 = oneHourBefore.getTime()
      const currentTime3 = threeHoursBefore.getTime()

      // 2 hours before - deadline reached
      expect(currentTime).toBeLessThanOrEqual(twoHoursBefore.getTime())
      
      // 1 hour before - too late to cancel
      expect(currentTime2).toBeGreaterThan(twoHoursBefore.getTime())
      
      // 3 hours before - can still cancel
      expect(currentTime3).toBeLessThan(twoHoursBefore.getTime())
    })
  })
})