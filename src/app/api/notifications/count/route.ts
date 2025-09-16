import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/middleware/auth'
import { getUnreadNotificationCount } from '../../../../lib/notifications/service'

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    try {
      if (!context.user) {
        return NextResponse.json({
          success: false,
          error: 'Utilisateur non authentifié'
        }, { status: 401 })
      }

      const count = await getUnreadNotificationCount(context.user.id)

      return NextResponse.json({
        success: true,
        data: { count }
      })

    } catch (error) {
      console.error('Get notification count error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du chargement du compteur'
      }, { status: 500 })
    }
  })
}