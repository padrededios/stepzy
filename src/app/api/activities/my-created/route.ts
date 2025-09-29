import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'

/**
 * GET /api/activities/my-created - Récupérer les activités créées par l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'

    // Récupérer les activités créées par l'utilisateur
    const activities = await prisma.activity.findMany({
      where: {
        createdBy: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        },
        sessions: includeStats ? {
          include: {
            participants: {
              select: {
                status: true,
                joinedAt: true
              }
            }
          }
        } : {
          where: {
            date: {
              gte: new Date()
            }
          },
          orderBy: {
            date: 'asc'
          },
          take: 3,
          include: {
            participants: {
              select: {
                status: true
              }
            }
          }
        },
        _count: includeStats ? {
          select: {
            sessions: true
          }
        } : undefined
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Enrichir avec les statistiques si demandées
    const enrichedActivities = activities.map(activity => {
      const upcomingSessions = activity.sessions.filter(s => s.date >= new Date())
      const nextSession = upcomingSessions[0] || null

      let stats = {}
      if (includeStats) {
        const allParticipants = activity.sessions.flatMap(s => s.participants)
        const totalParticipations = allParticipants.length
        const averageParticipation = activity.sessions.length > 0
          ? Math.round((totalParticipations / activity.sessions.length) * 100) / 100
          : 0

        stats = {
          totalSessions: activity._count?.sessions || activity.sessions.length,
          upcomingSessions: upcomingSessions.length,
          totalParticipants: new Set(allParticipants.map(p => p.userId)).size,
          totalParticipations,
          averageParticipation
        }
      }

      return {
        ...activity,
        nextSessionDate: nextSession?.date || null,
        upcomingSessionsCount: upcomingSessions.length,
        recentSessions: activity.sessions.slice(0, 3).map(session => ({
          ...session,
          confirmedParticipants: session.participants.filter(p => p.status === 'confirmed').length,
          totalParticipants: session.participants.length,
          availableSpots: session.maxPlayers - session.participants.filter(p => p.status === 'confirmed').length
        })),
        ...stats
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        activities: enrichedActivities,
        totalCount: activities.length
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des activités créées:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des activités créées' },
      { status: 500 }
    )
  }
}