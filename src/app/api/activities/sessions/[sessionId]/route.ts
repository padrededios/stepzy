import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

/**
 * GET /api/activities/sessions/[sessionId] - Récupérer les détails d'une session d'activité
 */
export async function GET(
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

    const { sessionId } = await params

    // Récupérer la session d'activité avec tous les détails
    const activitySession = await prisma.activitySession.findUnique({
      where: { id: sessionId },
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
          orderBy: {
            joinedAt: 'asc'
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

    // Séparer les joueurs confirmés et la liste d'attente
    const confirmedPlayers = activitySession.participants
      .filter(p => p.status === 'confirmed')
      .slice(0, activitySession.maxPlayers)

    const waitingList = activitySession.participants
      .filter(p => p.status === 'waiting' || p.status === 'confirmed')
      .slice(activitySession.maxPlayers)
      .map(p => ({ ...p, status: 'waiting' as const }))

    // Formatter la réponse pour être compatible avec l'interface Match
    const matchCompatibleData = {
      id: activitySession.id,
      date: activitySession.date,
      sport: activitySession.activity.sport,
      maxPlayers: activitySession.maxPlayers,
      status: 'open' as const, // Les sessions d'activités sont toujours ouvertes
      createdAt: activitySession.createdAt,
      updatedAt: activitySession.updatedAt,
      players: confirmedPlayers,
      waitingList,
      // Ajouter des informations spécifiques à l'activité
      activity: {
        id: activitySession.activity.id,
        name: activitySession.activity.name,
        description: activitySession.activity.description,
        creator: activitySession.activity.creator
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        match: matchCompatibleData
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la session' },
      { status: 500 }
    )
  }
}