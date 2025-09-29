import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ActivitySessionService } from '@/lib/services/activity-session.service'
import { z } from 'zod'

const querySchema = z.object({
  sport: z.string().optional(),
  weeksAhead: z.string().transform(val => parseInt(val) || 2).optional(),
  availableOnly: z.string().transform(val => val === 'true').optional()
})

/**
 * GET /api/activities/upcoming-sessions - Récupérer toutes les sessions à venir
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
    const query = querySchema.parse({
      sport: searchParams.get('sport'),
      weeksAhead: searchParams.get('weeksAhead'),
      availableOnly: searchParams.get('availableOnly')
    })

    const weeksAhead = query.weeksAhead || 2
    const sportFilter = query.sport
    const availableOnly = query.availableOnly || false

    let sessions
    if (availableOnly) {
      // Récupérer uniquement les sessions avec des places disponibles
      sessions = await ActivitySessionService.getAvailableSessions(weeksAhead, sportFilter)
    } else {
      // Récupérer toutes les sessions à venir
      const { prisma } = await import('@/lib/database/prisma')
      const { addWeeks } = await import('date-fns')

      const now = new Date()
      const endDate = addWeeks(now, weeksAhead)

      const whereClause: any = {
        date: {
          gte: now,
          lte: endDate
        },
        status: 'active',
        isCancelled: false
      }

      if (sportFilter) {
        whereClause.activity = {
          sport: sportFilter
        }
      }

      sessions = await prisma.activitySession.findMany({
        where: whereClause,
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
          },
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
        },
        orderBy: {
          date: 'asc'
        }
      })
    }

    // Enrichir les sessions avec les statistiques et le statut utilisateur
    const enrichedSessions = sessions.map(session => {
      const confirmedParticipants = session.participants.filter(p => p.status === 'confirmed')
      const waitingParticipants = session.participants.filter(p => p.status === 'waiting')
      const userParticipation = session.participants.find(p => p.userId === session.user.id)

      return {
        id: session.id,
        date: session.date,
        maxPlayers: session.maxPlayers,
        isCancelled: session.isCancelled,
        activity: {
          id: session.activity.id,
          name: session.activity.name,
          description: session.activity.description,
          sport: session.activity.sport,
          creator: session.activity.creator
        },
        participants: {
          confirmed: confirmedParticipants.map(p => ({
            id: p.id,
            user: p.user,
            joinedAt: p.joinedAt
          })),
          waiting: waitingParticipants.map(p => ({
            id: p.id,
            user: p.user,
            joinedAt: p.joinedAt
          }))
        },
        stats: {
          confirmedCount: confirmedParticipants.length,
          waitingCount: waitingParticipants.length,
          totalCount: session.participants.length,
          availableSpots: Math.max(0, session.maxPlayers - confirmedParticipants.length)
        },
        userStatus: userParticipation ? {
          isParticipant: true,
          status: userParticipation.status,
          joinedAt: userParticipation.joinedAt
        } : {
          isParticipant: false,
          canJoin: confirmedParticipants.length < session.maxPlayers || true // Peut toujours rejoindre (liste d'attente)
        }
      }
    })

    // Grouper par activité pour une meilleure présentation
    const groupedByActivity = enrichedSessions.reduce((acc, session) => {
      const activityId = session.activity.id
      if (!acc[activityId]) {
        acc[activityId] = {
          activity: session.activity,
          sessions: []
        }
      }
      acc[activityId].sessions.push(session)
      return acc
    }, {} as Record<string, any>)

    const groupedActivities = Object.values(groupedByActivity)

    return NextResponse.json({
      success: true,
      data: {
        sessions: enrichedSessions,
        groupedByActivity: groupedActivities,
        totalSessions: enrichedSessions.length,
        weeksAhead,
        filters: {
          sport: sportFilter,
          availableOnly
        }
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Paramètres de requête invalides' },
        { status: 400 }
      )
    }

    console.error('Erreur lors de la récupération des sessions à venir:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des sessions à venir' },
      { status: 500 }
    )
  }
}