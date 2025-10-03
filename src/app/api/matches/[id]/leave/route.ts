import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { requireAuth } from '@/lib/middleware/auth'

// DELETE /api/matches/[id]/leave - Leave a match
export async function DELETE(
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
      const userPlayer = match.players.find(p => p.userId === context.user!.id)

      if (!userPlayer) {
        return NextResponse.json(
          { success: false, error: 'Vous n\'êtes pas inscrit à ce match' },
          { status: 400 }
        )
      }

      // Remove user from match
      await prisma.matchPlayer.delete({
        where: {
          id: userPlayer.id
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
        message: 'Vous avez quitté le match avec succès'
      })

    } catch (error) {
      console.error('Leave match error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la désinscription du match' 
        },
        { status: 500 }
      )
    }
  })
}