import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/middleware/auth'

const prisma = new PrismaClient()

// POST /api/matches/[id]/join - Join a match
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req, context) => {
    try {
      const { id: matchId } = await params

      // Check if match exists
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          players: true
        }
      })

      if (!match) {
        return NextResponse.json(
          { success: false, error: 'Match non trouvé' },
          { status: 404 }
        )
      }

      // Check if match is open
      if (match.status !== 'open' && match.status !== 'full') {
        return NextResponse.json(
          { success: false, error: 'Ce match n\'est plus ouvert aux inscriptions' },
          { status: 400 }
        )
      }

      // Check if registrations are closed (15 minutes before match start)
      const now = new Date()
      const matchDate = new Date(match.date)
      const minutesUntilMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60)

      if (minutesUntilMatch <= 15) {
        return NextResponse.json(
          { success: false, error: 'Les inscriptions sont fermées 15 minutes avant le début de l\'activité' },
          { status: 400 }
        )
      }

      // Check if user is already in the match
      const existingPlayer = await prisma.matchPlayer.findFirst({
        where: {
          matchId: matchId,
          userId: context.user!.id
        }
      })

      if (existingPlayer) {
        return NextResponse.json(
          { success: false, error: 'Vous êtes déjà inscrit à ce match' },
          { status: 409 }
        )
      }

      // Count confirmed players
      const confirmedPlayersCount = match.players.filter(p => p.status === 'confirmed').length

      // Determine player status (confirmed or waiting)
      const playerStatus = confirmedPlayersCount < match.maxPlayers ? 'confirmed' : 'waiting'

      // Add player to match
      await prisma.matchPlayer.create({
        data: {
          matchId: matchId,
          userId: context.user!.id,
          status: playerStatus
        }
      })

      // Update match status if needed
      const newConfirmedCount = playerStatus === 'confirmed' ? confirmedPlayersCount + 1 : confirmedPlayersCount
      
      if (newConfirmedCount >= match.maxPlayers && match.status === 'open') {
        await prisma.match.update({
          where: { id: matchId },
          data: { status: 'full' }
        })
      }

      return NextResponse.json({
        success: true,
        message: playerStatus === 'confirmed' 
          ? 'Inscription confirmée au match' 
          : 'Ajouté à la liste d\'attente',
        data: {
          status: playerStatus,
          position: playerStatus === 'waiting' ? match.players.length + 1 : null
        }
      })

    } catch (error) {
      console.error('Join match error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de l\'inscription au match' 
        },
        { status: 500 }
      )
    }
  })
}