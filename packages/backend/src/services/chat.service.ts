/**
 * Chat Service - Business logic for chat rooms and messages
 */

import { prisma } from '../database/prisma'
import { ModerationService } from './moderation.service'

// Maximum number of messages to keep per room
export const MAX_MESSAGES_PER_ROOM = 100

export class ChatService {
  /**
   * Get or create a chat room for an activity
   */
  static async getOrCreateRoom(activityId: string) {
    // Check if room already exists
    let room = await prisma.chatRoom.findUnique({
      where: { activityId },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            sport: true
          }
        }
      }
    })

    // Create room if it doesn't exist
    if (!room) {
      room = await prisma.chatRoom.create({
        data: { activityId },
        include: {
          activity: {
            select: {
              id: true,
              name: true,
              sport: true
            }
          }
        }
      })
    }

    return room
  }

  /**
   * Check if a user can access a room
   * User must be subscribed to the activity or be the creator
   */
  static async canAccessRoom(roomId: string, userId: string): Promise<boolean> {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        activity: {
          select: {
            createdBy: true,
            subscriptions: {
              where: { userId },
              select: { id: true }
            },
            userLists: {
              where: { userId },
              select: { id: true }
            }
          }
        }
      }
    })

    if (!room) return false

    // Allow access if user is creator, subscribed, or has activity in their list
    return (
      room.activity.createdBy === userId ||
      room.activity.subscriptions.length > 0 ||
      room.activity.userLists.length > 0
    )
  }

  /**
   * Send a message in a room
   */
  static async sendMessage(roomId: string, senderId: string, content: string) {
    // Validate room access
    const hasAccess = await this.canAccessRoom(roomId, senderId)
    if (!hasAccess) {
      throw new Error('Vous n\'avez pas accès à ce salon')
    }

    // Moderate content
    const moderation = ModerationService.moderateMessage(content)

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId,
        content: moderation.content,
        originalContent: moderation.originalContent,
        isModerated: moderation.isModerated
      },
      include: {
        sender: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        }
      }
    })

    // Cleanup old messages to keep only the last MAX_MESSAGES_PER_ROOM
    await this.cleanupOldMessages(roomId)

    return message
  }

  /**
   * Delete messages beyond MAX_MESSAGES_PER_ROOM to limit storage
   * Keeps only the most recent messages
   */
  static async cleanupOldMessages(roomId: string): Promise<number> {
    // Get the ID of the message at position MAX_MESSAGES_PER_ROOM (the cutoff point)
    const cutoffMessage = await prisma.chatMessage.findFirst({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      skip: MAX_MESSAGES_PER_ROOM,
      select: { createdAt: true }
    })

    // If no cutoff message found, there are <= MAX_MESSAGES_PER_ROOM messages
    if (!cutoffMessage) {
      return 0
    }

    // Delete all messages older than the cutoff
    const deleted = await prisma.chatMessage.deleteMany({
      where: {
        roomId,
        createdAt: { lte: cutoffMessage.createdAt }
      }
    })

    return deleted.count
  }

  /**
   * Get messages for a room (limited to MAX_MESSAGES_PER_ROOM)
   */
  static async getMessages(
    roomId: string,
    userId: string,
    options: { limit?: number; before?: string } = {}
  ) {
    // Validate room access
    const hasAccess = await this.canAccessRoom(roomId, userId)
    if (!hasAccess) {
      throw new Error('Vous n\'avez pas accès à ce salon')
    }

    // Limit to MAX_MESSAGES_PER_ROOM maximum
    const { limit = MAX_MESSAGES_PER_ROOM, before } = options
    const effectiveLimit = Math.min(limit, MAX_MESSAGES_PER_ROOM)

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
        ...(before && {
          createdAt: {
            lt: new Date(before)
          }
        })
      },
      orderBy: { createdAt: 'desc' },
      take: effectiveLimit,
      include: {
        sender: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        }
      }
    })

    // Return in chronological order (oldest first)
    return messages.reverse()
  }

  /**
   * Mark a room as read for a user
   */
  static async markAsRead(roomId: string, userId: string) {
    // Validate room access
    const hasAccess = await this.canAccessRoom(roomId, userId)
    if (!hasAccess) {
      throw new Error('Vous n\'avez pas accès à ce salon')
    }

    // Get the latest message in the room
    const latestMessage = await prisma.chatMessage.findFirst({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    })

    // Upsert read status
    return prisma.chatRoomReadStatus.upsert({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      },
      update: {
        lastReadAt: new Date(),
        lastMessageId: latestMessage?.id
      },
      create: {
        roomId,
        userId,
        lastReadAt: new Date(),
        lastMessageId: latestMessage?.id
      }
    })
  }

  /**
   * Get rooms accessible to a user
   */
  static async getUserRooms(userId: string) {
    // Get all activities where user is creator, subscribed, or has in list
    const activities = await prisma.activity.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { subscriptions: { some: { userId } } },
          { userLists: { some: { userId } } }
        ]
      },
      select: {
        id: true,
        name: true,
        sport: true,
        chatRoom: {
          include: {
            _count: {
              select: { messages: true }
            }
          }
        }
      }
    })

    // Create chat rooms for activities that don't have one yet
    const roomPromises = activities.map(async (activity) => {
      let chatRoom = activity.chatRoom

      // If room doesn't exist, create it
      if (!chatRoom) {
        chatRoom = await prisma.chatRoom.create({
          data: { activityId: activity.id },
          include: {
            _count: {
              select: { messages: true }
            }
          }
        })
      }

      return {
        id: chatRoom.id,
        activityId: activity.id,
        activityName: activity.name,
        sport: activity.sport,
        messageCount: chatRoom._count.messages,
        createdAt: chatRoom.createdAt,
        updatedAt: chatRoom.updatedAt
      }
    })

    const rooms = await Promise.all(roomPromises)

    return rooms
  }

  /**
   * Get unread message counts for all user's rooms
   */
  static async getUnreadCounts(userId: string) {
    // Get user's rooms
    const rooms = await this.getUserRooms(userId)

    // For each room, count unread messages
    const unreadCounts = await Promise.all(
      rooms.map(async (room) => {
        // Get user's last read status
        const readStatus = await prisma.chatRoomReadStatus.findUnique({
          where: {
            roomId_userId: {
              roomId: room.id,
              userId
            }
          }
        })

        // Count messages created after last read
        const unreadCount = await prisma.chatMessage.count({
          where: {
            roomId: room.id,
            senderId: { not: userId }, // Don't count own messages
            createdAt: {
              gt: readStatus?.lastReadAt || new Date(0) // If never read, count all
            }
          }
        })

        return {
          roomId: room.id,
          activityId: room.activityId,
          activityName: room.activityName,
          unreadCount
        }
      })
    )

    return unreadCounts
  }

  /**
   * Get total unread message count for a user
   */
  static async getTotalUnreadCount(userId: string): Promise<number> {
    const unreadCounts = await this.getUnreadCounts(userId)
    return unreadCounts.reduce((total, room) => total + room.unreadCount, 0)
  }

  /**
   * Get a specific room by ID
   */
  static async getRoomById(roomId: string, userId: string) {
    // Validate room access
    const hasAccess = await this.canAccessRoom(roomId, userId)
    if (!hasAccess) {
      throw new Error('Vous n\'avez pas accès à ce salon')
    }

    return prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            sport: true,
            creator: {
              select: {
                id: true,
                pseudo: true,
                avatar: true
              }
            }
          }
        }
      }
    })
  }

  /**
   * Cleanup old messages for all rooms
   * Useful for maintenance tasks
   */
  static async cleanupAllRooms(): Promise<{ roomId: string; deleted: number }[]> {
    const rooms = await prisma.chatRoom.findMany({
      select: { id: true }
    })

    const results = await Promise.all(
      rooms.map(async (room) => ({
        roomId: room.id,
        deleted: await this.cleanupOldMessages(room.id)
      }))
    )

    return results.filter((r) => r.deleted > 0)
  }
}
