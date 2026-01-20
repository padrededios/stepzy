/**
 * Notification Service - Business logic for notifications
 */

import { prisma } from '../database/prisma'
import type { NotificationType } from '@prisma/client'

interface NotifyOptions {
  userId: string
  type: NotificationType
  title: string
  message: string
  activityId?: string
  sessionId?: string
  matchId?: string
  data?: Record<string, unknown>
}

interface NotifyManyOptions extends Omit<NotifyOptions, 'userId'> {
  userIds: string[]
}

export class NotificationService {
  /**
   * Create a single notification
   */
  static async create(options: NotifyOptions) {
    return prisma.notification.create({
      data: {
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        activityId: options.activityId,
        sessionId: options.sessionId,
        matchId: options.matchId,
        data: options.data
      }
    })
  }

  /**
   * Create notifications for multiple users
   */
  static async createMany(options: NotifyManyOptions) {
    const notifications = options.userIds.map(userId => ({
      userId,
      type: options.type,
      title: options.title,
      message: options.message,
      activityId: options.activityId,
      sessionId: options.sessionId,
      matchId: options.matchId,
      data: options.data
    }))

    return prisma.notification.createMany({
      data: notifications
    })
  }

  /**
   * Notify when a session reaches minimum players (confirmed)
   */
  static async notifySessionConfirmed(sessionId: string) {
    const session = await prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: {
        activity: true,
        participants: {
          where: { status: { in: ['confirmed', 'interested'] } },
          select: { userId: true }
        }
      }
    })

    if (!session) return

    const userIds = session.participants.map(p => p.userId)
    if (userIds.length === 0) return

    const sessionDate = new Date(session.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })

    return this.createMany({
      userIds,
      type: 'session_confirmed',
      title: 'Session confirmée !',
      message: `La session de ${session.activity.name} du ${sessionDate} est confirmée. On se retrouve bientôt !`,
      activityId: session.activityId,
      sessionId: session.id
    })
  }

  /**
   * Notify when a session is cancelled
   */
  static async notifySessionCancelled(sessionId: string, reason?: string) {
    const session = await prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: {
        activity: true,
        participants: {
          select: { userId: true }
        }
      }
    })

    if (!session) return

    const userIds = session.participants.map(p => p.userId)
    if (userIds.length === 0) return

    const sessionDate = new Date(session.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })

    const message = reason
      ? `La session de ${session.activity.name} du ${sessionDate} a été annulée. Raison : ${reason}`
      : `La session de ${session.activity.name} du ${sessionDate} a été annulée.`

    return this.createMany({
      userIds,
      type: 'session_cancelled',
      title: 'Session annulée',
      message,
      activityId: session.activityId,
      sessionId: session.id
    })
  }

  /**
   * Create session reminders (24h before)
   */
  static async createSessionReminders() {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setHours(now.getHours() + 24)

    // Find sessions happening in the next 24 hours
    const sessions = await prisma.activitySession.findMany({
      where: {
        date: {
          gte: now,
          lte: tomorrow
        },
        status: 'active',
        isCancelled: false
      },
      include: {
        activity: true,
        participants: {
          where: { status: { in: ['confirmed', 'interested'] } },
          select: { userId: true }
        }
      }
    })

    const reminders: NotifyManyOptions[] = []

    for (const session of sessions) {
      const userIds = session.participants.map(p => p.userId)
      if (userIds.length === 0) continue

      // Check if reminder already sent
      const existingReminder = await prisma.notification.findFirst({
        where: {
          sessionId: session.id,
          type: 'session_reminder',
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24h
          }
        }
      })

      if (existingReminder) continue

      const sessionDate = new Date(session.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      })

      reminders.push({
        userIds,
        type: 'session_reminder',
        title: 'Rappel de session',
        message: `N'oubliez pas : ${session.activity.name} demain le ${sessionDate}`,
        activityId: session.activityId,
        sessionId: session.id
      })
    }

    // Create all reminders
    for (const reminder of reminders) {
      await this.createMany(reminder)
    }

    return reminders.length
  }

  /**
   * Notify subscribers when new sessions are available
   */
  static async notifyNewSessions(activityId: string, sessionIds: string[]) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        subscriptions: {
          select: { userId: true }
        }
      }
    })

    if (!activity) return

    const userIds = activity.subscriptions.map(s => s.userId)
    if (userIds.length === 0) return

    const sessions = await prisma.activitySession.findMany({
      where: { id: { in: sessionIds } },
      orderBy: { date: 'asc' }
    })

    const sessionCount = sessions.length
    const firstSessionDate = sessions[0]?.date
      ? new Date(sessions[0].date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })
      : ''

    const message = sessionCount === 1
      ? `Une nouvelle session de ${activity.name} est disponible le ${firstSessionDate}`
      : `${sessionCount} nouvelles sessions de ${activity.name} sont disponibles`

    return this.createMany({
      userIds,
      type: 'new_sessions_available',
      title: 'Nouvelles sessions disponibles',
      message,
      activityId,
      data: { sessionIds }
    })
  }

  /**
   * Get notifications for a user
   */
  static async findMany(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ) {
    const { limit = 20, offset = 0, unreadOnly = false } = options

    const where = {
      userId,
      ...(unreadOnly && { read: false })
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          activity: {
            select: { id: true, name: true, sport: true }
          },
          session: {
            select: { id: true, date: true }
          },
          match: {
            select: { id: true, date: true, status: true }
          }
        }
      }),
      prisma.notification.count({ where })
    ])

    return { notifications, total }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false }
    })
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true }
    })
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    })
  }

  /**
   * Delete a single notification
   */
  static async delete(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, userId }
    })
  }

  /**
   * Delete multiple notifications
   */
  static async deleteMultiple(notificationIds: string[], userId: string) {
    return prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId
      }
    })
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAll(userId: string) {
    return prisma.notification.deleteMany({
      where: { userId }
    })
  }
}
