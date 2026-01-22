'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { SPORTS_CONFIG, type SportType } from '@/config/sports'
import { useRecurringActivities } from '@/hooks/useRecurringActivities'
import { formatDateTime } from '@/lib/utils/date'
import { Activity, SessionWithParticipants, ParticipantStatus, PARTICIPANT_STATUS_LABELS } from '@/types/activity'
import Image from 'next/image'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'


export default function MesActivitesPage() {
  const user = useCurrentUser()
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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    activityId: string | null
    activityName: string
  }>({
    isOpen: false,
    activityId: null,
    activityName: ''
  })
  const router = useRouter()

  // Utiliser uniquement les nouvelles participations aux activités récurrentes
  const upcomingParticipations = participationActivities.upcoming.filter(s => s.activity)
  const pastParticipations = participationActivities.past.filter(s => s.activity)

  // Regrouper les sessions par activité pour l'onglet "Mes participations"
  const groupedUpcomingByActivity = upcomingParticipations.reduce((acc, session) => {
    const activityId = session.activity!.id
    if (!acc[activityId]) {
      acc[activityId] = {
        activity: session.activity!,
        sessions: []
      }
    }
    acc[activityId].sessions.push(session)
    return acc
  }, {} as Record<string, { activity: any; sessions: any[] }>)

  const groupedPastByActivity = pastParticipations.reduce((acc, session) => {
    const activityId = session.activity!.id
    if (!acc[activityId]) {
      acc[activityId] = {
        activity: session.activity!,
        sessions: []
      }
    }
    acc[activityId].sessions.push(session)
    return acc
  }, {} as Record<string, { activity: any; sessions: any[] }>)

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

  const handleUnsubscribeFromActivity = async (activityId: string, activityName: string) => {
    setConfirmDialog({
      isOpen: true,
      activityId,
      activityName
    })
  }

  const handleConfirmUnsubscribe = async () => {
    if (!confirmDialog.activityId) return

    setActionLoading(confirmDialog.activityId)
    setMessage(null)

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_BASE_URL}/api/activities/${confirmDialog.activityId}/subscribe`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Désinscription réussie' })
        // Recharger la page pour mettre à jour les données
        router.refresh()
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la désinscription' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setActionLoading(null)
      setConfirmDialog({
        isOpen: false,
        activityId: null,
        activityName: ''
      })
    }
  }

  const getSessionStatusBadge = (session: any) => {
    if (session.userStatus?.isParticipant) {
      const status = session.userStatus.status as ParticipantStatus
      const colors: Record<string, string> = {
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

  if (loadingParticipations && loadingAvailable) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
        {/* Toast Notification */}
        {message && (
          <Toast
            message={message.text}
            type={message.type}
            onClose={() => setMessage(null)}
          />
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          onConfirm={handleConfirmUnsubscribe}
          title="Se désinscrire de l'activité"
          message={`Êtes-vous sûr de vouloir vous désinscrire de "${confirmDialog.activityName}" et de toutes ses sessions futures ?`}
          confirmText="Se désinscrire"
          cancelText="Annuler"
          isLoading={actionLoading === confirmDialog.activityId}
        />

        {/* Tab Navigation - Sticky */}
        <div className="sticky top-16 z-20 bg-[#f5f5f5] -mx-4 px-4 lg:-mx-6 lg:px-6 -mt-6 lg:-mt-8 pt-6 lg:pt-8 pb-4">
          <div className="border-b border-gray-200 bg-white rounded-lg shadow-sm px-4">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upcoming'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mes participations ({upcomingParticipations.length})
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sessions disponibles ({availableSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'past'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Historique ({pastParticipations.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-4 pt-4">
          {activeTab === 'upcoming' && (
            <>
              {loadingParticipations ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : Object.keys(groupedUpcomingByActivity).length > 0 ? (
                Object.values(groupedUpcomingByActivity).map((group) => (
                  <GroupedActivityCard
                    key={group.activity.id}
                    activity={group.activity}
                    sessions={group.sessions}
                    onLeave={handleLeaveSession}
                    loading={actionLoading}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m0-10V7m0 10V7m6 0v10m0-10V7" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune participation à venir</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Vos participations futures apparaîtront ici.
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
                    onLeave={handleLeaveSession}
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
              {loadingParticipations ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : Object.keys(groupedPastByActivity).length > 0 ? (
                Object.values(groupedPastByActivity).map((group) => (
                  <GroupedActivityCard
                    key={group.activity.id}
                    activity={group.activity}
                    sessions={group.sessions}
                    onLeave={handleLeaveSession}
                    loading={actionLoading}
                    isPast={true}
                  />
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
                    Vos participations passées apparaîtront ici.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  )
}

// Composant pour les sessions (participations et disponibles)
function SessionCard({
  session,
  onJoin,
  onLeave,
  loading,
  isPast = false
}: {
  session: any
  onJoin: (sessionId: string) => void
  onLeave: (sessionId: string) => void
  loading: boolean
  isPast?: boolean
}) {
  const sportConfig = SPORTS_CONFIG[session.activity.sport as SportType]
  const canJoin = !isPast && session.userStatus?.canJoin && !session.userStatus?.isParticipant

  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    // Empêcher la navigation si on clique sur un bouton
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    router.push(`/sessions/${session.id}`)
  }

  return (
    <div
      className="bg-white rounded-lg shadow border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleCardClick}
    >
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
              {(() => {
                const confirmedCount = session.stats.confirmedCount || 0
                const minPlayers = session.activity.minPlayers || 2
                const availableSpots = session.stats.availableSpots || 0

                // Si complet
                if (availableSpots === 0) {
                  return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Complet
                    </span>
                  )
                }
                // Si le minimum n'est pas atteint
                else if (confirmedCount < minPlayers) {
                  return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Non confirmée ({confirmedCount}/{minPlayers} min)
                    </span>
                  )
                }
                // Session confirmée avec places disponibles
                else {
                  return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Confirmée
                    </span>
                  )
                }
              })()}
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

            {session.userStatus?.isParticipant ? (
              <button
                onClick={() => onLeave(session.id)}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {loading ? 'Désinscription...' : 'Quitter'}
              </button>
            ) : canJoin ? (
              <button
                onClick={() => onJoin(session.id)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {loading ? 'Inscription...' : 'Rejoindre'}
              </button>
            ) : (
              <span className="text-sm text-gray-400">Non disponible</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant pour afficher une activité avec toutes ses sessions groupées
function GroupedActivityCard({
  activity,
  sessions,
  onLeave,
  loading,
  isPast = false
}: {
  activity: any
  sessions: any[]
  onLeave: (sessionId: string) => void
  loading: string | null
  isPast?: boolean
}) {
  const sportConfig = SPORTS_CONFIG[activity.sport as SportType]
  const router = useRouter()

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      {/* En-tête de l'activité */}
      <div className="flex items-start space-x-4 mb-4">
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
          <h3 className="text-lg font-semibold text-gray-900">{activity.name}</h3>
          <p className="text-sm text-gray-500">{sportConfig.name}</p>
          {activity.description && (
            <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Créé par <strong>{activity.creator.pseudo}</strong>
          </p>
        </div>
      </div>

      {/* Liste des sessions */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {sessions.length} session{sessions.length > 1 ? 's' : ''}
        </h4>
        <div className="space-y-2">
          {sessions.map((session) => {
            const isLoading = loading === session.id
            const confirmedCount = session.stats?.confirmedCount || 0
            const minPlayers = activity.minPlayers || 2
            const availableSpots = session.stats?.availableSpots || 0

            // Déterminer le badge de statut
            let statusBadge
            if (isPast) {
              statusBadge = (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Terminée
                </span>
              )
            } else if (availableSpots === 0) {
              statusBadge = (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Complet
                </span>
              )
            } else if (confirmedCount < minPlayers) {
              statusBadge = (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Non confirmée ({confirmedCount}/{minPlayers})
                </span>
              )
            } else {
              statusBadge = (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Confirmée
                </span>
              )
            }

            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => router.push(`/sessions/${session.id}`)}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      📅 {formatDateTime(session.date)}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-600">
                        {confirmedCount}/{session.maxPlayers} joueurs
                      </span>
                      {statusBadge}
                    </div>
                  </div>
                </div>

                {/* Bouton quitter - seulement pour les sessions futures */}
                {!isPast && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onLeave(session.id)
                    }}
                    disabled={isLoading}
                    className="ml-3 p-1.5 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Quitter cette session"
                  >
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

