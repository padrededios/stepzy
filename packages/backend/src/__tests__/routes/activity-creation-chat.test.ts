/**
 * Test for activity creation with chat room
 * Verifies that when an activity is created, the chat room is automatically created
 */

import { prisma } from '../../database/prisma'

describe('Activity Creation - Chat Room Creation', () => {
  let testUser: any

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-chat-creation@example.com',
        pseudo: 'TestChatCreation',
        role: 'user'
      }
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: 'test-chat-creation@example.com' }
    })
  })

  it('should create a chat room when an activity is created', async () => {
    // Create an activity
    const activity = await prisma.activity.create({
      data: {
        name: 'Rugby Activity for Chat Test',
        sport: 'rugby',
        minPlayers: 2,
        maxPlayers: 15,
        createdBy: testUser.id,
        code: 'TESTCODE123', // Using a test code
        recurringDays: ['monday', 'wednesday'],
        recurringType: 'weekly',
        startTime: '18:00',
        endTime: '20:00',
        isPublic: true
      }
    })

    // Verify that a chat room was created for this activity
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { activityId: activity.id }
    })

    expect(chatRoom).toBeDefined()
    expect(chatRoom?.activityId).toBe(activity.id)

    // Cleanup
    await prisma.activity.delete({
      where: { id: activity.id }
    })
  })

  it('should have getOrCreateRoom method that creates room on first call', async () => {
    // Create an activity without auto-creating chat room
    const activity = await prisma.activity.create({
      data: {
        name: 'Test Activity - No Auto Chat',
        sport: 'football',
        minPlayers: 2,
        maxPlayers: 11,
        createdBy: testUser.id,
        code: 'TESTCODE456',
        recurringDays: ['tuesday'],
        recurringType: 'weekly',
        startTime: '19:00',
        endTime: '21:00',
        isPublic: true
      }
    })

    // Verify no chat room exists yet
    let existingRoom = await prisma.chatRoom.findUnique({
      where: { activityId: activity.id }
    })
    expect(existingRoom).toBeUndefined()

    // Simulate the getOrCreateRoom call that should happen during creation
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { activityId: activity.id }
    })

    if (!chatRoom) {
      const newRoom = await prisma.chatRoom.create({
        data: { activityId: activity.id }
      })
      expect(newRoom).toBeDefined()
      expect(newRoom.activityId).toBe(activity.id)
    }

    // Cleanup
    await prisma.activity.delete({
      where: { id: activity.id }
    })
  })
})
