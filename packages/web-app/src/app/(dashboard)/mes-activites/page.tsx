'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { SPORTS_CONFIG, type SportType } from '@/config/sports'
import { useActivities, type Activity } from '@/hooks/useActivities'
import Image from 'next/image'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { JoinByCodeCard } from '@/components/activities/JoinByCodeCard'
import { formatActivityCode } from '@stepzy/shared'
import { activitiesApi } from '@/lib/api'


export default function SInscrirePage() {
  const user = useCurrentUser()
  const {
    getAvailableActivities,
    registerForActivity,
    unregisterFromActivity,
    joinByCode,
    leaveActivity,
    loading
  } = useActivities(user.id)

  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'sport'>('name')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    activityId: string | null
    activityName: string
    type: 'leave' | 'quit'
  }>({
    isOpen: false,
    activityId: null,
    activityName: '',
    type: 'leave'
  })

  const activities = getAvailableActivities()

  const handleManageActivity = (activityId: string) => {
    // Rediriger vers la page de gestion de l'activité
    // TODO: Implémenter la page de gestion
    alert('Fonctionnalité de gestion à implémenter')
  }

  const handleJoinActivity = async (activityId: string) => {
    setActionLoading(activityId)
    setMessage(null)

    try {
      const result = await registerForActivity(activityId)

      if (result?.success) {
        setMessage({ type: 'success', text: 'Inscription réussie' })
      } else {
        setMessage({ type: 'error', text: result?.error || 'Erreur lors de l\'inscription' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleLeaveActivity = async (activityId: string, activityName: string) => {
    setConfirmDialog({
      isOpen: true,
      activityId,
      activityName,
      type: 'leave'
    })
  }

  const handleQuitActivity = async (activityId: string, activityName: string) => {
    setConfirmDialog({
      isOpen: true,
      activityId,
      activityName,
      type: 'quit'
    })
  }

  const handleConfirmAction = async () => {
    if (!confirmDialog.activityId) return

    setActionLoading(confirmDialog.activityId)
    setMessage(null)

    try {
      const result = confirmDialog.type === 'leave'
        ? await unregisterFromActivity(confirmDialog.activityId)
        : await leaveActivity(confirmDialog.activityId)

      if (result?.success) {
        setMessage({
          type: 'success',
          text: confirmDialog.type === 'leave'
            ? 'Désinscription réussie'
            : 'Vous avez quitté l\'activité'
        })
      } else {
        setMessage({ type: 'error', text: result?.error || 'Erreur lors de l\'opération' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setActionLoading(null)
      setConfirmDialog({
        isOpen: false,
        activityId: null,
        activityName: '',
        type: 'leave'
      })
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
          onConfirm={handleConfirmAction}
          title={confirmDialog.type === 'leave' ? 'Se désinscrire de l\'activité' : 'Quitter l\'activité'}
          message={
            confirmDialog.type === 'leave'
              ? `Êtes-vous sûr de vouloir vous désinscrire de "${confirmDialog.activityName}" et de toutes ses sessions futures ?`
              : `Êtes-vous sûr de vouloir quitter définitivement "${confirmDialog.activityName}" ? Elle ne sera plus visible dans votre liste.`
          }
          confirmText={confirmDialog.type === 'leave' ? 'Se désinscrire' : 'Quitter'}
          cancelText="Annuler"
          isLoading={actionLoading === confirmDialog.activityId}
        />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Sport Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sport :</label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value as SportType | 'all')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {/* Activities */}
          {filteredAndSortedActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onJoin={handleJoinActivity}
              onLeave={(id) => handleLeaveActivity(id, activity.name)}
              onQuit={(id) => handleQuitActivity(id, activity.name)}
              onManage={handleManageActivity}
              isSubscribed={activity.isSubscribed}
              loading={actionLoading === activity.id}
            />
          ))}

          {/* Join by Code Card */}
          <JoinByCodeCard onJoin={joinByCode} />

          {/* Create Activity Card */}
          <CreateActivityCard />
        </div>

        {/* Empty state */}
        {filteredAndSortedActivities.length === 0 && (
          <div className="text-center py-12 col-span-full">
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
  )
}

function CreateActivityCard() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/create-activity')
  }

  return (
    <div
      className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-105"
      onClick={handleClick}
    >
      {/* Header with gradient */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Créer une activité</h3>
            <p className="text-sm text-white opacity-90">
              Nouvelle activité récurrente
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        <p className="text-gray-600 text-sm mb-4">
          Créez une nouvelle activité sportive récurrente et invitez d'autres joueurs à vous rejoindre.
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Définissez les jours et horaires</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Choisissez le sport et le nombre de joueurs</span>
          </div>
        </div>

        {/* Action button */}
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
        >
          Créer une activité
        </button>
      </div>
    </div>
  )
}

function ActivityCard({
  activity,
  onJoin,
  onLeave,
  onQuit,
  onManage,
  isSubscribed,
  loading
}: {
  activity: Activity
  onJoin: (id: string) => void
  onLeave: (id: string) => void
  onQuit: (id: string) => void
  onManage: (id: string) => void
  isSubscribed: boolean
  loading: boolean
}) {
  const sportConfig = SPORTS_CONFIG[activity.sport]
  const userIsSubscribed = isSubscribed || activity.isParticipant
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const canQuit = !userIsSubscribed && !activity.canManage // Peut quitter si désinscrit et non créateur

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

  // Copier le code dans le presse-papiers
  const handleCopyCode = async () => {
    const success = await activitiesApi.copyCodeToClipboard(activity.code)
    if (success) {
      setCopyFeedback('Code copié !')
      setTimeout(() => setCopyFeedback(null), 2000)
    } else {
      setCopyFeedback('Erreur de copie')
      setTimeout(() => setCopyFeedback(null), 2000)
    }
  }

  // Copier le lien de partage
  const handleCopyLink = async () => {
    const link = activitiesApi.generateShareLink(activity.code)
    try {
      await navigator.clipboard.writeText(link)
      setCopyFeedback('Lien copié !')
      setTimeout(() => setCopyFeedback(null), 2000)
    } catch (error) {
      setCopyFeedback('Erreur de copie')
      setTimeout(() => setCopyFeedback(null), 2000)
    }
  }

  // Partager par email
  const handleShareByEmail = () => {
    // Formater les jours de récurrence pour l'email
    const dayLabels: Record<string, string> = {
      monday: 'Lundi',
      tuesday: 'Mardi',
      wednesday: 'Mercredi',
      thursday: 'Jeudi',
      friday: 'Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche'
    }
    const formattedDays = activity.recurringDays.map(day => dayLabels[day] || day).join(', ')
    const recurringTypeLabel = activity.recurringType === 'weekly' ? 'hebdomadaire' : 'mensuel'

    const subject = `Invitation a rejoindre l'activite "${activity.name}"`
    const shareLink = activitiesApi.generateShareLink(activity.code)

    // Message simplifié sans emojis ni caractères spéciaux pour meilleure compatibilité
    const body = `Bonjour,

Je t'invite a rejoindre mon activite "${activity.name}" sur Stepzy.

INFORMATIONS :
- Sport : ${sportConfig.name}
- Recurrence : ${formattedDays} (${recurringTypeLabel})
- Horaires : ${activity.startTime} - ${activity.endTime}
- Joueurs : Jusqu'a ${activity.maxPlayers} par session

CODE D'INVITATION : ${formatActivityCode(activity.code)}

POUR REJOINDRE :

Option 1 - Lien direct :
${shareLink}

Option 2 - Code manuel :
1. Ouvre Stepzy
2. Va sur "S'inscrire"
3. Clique sur "Rejoindre avec un code"
4. Entre le code : ${activity.code}

A bientot sur le terrain !

--
Envoye depuis Stepzy - Plateforme Multisports`

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const getActionButtons = () => {
    const buttons = []

    // Bouton principal : S'inscrire ou voir les sessions
    if (userIsSubscribed) {
      buttons.push(
        <button
          key="unsubscribe"
          onClick={() => onLeave(activity.id)}
          disabled={loading}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Désinscription...' : 'Se désinscrire'}
        </button>
      )
    } else {
      buttons.push(
        <button
          key="subscribe"
          onClick={() => onJoin(activity.id)}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Inscription...' : 'S\'inscrire'}
        </button>
      )
    }

    // Bouton de gestion pour le créateur
    if (activity.canManage) {
      buttons.push(
        <button
          key="manage"
          onClick={() => onManage(activity.id)}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Gérer
        </button>
      )
    }

    // Bouton "Quitter" visible seulement si désinscrit et non créateur
    if (canQuit) {
      buttons.push(
        <button
          key="quit"
          onClick={() => onQuit(activity.id)}
          disabled={loading}
          className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Quitter l'activité"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
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
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:scale-105">
      {/* Header with sport info */}
      <div className={`px-6 py-4 ${sportConfig.color}`}>
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

        {/* Code de partage pour les créateurs */}
        {activity.canManage && (
          <div className="mb-4 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span className="text-sm font-semibold text-teal-900">Code d'invitation</span>
            </div>

            {/* Code display */}
            <div className="bg-white border border-teal-300 rounded-md p-2 mb-3 text-center">
              <span className="text-lg font-mono font-bold text-teal-700 tracking-widest">
                {formatActivityCode(activity.code)}
              </span>
            </div>

            {/* Feedback message */}
            {copyFeedback && (
              <div className="mb-2 text-xs text-center text-teal-700 font-medium">
                {copyFeedback}
              </div>
            )}

            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-medium transition-colors"
                title="Copier le code"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Code</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors"
                title="Copier le lien d'invitation"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Lien</span>
              </button>

              <button
                onClick={handleShareByEmail}
                className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                title="Partager par email"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Email</span>
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {getActionButtons()}
      </div>
    </div>
  )
}