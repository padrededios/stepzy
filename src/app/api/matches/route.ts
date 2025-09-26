import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireAdmin } from '@/lib/middleware/auth'

const prisma = new PrismaClient()

// GET /api/matches - Get all matches
export async function GET(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    try {
      const url = new URL(req.url)
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
      const status = url.searchParams.get('status')

      // Build where clause
      const where: any = {}
      
      if (status && ['open', 'full', 'cancelled', 'completed'].includes(status)) {
        where.status = status
      }

      const matches = await prisma.match.findMany({
        where,
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
        },
        orderBy: {
          date: 'asc'
        },
        take: limit
      })

      // Transform data to separate confirmed players and waiting list
      const currentUserId = context.user?.id
      const transformedMatches = matches.map(match => {
        const confirmedPlayers = match.players
          .filter(p => p.status === 'confirmed')
          .slice(0, match.maxPlayers)

        const waitingList = match.players
          .filter(p => p.status === 'waiting' || p.status === 'confirmed')
          .slice(match.maxPlayers)
          .map(p => ({ ...p, status: 'waiting' as const }))

        // Vérifier si l'utilisateur courant est inscrit
        const userRegistration = match.players.find(p => p.userId === currentUserId)
        let userStatus = null
        if (userRegistration) {
          userStatus = userRegistration.status === 'confirmed' ? 'active' : 'waiting'
        }

        return {
          id: match.id,
          date: match.date,
          sport: match.sport,
          maxPlayers: match.maxPlayers,
          status: match.status,
          _count: {
            matchPlayers: match.players.length
          },
          matchPlayers: match.players.map(p => ({
            user: {
              id: p.user.id,
              pseudo: p.user.pseudo,
              email: p.user.email || ''
            },
            status: p.status === 'confirmed' ? 'active' as const : 'waiting' as const,
            joinedAt: p.joinedAt.toISOString()
          })),
          players: confirmedPlayers,
          waitingList,
          // Ajouter le statut de l'utilisateur courant
          currentUserStatus: userStatus
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          matches: transformedMatches
        }
      })

    } catch (error) {
      console.error('Get matches error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la récupération des matchs' 
        },
        { status: 500 }
      )
    }
  })
}

// POST /api/matches - Create match (root only)
export async function POST(request: NextRequest) {
  return requireAdmin(request, async (req, context) => {
    try {
      const body = await req.json()

      // Validate required fields
      if (!body.date) {
        return NextResponse.json(
          { success: false, error: 'Le champ date est requis' },
          { status: 400 }
        )
      }

      const matchDate = new Date(body.date)
      const dayOfWeek = matchDate.getDay()
      const now = new Date()

      // Validate working days (Monday-Friday: 1-5)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return NextResponse.json(
          { success: false, error: 'Les matchs doivent être programmés en jour ouvrable (Lundi-Vendredi)' },
          { status: 400 }
        )
      }

      // Validate minimum advance booking (4 hours)
      const hoursDifference = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      if (hoursDifference < 4) {
        return NextResponse.json(
          { success: false, error: 'Les matchs doivent être créés au moins 4h à l\'avance' },
          { status: 400 }
        )
      }

      // Validate reservation advance limit (2 weeks)
      const daysDifference = Math.floor((matchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDifference > 14) {
        return NextResponse.json(
          { success: false, error: 'Les matchs ne peuvent être créés que 2 semaines à l\'avance maximum' },
          { status: 400 }
        )
      }

      if (hoursDifference < 0) {
        return NextResponse.json(
          { success: false, error: 'Impossible de créer un match dans le passé' },
          { status: 400 }
        )
      }

      // Create match
      const match = await prisma.match.create({
        data: {
          date: matchDate,
          sport: body.sport || 'football',
          maxPlayers: body.maxPlayers || 12,
          status: 'open'
        },
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
        message: 'Match créé avec succès',
        data: {
          match
        }
      }, { status: 201 })

    } catch (error) {
      console.error('Create match error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la création du match' 
        },
        { status: 500 }
      )
    }
  })
}