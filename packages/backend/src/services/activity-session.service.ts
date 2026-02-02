/**
 * Activity Session Service - Business logic for activity sessions
 */

import { prisma } from '../database/prisma'
import type { Activity, DayOfWeek, ActivitySession } from '@stepzy/shared'
import { NotificationService } from './notification.service'

export class ActivitySessionService {
  /**
   * Generate sessions for an activity
   */
  static async generateSessions(
    activityId: string,
    fromDate: Date,
    weeksAhead: number = 2
  ): Promise<ActivitySession[]> {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if (!activity) {
      throw new Error('Activity not found')
    }

    const sessions: ActivitySession[] = []
    const endDate = new Date(fromDate)
    endDate.setDate(endDate.getDate() + weeksAhead * 7)

    // Generate sessions based on recurring type
    if (activity.recurringType === 'weekly') {
      sessions.push(...(await this.generateWeeklySessions(activity as Activity, fromDate, endDate)))
    } else if (activity.recurringType === 'monthly') {
      sessions.push(...(await this.generateMonthlySessions(activity as Activity, fromDate, endDate)))
    }

    // Notify subscribers about new sessions
    if (sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      await NotificationService.notifyNewSessions(activityId, sessionIds).catch(err => {
        console.error('[ActivitySessionService] Error notifying new sessions:', err)
      })
    }

    return sessions
  }

  /**
   * Generate weekly sessions
   */
  private static async generateWeeklySessions(
    activity: Activity,
    fromDate: Date,
    endDate: Date
  ): Promise<ActivitySession[]> {
    const sessions: ActivitySession[] = []
    const dayMapping: Record<DayOfWeek, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    }

