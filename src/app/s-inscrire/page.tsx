'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SPORTS_CONFIG, type SportType } from '@/config/sports'
import { useActivities, type Activity } from '@/hooks/useActivities'
import Image from 'next/image'

interface User {
  id: string
  pseudo: string
  email: string
  role: 'user' | 'root'
}

// Utility function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function SInscrireContent({ user }: { user: User }) {
  const {
    getAvailableActivities,
    registerForActivity,
    unregisterFromActivity,
    joinWaitingList,
    loading
  } = useActivities(user.id)

  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'sport'>('date')

  const activities = getAvailableActivities()

  const handleJoinMatch = (activityId: string) => {
    registerForActivity(activityId)
  }

  const handleLeaveMatch = (activityId: string) => {
    unregisterFromActivity(activityId)
  }

  const handleJoinWaitingList = (activityId: string) => {
    joinWaitingList(activityId)
  }

  const filteredAndSortedActivities = activities
    .filter(activity => selectedSport === 'all' || activity.sport === selectedSport)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      } else {
        return SPORTS_CONFIG[a.sport].name.localeCompare(SPORTS_CONFIG[b.sport].name)
      }
    })

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">S'inscrire à une activité</h1>
          <p className="mt-2 text-gray-600">
            Découvrez toutes les activités sportives disponibles et inscrivez-vous
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Sport Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sport :</label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value as SportType | 'all')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les sports</option>
                {Object.values(SPORTS_CONFIG).map(sport => (
                  <option key={sport.id} value={sport.id}>{sport.name}</option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Trier par :</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'sport')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="sport">Sport</option>
              </select>
            </div>

            {/* Results count */}
            <div className="ml-auto text-sm text-gray-500">
              {filteredAndSortedActivities.length} activité{filteredAndSortedActivities.length > 1 ? 's' : ''} trouvée{filteredAndSortedActivities.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Activities Grid */}
        {filteredAndSortedActivities.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onJoin={handleJoinMatch}
                onLeave={handleLeaveMatch}
                onJoinWaitingList={handleJoinWaitingList}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune activité trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">
              Essayez de modifier vos filtres pour voir plus d'activités.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function SInscrirePage() {
  return (
    <ProtectedRoute>
      {(user) => <SInscrireContent user={user} />}
    </ProtectedRoute>
  )
}

function ActivityCard({
  activity,
  onJoin,
  onLeave,
  onJoinWaitingList
}: {
  activity: Activity
  onJoin: (id: string) => void
  onLeave: (id: string) => void
  onJoinWaitingList: (id: string) => void
}) {
  const sportConfig = SPORTS_CONFIG[activity.sport]
  const spotsLeft = activity.maxPlayers - activity.currentPlayers
  const isNearlyFull = spotsLeft <= 2 && spotsLeft > 0

  const getActionButton = () => {
    if (activity.status === 'cancelled') {
      return (
        <button disabled className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed">
          Activité annulée
        </button>
      )
    }

    if (activity.isParticipant) {
      return (
        <button
          onClick={() => onLeave(activity.id)}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
        >
          Se désinscrire
        </button>
      )
    }

    if (activity.isWaitingList) {
      return (
        <button disabled className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed">
          En liste d\'attente
        </button>
      )
    }

    if (activity.status === 'full') {
      return (
        <button
          onClick={() => onJoinWaitingList(activity.id)}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
        >
          Rejoindre la liste d\'attente
        </button>
      )
    }

    return (
      <button
        onClick={() => onJoin(activity.id)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
      >
        S'inscrire
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      {/* Header with sport info */}
      <div className={`px-6 py-4 ${sportConfig.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <Image
                src={sportConfig.icon}
                alt={sportConfig.name}
                fill
                className="rounded-lg object-cover"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{sportConfig.name}</h3>
              <p className="text-sm text-white opacity-90">
                {formatDate(activity.date)}
              </p>
            </div>
          </div>

          {isNearlyFull && (
            <span className="bg-white bg-opacity-20 text-white px-2 py-1 rounded-full text-xs font-medium">
              Plus que {spotsLeft} place{spotsLeft > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {activity.description && (
          <p className="text-gray-600 text-sm mb-4">{activity.description}</p>
        )}

        {/* Players info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm text-gray-600">
              {activity.currentPlayers}/{activity.maxPlayers} joueurs
            </span>
          </div>

          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                activity.status === 'full' ? 'bg-red-500' :
                isNearlyFull ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${(activity.currentPlayers / activity.maxPlayers) * 100}%` }}
            />
          </div>
        </div>

        {/* Action button */}
        {getActionButton()}
      </div>
    </div>
  )
}