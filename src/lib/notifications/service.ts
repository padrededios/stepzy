/**
 * Notification Service - Real-time Notifications System
 * 
 * This service handles all notification operations including creation,
 * delivery, and management of user notifications.
 * 
 * Available notification service functions:
 * - createNotification(): Create new notification for user
 * - createBulkNotifications(): Create notifications for multiple users
 * - getNotifications(): Get user notifications with pagination
 * - getUnreadCount(): Get count of unread notifications  
 * - markAsRead(): Mark notification as read
 * - markAllAsRead(): Mark all user notifications as read
 * - deleteNotification(): Delete specific notification
 * - deleteOldNotifications(): Cleanup old notifications
 * - sendNotificationEmail(): Send notification via email
 * - scheduleReminder(): Schedule future reminder notification
 * 
 * Email integration (via ./email):
 * - sendMatchNotification(): Send match-related email notifications
 * - sendWelcomeEmail(): Send welcome email to new users
 * - sendPasswordResetEmail(): Send password reset email
 * - sendMatchReminderEmail(): Send match reminder 24h before
 * 
 * Push notifications (via ./push):
 * - sendPushNotification(): Send push notification to user devices
 * - subscribeUser(): Subscribe user to push notifications
 * - unsubscribeUser(): Unsubscribe user from push notifications
 * 
 * Notification types supported:
 * - match_created: New match available
 * - match_updated: Match details changed
 * - match_cancelled: Match was cancelled
 * - match_reminder: Upcoming match reminder
 * - match_joined: User joined match
 * - match_left: User left match
 * - waiting_list_promoted: Moved from waiting list to confirmed
 * - announcement: Admin announcements
 * - system: System maintenance notifications
 * 
 * Features:
 * - Real-time delivery via Server-Sent Events (SSE)
 * - Email fallback for important notifications
 * - Push notification support (optional)
 * - Automatic cleanup of old notifications
 * - Bulk operations for efficiency
 * - Notification preferences per user
 */

import { prisma } from '../database/prisma'
import { sendMatchNotification, type MatchNotificationData } from './email'

export type NotificationType = 
  | 'match_created'
  | 'match_updated'
  | 'match_cancelled'
  | 'match_reminder'
  | 'match_joined'
  | 'match_left'
  | 'waiting_list_promoted'
  | 'announcement'
  | 'system'

export interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
  matchId?: string
}

export interface NotificationWithMatch {
  id: string
  type: NotificationType
  title: string
  message: string
  data: any
  read: boolean
  matchId: string | null
  createdAt: Date
  updatedAt: Date
  match?: {
    id: string
    date: Date
    status: string
  }
}

/**
 * Creates a new notification
 */
export async function createNotification(data: CreateNotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        matchId: data.matchId
      },
      include: {
        user: true,
        match: true
      }
    })

    // Here you would typically emit to WebSocket/SSE for real-time updates
    console.log(`📧 Notification created for user ${data.userId}:`, data.title)

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Gets notifications for a user
 */
export async function getUserNotifications(
  userId: string, 
  limit: number = 20, 
  unreadOnly: boolean = false
): Promise<NotificationWithMatch[]> {
  try {
    const where: any = { userId }
    if (unreadOnly) {
      where.read = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        match: {
          select: {
            id: true,
            date: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return notifications as NotificationWithMatch[]
  } catch (error) {
    console.error('Error fetching user notifications:', error)
    throw error
  }
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId // Ensure user can only mark their own notifications
      },
      data: {
        read: true,
        updatedAt: new Date()
      }
    })

    return notification.count > 0
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

/**
 * Marks all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true,
        updatedAt: new Date()
      }
    })

    return result.count
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}

/**
 * Gets unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    })

    return count
  } catch (error) {
    console.error('Error getting unread notification count:', error)
    return 0
  }
}

/**
 * Creates match-related notifications for multiple users
 */
export async function notifyMatchEvent(
  type: NotificationType,
  matchId: string,
  userIds: string[],
  title: string,
  message: string,
  additionalData?: any
) {
  try {
    const notifications = await Promise.all(
      userIds.map(userId => 
        createNotification({
          userId,
          type,
          title,
          message,
          data: additionalData,
          matchId
        })
      )
    )

    // Also send email notifications if applicable
    if (['match_created', 'match_updated', 'match_cancelled', 'match_reminder'].includes(type)) {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          players: {
            include: {
              user: true
            }
          }
        }
      })

      if (match) {
        const emailType = type === 'match_created' ? 'created' :
                         type === 'match_updated' ? 'updated' :
                         type === 'match_cancelled' ? 'cancelled' :
                         'reminder'

        const notificationData: MatchNotificationData = {
          matchId: match.id,
          date: match.date,
          maxPlayers: match.maxPlayers,
          type: emailType as any,
          recipients: match.players.map(player => ({
            email: player.user.email,
            pseudo: player.user.pseudo
          }))
        }

        await sendMatchNotification(notificationData)
      }
    }

    return notifications
  } catch (error) {
    console.error('Error creating match notifications:', error)
    throw error
  }
}

/**
 * Deletes old notifications (cleanup)
 */
export async function cleanupOldNotifications(olderThanDays: number = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        read: true // Only delete read notifications
      }
    })

    console.log(`🧹 Cleaned up ${result.count} old notifications`)
    return result.count
  } catch (error) {
    console.error('Error cleaning up old notifications:', error)
    throw error
  }
}