    // For each recurring day
    for (const dayOfWeek of activity.recurringDays as DayOfWeek[]) {
      const targetDayNumber = dayMapping[dayOfWeek]
      let currentDate = new Date(fromDate)

      // Find next matching day
      while (currentDate.getDay() !== targetDayNumber) {
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Generate weekly sessions
      while (currentDate <= endDate) {
        // Check if session doesn't already exist
        const startOfDay = new Date(currentDate)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(currentDate)
        endOfDay.setHours(23, 59, 59, 999)

        const existingSession = await prisma.activitySession.findFirst({
          where: {
            activityId: activity.id,
            date: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        })

        if (!existingSession) {
          // Create session at 12:00 by default
          const sessionDate = new Date(currentDate)
          sessionDate.setHours(12, 0, 0, 0)

          const session = await prisma.activitySession.create({
            data: {
              activityId: activity.id,
              date: sessionDate,
              maxPlayers: activity.maxPlayers,
              status: 'active'
            }
          })

          sessions.push(session as ActivitySession)
        }

        currentDate.setDate(currentDate.getDate() + 7) // Next week
      }
    }

    return sessions
  }

  /**
   * Generate monthly sessions
   */
  private static async generateMonthlySessions(
    activity: Activity,
    fromDate: Date,
    endDate: Date
  ): Promise<ActivitySession[]> {
    const sessions: ActivitySession[] = []
    const dayMapping: Record<DayOfWeek, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    }

    // For each recurring day
    for (const dayOfWeek of activity.recurringDays as DayOfWeek[]) {
      const targetDayNumber = dayMapping[dayOfWeek]
      let currentDate = new Date(fromDate)

      // Generate monthly sessions
      while (currentDate <= endDate) {
        // Find first occurrence of target day in current month
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        let targetDate = new Date(firstDayOfMonth)

        while (targetDate.getDay() !== targetDayNumber) {
          targetDate.setDate(targetDate.getDate() + 1)
        }

        // Only create if the date is within range
        if (targetDate >= fromDate && targetDate <= endDate) {
          const startOfDay = new Date(targetDate)
          startOfDay.setHours(0, 0, 0, 0)

          const endOfDay = new Date(targetDate)
          endOfDay.setHours(23, 59, 59, 999)

          const existingSession = await prisma.activitySession.findFirst({
            where: {
              activityId: activity.id,
              date: {
                gte: startOfDay,
                lte: endOfDay
              }
            }
          })

          if (!existingSession) {
            const sessionDate = new Date(targetDate)
            sessionDate.setHours(12, 0, 0, 0)

            const session = await prisma.activitySession.create({
              data: {
                activityId: activity.id,
                date: sessionDate,
                maxPlayers: activity.maxPlayers,
                status: 'active'
              }
            })

            sessions.push(session as ActivitySession)
          }
        }

        // Move to next month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      }
    }

    return sessions
  }

  /**
   * Get upcoming sessions
   */
  static async getUpcomingSessions(limit: number = 20, userId?: string) {
    // First, get user's subscribed activity IDs
    let subscribedActivityIds: string[] = []
    if (userId) {
      const subscriptions = await prisma.activitySubscription.findMany({
        where: { userId },
        select: { activityId: true }
      })
      subscribedActivityIds = subscriptions.map(s => s.activityId)

      // If user is not subscribed to any activity, return empty array
      if (subscribedActivityIds.length === 0) {
        console.log(`[getUpcomingSessions] userId: ${userId}, no subscriptions, returning empty array`)
        return []
      }
    }

    const sessions = await prisma.activitySession.findMany({
      where: {
        date: {
          gte: new Date()
        },
        status: 'active',
        // Only show sessions from activities user is subscribed to
        ...(userId ? {
          activityId: { in: subscribedActivityIds }
        } : {})
      },
      include: {
        activity: {
          include: {
            creator: {
              select: {
                id: true,
                pseudo: true,
                avatar: true
              }
            }
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: limit
    })

    // Add stats and userStatus to each session, filter out sessions user is already in
    const enrichedSessions = sessions.map(session => {
      const confirmedCount = session.participants.filter(p => p.status === 'confirmed').length
      const waitingCount = session.participants.filter(p => p.status === 'waiting').length
      const interestedCount = session.participants.filter(p => p.status === 'interested').length
      const availableSpots = Math.max(0, session.maxPlayers - confirmedCount)

      // Find user's participation status
      const userParticipant = userId
        ? session.participants.find(p => p.userId === userId)
        : null

      const isParticipant = !!userParticipant
      const canJoin = !isParticipant && !session.isCancelled && availableSpots > 0

      return {
        ...session,
        stats: {
          confirmedCount,
          waitingCount,
          interestedCount,
          availableSpots
        },
        userStatus: {
          isParticipant,
          canJoin,
          participantStatus: userParticipant?.status || null
        }
      }
    })

    // Filter out sessions user is already participating in
    const filteredSessions = enrichedSessions.filter(session => !session.userStatus.isParticipant)

    console.log(`[getUpcomingSessions] userId: ${userId}, total sessions: ${sessions.length}, after filter: ${filteredSessions.length}`)

    return filteredSessions
  }

  /**
   * Join a session
   */
  static async joinSession(sessionId: string, userId: string) {
    const session = await prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: {
        activity: true,
        participants: true
      }
    })

    if (!session) {
      throw new Error('Session non trouvée')
    }

    if (session.isCancelled) {
      throw new Error('Cette session a été annulée')
    }

    // Check if already participating
    const existingParticipant = session.participants.find(p => p.userId === userId)
    if (existingParticipant) {
      throw new Error('Vous participez déjà à cette session')
    }

    // Check capacity
    const confirmedCount = session.participants.filter(p => p.status === 'confirmed').length

    const status = confirmedCount < session.maxPlayers ? 'confirmed' : 'waiting'

    // Add participant
    const participant = await prisma.activityParticipant.create({
      data: {
        sessionId,
        userId,
        status
      },
      include: {
        user: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        }
      }
    })

    // Check if session just reached minPlayers (confirmed)
    const newConfirmedCount = status === 'confirmed' ? confirmedCount + 1 : confirmedCount
    if (newConfirmedCount === session.activity.minPlayers) {
      // Session is now confirmed - notify all participants
      await NotificationService.notifySessionConfirmed(sessionId).catch(err => {
        console.error('[ActivitySessionService] Error notifying session confirmed:', err)
      })
    }

    return participant
  }

  /**
   * Leave a session
   */
  static async leaveSession(sessionId: string, userId: string) {
    // Find participant
    const participant = await prisma.activityParticipant.findFirst({
      where: {
        sessionId,
        userId
      }
    })

    if (!participant) {
      throw new Error('Vous ne participez pas à cette session')
    }

    // Remove participant
    await prisma.activityParticipant.delete({
      where: { id: participant.id }
    })

    // If confirmed participant left, promote waiting participant
    if (participant.status === 'confirmed') {
      const waitingParticipant = await prisma.activityParticipant.findFirst({
        where: {
          sessionId,
          status: 'waiting'
        },
        orderBy: {
          joinedAt: 'asc'
        }
      })

      if (waitingParticipant) {
        await prisma.activityParticipant.update({
          where: { id: waitingParticipant.id },
          data: { status: 'confirmed' }
        })
      }
    }
  }

  /**
   * Get session by ID
   */
  static async findById(sessionId: string) {
    return await prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: {
        activity: {
          include: {
            creator: {
              select: {
                id: true,
                pseudo: true,
                avatar: true
              }
            }
          }
        },
        participants: {
          include: {
            user: {
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
   * Update session
   */
  static async update(sessionId: string, data: { maxPlayers?: number; isCancelled?: boolean }, reason?: string) {
    const updatedSession = await prisma.activitySession.update({
      where: { id: sessionId },
      data,
      include: {
        activity: {
          include: {
            creator: {
              select: {
                id: true,
                pseudo: true,
                avatar: true
              }
            }
          }
        },
        participants: {
          include: {
            user: {
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

    // If session was cancelled, notify participants
    if (data.isCancelled === true) {
      await NotificationService.notifySessionCancelled(sessionId, reason).catch(err => {
        console.error('[ActivitySessionService] Error notifying session cancelled:', err)
      })
    }

    return updatedSession
  }
}
