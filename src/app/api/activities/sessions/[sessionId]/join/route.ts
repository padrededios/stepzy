import { NextRequest, NextResponse } from 'next/server'
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
    const { prisma } = await import('@/lib/database/prisma')
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

    const { sessionId } = context.params

    // Vérifier si l'utilisateur peut rejoindre la session
    const canJoin = await ActivityParticipationService.canUserJoinSession(sessionId, user.id)

    if (!canJoin.canJoin) {
      return NextResponse.json(
        { success: false, error: canJoin.reason },
        { status: 400 }
      )
    }

    // Rejoindre la session
    const participation = await ActivityParticipationService.joinSession(sessionId, user.id)

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
    const { prisma } = await import('@/lib/database/prisma')
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

    const { sessionId } = context.params

    // Quitter la session
    await ActivityParticipationService.leaveSession(sessionId, user.id)

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