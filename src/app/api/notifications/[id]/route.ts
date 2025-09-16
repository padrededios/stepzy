import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/middleware/auth'
import { markNotificationAsRead } from '../../../../lib/notifications/service'

interface Params {
  id: string
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return requireAuth(request, async (req, context) => {
    try {
      const { id } = await params
      const body = await req.json()
      const { action } = body

      if (action === 'mark_read') {
        const success = await markNotificationAsRead(id, context.user.id)
        
        if (success) {
          return NextResponse.json({
            success: true,
            data: { message: 'Notification marquée comme lue' }
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Notification non trouvée ou accès non autorisé'
          }, { status: 404 })
        }
      }

      return NextResponse.json({
        success: false,
        error: 'Action non supportée'
      }, { status: 400 })

    } catch (error) {
      console.error('Update notification error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la mise à jour'
      }, { status: 500 })
    }
  })
}