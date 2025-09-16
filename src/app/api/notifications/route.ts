import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../lib/middleware/auth'
import { getUserNotifications, markAllNotificationsAsRead } from '../../../lib/notifications/service'

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    try {
      const { searchParams } = new URL(req.url)
      const limit = parseInt(searchParams.get('limit') || '20')
      const unreadOnly = searchParams.get('unreadOnly') === 'true'

      const notifications = await getUserNotifications(
        context.user.id,
        Math.min(limit, 50), // Max 50 notifications
        unreadOnly
      )

      return NextResponse.json({
        success: true,
        data: { notifications }
      })

    } catch (error) {
      console.error('Get notifications error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du chargement des notifications'
      }, { status: 500 })
    }
  })
}

export async function PUT(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    try {
      const body = await req.json()
      const { action } = body

      if (action === 'mark_all_read') {
        const count = await markAllNotificationsAsRead(context.user.id)
        
        return NextResponse.json({
          success: true,
          data: { markedCount: count }
        })
      }

      return NextResponse.json({
        success: false,
        error: 'Action non supportée'
      }, { status: 400 })

    } catch (error) {
      console.error('Update notifications error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la mise à jour'
      }, { status: 500 })
    }
  })
}