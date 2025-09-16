import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '@/lib/middleware/auth'

const prisma = new PrismaClient()

// POST /api/matches/[id]/force-join - Force join player to match (admin only)
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

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: body.userId }
      })

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Utilisateur non trouvé' },
          { status: 404 }
        )
      }

      // Check if user is already in the match
      const existingPlayer = await prisma.matchPlayer.findUnique({
        where: {
          userId_matchId: {
            userId: body.userId,
            matchId: matchId
          }
        }
      })

      if (existingPlayer) {
        return NextResponse.json(
          { success: false, error: 'L\'utilisateur est déjà inscrit à ce match' },
          { status: 409 }
        )
      }

      // Count confirmed players
      const confirmedPlayersCount = match.players.filter(p => p.status === 'confirmed').length

      // Determine player status (admin can force confirmed even if full)
      const playerStatus = body.status === 'waiting' ? 'waiting' : 'confirmed'

      // Add player to match
      await prisma.matchPlayer.create({
        data: {
          matchId: matchId,
          userId: body.userId,
          status: playerStatus
        }
      })

      // Update match status if needed
      if (playerStatus === 'confirmed') {
        const newConfirmedCount = confirmedPlayersCount + 1
        
        if (newConfirmedCount >= match.maxPlayers && match.status === 'open') {
          await prisma.match.update({
            where: { id: matchId },
            data: { status: 'full' }
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Utilisateur ${user.pseudo} inscrit au match avec succès`,
        data: {
          status: playerStatus
        }
      })

    } catch (error) {
      console.error('Force join match error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de l\'inscription forcée au match' 
        },
        { status: 500 }
      )
    }
  })
}