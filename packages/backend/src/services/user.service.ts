/**
 * User Service - Business logic for users
 */

import { prisma } from '../database/prisma'

export class UserService {
  /**
   * Get user profile by ID
   */
  static async findById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
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
   * Update user profile
   */
  static async updateProfile(userId: string, data: { pseudo?: string; email?: string; avatar?: string | null }) {
    const { pseudo, email, avatar } = data

    // Validate required fields
    if (!pseudo || !email) {
      throw new Error('Pseudo et email sont obligatoires')
    }

    // Check if pseudo is taken by another user
    if (pseudo) {
      const existingUser = await prisma.user.findFirst({
        where: {
          pseudo,
          id: { not: userId }
        }
      })

      if (existingUser) {
        throw new Error('Ce pseudo est déjà utilisé')
      }
    }

    // Check if email is taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      })

      if (existingUser) {
        throw new Error('Cet email est déjà utilisé')
      }
    }

    // Update user
    return await prisma.user.update({
      where: { id: userId },
      data: {
        pseudo,
        email,
        avatar,
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
   * Get user statistics
   */
  static async getStats(userId: string) {
    // Get user's activity participations
    const participations = await prisma.activityParticipant.findMany({
      where: {
        userId
      },
      include: {
        session: {
          select: {
            date: true,
            status: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    })

    // Calculate statistics
    const totalSessions = participations.length
    const completedSessions = participations.filter(p =>
      p.session.status === 'completed'
    ).length
    const cancelledSessions = participations.filter(p =>
      p.session.status === 'cancelled'
    ).length
    const activeSessions = participations.filter(p =>
      p.session.status === 'active' && new Date(p.session.date) > new Date()
    ).length

    const attendanceRate = totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0

    // Calculate favorite time slot
    const timeSlots = participations.map(p => {
      const hour = new Date(p.session.date).getHours()
      const minute = new Date(p.session.date).getMinutes()
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    })

    const timeSlotCounts: { [key: string]: number } = {}
    timeSlots.forEach(slot => {
      timeSlotCounts[slot] = (timeSlotCounts[slot] || 0) + 1
    })

    const favoriteTime = Object.keys(timeSlotCounts).length > 0
      ? Object.keys(timeSlotCounts).reduce((a, b) =>
          timeSlotCounts[a] > timeSlotCounts[b] ? a : b
        )
      : '12:00'

    // Calculate streaks
    const sortedSessions = participations
      .filter(p => p.session.status === 'completed')
      .sort((a, b) => new Date(a.session.date).getTime() - new Date(b.session.date).getTime())

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Calculate current streak
    const recentSessions = sortedSessions.slice().reverse()
    for (let i = 0; i < recentSessions.length; i++) {
      currentStreak++
      if (i >= 2) break
    }

    // Calculate longest streak
    for (let i = 0; i < sortedSessions.length; i++) {
      tempStreak++
      if (i === sortedSessions.length - 1 || Math.abs(
        new Date(sortedSessions[i + 1].session.date).getTime() -
        new Date(sortedSessions[i].session.date).getTime()
      ) > 7 * 24 * 60 * 60 * 1000) {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 0
      }
    }

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      activeSessions,
      attendanceRate,
      favoriteTime,
      currentStreak: Math.min(currentStreak, completedSessions),
      longestStreak: Math.max(longestStreak, currentStreak)
    }
  }

  /**
   * Get user's activities
   */
  static async getUserActivities(userId: string) {
    const participations = await prisma.activityParticipant.findMany({
      where: {
        userId,
        session: {
          date: {
            gte: new Date()
          }
        }
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

    return participations.map(p => p.session)
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(userId: string, preferences: any) {
    // In a real app, you'd have a preferences table
    // For now, we'll just return success
    return {
      userId,
      preferences,
      updatedAt: new Date()
    }
  }
}
