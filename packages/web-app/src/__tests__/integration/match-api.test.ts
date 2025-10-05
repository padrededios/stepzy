import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

describe('Match API Integration Tests', () => {
  let rootUser: any
  let testUser: any
  let testMatch: any
  let rootToken: string
  let userToken: string

  beforeAll(async () => {
    // Clean up before tests
    await prisma.matchPlayer.deleteMany()
    await prisma.match.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    // Clean up after tests
    await prisma.matchPlayer.deleteMany()
    await prisma.match.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up before each test
    await prisma.matchPlayer.deleteMany()
    await prisma.match.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()

    // Create test users
    const hashedPassword = await bcrypt.hash('TestPass123!', 10)
    
    rootUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        pseudo: 'AdminTest',
        role: 'root'
      }
    })

    testUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: hashedPassword,
        pseudo: 'UserTest',
        role: 'user'
      }
    })

    // Create test sessions (simulate auth)
    const rootSession = await prisma.session.create({
      data: {
        userId: rootUser.id,
        token: 'root-session-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })

    const userSession = await prisma.session.create({
      data: {
        userId: testUser.id,
        token: 'user-session-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })

    rootToken = rootSession.token
    userToken = userSession.token

    // Create test match
    testMatch = await prisma.match.create({
      data: {
        date: new Date('2024-01-08T12:30:00.000Z'),
        maxPlayers: 12,
        status: 'open'
      }
    })
  })

  describe('GET /api/matches', () => {
    it('should return matches list for authenticated user', async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches`, {
        method: 'GET',
        headers: {
          'Cookie': `session=${userToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.matches).toBeDefined()
      expect(Array.isArray(data.data.matches)).toBe(true)
    })

    it('should return 401 for unauthenticated requests', async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })

    it('should filter matches by status parameter', async () => {
      // Create matches with different statuses
      await prisma.match.create({
        data: {
          date: new Date('2024-01-09T12:30:00.000Z'),
          maxPlayers: 12,
          status: 'full'
        }
      })

      await prisma.match.create({
        data: {
          date: new Date('2024-01-10T12:30:00.000Z'),
          maxPlayers: 12,
          status: 'cancelled'
        }
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches?status=open`, {
        method: 'GET',
        headers: {
          'Cookie': `session=${userToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.matches).toHaveLength(1)
      expect(data.data.matches[0].status).toBe('open')
    })

    it('should respect limit parameter', async () => {
      // Create multiple matches
      for (let i = 1; i <= 5; i++) {
        await prisma.match.create({
          data: {
            date: new Date(`2024-01-${i + 10}T12:30:00.000Z`),
            maxPlayers: 12,
            status: 'open'
          }
        })
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches?limit=3`, {
        method: 'GET',
        headers: {
          'Cookie': `session=${userToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.matches.length).toBeLessThanOrEqual(3)
    })
  })

  describe('POST /api/matches (Create Match - Root Only)', () => {
    it('should create match successfully with root user', async () => {
      const matchData = {
        date: '2024-02-15T12:30:00.000Z',
        maxPlayers: 10
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${rootToken}`
        },
        body: JSON.stringify(matchData)
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.match).toBeDefined()
      expect(data.data.match.maxPlayers).toBe(10)
      expect(data.data.match.status).toBe('open')
    })

    it('should reject creation by regular user', async () => {
      const matchData = {
        date: '2024-02-15T12:30:00.000Z',
        maxPlayers: 12
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${userToken}`
        },
        body: JSON.stringify(matchData)
      })

      expect(response.status).toBe(403)
    })

    it('should validate required fields', async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${rootToken}`
        },
        body: JSON.stringify({})
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('date')
    })

    it('should validate match time constraints (12h-14h)', async () => {
      const invalidTime = {
        date: '2024-02-15T15:30:00.000Z', // 15:30 - outside lunch hours
        maxPlayers: 12
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${rootToken}`
        },
        body: JSON.stringify(invalidTime)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('12h-14h')
    })

    it('should validate working days (Monday-Friday)', async () => {
      const saturdayMatch = {
        date: '2024-01-13T12:30:00.000Z', // Saturday
        maxPlayers: 12
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${rootToken}`
        },
        body: JSON.stringify(saturdayMatch)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('working day')
    })
  })

  describe('GET /api/matches/[id]', () => {
    it('should return match details with players', async () => {
      // Add players to match
      await prisma.matchPlayer.create({
        data: {
          matchId: testMatch.id,
          userId: testUser.id,
          status: 'confirmed'
        }
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${testMatch.id}`, {
        method: 'GET',
        headers: {
          'Cookie': `session=${userToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.match.id).toBe(testMatch.id)
      expect(data.data.match.players).toBeDefined()
      expect(data.data.match.waitingList).toBeDefined()
      expect(Array.isArray(data.data.match.players)).toBe(true)
      expect(Array.isArray(data.data.match.waitingList)).toBe(true)
    })

    it('should return 404 for non-existent match', async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/non-existent-id`, {
        method: 'GET',
        headers: {
          'Cookie': `session=${userToken}`
        }
      })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/matches/[id] (Update Match - Root Only)', () => {
    it('should update match successfully with root user', async () => {
      const updateData = {
        date: '2024-01-15T13:30:00.000Z',
        maxPlayers: 10,
        status: 'full'
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${testMatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${rootToken}`
        },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.match.maxPlayers).toBe(10)
      expect(data.data.match.status).toBe('full')
    })

    it('should reject update by regular user', async () => {
      const updateData = { maxPlayers: 10 }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${testMatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${userToken}`
        },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(403)
    })

    it('should validate time constraints on update', async () => {
      const invalidUpdate = {
        date: '2024-01-15T16:30:00.000Z' // 16:30 - outside lunch hours
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${testMatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${rootToken}`
        },
        body: JSON.stringify(invalidUpdate)
      })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/matches/[id] (Delete Match - Root Only)', () => {
    it('should delete match successfully with root user', async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${testMatch.id}`, {
        method: 'DELETE',
        headers: {
          'Cookie': `session=${rootToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify match is deleted
      const deletedMatch = await prisma.match.findUnique({
        where: { id: testMatch.id }
      })
      expect(deletedMatch).toBeNull()
    })

    it('should reject deletion by regular user', async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${testMatch.id}`, {
        method: 'DELETE',
        headers: {
          'Cookie': `session=${userToken}`
        }
      })

      expect(response.status).toBe(403)
    })

    it('should return 404 for non-existent match', async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/non-existent-id`, {
        method: 'DELETE',
        headers: {
          'Cookie': `session=${rootToken}`
        }
      })

      expect(response.status).toBe(404)
    })
  })

  describe('Admin Actions', () => {
    let secondUser: any

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('TestPass123!', 10)
      secondUser = await prisma.user.create({
        data: {
          email: 'user2@test.com',
          password: hashedPassword,
          pseudo: 'User2Test',
          role: 'user'
        }
      })
    })

    describe('POST /api/matches/[id]/force-join', () => {
      it('should allow root to force join player', async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${testMatch.id}/force-join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `session=${rootToken}`
          },
          body: JSON.stringify({ userId: testUser.id })
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)

        // Verify player was added
        const player = await prisma.matchPlayer.findUnique({
          where: {
            userId_matchId: {
              userId: testUser.id,
              matchId: testMatch.id
            }
          }
        })
        expect(player).toBeDefined()
      })

      it('should reject force join by regular user', async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${testMatch.id}/force-join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `session=${userToken}`
          },
          body: JSON.stringify({ userId: testUser.id })
        })

        expect(response.status).toBe(403)
      })
    })

    describe('POST /api/matches/[id]/force-leave', () => {
      beforeEach(async () => {
        // Add player to match first
        await prisma.matchPlayer.create({
          data: {
            matchId: testMatch.id,
            userId: testUser.id,
            status: 'confirmed'
          }
        })
      })

      it('should allow root to force leave player', async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${testMatch.id}/force-leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `session=${rootToken}`
          },
          body: JSON.stringify({ userId: testUser.id })
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)

        // Verify player was removed
        const player = await prisma.matchPlayer.findUnique({
          where: {
            userId_matchId: {
              userId: testUser.id,
              matchId: testMatch.id
            }
          }
        })
        expect(player).toBeNull()
      })

      it('should reject force leave by regular user', async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${testMatch.id}/force-leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `session=${userToken}`
          },
          body: JSON.stringify({ userId: testUser.id })
        })

        expect(response.status).toBe(403)
      })
    })

    describe('POST /api/matches/[id]/replace', () => {
      beforeEach(async () => {
        // Add player to match first
        await prisma.matchPlayer.create({
          data: {
            matchId: testMatch.id,
            userId: testUser.id,
            status: 'confirmed'
          }
        })
      })

      it('should allow root to replace player', async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${testMatch.id}/replace`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `session=${rootToken}`
          },
          body: JSON.stringify({ 
            fromUserId: testUser.id,
            toUserId: secondUser.id
          })
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)

        // Verify old player was removed
        const oldPlayer = await prisma.matchPlayer.findUnique({
          where: {
            userId_matchId: {
              userId: testUser.id,
              matchId: testMatch.id
            }
          }
        })
        expect(oldPlayer).toBeNull()

        // Verify new player was added
        const newPlayer = await prisma.matchPlayer.findUnique({
          where: {
            userId_matchId: {
              userId: secondUser.id,
              matchId: testMatch.id
            }
          }
        })
        expect(newPlayer).toBeDefined()
        expect(newPlayer?.status).toBe('confirmed')
      })

      it('should reject replace by regular user', async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${testMatch.id}/replace`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `session=${userToken}`
          },
          body: JSON.stringify({ 
            fromUserId: testUser.id,
            toUserId: secondUser.id
          })
        })

        expect(response.status).toBe(403)
      })
    })
  })
})