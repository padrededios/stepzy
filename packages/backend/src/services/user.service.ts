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
   * Get user statistics (enhanced with sport breakdown and monthly activity)
   */
  static async getStats(userId: string) {
    // Get user's activity participations with activity details for sport breakdown
    const participations = await prisma.activityParticipant.findMany({
      where: {
        userId
      },
      include: {
        session: {
          select: {
            date: true,
            status: true,
            activity: {
              select: {
                sport: true,
                startTime: true,
                endTime: true
              }
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    })

    // Filter only completed sessions for stats (sessions that have been played)
    const completedParticipations = participations.filter(p => p.session.status === 'completed')

    // Calculate basic statistics based on completed sessions only
    const totalSessions = completedParticipations.length
    const completedSessions = totalSessions
    const cancelledSessions = participations.filter(p =>
      p.session.status === 'cancelled'
    ).length
    const activeSessions = participations.filter(p =>
      p.session.status === 'active' && new Date(p.session.date) > new Date()
    ).length

    // Attendance rate: completed vs (completed + cancelled) - excludes future sessions
    const pastSessions = completedSessions + cancelledSessions
    const attendanceRate = pastSessions > 0
      ? Math.round((completedSessions / pastSessions) * 100)
      : 0

    // Calculate favorite time slot (based on completed sessions only)
    const timeSlots = completedParticipations.map(p => {
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

    // Calculate streaks (sessions within 7 days of each other)
    const sortedSessions = completedParticipations
      .slice()
      .sort((a, b) => new Date(a.session.date).getTime() - new Date(b.session.date).getTime())

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Calculate current streak from most recent sessions
    const recentSessions = sortedSessions.slice().reverse()
    for (let i = 0; i < recentSessions.length; i++) {
      currentStreak++
      if (i < recentSessions.length - 1) {
        const gap = new Date(recentSessions[i].session.date).getTime() -
          new Date(recentSessions[i + 1].session.date).getTime()
        if (gap > 7 * 24 * 60 * 60 * 1000) break
      }
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

    currentStreak = Math.min(currentStreak, completedSessions)
    longestStreak = Math.max(longestStreak, currentStreak)

    // Calculate total hours from activity start/end times
    const calculateHours = (startTime: string, endTime: string): number => {
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = endTime.split(':').map(Number)
      return Math.max(0, (endH + endM / 60) - (startH + startM / 60))
    }

    const totalHours = Math.round(
      completedParticipations
        .reduce((sum, p) => sum + calculateHours(p.session.activity.startTime, p.session.activity.endTime), 0)
    )

    // Calculate sport-specific statistics (based on completed sessions only)
    const sportMap: Record<string, { completed: number; hours: number }> = {}
    for (const p of completedParticipations) {
      const sport = p.session.activity.sport
      if (!sportMap[sport]) {
        sportMap[sport] = { completed: 0, hours: 0 }
      }
      sportMap[sport].completed++
      sportMap[sport].hours += calculateHours(p.session.activity.startTime, p.session.activity.endTime)
    }

    const sportStats = Object.entries(sportMap).map(([sport, data]) => ({
      sport,
      totalMatches: data.completed,
      completedMatches: data.completed,
      cancelledMatches: 0,
      hoursPlayed: Math.round(data.hours)
    })).sort((a, b) => b.totalMatches - a.totalMatches)

    // Calculate monthly activity (last 6 months, completed sessions only)
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const now = new Date()
    const monthlyActivity: Array<{ month: string; matches: number }> = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const count = completedParticipations.filter(p => {
        const pDate = new Date(p.session.date)
        return pDate.getFullYear() === d.getFullYear() && pDate.getMonth() === d.getMonth()
      }).length
      monthlyActivity.push({
        month: monthNames[d.getMonth()],
        matches: count
      })
    }

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      activeSessions,
      attendanceRate,
      favoriteTime,
      currentStreak,
      longestStreak,
      totalHours,
      sportStats,
      monthlyActivity,
      uniqueSports: Object.keys(sportMap).length
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
