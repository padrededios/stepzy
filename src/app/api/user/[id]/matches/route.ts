import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/middleware/auth'
import { prisma } from '../../../../../lib/database/prisma'

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return requireAuth(request, async (req, context) => {
    try {
      const { id } = await params

      // Users can only view their own matches unless they are admin
      if (!context.user || (context.user.id !== id && context.user.role !== 'root')) {
        return NextResponse.json({
          success: false,
          error: 'Accès non autorisé'
        }, { status: 403 })
      }

      // Get user's matches through MatchPlayer table
      const userMatches = await prisma.matchPlayer.findMany({
        where: {
          userId: id
        },
        include: {
          match: {
            include: {
              _count: {
                select: {
                  players: true
                }
              }
            }
          }
        },
        orderBy: {
          match: {
            date: 'desc'
          }
        }
      })

      // Transform the data to match the expected format
      const matches = userMatches.map(userMatch => ({
        id: userMatch.match.id,
        date: userMatch.match.date,
        status: userMatch.match.status,
        maxPlayers: userMatch.match.maxPlayers,
        _count: userMatch.match._count,
        matchPlayers: [{
          status: userMatch.status,
          joinedAt: userMatch.joinedAt
        }]
      }))

      return NextResponse.json({
        success: true,
        data: { matches }
      })

    } catch (error) {
      console.error('User matches error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du chargement des matchs'
      }, { status: 500 })
    }
  })
}