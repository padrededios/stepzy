import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { ActivitySessionService } from '@/lib/services/activity-session.service'
import { CreateActivityData, ActivityFilters } from '@/types/activity'
import { z } from 'zod'

// Schema de validation pour la création d'activité
const createActivitySchema = z.object({
  name: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
  description: z.string().optional(),
  sport: z.enum(['football', 'badminton', 'volley', 'pingpong', 'rugby']),
  maxPlayers: z.number().min(2).max(20),
  recurringDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  recurringType: z.enum(['weekly', 'monthly'])
})

// Schema de validation pour les filtres
const filtersSchema = z.object({
  sport: z.string().optional(),
  createdBy: z.string().optional(),
  isPublic: z.string().transform(val => val === 'true').optional(),
  recurringType: z.enum(['weekly', 'monthly']).optional()
})

/**
 * POST /api/activities - Créer une nouvelle activité
 */
export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get('cookie')
    let sessionToken = null

    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

      sessionToken = cookies['futsal.session-token']
    }

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Find session in database
    const sessionData = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: true
      }
    })

    if (!sessionData || sessionData.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = sessionData.user

    const body = await request.json()

    // Validation des données
    const validatedData = createActivitySchema.parse(body)

    // Vérifications métier
    if (validatedData.recurringDays.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vous devez sélectionner au moins un jour de la semaine' },
        { status: 400 }
      )
    }

    // Créer l'activité
    const activity = await prisma.activity.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        sport: validatedData.sport,
        maxPlayers: validatedData.maxPlayers,
        createdBy: user.id,
        recurringDays: validatedData.recurringDays,
        recurringType: validatedData.recurringType,
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

    // Générer les premières sessions (2 semaines à l'avance)
    await ActivitySessionService.generateSessions(activity.id, new Date(), 2)

    // Récupérer l'activité avec ses sessions
    const activityWithSessions = await prisma.activity.findUnique({
      where: { id: activity.id },
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
          take: 10
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: activityWithSessions,
      message: `Activité "${activity.name}" créée avec succès`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Erreur lors de la création de l\'activité:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de l\'activité' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/activities - Récupérer les activités avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get('cookie')
    let sessionToken = null

    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

      sessionToken = cookies['futsal.session-token']
    }

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Find session in database
    const sessionData = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: true
      }
    })

    if (!sessionData || sessionData.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = sessionData.user
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Parsing des filtres (optionnels)
    const filters = {
      sport: searchParams.get('sport'),
      createdBy: searchParams.get('createdBy'),
      isPublic: searchParams.get('isPublic') ? searchParams.get('isPublic') === 'true' : undefined,
      recurringType: searchParams.get('recurringType') as 'weekly' | 'monthly' | undefined
    }

    // Construire la clause where
    const whereClause: any = {}

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

    // Récupérer les activités
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
      prisma.activity.count({
        where: whereClause
      })
    ])

    // Récupérer les abonnements de l'utilisateur
    const userSubscriptions = await prisma.activitySubscription.findMany({
      where: {
        userId: user.id
      },
      select: {
        activityId: true
      }
    })

    const subscribedActivityIds = new Set(userSubscriptions.map(sub => sub.activityId))

    // Enrichir les données avec les statistiques
    const enrichedActivities = activities.map(activity => {
      // Vérifier si l'utilisateur participe à au moins une session
      const userParticipatesInSessions = activity.sessions.some(session =>
        session.participants.some(participant =>
          participant.userId === user.id && participant.status === 'confirmed'
        )
      )

      // Vérifier si l'utilisateur est abonné à l'activité
      const isSubscribed = subscribedActivityIds.has(activity.id)

      return {
        ...activity,
        upcomingSessionsCount: activity.sessions.length,
        totalSessionsCount: activity._count.sessions,
        nextSessionDate: activity.sessions[0]?.date || null,
        userStatus: {
          isParticipant: userParticipatesInSessions || isSubscribed,
          isSubscribed: isSubscribed
        },
        sessions: activity.sessions.map(session => ({
          ...session,
          confirmedParticipants: session.participants.filter(p => p.status === 'confirmed').length,
          totalParticipants: session.participants.length
        }))
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        activities: enrichedActivities,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des activités' },
      { status: 500 }
    )
  }
}