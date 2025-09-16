'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

interface Match {
  id: string
  date: string
  status: 'open' | 'full' | 'completed' | 'cancelled'
  maxPlayers: number
  _count: {
    matchPlayers: number
  }
  matchPlayers: Array<{
    user: {
      id: string
      pseudo: string
      email: string
    }
    status: 'active' | 'waiting'
    joinedAt: string
  }>
}

function formatDateSafely(dateValue: string | Date): string {
  try {
    const date = new Date(dateValue)
    if (isFinite(date.getTime())) {
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }
    return 'Date invalide'
  } catch {
    return 'Date invalide'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open':
      return 'bg-green-100 text-green-800'
    case 'full':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'open':
      return 'Ouvert'
    case 'full':
      return 'Complet'
    case 'completed':
      return 'Terminé'
    case 'cancelled':
      return 'Annulé'
    default:
      return status
  }
}

function AdminMatchesContent() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/matches')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des matchs')
      }
      const data = await response.json()
      setMatches(data.matches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (matchId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du match')
      }

      // Refresh matches after update
      fetchMatches()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    }
  }

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) {
      return
    }

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du match')
      }

      // Refresh matches after deletion
      fetchMatches()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  const filteredMatches = matches.filter(match => 
    statusFilter === 'all' || match.status === statusFilter
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des matchs...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Matchs</h1>
          <p className="text-gray-600 mt-1">Administrez tous les matchs de futsal</p>
        </div>
        <Link
          href="/admin/matches/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Créer un match
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Filtrer par statut :</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous</option>
            <option value="open">Ouvert</option>
            <option value="full">Complet</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
          <span className="text-sm text-gray-500">
            {filteredMatches.length} match{filteredMatches.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Matches List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun match</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter === 'all' 
                ? 'Aucun match créé pour le moment.' 
                : `Aucun match avec le statut "${getStatusText(statusFilter)}".`
              }
            </p>
            <div className="mt-6">
              <Link
                href="/admin/matches/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Créer le premier match
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredMatches.map((match) => (
              <li key={match.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-lg font-medium text-gray-900">
                            {formatDateSafely(match.date)}
                          </p>
                          <div className="mt-1 flex items-center space-x-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(match.status)}`}>
                              {getStatusText(match.status)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {match._count.matchPlayers}/{match.maxPlayers} joueurs
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Status Change Buttons */}
                        {match.status === 'open' && (
                          <button
                            onClick={() => handleStatusChange(match.id, 'cancelled')}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          >
                            Annuler
                          </button>
                        )}
                        
                        {match.status === 'full' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(match.id, 'completed')}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                            >
                              Marquer terminé
                            </button>
                            <button
                              onClick={() => handleStatusChange(match.id, 'cancelled')}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                            >
                              Annuler
                            </button>
                          </>
                        )}
                        
                        {match.status === 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(match.id, 'open')}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                          >
                            Réactiver
                          </button>
                        )}

                        {/* Action Buttons */}
                        <Link
                          href={`/matches/${match.id}`}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Voir
                        </Link>
                        
                        <button
                          onClick={() => handleDeleteMatch(match.id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>

                    {/* Players List */}
                    {match.matchPlayers.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Joueurs inscrits :</h4>
                        <div className="flex flex-wrap gap-2">
                          {match.matchPlayers.slice(0, 6).map((mp, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 text-xs rounded-full ${
                                mp.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {mp.user.pseudo}
                              {mp.status === 'waiting' && ' (attente)'}
                            </span>
                          ))}
                          {match.matchPlayers.length > 6 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              +{match.matchPlayers.length - 6} autres
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function AdminMatchesPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      {(user) => <AdminMatchesContent />}
    </ProtectedRoute>
  )
}