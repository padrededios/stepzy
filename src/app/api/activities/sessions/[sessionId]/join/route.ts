import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ActivityParticipationService } from '@/lib/services/activity-participation.service'

interface Params {
  sessionId: string
}

/**
 * POST /api/activities/sessions/[sessionId]/join - Rejoindre une session
 */
export async function POST(
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

    const { sessionId } = context.params

    // Vérifier si l'utilisateur peut rejoindre la session
    const canJoin = await ActivityParticipationService.canUserJoinSession(sessionId, session.user.id)

    if (!canJoin.canJoin) {
      return NextResponse.json(
        { success: false, error: canJoin.reason },
        { status: 400 }
      )
    }

    // Rejoindre la session
    const participation = await ActivityParticipationService.joinSession(sessionId, session.user.id)

    // Récupérer les stats mises à jour
    const stats = await ActivityParticipationService.getSessionStats(sessionId)

    return NextResponse.json({
      success: true,
      data: {
        participation: {
          id: participation.id,
          status: participation.status,
          joinedAt: participation.joinedAt
        },
        sessionStats: stats,
        message: participation.status === 'confirmed'
          ? 'Inscription confirmée !'
          : 'Ajouté à la liste d\'attente'
      }
    })

  } catch (error) {
    console.error('Erreur lors de l\'inscription à la session:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'inscription à la session' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/activities/sessions/[sessionId]/join - Quitter une session
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

    const { sessionId } = context.params

    // Quitter la session
    await ActivityParticipationService.leaveSession(sessionId, session.user.id)

    // Récupérer les stats mises à jour
    const stats = await ActivityParticipationService.getSessionStats(sessionId)

    return NextResponse.json({
      success: true,
      data: {
        sessionStats: stats,
        message: 'Désinscription réussie'
      }
    })

  } catch (error) {
    console.error('Erreur lors de la désinscription de la session:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur lors de la désinscription' },
      { status: 500 }
    )
  }
}