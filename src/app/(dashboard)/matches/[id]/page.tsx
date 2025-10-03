import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { MatchDetailClient } from '@/components/matches/MatchDetailClient'
import { prisma } from '@/lib/database/prisma'

interface MatchDetailPageProps {
  params: Promise<{ id: string }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: MatchDetailPageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const match = await prisma.match.findUnique({
      where: { id },
      select: {
        sport: true,
        date: true,
      },
    })

    if (!match) {
      return {
        title: 'Activité non trouvée - Stepzy',
      }
    }

    const sportNames: Record<string, string> = {
      football: 'Football',
      badminton: 'Badminton',
      volley: 'Volley-ball',
      pingpong: 'Ping-pong',
      rugby: 'Rugby',
    }

    return {
      title: `${sportNames[match.sport] || match.sport} - ${new Date(match.date).toLocaleDateString('fr-FR')} - Stepzy`,
      description: `Détails de la session de ${sportNames[match.sport] || match.sport}`,
    }
  } catch {
    return {
      title: 'Activité - Stepzy',
    }
  }
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = await params

  // Fetch initial match data on the server
  let initialMatch = null
  let error = null

  try {
    // Try traditional matches first
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    })

    if (match) {
      // Separate confirmed players and waiting list
      const confirmedPlayers = match.players
        .filter((p) => p.status === 'confirmed')
        .slice(0, match.maxPlayers)

      const waitingList = match.players
        .filter((p) => p.status === 'waiting' || p.status === 'confirmed')
        .slice(match.maxPlayers)
        .map((p) => ({ ...p, status: 'waiting' as const }))

      initialMatch = {
        id: match.id,
        date: match.date,
        sport: match.sport,
        maxPlayers: match.maxPlayers,
        status: match.status,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        players: confirmedPlayers,
        waitingList,
      }
    }
  } catch (err) {
    console.error('Error fetching match:', err)
    error = 'Erreur lors du chargement de l\'activité'
  }

  // If match not found, return 404
  if (!initialMatch && !error) {
    notFound()
  }

  // Render client component with initial data
  return <MatchDetailClient matchId={id} initialMatch={initialMatch} initialError={error} />
}
