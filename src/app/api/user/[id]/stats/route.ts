import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/middleware/auth'
import { prisma } from '../../../../../lib/database/prisma'

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return requireAuth(request, async (req, context) => {
    try {
      const { id } = await params

      // Users can only view their own stats unless they are admin
      if (!context.user || (context.user.id !== id && context.user.role !== 'root')) {
        return NextResponse.json({
          success: false,
          error: 'Accès non autorisé'
        }, { status: 403 })
      }

      // Get user's match statistics
      const matchPlayers = await prisma.matchPlayer.findMany({
        where: {
          userId: id
        },
        include: {
          match: {
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
      const totalMatches = matchPlayers.length
      const completedMatches = matchPlayers.filter(mp => 
        mp.match.status === 'completed'
      ).length
      const cancelledMatches = matchPlayers.filter(mp => 
        mp.match.status === 'cancelled'
      ).length

      const attendanceRate = totalMatches > 0 
        ? Math.round((completedMatches / totalMatches) * 100)
        : 0

      // Calculate favorite time slot (most common hour)
      const timeSlots = matchPlayers.map(mp => {
        const hour = new Date(mp.match.date).getHours()
        const minute = new Date(mp.match.date).getMinutes()
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
        : '12:30'

      // Calculate streaks
      const sortedMatches = matchPlayers
        .filter(mp => mp.match.status === 'completed')
        .sort((a, b) => new Date(a.match.date).getTime() - new Date(b.match.date).getTime())

      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0

      // Calculate current streak (from most recent backwards)
      const recentMatches = sortedMatches.slice().reverse()
      for (let i = 0; i < recentMatches.length; i++) {
        currentStreak++
        // In a real app, we'd check for consecutive weeks/days
        // For now, we'll just count recent completed matches
        if (i >= 2) break // Limit to recent matches
      }

      // Calculate longest streak
      for (let i = 0; i < sortedMatches.length; i++) {
        tempStreak++
        if (i === sortedMatches.length - 1 || Math.abs(
          new Date(sortedMatches[i + 1].match.date).getTime() - 
          new Date(sortedMatches[i].match.date).getTime()
        ) > 7 * 24 * 60 * 60 * 1000) { // More than 1 week gap
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 0
        }
      }

      const stats = {
        totalMatches,
        completedMatches,
        cancelledMatches,
        attendanceRate,
        favoriteTime,
        currentStreak: Math.min(currentStreak, completedMatches),
        longestStreak: Math.max(longestStreak, currentStreak)
      }

      return NextResponse.json({
        success: true,
        data: { stats }
      })

    } catch (error) {
      console.error('User stats error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du chargement des statistiques'
      }, { status: 500 })
    }
  })
}