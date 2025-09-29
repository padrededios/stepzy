'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SportType, getSportConfig } from '@/config/sports'
import { formatDate, formatTime } from '@/lib/utils/date'
import { User, Match, MatchPlayer } from '@/types'

interface MatchCardProps {
  match: Match
  currentUser: User
  onUpdate?: () => void
}

export function MatchCard({ match, currentUser, onUpdate }: MatchCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const currentUserPlayer = match.players.find(p => p.user.id === currentUser.id)
  const currentUserWaiting = match.waitingList.find(p => p.user.id === currentUser.id)
  const isUserInMatch = !!currentUserPlayer || !!currentUserWaiting
  
  const confirmedPlayers = match.players.filter(p => p.status === 'confirmed')
  const spotsAvailable = match.maxPlayers - confirmedPlayers.length
  const isMatchFull = spotsAvailable <= 0
  const waitingPosition = currentUserWaiting ? 
    match.waitingList.findIndex(p => p.user.id === currentUser.id) + 1 : 0

  const handleJoinMatch = async () => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/matches/${match.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      onUpdate?.()
    } catch (err) {
      // Join match error handled with user feedback
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'action')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveMatch = async () => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/matches/${match.id}/leave`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la désinscription')
      }

      onUpdate?.()
    } catch (err) {
      // Leave match error handled with user feedback
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'action')
    } finally {
      setIsLoading(false)
    }
  }

  const renderPlayerAvatars = (players: MatchPlayer[], maxDisplay = 6) => {
    const displayPlayers = players.slice(0, maxDisplay)
    const remainingCount = Math.max(0, players.length - maxDisplay)

    return (
      <div className="flex -space-x-2">
        {displayPlayers.map((player) => (
          <div
            key={player.id}
            className="relative w-8 h-8 rounded-full border-2 border-white bg-gray-100"
            title={player.user.pseudo}
          >
            <Image
              src={player.user.avatar || 
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user.pseudo)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`}
              alt={`Avatar de ${player.user.pseudo}`}
              fill
              className="rounded-full object-cover"
            />
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="relative w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">+{remainingCount}</span>
          </div>
        )}
      </div>
    )
  }

  const getStatusBadge = () => {
    if (match.status === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Annulé
        </span>
      )
    }

    if (match.status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Terminé
        </span>
      )
    }

    if (isMatchFull) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Match complet
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Ouvert
      </span>
    )
  }

  const getActionButton = () => {
    if (match.status === 'cancelled' || match.status === 'completed') {
      return null
    }

    // Check if registrations are closed (15 minutes before match start)
    const now = new Date()
    const matchDate = new Date(match.date)
    const minutesUntilMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60)
    const registrationsClosed = minutesUntilMatch <= 15

    if (registrationsClosed && !isUserInMatch) {
      return (
        <div className="w-full px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-md text-center">
          Inscriptions fermées
        </div>
      )
    }

    if (currentUserPlayer) {
      return (
        <button
          onClick={handleLeaveMatch}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Quitter...' : "Quitter l'activité"}
        </button>
      )
    }

    if (currentUserWaiting) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-medium">
            Position {waitingPosition} en liste d'attente
          </p>
          <button
            onClick={handleLeaveMatch}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Quitter...' : "Quitter la liste d'attente"}
          </button>
        </div>
      )
    }

    if (isMatchFull) {
      return (
        <button
          onClick={handleJoinMatch}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Rejoindre...' : 'Rejoindre la liste d\'attente'}
        </button>
      )
    }

    return (
      <button
        onClick={handleJoinMatch}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Rejoindre...' : "Rejoindre l'activité"}
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center mb-2">
            <div className="relative w-8 h-8 mr-3">
              <Image
                src={getSportConfig(match.sport).icon}
                alt={getSportConfig(match.sport).name}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {getSportConfig(match.sport).name}
            </h3>
          </div>
          <p className="text-sm font-medium text-gray-900 capitalize">
            {formatDate(match.date)}
          </p>
          <p className="text-sm text-gray-600">
            {formatTime(match.date)}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Match Info */}
      <div className="space-y-4">
        {/* Player Count */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {confirmedPlayers.length} / {match.maxPlayers} joueurs
            </p>
            {match.waitingList.length > 0 && (
              <p className="text-xs text-gray-500">
                {match.waitingList.length} en attente
              </p>
            )}
          </div>
        </div>

        {/* Players */}
        {confirmedPlayers.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Joueurs confirmés</p>
            {renderPlayerAvatars(confirmedPlayers)}
          </div>
        )}

        {/* Waiting List */}
        {match.waitingList.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Liste d'attente</p>
            {renderPlayerAvatars(match.waitingList, 4)}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {getActionButton()}
        </div>

        {/* View Details Link */}
        <div className="pt-2 border-t border-gray-100">
          <Link
            href={`/matches/${match.id}`}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Voir les détails de l&apos;activité →
          </Link>
        </div>
      </div>
    </div>
  )
}