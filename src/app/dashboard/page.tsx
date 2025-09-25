'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MatchCard } from '@/components/matches/MatchCard'
import AnnouncementBanner from '@/components/announcements/AnnouncementBanner'
import { SportType } from '@/config/sports'

interface User {
  id: string
  email: string
  pseudo: string
  avatar?: string | null
  role: 'user' | 'root'
}

interface MatchPlayer {
  id: string
  user: {
    id: string
    pseudo: string
    avatar?: string | null
  }
  status: 'confirmed' | 'waiting'
  joinedAt: Date
}

interface Match {
  id: string
  date: Date
  sport: SportType
  maxPlayers: number
  status: 'open' | 'full' | 'cancelled' | 'completed'
  players: MatchPlayer[]
  waitingList: MatchPlayer[]
}

function DashboardContent({ user }: { user: User }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/matches')
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des matchs')
      }

      const data = await response.json()

      if (data.success) {
        // Convert date strings to Date objects
        const matchesWithDates = data.data.matches.map((match: any) => ({
          ...match,
          date: new Date(match.date),
          players: match.players.map((p: any) => ({
            ...p,
            joinedAt: new Date(p.joinedAt)
          })),
          waitingList: match.waitingList.map((p: any) => ({
            ...p,
            joinedAt: new Date(p.joinedAt)
          }))
        }))

        setMatches(matchesWithDates)
      } else {
        throw new Error(data.error || 'Erreur inconnue')
      }
    } catch (err) {
      console.error('Error fetching matches:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [])

  const getCurrentWeekMatches = () => {
    const now = new Date()
    const currentWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1)
    const currentWeekEnd = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)

    return matches.filter(match => {
      const matchDate = new Date(match.date)
      return matchDate >= currentWeekStart && matchDate <= currentWeekEnd
    })
  }

  const getNextWeekMatches = () => {
    const now = new Date()
    const nextWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 8)
    const nextWeekEnd = new Date(nextWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)

    return matches.filter(match => {
      const matchDate = new Date(match.date)
      return matchDate >= nextWeekStart && matchDate <= nextWeekEnd
    })
  }

  const getUserStats = () => {
    const userMatches = matches.filter(match => 
      match.players.some(p => p.user.id === user.id) ||
      match.waitingList.some(p => p.user.id === user.id)
    )

    const confirmedMatches = matches.filter(match => 
      match.players.some(p => p.user.id === user.id && p.status === 'confirmed')
    )

    const waitingMatches = matches.filter(match => 
      match.waitingList.some(p => p.user.id === user.id)
    )

    return {
      total: userMatches.length,
      confirmed: confirmedMatches.length,
      waiting: waitingMatches.length
    }
  }

  const currentWeekMatches = getCurrentWeekMatches()
  const nextWeekMatches = getNextWeekMatches()
  const userStats = getUserStats()

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-600">Chargement des matchs...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout user={user}>
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Erreur de chargement</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchMatches}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Réessayer
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        {/* Announcements */}
        <AnnouncementBanner />

        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bonjour {user.pseudo} 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenue sur votre tableau de bord Stepzy
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Vos statistiques</p>
              <div className="flex space-x-4 mt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{userStats.confirmed}</p>
                  <p className="text-xs text-gray-500">Matchs confirmés</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{userStats.waiting}</p>
                  <p className="text-xs text-gray-500">En attente</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Week Matches */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Matchs de cette semaine
            </h2>
          </div>

          {currentWeekMatches.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {currentWeekMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  currentUser={user}
                  onUpdate={fetchMatches}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun match cette semaine</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucun match n'est programmé pour cette semaine.
              </p>
            </div>
          )}
        </section>

        {/* Next Week Matches */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Matchs de la semaine prochaine
            </h2>
          </div>

          {nextWeekMatches.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {nextWeekMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  currentUser={user}
                  onUpdate={fetchMatches}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun match prévu</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucun match n'est programmé pour la semaine prochaine.
              </p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {(user) => <DashboardContent user={user} />}
    </ProtectedRoute>
  )
}