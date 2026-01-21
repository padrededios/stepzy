/**
 * Activity Service - Business logic for activities
 */

import { prisma } from '../database/prisma'
import type {
  Activity,
  CreateActivityData,
  UpdateActivityData,
  ActivityFilters
} from '@stepzy/shared'
import { generateActivityCode } from '@stepzy/shared'

export class ActivityService {
  /**
   * Generate a unique activity code
   */
  private static async generateUniqueCode(): Promise<string> {
    let code: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      code = generateActivityCode()

      // Check if code already exists
      const existing = await prisma.activity.findUnique({
        where: { code }
      })

      if (!existing) {
        isUnique = true
        return code
      }

      attempts++
    }

    throw new Error('Impossible de générer un code unique pour l\'activité')
  }

  /**
   * Create a new activity
   */
  static async create(userId: string, data: CreateActivityData) {
    // Validate business rules
    if (data.recurringDays.length === 0) {
      throw new Error('Vous devez sélectionner au moins un jour de la semaine')
    }

    if (data.minPlayers > data.maxPlayers) {
      throw new Error('Le nombre minimum de joueurs ne peut pas être supérieur au nombre maximum')
    }

    // Generate unique code
    const code = await this.generateUniqueCode()

    // Create activity
    const activity = await prisma.activity.create({
      data: {
        name: data.name,
        description: data.description,
        sport: data.sport,
        minPlayers: data.minPlayers,
        maxPlayers: data.maxPlayers,
        createdBy: userId,
        code,
        recurringDays: data.recurringDays,
        recurringType: data.recurringType,
        startTime: data.startTime,
        endTime: data.endTime,
        isPublic: true
      },
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

    // Auto-subscribe creator to their activity
    await prisma.activitySubscription.create({
      data: {
        userId,
        activityId: activity.id
      }
    })

    // Add activity to creator's list
    await prisma.userActivityList.create({
      data: {
        userId,
        activityId: activity.id
      }
    })

    return activity
  }

  /**
   * Get activities with filters
   * Returns only activities in user's list (created by them or joined via code)
   */
  static async findMany(
    userId: string,
    filters: ActivityFilters = {},
    pagination: { page: number; limit: number }
  ) {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    // Get user's activity list (activities they've joined or created)
    const userActivityList = await prisma.userActivityList.findMany({
      where: { userId },
      select: { activityId: true }
    })

    const activityIdsInList = userActivityList.map(item => item.activityId)

    // Build where clause
    const whereClause: any = {
      OR: [
        { id: { in: activityIdsInList } }, // Activities in user's list
        { createdBy: userId } // Activities created by user
      ]
    }

    if (filters.sport) {
      whereClause.sport = filters.sport
    }

    if (filters.createdBy) {
      whereClause.createdBy = filters.createdBy
    }

    if (filters.isPublic !== undefined) {
      whereClause.isPublic = filters.isPublic
    }

    if (filters.recurringType) {
      whereClause.recurringType = filters.recurringType
    }

    // Fetch activities and count
    const [activities, totalCount] = await Promise.all([
      prisma.activity.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              id: true,
              pseudo: true,
              avatar: true
            }
          },
          sessions: {
            where: {
              date: {
                gte: new Date()
              }
            },
            orderBy: {
              date: 'asc'
            },
            take: 5,
            include: {
              participants: {
                select: {
                  userId: true,
                  status: true
                }
              }
            }
          },
          _count: {
            select: {
              sessions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.activity.count({ where: whereClause })
    ])

    // Get user subscriptions
    const userSubscriptions = await prisma.activitySubscription.findMany({
      where: { userId },
      select: { activityId: true }
    })

    const subscribedActivityIds = new Set(userSubscriptions.map(sub => sub.activityId))

    // Enrich activities with stats
    const enrichedActivities = activities.map(activity => {
      const userParticipatesInSessions = activity.sessions.some(session =>
        session.participants.some(p =>
          p.userId === userId && p.status === 'confirmed'
        )
      )

      const isSubscribed = subscribedActivityIds.has(activity.id)

      return {
        ...activity,
        upcomingSessionsCount: activity.sessions.length,
        totalSessionsCount: activity._count.sessions,
        nextSessionDate: activity.sessions[0]?.date || null,
        userStatus: {
          isParticipant: userParticipatesInSessions,
          isSubscribed: isSubscribed
        },
        sessions: activity.sessions.map(session => ({
          ...session,
          confirmedParticipants: session.participants.filter(p => p.status === 'confirmed').length,
          totalParticipants: session.participants.length
        }))
      }
    })

    return {
      activities: enrichedActivities,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }
  }

  /**
   * Get activity by ID
   */
  static async findById(activityId: string, userId?: string) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        creator: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        },
        sessions: {
          where: {
            date: {
              gte: new Date()
            }
          },
          orderBy: {
            date: 'asc'
          },
          include: {
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
        }
      }
    })

    if (!activity) {
      return null
    }

    // Check if user is subscribed
    let isSubscribed = false
    if (userId) {
      const subscription = await prisma.activitySubscription.findFirst({
        where: {
          userId,
          activityId
        }
      })
      isSubscribed = !!subscription
    }

    return {
      ...activity,
      isSubscribed
    }
  }

  /**
   * Update activity
   */
  static async update(activityId: string, userId: string, data: UpdateActivityData) {
    // Check ownership
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if (!activity) {
      throw new Error('Activité non trouvée')
    }

    if (activity.createdBy !== userId) {
      throw new Error('Vous n\'êtes pas autorisé à modifier cette activité')
    }

    // Update activity
    return await prisma.activity.update({
      where: { id: activityId },
      data,
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
  }

  /**
   * Delete activity
   */
  static async delete(activityId: string, userId: string) {
    // Check ownership
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if (!activity) {
      throw new Error('Activité non trouvée')
    }

    if (activity.createdBy !== userId) {
      throw new Error('Vous n\'êtes pas autorisé à supprimer cette activité')
    }

    // Delete activity (cascade will delete sessions and participants)
    await prisma.activity.delete({
      where: { id: activityId }
    })
  }

  /**
   * Subscribe to activity
   */
  static async subscribe(activityId: string, userId: string) {
    // Check if activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if (!activity) {
      throw new Error('Activité non trouvée')
    }

    // Add to user's activity list if not already there
    await prisma.userActivityList.upsert({
      where: {
        userId_activityId: {
          userId,
          activityId
        }
      },
      create: {
        userId,
        activityId
      },
      update: {}
    })

    // Check if already subscribed
    const existing = await prisma.activitySubscription.findFirst({
      where: {
        userId,
        activityId
      }
    })

    if (existing) {
      return existing
    }

    // Create subscription
    const subscription = await prisma.activitySubscription.create({
      data: {
        userId,
        activityId
      }
    })

    return subscription
  }

  /**
   * Unsubscribe from activity
   */
  static async unsubscribe(activityId: string, userId: string) {
    // Delete subscription
    const subscription = await prisma.activitySubscription.findFirst({
      where: {
        userId,
        activityId
      }
    })

    if (subscription) {
      await prisma.activitySubscription.delete({
        where: {
          id: subscription.id
        }
      })
    }

    // Remove user from all future sessions of this activity
    const now = new Date()
    const futureSessions = await prisma.activitySession.findMany({
      where: {
        activityId,
        date: {
          gte: now
        }
      },
      select: {
        id: true
      }
    })

    const sessionIds = futureSessions.map(s => s.id)

    if (sessionIds.length > 0) {
      await prisma.activityParticipant.deleteMany({
        where: {
          userId,
          sessionId: {
            in: sessionIds
          }
        }
      })
    }
  }

  /**
   * Get user's created activities
   */
  static async findByCreator(userId: string) {
    return await prisma.activity.findMany({
      where: { createdBy: userId },
      include: {
        creator: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        },
        sessions: {
          where: {
            date: {
              gte: new Date()
            }
          },
          orderBy: {
            date: 'asc'
          },
          take: 5
        },
        _count: {
          select: {
            sessions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  /**
   * Get user's participations
   */
  static async findUserParticipations(userId: string) {
    const now = new Date()

    // Get all participations
    const participations = await prisma.activityParticipant.findMany({
      where: {
        userId
      },
      include: {
        session: {
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
        }
      },
      orderBy: {
        session: {
          date: 'asc'
        }
      }
    })

    // Separate into upcoming and past
    const upcomingSessions: any[] = []
    const pastSessions: any[] = []

    participations.forEach(participation => {
      const sessionWithStats = {
        ...participation.session,
        stats: {
          confirmedCount: participation.session.participants.filter(p => p.status === 'confirmed').length,
          waitingCount: participation.session.participants.filter(p => p.status === 'waiting').length,
          interestedCount: participation.session.participants.filter(p => p.status === 'interested').length,
          availableSpots: Math.max(0, participation.session.maxPlayers - participation.session.participants.filter(p => p.status === 'confirmed').length)
        },
        userStatus: {
          isParticipant: true,
          canJoin: false,
          participantStatus: participation.status
        }
      }

      if (new Date(participation.session.date) >= now) {
        upcomingSessions.push(sessionWithStats)
      } else {
        pastSessions.push(sessionWithStats)
      }
    })

    return {
      upcoming: upcomingSessions,
      past: pastSessions.reverse() // Most recent first
    }
  }

  /**
   * Find activity by code
   */
  static async findByCode(code: string) {
    const activity = await prisma.activity.findUnique({
      where: { code },
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

    return activity
  }

  /**
   * Join activity by code
   */
  static async joinByCode(userId: string, code: string) {
    // Find activity by code
    const activity = await this.findByCode(code)

    if (!activity) {
      throw new Error('Code d\'activité invalide')
    }

    // Check if user is already subscribed
    const existing = await prisma.activitySubscription.findFirst({
      where: {
        userId,
        activityId: activity.id
      }
    })

    // Check if already in list
    const inList = await prisma.userActivityList.findFirst({
      where: {
        userId,
        activityId: activity.id
      }
    })

    if (existing && inList) {
      return {
        activity,
        alreadyMember: true
      }
    }

    // Add to user's activity list if not already there
    if (!inList) {
      await prisma.userActivityList.create({
        data: {
          userId,
          activityId: activity.id
        }
      })
    }

    // Subscribe to activity if not already subscribed
    if (!existing) {
      await this.subscribe(activity.id, userId)
    }

    return {
      activity,
      alreadyMember: !!existing
    }
  }

  /**
   * Leave activity (remove from user's list)
   * Only allowed if user is not subscribed and is not the creator
   */
  static async leave(activityId: string, userId: string) {
    // Check if activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if (!activity) {
      throw new Error('Activité non trouvée')
    }

    // Don't allow creator to leave their own activity
    if (activity.createdBy === userId) {
      throw new Error('Vous ne pouvez pas quitter une activité que vous avez créée')
    }

    // Check if user is subscribed
    const subscription = await prisma.activitySubscription.findFirst({
      where: {
        userId,
        activityId
      }
    })

    if (subscription) {
      throw new Error('Vous devez d\'abord vous désinscrire de l\'activité')
    }

    // Remove from user's activity list
    await prisma.userActivityList.deleteMany({
      where: {
        userId,
        activityId
      }
    })
  }
}
