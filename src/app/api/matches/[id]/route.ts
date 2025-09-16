import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireAdmin } from '@/lib/middleware/auth'

const prisma = new PrismaClient()

// GET /api/matches/[id] - Get match details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req, context) => {
    try {
      const { id: matchId } = await params

      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  pseudo: true,
                  avatar: true
                }
              }
            },
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

      // Separate confirmed players and waiting list
      const confirmedPlayers = match.players
        .filter(p => p.status === 'confirmed')
        .slice(0, match.maxPlayers)

      const waitingList = match.players
        .filter(p => p.status === 'waiting' || p.status === 'confirmed')
        .slice(match.maxPlayers)
        .map(p => ({ ...p, status: 'waiting' as const }))

      return NextResponse.json({
        success: true,
        data: {
          match: {
            id: match.id,
            date: match.date,
            maxPlayers: match.maxPlayers,
            status: match.status,
            createdAt: match.createdAt,
            updatedAt: match.updatedAt,
            players: confirmedPlayers,
            waitingList
          }
        }
      })

    } catch (error) {
      console.error('Get match details error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la récupération du match' 
        },
        { status: 500 }
      )
    }
  })
}

// PUT /api/matches/[id] - Update match (root only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (req, context) => {
    try {
      const { id: matchId } = await params
      const body = await req.json()

      // Validate match exists
      const existingMatch = await prisma.match.findUnique({
        where: { id: matchId }
      })

      if (!existingMatch) {
        return NextResponse.json(
          { success: false, error: 'Match non trouvé' },
          { status: 404 }
        )
      }

      // Validate time constraints if date is provided
      if (body.date) {
        const matchDate = new Date(body.date)
        const hour = matchDate.getHours()
        const dayOfWeek = matchDate.getDay()

        // Validate lunch hours (12h-14h)
        if (hour < 12 || hour >= 14) {
          return NextResponse.json(
            { success: false, error: 'Les matchs doivent être programmés entre 12h-14h' },
            { status: 400 }
          )
        }

        // Validate working days (Monday-Friday: 1-5)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return NextResponse.json(
            { success: false, error: 'Les matchs doivent être programmés en jour ouvrable (Lundi-Vendredi)' },
            { status: 400 }
          )
        }
      }

      // Prepare update data
      const updateData: any = {}
      if (body.date !== undefined) updateData.date = new Date(body.date)
      if (body.maxPlayers !== undefined) updateData.maxPlayers = parseInt(body.maxPlayers)
      if (body.status !== undefined) updateData.status = body.status

      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: updateData,
        include: {
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  pseudo: true,
                  avatar: true
                }
              }
            },
            orderBy: {
              joinedAt: 'asc'
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Match modifié avec succès',
        data: {
          match: updatedMatch
        }
      })

    } catch (error) {
      console.error('Update match error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la modification du match' 
        },
        { status: 500 }
      )
    }
  })
}

// DELETE /api/matches/[id] - Delete match (root only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (req, context) => {
    try {
      const { id: matchId } = await params

      // Check if match exists
      const match = await prisma.match.findUnique({
        where: { id: matchId }
      })

      if (!match) {
        return NextResponse.json(
          { success: false, error: 'Match non trouvé' },
          { status: 404 }
        )
      }

      // Delete match (cascade will handle match players)
      await prisma.match.delete({
        where: { id: matchId }
      })

      return NextResponse.json({
        success: true,
        message: 'Match supprimé avec succès'
      })

    } catch (error) {
      console.error('Delete match error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la suppression du match' 
        },
        { status: 500 }
      )
    }
  })
}