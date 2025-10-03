import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

/**
 * POST /api/activities/[activityId]/subscribe - S'inscrire à une activité
 * L'utilisateur s'inscrit à l'activité (pas à une session spécifique)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
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
    const { activityId } = await params

    // Vérifier que l'activité existe
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if (!activity) {
      return NextResponse.json(
        { success: false, error: 'Activité introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur n'est pas déjà abonné
    const existingSubscription = await prisma.activitySubscription.findUnique({
      where: {
        activityId_userId: {
          activityId,
          userId: user.id
        }
      }
    })

    if (existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'Vous êtes déjà inscrit à cette activité' },
        { status: 400 }
      )
    }

    // Créer l'abonnement
    await prisma.activitySubscription.create({
      data: {
        activityId,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Inscription réussie. Les sessions de cette activité apparaissent maintenant dans vos sessions disponibles.',
        activityId,
        activityName: activity.name
      }
    })

  } catch (error) {
    console.error('Erreur lors de l\'inscription à l\'activité:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/activities/[activityId]/subscribe - Se désinscrire d'une activité
 * Désinscrit l'utilisateur de toutes les sessions futures de l'activité
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
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
    const { activityId } = await params

    // Vérifier que l'activité existe
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if (!activity) {
      return NextResponse.json(
        { success: false, error: 'Activité introuvable' },
        { status: 404 }
      )
    }

    // Vérifier si un abonnement existe
    const existingSubscription = await prisma.activitySubscription.findUnique({
      where: {
        activityId_userId: {
          activityId,
          userId: user.id
        }
      }
    })

    // Supprimer l'abonnement s'il existe
    if (existingSubscription) {
      await prisma.activitySubscription.delete({
        where: {
          activityId_userId: {
            activityId,
            userId: user.id
          }
        }
      })
    }

    // Supprimer toutes les participations futures aux sessions de cette activité
    const now = new Date()
    const deletedParticipations = await prisma.activityParticipant.deleteMany({
      where: {
        userId: user.id,
        session: {
          activityId: activityId,
          date: {
            gte: now
          }
        }
      }
    })

    // Vérifier s'il reste des participations passées
    const remainingPastParticipations = await prisma.activityParticipant.count({
      where: {
        userId: user.id,
        session: {
          activityId: activityId,
          date: {
            lt: now
          }
        }
      }
    })

    const message = existingSubscription
      ? `Désinscription de l'activité réussie. ${deletedParticipations.count} participation(s) future(s) supprimée(s).`
      : `${deletedParticipations.count} participation(s) future(s) supprimée(s).`

    return NextResponse.json({
      success: true,
      data: {
        message,
        activityId,
        activityName: activity.name,
        deletedCount: deletedParticipations.count,
        wasSubscribed: !!existingSubscription,
        hasPastParticipations: remainingPastParticipations > 0
      }
    })

  } catch (error) {
    console.error('Erreur lors de la désinscription de l\'activité:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la désinscription' },
      { status: 500 }
    )
  }
}