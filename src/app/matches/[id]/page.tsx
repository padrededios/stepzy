'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import MatchView from '@/components/matches/MatchView'

interface User {
  id: string
  pseudo: string
  avatar: string
}

interface MatchPlayer {
  id: string
  userId: string
  matchId: string
  status: 'confirmed' | 'waiting'
  joinedAt: Date
  user: User
}

interface Match {
  id: string
  date: Date
  maxPlayers: number
  status: 'open' | 'full' | 'cancelled' | 'completed'
  players: MatchPlayer[]
  waitingList: MatchPlayer[]
}

interface CurrentUser {
  id: string
  pseudo: string
  role: 'user' | 'root'
}

export default function MatchDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setCurrentUser({
            id: data.user.id,
            pseudo: data.user.pseudo,
            role: data.user.role
          })
        } else {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      router.push('/login')
    }
  }

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.match) {
          const matchData = data.data.match
          setMatch({
            ...matchData,
            date: new Date(matchData.date),
            players: matchData.players.map((p: any) => ({
              ...p,
              joinedAt: new Date(p.joinedAt)
            })),
            waitingList: matchData.waitingList?.map((p: any) => ({
              ...p,
              joinedAt: new Date(p.joinedAt)
            })) || []
          })
        } else {
          setError('Match non trouvé')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors du chargement du match')
      }
    } catch (error) {
      console.error('Error fetching match:', error)
      setError('Erreur lors du chargement du match')
    }
  }

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true)
      await fetchCurrentUser()
      await fetchMatch()
      setLoading(false)
    }
    
    initializePage()
  }, [resolvedParams.id])

  const handleMatchUpdate = () => {
    fetchMatch()
  }

  const handleError = (message: string) => {
    setError(message)
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000)
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600">Chargement du match...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBackToDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!match || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Match non trouvé</h1>
          <button
            onClick={handleBackToDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBackToDashboard}
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
            Retour au dashboard
          </button>
          
          <h1 className="text-xl font-semibold text-gray-800">
            Détails du match
          </h1>
          
          <div></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-red-500 mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Match details */}
      <div className="py-6">
        <MatchView
          match={match}
          currentUser={currentUser}
          onMatchUpdate={handleMatchUpdate}
          onError={handleError}
        />
      </div>
    </div>
  )
}