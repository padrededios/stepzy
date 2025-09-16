import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/middleware/auth'
import { prisma } from '../../../../lib/database'

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    if (!context.user || context.user.role !== 'root') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    try {
      const url = new URL(req.url)
      const range = url.searchParams.get('range') || '7d'
      
      // Calculate date range
      const now = new Date()
      let startDate: Date
      
      switch (range) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '3m':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      }

      // Get user statistics
      const [totalUsers, activeUsers, adminUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            sessions: {
              some: {
                expiresAt: {
                  gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
                }
              }
            }
          }
        }),
        prisma.user.count({ where: { role: 'root' } })
      ])

      // Get match statistics
      const [
        totalMatches,
        openMatches,
        fullMatches,
        completedMatches,
        cancelledMatches
      ] = await Promise.all([
        prisma.match.count(),
        prisma.match.count({ where: { status: 'open' } }),
        prisma.match.count({ where: { status: 'full' } }),
        prisma.match.count({ where: { status: 'completed' } }),
        prisma.match.count({ where: { status: 'cancelled' } })
      ])

      // Get activity statistics
      const totalPlayers = await prisma.matchPlayer.count({
        where: { status: 'confirmed' }
      })

      const avgPlayersPerMatch = totalMatches > 0 
        ? Math.round((totalPlayers / totalMatches) * 10) / 10 
        : 0

      // Get most active user
      const mostActiveUserData = await prisma.user.findFirst({
        select: {
          pseudo: true,
          _count: {
            select: { matchPlayers: true }
          }
        },
        orderBy: {
          matchPlayers: { _count: 'desc' }
        }
      })

      // Get recent activity (last 10 activities in date range)
      const recentActivity = await prisma.matchPlayer.findMany({
        where: {
          joinedAt: { gte: startDate }
        },
        include: {
          user: {
            select: { pseudo: true }
          },
          match: {
            select: { date: true }
          }
        },
        orderBy: { joinedAt: 'desc' },
        take: 10
      })

      // Transform recent activity data
      const formattedActivity = recentActivity.map((activity: { id: any; status: string; user: { pseudo: any }; match: { date: any }; joinedAt: any }) => ({
        id: activity.id,
        type: activity.status === 'confirmed' ? 'match_join' : 'match_leave',
        user: { pseudo: activity.user.pseudo },
        match: { date: activity.match.date },
        timestamp: activity.joinedAt
      }))

      const statistics = {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers
        },
        matches: {
          total: totalMatches,
          open: openMatches,
          full: fullMatches,
          completed: completedMatches,
          cancelled: cancelledMatches
        },
        activity: {
          totalPlayers,
          averagePlayersPerMatch: avgPlayersPerMatch,
          mostActiveUser: mostActiveUserData ? {
            pseudo: mostActiveUserData.pseudo,
            matchCount: mostActiveUserData._count.matchPlayers
          } : null
        },
        recentActivity: formattedActivity
      }

      return NextResponse.json({
        success: true,
        data: statistics
      })
    } catch (error) {
      console.error('Error fetching statistics:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}