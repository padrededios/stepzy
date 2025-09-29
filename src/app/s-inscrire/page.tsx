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


function SInscrireContent({ user }: { user: User }) {
  const {
    getAvailableActivities,
    registerForActivity,
    unregisterFromActivity,
    loading
  } = useActivities(user.id)

  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'sport'>('name')

  const activities = getAvailableActivities()

  const handleManageActivity = (activityId: string) => {
    // Rediriger vers la page de gestion de l'activité
    // TODO: Implémenter la page de gestion
    alert('Fonctionnalité de gestion à implémenter')
  }

  const handleJoinActivity = async (activityId: string) => {
    // Pour l'instant, rediriger vers les sessions disponibles
    // En attendant l'implémentation d'une page dédiée
    window.location.href = '/mes-activites?tab=available'
  }

  const handleLeaveActivity = async (activityId: string) => {
    // Désinscription de toutes les sessions de l'activité
    // TODO: Implémenter une API pour se désinscrire de toutes les sessions d'une activité
    if (confirm('Êtes-vous sûr de vouloir vous désinscrire de toutes les sessions de cette activité ?')) {
      alert('Désinscription de toutes les sessions à implémenter')
      // Recharger la page pour voir les changements
      window.location.reload()
    }
  }

  const filteredAndSortedActivities = activities
    .filter(activity => selectedSport === 'all' || activity.sport === selectedSport)
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
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
                onChange={(e) => setSortBy(e.target.value as 'name' | 'sport')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Nom</option>
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
                onJoin={handleJoinActivity}
                onLeave={handleLeaveActivity}
                onManage={handleManageActivity}
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
  onManage
}: {
  activity: Activity
  onJoin: (id: string) => void
  onLeave: (id: string) => void
  onManage: (id: string) => void
}) {
  const sportConfig = SPORTS_CONFIG[activity.sport]

  // Formater les jours de récurrence
  const formatRecurringDays = (days: string[], type: string) => {
    const dayLabels: Record<string, string> = {
      monday: 'Lundi',
      tuesday: 'Mardi',
      wednesday: 'Mercredi',
      thursday: 'Jeudi',
      friday: 'Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche'
    }

    const formattedDays = days.map(day => dayLabels[day] || day).join(', ')
    return `${formattedDays} (${type === 'weekly' ? 'hebdomadaire' : 'mensuel'})`
  }

  const getActionButtons = () => {
    const buttons = []

    // Bouton principal : S'inscrire ou voir les sessions
    if (activity.isParticipant) {
      buttons.push(
        <button
          key="unsubscribe"
          onClick={() => onLeave(activity.id)}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
        >
          Se désinscrire
        </button>
      )
    } else {
      buttons.push(
        <button
          key="subscribe"
          onClick={() => onJoin(activity.id)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
        >
          S'inscrire
        </button>
      )
    }

    // Bouton de gestion pour le créateur
    if (activity.canManage) {
      buttons.push(
        <button
          key="manage"
          onClick={() => onManage(activity.id)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
        >
          Gérer
        </button>
      )
    }

    return (
      <div className="flex space-x-2">
        {buttons}
      </div>
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
              <h3 className="text-lg font-semibold text-white">{activity.name}</h3>
              <p className="text-sm text-white opacity-90">
                {sportConfig.name}
              </p>
            </div>
          </div>

          {activity.isParticipant && (
            <span className="bg-white bg-opacity-20 text-white px-2 py-1 rounded-full text-xs font-medium">
              Inscrit
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {activity.description && (
          <p className="text-gray-600 text-sm mb-4">{activity.description}</p>
        )}

        {/* Creator info */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            {activity.creator.avatar ? (
              <Image
                src={activity.creator.avatar}
                alt={activity.creator.pseudo}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <span className="text-xs text-gray-500">{activity.creator.pseudo[0]}</span>
            )}
          </div>
          <span className="text-sm text-gray-600">Par {activity.creator.pseudo}</span>
        </div>

        {/* Recurring info */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-600">
              {formatRecurringDays(activity.recurringDays, activity.recurringType)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm text-gray-600">
              Jusqu'à {activity.maxPlayers} joueurs par session
            </span>
          </div>
        </div>

        {/* Action buttons */}
        {getActionButtons()}
      </div>
    </div>
  )
}