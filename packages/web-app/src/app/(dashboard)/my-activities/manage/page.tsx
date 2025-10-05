'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { SPORTS_CONFIG } from '@/config/sports'
import { useRecurringActivities } from '@/hooks/useRecurringActivities'
import { formatDateTime } from '@/lib/utils/date'
import { User } from '@/types'
import { Activity, ActivitySession, DAY_LABELS, RECURRING_TYPE_LABELS } from '@/types/activity'
import Image from 'next/image'

export default function ManageActivitiesPage() {
  const user = useCurrentUser()
  const router = useRouter()
  const { createdActivities, loadingCreated, fetchCreatedActivities } = useRecurringActivities(user.id)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [selectedSessions, setSelectedSessions] = useState<ActivitySession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Charger les sessions d'une activité
  const loadActivitySessions = async (activityId: string) => {
    setLoadingSessions(true)
    try {
      const response = await fetch(`/api/activities/${activityId}/sessions?includeParticipants=true`)
      const data = await response.json()

      if (data.success) {
        setSelectedSessions(data.data.sessions)
        setSelectedActivity(data.data.activity)
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du chargement des sessions' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setLoadingSessions(false)
    }
  }

  // Annuler une session
  const cancelSession = async (activityId: string, sessionId: string) => {
    setActionLoading(sessionId)
    setMessage(null)

    try {
      const response = await fetch(`/api/activities/${activityId}/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Session annulée avec succès' })
        // Recharger les sessions
        await loadActivitySessions(activityId)
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'annulation' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setActionLoading(null)
    }
  }

  // Modifier le nombre de participants d'une session
  const updateSessionMaxPlayers = async (activityId: string, sessionId: string, newMaxPlayers: number) => {
    setActionLoading(sessionId)
    setMessage(null)

    try {
      const response = await fetch(`/api/activities/${activityId}/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPlayers: newMaxPlayers })
      })
      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Session mise à jour avec succès' })
        // Recharger les sessions
        await loadActivitySessions(activityId)
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setActionLoading(null)
    }
  }

  if (loadingCreated) {
    return (
      
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      
    )
  }

  if (createdActivities.length === 0) {
    return (
      
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune activité créée</h2>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas encore créé d'activité. Commencez par en créer une !
          </p>
          <button
            onClick={() => router.push('/create-activity')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Créer ma première activité
          </button>
        </div>
      
    )
  }

  return (
    
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des activités</h1>
              <p className="mt-2 text-gray-600">
                Gérez vos activités créées et leurs sessions
              </p>
            </div>
            <button
              onClick={() => router.push('/create-activity')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Nouvelle activité
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Liste des activités */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Mes activités ({createdActivities.length})
            </h2>

            {createdActivities.map((activity) => (
              <ActivityManagementCard
                key={activity.id}
                activity={activity}
                isSelected={selectedActivity?.id === activity.id}
                onClick={() => loadActivitySessions(activity.id)}
              />
            ))}
          </div>

          {/* Sessions de l'activité sélectionnée */}
          <div>
            {selectedActivity ? (
              <div className="bg-white rounded-lg shadow border p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="relative w-10 h-10">
                    <Image
                      src={SPORTS_CONFIG[selectedActivity.sport].icon}
                      alt={SPORTS_CONFIG[selectedActivity.sport].name}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedActivity.name}</h3>
                    <p className="text-sm text-gray-500">
                      {SPORTS_CONFIG[selectedActivity.sport].name} - {RECURRING_TYPE_LABELS[selectedActivity.recurringType]}
                    </p>
                  </div>
                </div>

                {loadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : selectedSessions.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Sessions ({selectedSessions.length})
                    </h4>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedSessions.map((session) => (
                        <SessionManagementCard
                          key={session.id}
                          session={session}
                          activityId={selectedActivity.id}
                          onCancel={cancelSession}
                          onUpdateMaxPlayers={updateSessionMaxPlayers}
                          loading={actionLoading === session.id}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucune session trouvée</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Sélectionnez une activité</h3>
                <p className="text-gray-500">Cliquez sur une activité à gauche pour voir ses sessions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    
  )
}

// Composant pour la carte d'activité
function ActivityManagementCard({
  activity,
  isSelected,
  onClick
}: {
  activity: Activity
  isSelected: boolean
  onClick: () => void
}) {
  const sportConfig = SPORTS_CONFIG[activity.sport]

  return (
    <div
      className={`bg-white rounded-lg shadow border p-4 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="relative w-10 h-10 flex-shrink-0">
          <Image
            src={sportConfig.icon}
            alt={sportConfig.name}
            fill
            className="rounded-lg object-cover"
          />
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{activity.name}</h4>
          <p className="text-sm text-gray-600">{sportConfig.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {DAY_LABELS[activity.recurringDays[0]]} {activity.recurringDays.length > 1 && `+${activity.recurringDays.length - 1} autres`}
            • {RECURRING_TYPE_LABELS[activity.recurringType]}
          </p>

          {/* Statistiques si disponibles */}
          {(activity as any).upcomingSessionsCount !== undefined && (
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>📅 {(activity as any).upcomingSessionsCount} sessions à venir</span>
              <span>👥 {(activity as any).totalParticipations || 0} inscriptions</span>
            </div>
          )}
        </div>

        <div className="text-right">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
          }`}>
            {activity.maxPlayers} max
          </span>
        </div>
      </div>
    </div>
  )
}

// Composant pour la gestion d'une session
function SessionManagementCard({
  session,
  activityId,
  onCancel,
  onUpdateMaxPlayers,
  loading
}: {
  session: any
  activityId: string
  onCancel: (activityId: string, sessionId: string) => void
  onUpdateMaxPlayers: (activityId: string, sessionId: string, maxPlayers: number) => void
  loading: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [newMaxPlayers, setNewMaxPlayers] = useState(session.maxPlayers)

  const handleSaveMaxPlayers = () => {
    if (newMaxPlayers !== session.maxPlayers && newMaxPlayers >= session.stats.confirmedCount) {
      onUpdateMaxPlayers(activityId, session.id, newMaxPlayers)
    }
    setIsEditing(false)
  }

  const isPast = new Date(session.date) < new Date()
  const canEdit = !isPast && !session.isCancelled

  return (
    <div className={`p-4 border rounded-lg ${
      session.isCancelled ? 'bg-red-50 border-red-200' :
      isPast ? 'bg-gray-50 border-gray-200' :
      'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-gray-900">
              {formatDateTime(session.date)}
            </span>
            {session.isCancelled && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Annulée
              </span>
            )}
            {isPast && !session.isCancelled && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Terminée
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>👥 {session.stats.confirmedCount} confirmés</span>
            <span>⏳ {session.stats.waitingCount} en attente</span>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <span>Max:</span>
                <input
                  type="number"
                  value={newMaxPlayers}
                  onChange={(e) => setNewMaxPlayers(parseInt(e.target.value) || 0)}
                  min={session.stats.confirmedCount}
                  max={30}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  disabled={loading}
                />
                <button
                  onClick={handleSaveMaxPlayers}
                  disabled={loading}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setNewMaxPlayers(session.maxPlayers)
                  }}
                  disabled={loading}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ✗
                </button>
              </div>
            ) : (
              <span>📊 /{session.maxPlayers} max</span>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                disabled={loading}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Modifier
              </button>
            )}
            <button
              onClick={() => onCancel(activityId, session.id)}
              disabled={loading}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Annuler'}
            </button>
          </div>
        )}
      </div>

      {/* Participants */}
      {session.participants && session.participants.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {session.participants.slice(0, 5).map((participant: any) => (
              <span
                key={participant.id}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  participant.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  participant.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}
              >
                {participant.user.pseudo}
              </span>
            ))}
            {session.participants.length > 5 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                +{session.participants.length - 5} autres
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}