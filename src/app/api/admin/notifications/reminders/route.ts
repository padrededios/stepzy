import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/middleware/auth'
import { runNotificationTasks, sendMatchReminders, sendMatchStartingSoon, updateCompletedMatches } from '../../../../../lib/notifications/reminders'

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    try {
      // Only admins can trigger reminders manually
      if (context.user.role !== 'root') {
        return NextResponse.json({
          success: false,
          error: 'Accès non autorisé'
        }, { status: 403 })
      }

      const body = await req.json()
      const { type = 'all' } = body

      let results: any = {}

      switch (type) {
        case 'reminders':
          results = await sendMatchReminders()
          break
        case 'starting_soon':
          results = await sendMatchStartingSoon()
          break
        case 'completed':
          results = await updateCompletedMatches()
          break
        case 'all':
        default:
          results = await runNotificationTasks()
          break
      }

      return NextResponse.json({
        success: true,
        data: { results }
      })

    } catch (error) {
      console.error('Manual reminder trigger error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de l\'envoi des rappels'
      }, { status: 500 })
    }
  })
}