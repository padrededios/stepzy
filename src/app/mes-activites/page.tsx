'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SPORTS_CONFIG, type SportType } from '@/config/sports'
import { useActivities, type Activity } from '@/hooks/useActivities'
import { useRecurringActivities } from '@/hooks/useRecurringActivities'
import { formatDateTime } from '@/lib/utils/date'
import { User } from '@/types'
import { Activity as RecurringActivity, SessionWithParticipants, PARTICIPANT_STATUS_LABELS } from '@/types/activity'
import Image from 'next/image'


function MesActivitesContent({ user }: { user: User }) {
  const { getUserActivities, loading } = useActivities(user.id)
  const {
    participationActivities,
    availableSessions,
    loadingParticipations,
    loadingAvailable,
    joinSession,
    leaveSession
  } = useRecurringActivities(user.id)

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'available'>('upcoming')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Combiner les anciennes activités et les nouvelles
  const { upcoming: upcomingActivities, past: pastActivities } = getUserActivities()
  const upcomingRecurring = participationActivities.upcoming
  const pastRecurring = participationActivities.past

  // Actions pour les sessions
  const handleJoinSession = async (sessionId: string) => {
    setActionLoading(sessionId)
    setMessage(null)

    try {
      const result = await joinSession(sessionId)
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Inscription réussie' })
      } else {
        setMessage({ type: 'error', text: result.message || 'Erreur lors de l\'inscription' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleLeaveSession = async (sessionId: string) => {
    setActionLoading(sessionId)
    setMessage(null)

    try {
      const result = await leaveSession(sessionId)
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Désinscription réussie' })
      } else {
        setMessage({ type: 'error', text: result.message || 'Erreur lors de la désinscription' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setActionLoading(null)
    }
  }

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

  const getSessionStatusBadge = (session: any) => {
    if (session.userStatus?.isParticipant) {
      const status = session.userStatus.status
      const colors = {
        confirmed: 'bg-green-100 text-green-800',
        waiting: 'bg-yellow-100 text-yellow-800',
        interested: 'bg-blue-100 text-blue-800'
      }
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
          {PARTICIPANT_STATUS_LABELS[status] || status}
        </span>
      )
    }
    return null
  }

  if (loading && loadingParticipations) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes activités</h1>
              <p className="mt-2 text-gray-600">
                Retrouvez toutes vos activités passées et à venir
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/create-activity'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Créer une activité
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-md border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

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
              Mes participations ({upcomingActivities.length + upcomingRecurring.length})
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sessions disponibles ({availableSessions.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'past'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historique ({pastActivities.length + pastRecurring.length})
            </button>
          </nav>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {activeTab === 'upcoming' && (
            <>
              {/* Anciennes activités */}
              {upcomingActivities.map((activity) => (
                <ActivityCard key={`old-${activity.id}`} activity={activity} getStatusBadge={getStatusBadge} />
              ))}

              {/* Nouvelles activités récurrentes */}
              {upcomingRecurring.map((activity) => (
                <RecurringActivityCard key={`rec-${activity.id}`} activity={activity} />
              ))}

              {upcomingActivities.length === 0 && upcomingRecurring.length === 0 && (
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
              )}
            </>
          )}

          {activeTab === 'available' && (
            <>
              {loadingAvailable ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : availableSessions.length > 0 ? (
                availableSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onJoin={handleJoinSession}
                    loading={actionLoading === session.id}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune session disponible</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Les nouvelles sessions apparaîtront ici quand elles seront créées.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'past' && (
            <>
              {pastActivities.map((activity) => (
                <ActivityCard key={`old-past-${activity.id}`} activity={activity} getStatusBadge={getStatusBadge} />
              ))}

              {pastRecurring.map((activity) => (
                <RecurringActivityCard key={`rec-past-${activity.id}`} activity={activity} />
              ))}

              {pastActivities.length === 0 && pastRecurring.length === 0 && (
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
              )}
            </>
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

// Nouveau composant pour les activités récurrentes
function RecurringActivityCard({ activity }: { activity: RecurringActivity }) {
  const sportConfig = SPORTS_CONFIG[activity.sport]

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{activity.name}</h3>
              <p className="text-sm text-gray-500">{sportConfig.name}</p>
              {activity.description && (
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Récurrent
              </span>
            </div>
          </div>

          {/* Sessions à venir */}
          {activity.sessions && activity.sessions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Prochaines sessions :</h4>
              <div className="space-y-1">
                {activity.sessions.slice(0, 3).map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">
                      {formatDateTime(session.date)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {session.confirmedParticipants || 0}/{session.maxPlayers} joueurs
                      </span>
                      {session.userStatus?.isParticipant && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          session.userStatus.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          session.userStatus.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {PARTICIPANT_STATUS_LABELS[session.userStatus.status]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Nouveau composant pour les sessions disponibles
function SessionCard({
  session,
  onJoin,
  loading
}: {
  session: any
  onJoin: (sessionId: string) => void
  loading: boolean
}) {
  const sportConfig = SPORTS_CONFIG[session.activity.sport]
  const canJoin = session.userStatus?.canJoin && !session.userStatus?.isParticipant

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
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

        {/* Session Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{session.activity.name}</h3>
              <p className="text-sm text-gray-500">{sportConfig.name}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {session.stats.confirmedCount}/{session.maxPlayers} joueurs
              </span>
              {session.stats.availableSpots === 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Complet
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            📅 {formatDateTime(session.date)}
          </p>

          {session.activity.description && (
            <p className="text-sm text-gray-500 mb-4">{session.activity.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Créé par <strong>{session.activity.creator.pseudo}</strong>
            </div>

            {canJoin ? (
              <button
                onClick={() => onJoin(session.id)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {loading ? 'Inscription...' : 'Rejoindre'}
              </button>
            ) : session.userStatus?.isParticipant ? (
              <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                session.userStatus.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                session.userStatus.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {PARTICIPANT_STATUS_LABELS[session.userStatus.status]}
              </span>
            ) : (
              <span className="text-sm text-gray-400">Non disponible</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

