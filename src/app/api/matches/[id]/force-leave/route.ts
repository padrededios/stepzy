import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '@/lib/middleware/auth'

const prisma = new PrismaClient()

// POST /api/matches/[id]/force-leave - Force remove player from match (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (req, context) => {
    try {
      const { id: matchId } = await params
      const body = await req.json()

      if (!body.userId) {
        return NextResponse.json(
          { success: false, error: 'Le champ userId est requis' },
          { status: 400 }
        )
      }

      // Check if match exists
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          players: {
            orderBy: {
              joinedAt: 'asc'
            }
          }
        }
      })

      if (!match) {
        return NextResponse.json(
          { success: false, error: 'Match non trouvé' },
          { status: 404 }
        )
      }

      // Check if user is in the match
      const userPlayer = match.players.find(p => p.userId === body.userId)

      if (!userPlayer) {
        return NextResponse.json(
          { success: false, error: 'L\'utilisateur n\'est pas inscrit à ce match' },
          { status: 400 }
        )
      }

      // Get user info for response
      const user = await prisma.user.findUnique({
        where: { id: body.userId },
        select: { pseudo: true }
      })

      // Remove user from match
      await prisma.matchPlayer.delete({
        where: {
          userId_matchId: {
            userId: body.userId,
            matchId: matchId
          }
        }
      })

      // If the user was confirmed, promote the first waiting player
      if (userPlayer.status === 'confirmed') {
        const waitingPlayers = match.players.filter(p => p.status === 'waiting')
        
        if (waitingPlayers.length > 0) {
          // Promote the first waiting player
          const firstWaiting = waitingPlayers[0]
          await prisma.matchPlayer.update({
            where: { id: firstWaiting.id },
            data: { status: 'confirmed' }
          })
        }

        // Update match status
        const confirmedPlayersCount = match.players.filter(p => p.status === 'confirmed').length - 1
        const waitingCount = waitingPlayers.length
        
        if (confirmedPlayersCount + Math.min(1, waitingCount) < match.maxPlayers && match.status === 'full') {
          await prisma.match.update({
            where: { id: matchId },
            data: { status: 'open' }
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `${user?.pseudo || 'Utilisateur'} retiré du match avec succès`
      })

    } catch (error) {
      console.error('Force leave match error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la désinscription forcée du match' 
        },
        { status: 500 }
      )
    }
  })
}