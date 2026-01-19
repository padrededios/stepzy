'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { SPORTS_CONFIG } from '@/config/sports'
import MatchView from '@/components/matches/MatchView'

interface MatchPlayer {
  id: string
  userId: string
  matchId: string
  status: 'confirmed' | 'waiting'
  joinedAt: Date
  user: {
    id: string
    pseudo: string
    avatar: string | null
  }
}

interface Match {
  id: string
  date: Date
  sport: 'football' | 'badminton' | 'volley' | 'pingpong' | 'rugby'
  maxPlayers: number
  status: 'open' | 'full' | 'cancelled' | 'completed'
  players: MatchPlayer[]
  waitingList: MatchPlayer[]
}

interface MatchDetailClientProps {
  matchId: string
  initialMatch: Match | null
  initialError: string | null
}

export function MatchDetailClient({
  matchId,
  initialMatch,
  initialError,
}: MatchDetailClientProps) {
  const user = useCurrentUser()
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(initialMatch)
  const [error, setError] = useState<string | null>(initialError)

  const fetchMatch = async () => {
    try {
      // Try traditional matches first
      let response = await fetch(`/api/matches/${matchId}`)

      // If that doesn't work, try activity sessions
      if (!response.ok) {
        response = await fetch(`/api/activities/sessions/${matchId}`)
      }

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.match) {
          const matchData = data.data.match
          setMatch({
            ...matchData,
            date: new Date(matchData.date),
            sport: matchData.sport,
            players: matchData.players.map((p: any) => ({
              ...p,
              joinedAt: new Date(p.joinedAt),
            })),
            waitingList:
              matchData.waitingList?.map((p: any) => ({
                ...p,
                joinedAt: new Date(p.joinedAt),
              })) || [],
          })
        } else {
          setError('Activité non trouvée')
        }
      } else {
        const data = await response.json()
        setError(data.error || "Erreur lors du chargement de l'activité")
      }
    } catch (error) {
      console.error('Error fetching match:', error)
      setError("Erreur lors du chargement de l'activité")
    }
  }

  const handleMatchUpdate = () => {
    fetchMatch()
  }

  const handleError = (message: string) => {
    setError(message)
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (error && !match) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => router.push('/mes-sessions')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour aux activités
        </button>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Activité non trouvée
        </h1>
        <button
          onClick={() => router.push('/mes-sessions')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour aux activités
        </button>
      </div>
    )
  }

  const sportConfig = SPORTS_CONFIG[match.sport]

  return (
    <div className="space-y-6">
      {/* Page Header with activity info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/mes-sessions')}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour aux activités
          </button>
        </div>

        <div className="flex items-start space-x-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <img
              src={sportConfig.icon}
              alt={sportConfig.name}
              className="rounded-lg object-cover w-full h-full"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {sportConfig.name}
            </h1>
            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m0-10V7m0 10V7m6 0v10m0-10V7"
                  />
                </svg>
                <span className="font-medium">
                  {formatDate(match.date).charAt(0).toUpperCase() +
                    formatDate(match.date).slice(1)}
                </span>
              </div>
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">{formatTime(match.date)}</span>
              </div>
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="font-medium">
                  {match.players.length}/{match.maxPlayers} joueurs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-red-700 text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Match details */}
      <MatchView
        match={match}
        currentUser={user}
        onMatchUpdate={handleMatchUpdate}
        onError={handleError}
      />
    </div>
  )
}
