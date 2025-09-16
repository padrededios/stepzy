import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '@/lib/middleware/auth'

const prisma = new PrismaClient()

// POST /api/matches/[id]/replace - Replace player in match (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (req, context) => {
    try {
      const { id: matchId } = await params
      const body = await req.json()

      if (!body.fromUserId || !body.toUserId) {
        return NextResponse.json(
          { success: false, error: 'Les champs fromUserId et toUserId sont requis' },
          { status: 400 }
        )
      }

      if (body.fromUserId === body.toUserId) {
        return NextResponse.json(
          { success: false, error: 'L\'utilisateur source et destination ne peuvent pas être identiques' },
          { status: 400 }
        )
      }

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

      // Check if fromUser is in the match
      const fromPlayer = match.players.find(p => p.userId === body.fromUserId)
      if (!fromPlayer) {
        return NextResponse.json(
          { success: false, error: 'L\'utilisateur à remplacer n\'est pas inscrit à ce match' },
          { status: 400 }
        )
      }

      // Check if toUser is already in the match
      const existingToPlayer = match.players.find(p => p.userId === body.toUserId)
      if (existingToPlayer) {
        return NextResponse.json(
          { success: false, error: 'L\'utilisateur de remplacement est déjà inscrit à ce match' },
          { status: 409 }
        )
      }

      // Check if both users exist
      const [fromUser, toUser] = await Promise.all([
        prisma.user.findUnique({
          where: { id: body.fromUserId },
          select: { pseudo: true }
        }),
        prisma.user.findUnique({
          where: { id: body.toUserId },
          select: { pseudo: true }
        })
      ])

      if (!fromUser || !toUser) {
        return NextResponse.json(
          { success: false, error: 'Un des utilisateurs n\'existe pas' },
          { status: 404 }
        )
      }

      // Perform replacement in a transaction
      await prisma.$transaction(async (tx) => {
        // Remove old player
        await tx.matchPlayer.delete({
          where: {
            userId_matchId: {
              userId: body.fromUserId,
              matchId: matchId
            }
          }
        })

        // Add new player with same status
        await tx.matchPlayer.create({
          data: {
            matchId: matchId,
            userId: body.toUserId,
            status: fromPlayer.status
          }
        })
      })

      return NextResponse.json({
        success: true,
        message: `${fromUser.pseudo} remplacé par ${toUser.pseudo} avec succès`
      })

    } catch (error) {
      console.error('Replace player error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors du remplacement du joueur' 
        },
        { status: 500 }
      )
    }
  })
}