import { NextRequest, NextResponse } from 'next/server'
import { ActivitySessionService } from '@/lib/services/activity-session.service'

/**
 * POST /api/activities/generate-sessions - Générer les sessions à venir pour toutes les activités
 * Cette route est destinée à être appelée par un cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier la clé API pour sécuriser l'endpoint (optionnel)
    const apiKey = request.headers.get('X-API-Key')
    const expectedApiKey = process.env.CRON_API_KEY

    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { success: false, error: 'Clé API invalide' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const weeksAhead = parseInt(searchParams.get('weeksAhead') || '2')

    if (weeksAhead < 1 || weeksAhead > 8) {
      return NextResponse.json(
        { success: false, error: 'weeksAhead doit être entre 1 et 8' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Générer les sessions pour toutes les activités
    await ActivitySessionService.generateAllUpcomingSessions(weeksAhead)

    // Mettre à jour les sessions terminées
    await ActivitySessionService.updateCompletedSessions()

    // Nettoyer les anciennes sessions (optionnel)
    const cleanup = searchParams.get('cleanup') === 'true'
    if (cleanup) {
      await ActivitySessionService.cleanupOldSessions()
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    return NextResponse.json({
      success: true,
      data: {
        message: 'Sessions générées avec succès',
        weeksAhead,
        duration: `${duration}ms`,
        cleanup: cleanup
      }
    })

  } catch (error) {
    console.error('Erreur lors de la génération des sessions:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la génération des sessions',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}