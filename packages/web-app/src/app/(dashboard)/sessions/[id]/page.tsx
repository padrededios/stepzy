'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import MatchView from '@/components/matches/MatchView'
import { Match } from '@/types'
import { SessionWithParticipants } from '@/types/activity'
import { api } from '@/lib/api/client'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const user = useCurrentUser()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionWithParticipants | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = async () => {
    try {
      const result = await api.get<SessionWithParticipants>(`/api/sessions/${sessionId}`)

      if (result.success && result.data) {
        setSession(result.data)
      } else {
        setError(result.error || 'Erreur lors de la récupération de la session')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session introuvable</h2>
          <p className="text-gray-600 mb-6">{error || 'Cette session n\'existe pas'}</p>
          <button
            onClick={() => router.push('/mes-activites')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Retour à mes activités
          </button>
        </div>
      </div>
    )
  }

  // Convert session to match format for MatchView
  // Separate confirmed players from waiting list
  const confirmedPlayers = session.participants
    .filter(p => p.status === 'confirmed')
    .map(p => ({
      id: p.id,
      userId: p.user.id,
      matchId: session.id,
      status: p.status as 'confirmed' | 'waiting',
      joinedAt: new Date(p.joinedAt),
      user: p.user
    }))

  const waitingPlayers = session.participants
    .filter(p => p.status === 'waiting')
    .map(p => ({
      id: p.id,
      userId: p.user.id,
      matchId: session.id,
      status: p.status as 'confirmed' | 'waiting',
      joinedAt: new Date(p.joinedAt),
      user: p.user
    }))

  const matchData: Match = {
    id: session.id,
    date: new Date(session.date),
    sport: session.activity!.sport,
    maxPlayers: session.maxPlayers,
    status: session.isCancelled ? 'cancelled' : session.status === 'active' ? 'open' : 'completed',
    players: confirmedPlayers,
    waitingList: waitingPlayers
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <MatchView
        match={matchData}
        currentUser={user}
        onMatchUpdate={fetchSession}
        onError={(message) => setError(message)}
      />
    </div>
  )
}
