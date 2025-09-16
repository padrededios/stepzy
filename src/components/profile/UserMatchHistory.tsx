'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Match {
  id: string
  date: Date
  status: 'open' | 'full' | 'completed' | 'cancelled'
  maxPlayers: number
  _count: {
    matchPlayers: number
  }
  matchPlayers: Array<{
    status: 'active' | 'waiting'
    joinedAt: Date
  }>
}

interface UserMatchHistoryProps {
  userId: string
  onError?: (message: string) => void
}

export default function UserMatchHistory({ userId, onError }: UserMatchHistoryProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled' | 'upcoming'>('all')

  useEffect(() => {
    fetchUserMatches()
  }, [userId])

  const fetchUserMatches = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/${userId}/matches`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const parsedMatches = data.data.matches.map((match: any) => ({
            ...match,
            date: new Date(match.date)
          }))
          setMatches(parsedMatches)
        } else {
          onError?.('Erreur lors du chargement de l\'historique')
        }
      }
    } catch (error) {
      onError?.('Erreur lors du chargement de l\'historique')
    } finally {
      setLoading(false)
    }
  }

  const filteredMatches = matches.filter(match => {
    const now = new Date()
    switch (filter) {
      case 'completed':
        return match.status === 'completed'
      case 'cancelled':
        return match.status === 'cancelled'
      case 'upcoming':
        return match.date > now && (match.status === 'open' || match.status === 'full')
      default:
        return true
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      case 'open':
        return 'bg-blue-100 text-blue-700'
      case 'full':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé'
      case 'cancelled':
        return 'Annulé'
      case 'open':
        return 'Ouvert'
      case 'full':
        return 'Complet'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement de l'historique...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Historique des matchs</h3>
        
        {/* Filter buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-md font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous ({matches.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1 text-sm rounded-md font-medium ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            À venir ({matches.filter(m => {
              const now = new Date()
              return m.date > now && (m.status === 'open' || m.status === 'full')
            }).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 text-sm rounded-md font-medium ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Terminés ({matches.filter(m => m.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1 text-sm rounded-md font-medium ${
              filter === 'cancelled'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Annulés ({matches.filter(m => m.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun match</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? "Vous n'avez encore participé à aucun match."
              : `Aucun match ${filter === 'upcoming' ? 'à venir' : filter === 'completed' ? 'terminé' : 'annulé'}.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((match) => (
            <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-900">
                    {new Intl.DateTimeFormat('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).format(match.date)}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(match.status)}`}>
                    {getStatusText(match.status)}
                  </span>
                </div>
                
                <Link
                  href={`/matches/${match.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Voir détails →
                </Link>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                    </svg>
                    {match._count.matchPlayers}/{match.maxPlayers} joueurs
                  </span>
                  
                  {match.matchPlayers.length > 0 && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Inscrit le {new Intl.DateTimeFormat('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(match.matchPlayers[0].joinedAt)}
                    </span>
                  )}
                  
                  {match.matchPlayers.some(mp => mp.status === 'waiting') && (
                    <span className="text-orange-600 font-medium">
                      En liste d'attente
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}