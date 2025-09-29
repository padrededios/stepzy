import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/middleware/auth'
import { PrismaClient } from '@prisma/client'
import {
  calculateRecurringDates,
  validateMatchCreation,
  type RecurringFrequency
} from '../../../../lib/utils/time-constraints'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    // Only admins can create recurring matches
    if (!context.user || context.user.role !== 'root') {
      return NextResponse.json(
        { success: false, error: 'Seuls les administrateurs peuvent créer des matchs récurrents' },
        { status: 403 }
      )
    }

    try {
      const body = await req.json()
      const { date, sport, maxPlayers, description, recurring } = body

      // Validate input
      if (!date || !recurring || !recurring.frequency || !recurring.count) {
        return NextResponse.json(
          { success: false, error: 'Données manquantes pour la création de matchs récurrents' },
          { status: 400 }
        )
      }

      const startDate = new Date(date)
      const { frequency, count } = recurring as { frequency: RecurringFrequency, count: number }

      // Validate base match data
      const baseMatchValidation = validateMatchCreation({
        date: startDate,
        maxPlayers: maxPlayers || 12,
        description: description || ''
      })

      if (!baseMatchValidation.isValid) {
        return NextResponse.json(
          { success: false, error: baseMatchValidation.errors.join(', ') },
          { status: 400 }
        )
      }

      // Calculate all recurring dates
      const recurringDates = calculateRecurringDates(startDate, frequency, count)
      
      if (recurringDates.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Aucune date valide générée pour la récurrence' },
          { status: 400 }
        )
      }

      // Check for existing matches at these dates/times
      const existingMatches = await prisma.match.findMany({
        where: {
          date: {
            in: recurringDates
          }
        }
      })

      if (existingMatches.length > 0) {
        const conflictDates = existingMatches.map((match: { date: { toLocaleDateString: (arg0: string) => any } }) => 
          match.date.toLocaleDateString('fr-FR')
        ).join(', ')
        
        return NextResponse.json(
          { 
            success: false, 
            error: `Des matchs existent déjà aux dates suivantes : ${conflictDates}` 
          },
          { status: 409 }
        )
      }

      // Create all matches in a transaction
      const createdMatches = await prisma.$transaction(
        recurringDates.map(matchDate => 
          prisma.match.create({
            data: {
              date: matchDate,
              sport: sport || 'football',
              maxPlayers: maxPlayers || 12,
              description: description || '',
              status: 'open'
            }
          })
        )
      )

      // Log the recurring match creation
      console.log(`Admin ${context.user.pseudo} created ${createdMatches.length} recurring matches`)

      return NextResponse.json({
        success: true,
        message: `${createdMatches.length} matchs récurrents créés avec succès`,
        data: {
          matches: createdMatches.map((match: { id: any; date: any; sport: any; maxPlayers: any; description: any; status: any }) => ({
            id: match.id,
            date: match.date,
            sport: match.sport,
            maxPlayers: match.maxPlayers,
            description: match.description,
            status: match.status
          }))
        }
      })

    } catch (error) {
      console.error('Recurring match creation error:', error)
      
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { success: false, error: 'Un ou plusieurs matchs existent déjà à ces dates' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création des matchs récurrents' },
        { status: 500 }
      )
    }
  })
}