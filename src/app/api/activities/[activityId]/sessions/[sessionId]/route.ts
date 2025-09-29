import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'
import { ActivityParticipationService } from '@/lib/services/activity-participation.service'
import { z } from 'zod'

interface Params {
  activityId: string
  sessionId: string
}

const updateSessionSchema = z.object({
  maxPlayers: z.number().min(2).max(30).optional(),
  isCancelled: z.boolean().optional()
})

/**
 * GET /api/activities/[activityId]/sessions/[sessionId] - Récupérer une session spécifique
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

    const { activityId, sessionId } = context.params

    const activitySession = await prisma.activitySession.findFirst({
      where: {
        id: sessionId,
        activityId: activityId
      },
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
          },
          orderBy: [
            { status: 'asc' }, // confirmed d'abord, puis waiting
            { joinedAt: 'asc' }
          ]
        }
      }
    })

    if (!activitySession) {
      return NextResponse.json(
        { success: false, error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    // Enrichir avec les statistiques
    const confirmedParticipants = activitySession.participants.filter(p => p.status === 'confirmed')
    const waitingParticipants = activitySession.participants.filter(p => p.status === 'waiting')
    const userParticipation = activitySession.participants.find(p => p.userId === session.user.id)

    const enrichedSession = {
      ...activitySession,
      stats: {
        confirmedCount: confirmedParticipants.length,
        waitingCount: waitingParticipants.length,
        totalCount: activitySession.participants.length,
        availableSpots: Math.max(0, activitySession.maxPlayers - confirmedParticipants.length)
      },
      userStatus: userParticipation ? {
        isParticipant: true,
        status: userParticipation.status,
        joinedAt: userParticipation.joinedAt
      } : {
        isParticipant: false,
        canJoin: confirmedParticipants.length < activitySession.maxPlayers || true
      },
      isOwner: activitySession.activity.createdBy === session.user.id
    }

    return NextResponse.json({
      success: true,
      data: enrichedSession
    })

  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la session' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/activities/[activityId]/sessions/[sessionId] - Modifier une session (créateur seulement)
 */
export async function PUT(
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

    const { activityId, sessionId } = context.params

    // Vérifier que l'utilisateur est le créateur de l'activité
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if (!activity) {
      return NextResponse.json(
        { success: false, error: 'Activité non trouvée' },
        { status: 404 }
      )
    }

    if (activity.createdBy !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Seul le créateur de l\'activité peut modifier ses sessions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateSessionSchema.parse(body)

    // Mettre à jour la session
    const updatedSession = await prisma.activitySession.update({
      where: {
        id: sessionId
      },
      data: validatedData,
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
    })

    // Si le nombre max de joueurs a changé, ajuster les statuts des participants
    if (validatedData.maxPlayers) {
      await ActivityParticipationService.processInterestedParticipants(sessionId)
    }

    // Récupérer les stats mises à jour
    const stats = await ActivityParticipationService.getSessionStats(sessionId)

    return NextResponse.json({
      success: true,
      data: {
        session: updatedSession,
        stats
      },
      message: 'Session mise à jour avec succès'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Erreur lors de la modification de la session:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification de la session' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/activities/[activityId]/sessions/[sessionId] - Supprimer une session (créateur seulement)
 */
export async function DELETE(
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

    const { activityId, sessionId } = context.params

    // Vérifier que l'utilisateur est le créateur de l'activité
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if (!activity) {
      return NextResponse.json(
        { success: false, error: 'Activité non trouvée' },
        { status: 404 }
      )
    }

    if (activity.createdBy !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Seul le créateur de l\'activité peut supprimer ses sessions' },
        { status: 403 }
      )
    }

    // Récupérer la session pour notifier les participants
    const activitySession = await prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    })

    if (!activitySession) {
      return NextResponse.json(
        { success: false, error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    // Marquer comme annulée plutôt que de supprimer
    await prisma.activitySession.update({
      where: { id: sessionId },
      data: {
        isCancelled: true,
        status: 'cancelled'
      }
    })

    // TODO: Envoyer des notifications d'annulation aux participants

    return NextResponse.json({
      success: true,
      message: 'Session annulée avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la session:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'annulation de la session' },
      { status: 500 }
    )
  }
}