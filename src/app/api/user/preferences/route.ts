import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/middleware/auth'
import { prisma } from '../../../../lib/database/prisma'

// We'll extend the User model to include notification preferences
// For now, we'll use a simple JSON field approach

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    try {
      // Get user preferences from database
      // In a real implementation, you might have a separate UserPreferences table
      // For now, we'll return default preferences
      if (!context.user) {
        return NextResponse.json({
          success: false,
          error: 'Non autorisé'
        }, { status: 401 })
      }

      const user = await prisma.user.findUnique({
        where: { id: context.user.id }
      })

      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'Utilisateur non trouvé'
        }, { status: 404 })
      }

      // Default preferences - in a real app these would be stored in DB
      const preferences = {
        emailNotifications: true,
        newMatches: true,
        matchReminders: false,
        cancellations: true
      }

      return NextResponse.json({
        success: true,
        data: { preferences }
      })

    } catch (error) {
      console.error('Get preferences error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur serveur'
      }, { status: 500 })
    }
  })
}

export async function PUT(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    try {
      const body = await req.json()
      const { emailNotifications, newMatches, matchReminders, cancellations } = body

      // Validate preferences
      if (
        typeof emailNotifications !== 'boolean' ||
        typeof newMatches !== 'boolean' ||
        typeof matchReminders !== 'boolean' ||
        typeof cancellations !== 'boolean'
      ) {
        return NextResponse.json({
          success: false,
          error: 'Format des préférences invalide'
        }, { status: 400 })
      }

      // In a real implementation, you would save these to a UserPreferences table
      // For now, we'll just acknowledge the update
      const preferences = {
        emailNotifications,
        newMatches,
        matchReminders,
        cancellations
      }

      // Log the preference update
      console.log(`User ${context.user?.id} updated preferences:`, preferences)

      return NextResponse.json({
        success: true,
        data: { preferences }
      })

    } catch (error) {
      console.error('Update preferences error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur serveur'
      }, { status: 500 })
    }
  })
}