/**
 * Admin Service - Business logic for admin operations
 */

import { prisma } from '../database/prisma'

export class AdminService {
  /**
   * Get all users with pagination and filters
   */
  static async getUsers(filters: {
    page?: number
    limit?: number
    search?: string
    role?: 'user' | 'root'
  }) {
    const { page = 1, limit = 20, search, role } = filters
    const skip = (page - 1) * Math.min(limit, 100)

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { pseudo: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role && (role === 'user' || role === 'root')) {
      where.role = role
    }

    // Fetch users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          pseudo: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              activityParticipations: true,
              createdActivities: true
            }
          }
        },
        skip,
        take: Math.min(limit, 100),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

  /**
   * Update user (admin only)
   */
  static async updateUser(userId: string, data: {
    pseudo?: string
    email?: string
    role?: 'user' | 'root'
    avatar?: string | null
  }) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        pseudo: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(userId: string) {
    await prisma.user.delete({
      where: { id: userId }
    })
  }

  /**
   * Get platform statistics
   */
  static async getStatistics() {
    const [
      totalUsers,
      totalActivities,
      totalSessions,
      totalParticipations,
      activeUsers,
      recentActivities
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total activities
      prisma.activity.count(),

      // Total sessions
      prisma.activitySession.count(),

      // Total participations
      prisma.activityParticipant.count(),

      // Active users (participated in last 30 days)
      prisma.user.count({
        where: {
          activityParticipations: {
            some: {
              joinedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      }),

      // Recent activities (last 7 days)
      prisma.activity.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    })

    // Activities by sport
    const activitiesBySport = await prisma.activity.groupBy({
      by: ['sport'],
      _count: true
    })

    // Sessions by status
    const sessionsByStatus = await prisma.activitySession.groupBy({
      by: ['status'],
      _count: true
    })

    return {
      overview: {
        totalUsers,
        totalActivities,
        totalSessions,
        totalParticipations,
        activeUsers,
        recentActivities
      },
      breakdown: {
        usersByRole: usersByRole.map(item => ({
          role: item.role,
          count: item._count
        })),
        activitiesBySport: activitiesBySport.map(item => ({
          sport: item.sport,
          count: item._count
        })),
        sessionsByStatus: sessionsByStatus.map(item => ({
          status: item.status,
          count: item._count
        }))
      }
    }
  }

  /**
   * Get recent activity logs (simplified version)
   */
  static async getActivityLogs(limit: number = 50) {
    // Get recent sessions created
    const recentSessions = await prisma.activitySession.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        activity: {
          select: {
            name: true,
            sport: true
          }
        }
      }
    })

    // Get recent participations
    const recentParticipations = await prisma.activityParticipant.findMany({
      take: limit,
      orderBy: { joinedAt: 'desc' },
      include: {
        user: {
          select: {
            pseudo: true
          }
        },
        session: {
          include: {
            activity: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return {
      recentSessions,
      recentParticipations
    }
  }
}
