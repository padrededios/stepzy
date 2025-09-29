'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SPORTS_CONFIG, type SportType } from '@/config/sports'
import { useActivities, type Activity } from '@/hooks/useActivities'
import { formatDateTime } from '@/lib/utils/date'
import { User } from '@/types'
import Image from 'next/image'


function MesActivitesContent({ user }: { user: User }) {
  const { getUserActivities, loading } = useActivities(user.id)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  const { upcoming: upcomingActivities, past: pastActivities } = getUserActivities()

  const getStatusBadge = (activity: Activity) => {
    if (activity.isWaitingList) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Liste d\'attente
        </span>
      )
    }

    if (activity.isParticipant) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Confirmé
        </span>
      )
    }

    if (activity.status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Terminé
        </span>
      )
    }

    return null
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Mes activités</h1>
          <p className="mt-2 text-gray-600">
            Retrouvez toutes vos activités passées et à venir
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activités à venir ({upcomingActivities.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'past'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historique ({pastActivities.length})
            </button>
          </nav>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {activeTab === 'upcoming' ? (
            upcomingActivities.length > 0 ? (
              upcomingActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} getStatusBadge={getStatusBadge} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m0-10V7m0 10V7m6 0v10m0-10V7" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune activité à venir</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Inscrivez-vous à de nouvelles activités pour les voir apparaître ici.
                </p>
              </div>
            )
          ) : (
            pastActivities.length > 0 ? (
              pastActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} getStatusBadge={getStatusBadge} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun historique</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Vos activités passées apparaîtront ici après votre participation.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function MesActivitesPage() {
  return (
    <ProtectedRoute>
      {(user) => <MesActivitesContent user={user} />}
    </ProtectedRoute>
  )
}

function ActivityCard({
  activity,
  getStatusBadge
}: {
  activity: Activity
  getStatusBadge: (activity: Activity) => JSX.Element | null
}) {
  const router = useRouter()
  const sportConfig = SPORTS_CONFIG[activity.sport]

  const handleClick = () => {
    router.push(`/matches/${activity.id}`)
  }

  return (
    <div
      className="bg-white rounded-lg shadow border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {/* Sport Icon */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src={sportConfig.icon}
              alt={sportConfig.name}
              fill
              className="rounded-lg object-cover"
            />
          </div>

          {/* Activity Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">{sportConfig.name}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-20 ${sportConfig.color} text-gray-800`}>
                {activity.currentPlayers}/{activity.maxPlayers} joueurs
              </span>
            </div>

            <p className="text-sm text-gray-600 mt-1">
              {formatDateTime(activity.date)}
            </p>

            {activity.description && (
              <p className="text-sm text-gray-500 mt-2">{activity.description}</p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end space-y-2">
          {getStatusBadge(activity)}
        </div>
      </div>
    </div>
  )
}

