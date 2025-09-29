import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

/**
 * DELETE /api/activities/sessions/[sessionId]/leave - Quitter une session d'activité
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
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
    const { sessionId } = await params

    // Vérifier que la session d'activité existe
    const activitySession = await prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: {
        activity: true
      }
    })

    if (!activitySession) {
      return NextResponse.json(
        { success: false, error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur participe à cette session
    const participation = await prisma.activityParticipant.findFirst({
      where: {
        sessionId: sessionId,
        userId: user.id
      }
    })

    if (!participation) {
      return NextResponse.json(
        { success: false, error: 'Vous ne participez pas à cette session' },
        { status: 400 }
      )
    }

    // Supprimer la participation
    await prisma.activityParticipant.delete({
      where: {
        id: participation.id
      }
    })

    // Promouvoir le premier utilisateur en liste d'attente si nécessaire
    const confirmedCount = await prisma.activityParticipant.count({
      where: {
        sessionId: sessionId,
        status: 'confirmed'
      }
    })

    if (confirmedCount < activitySession.maxPlayers) {
      const nextWaiting = await prisma.activityParticipant.findFirst({
        where: {
          sessionId: sessionId,
          status: 'waiting'
        },
        orderBy: {
          joinedAt: 'asc'
        }
      })

      if (nextWaiting) {
        await prisma.activityParticipant.update({
          where: { id: nextWaiting.id },
          data: { status: 'confirmed' }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Vous avez quitté la session avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la désinscription de la session:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la désinscription de la session' },
      { status: 500 }
    )
  }
}