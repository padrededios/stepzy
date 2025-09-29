import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'
import { addWeeks, startOfDay, endOfDay } from 'date-fns'
import { z } from 'zod'

interface Params {
  activityId: string
}

const querySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50)).optional(),
  status: z.enum(['active', 'cancelled', 'completed']).optional(),
  dateFrom: z.string().transform(val => val ? new Date(val) : undefined).optional(),
  dateTo: z.string().transform(val => val ? new Date(val) : undefined).optional(),
  includeParticipants: z.string().transform(val => val === 'true').optional()
})

/**
 * GET /api/activities/[activityId]/sessions - Récupérer les sessions d'une activité
 */
export async function GET(
  request: NextRequest,
  context: { params: Params }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { activityId } = context.params
    const { searchParams } = new URL(request.url)

    // Validation des paramètres de requête
    const query = querySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      includeParticipants: searchParams.get('includeParticipants')
    })

    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit

    // Vérifier que l'activité existe
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
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

    if (!activity) {
      return NextResponse.json(
        { success: false, error: 'Activité non trouvée' },
        { status: 404 }
      )
    }

    // Construire la clause WHERE
    const whereClause: any = {
      activityId: activityId
    }

    if (query.status) {
      whereClause.status = query.status
    }

    if (query.dateFrom || query.dateTo) {
      whereClause.date = {}
      if (query.dateFrom) {
        whereClause.date.gte = startOfDay(query.dateFrom)
      }
      if (query.dateTo) {
        whereClause.date.lte = endOfDay(query.dateTo)
      }
    }

    // Récupérer les sessions avec pagination
    const [sessions, totalCount] = await Promise.all([
      prisma.activitySession.findMany({
        where: whereClause,
        include: query.includeParticipants ? {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  pseudo: true,
                  avatar: true
                }
              }
            },
            orderBy: [
              { status: 'asc' },
              { joinedAt: 'asc' }
            ]
          }
        } : {
          participants: {
            select: {
              status: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.activitySession.count({
        where: whereClause
      })
    ])

    // Enrichir les sessions avec les statistiques
    const enrichedSessions = sessions.map(sessionItem => {
      const confirmedCount = sessionItem.participants.filter(p => p.status === 'confirmed').length
      const waitingCount = sessionItem.participants.filter(p => p.status === 'waiting').length
      const totalParticipants = sessionItem.participants.length
      const availableSpots = Math.max(0, sessionItem.maxPlayers - confirmedCount)

      const userParticipation = query.includeParticipants
        ? sessionItem.participants.find((p: any) => p.userId === session.user.id)
        : null

      return {
        id: sessionItem.id,
        date: sessionItem.date,
        status: sessionItem.status,
        maxPlayers: sessionItem.maxPlayers,
        isCancelled: sessionItem.isCancelled,
        createdAt: sessionItem.createdAt,
        updatedAt: sessionItem.updatedAt,
        stats: {
          confirmedCount,
          waitingCount,
          totalParticipants,
          availableSpots
        },
        participants: query.includeParticipants ? sessionItem.participants : undefined,
        userStatus: userParticipation ? {
          isParticipant: true,
          status: userParticipation.status,
          joinedAt: userParticipation.joinedAt
        } : {
          isParticipant: false,
          canJoin: confirmedCount < sessionItem.maxPlayers || sessionItem.status === 'active'
        }
      }
    })

    // Calculer les statistiques globales
    const now = new Date()
    const upcomingSessions = enrichedSessions.filter(s => s.date >= now && s.status === 'active')
    const pastSessions = enrichedSessions.filter(s => s.date < now)

    return NextResponse.json({
      success: true,
      data: {
        activity,
        sessions: enrichedSessions,
        statistics: {
          totalSessions: totalCount,
          upcomingSessions: upcomingSessions.length,
          pastSessions: pastSessions.length,
          cancelledSessions: enrichedSessions.filter(s => s.isCancelled).length
        },
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        isOwner: activity.createdBy === session.user.id
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Paramètres de requête invalides' },
        { status: 400 }
      )
    }

    console.error('Erreur lors de la récupération des sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des sessions' },
      { status: 500 }
    )
  }
}