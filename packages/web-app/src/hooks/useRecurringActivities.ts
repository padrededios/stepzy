/**
 * Hook pour gérer les nouvelles activités récurrentes et sessions
 */

import { useState, useEffect, useCallback } from 'react'
import { Activity, ActivitySession, SessionWithParticipants } from '@/types/activity'
import { activitiesApi, sessionsApi } from '@/lib/api'

interface UseRecurringActivitiesReturn {
  // Activités créées par l'utilisateur
  createdActivities: Activity[]
  loadingCreated: boolean
  errorCreated: string | null
  fetchCreatedActivities: () => Promise<void>

  // Participations utilisateur
  participationActivities: {
    upcoming: SessionWithParticipants[]
    past: SessionWithParticipants[]
  }
  loadingParticipations: boolean
  errorParticipations: string | null
  fetchParticipations: () => Promise<void>

  // Sessions disponibles
  availableSessions: SessionWithParticipants[]
  loadingAvailable: boolean
  errorAvailable: string | null
  fetchAvailableSessions: (sport?: string) => Promise<void>

  // Actions
  joinSession: (sessionId: string) => Promise<{ success: boolean; message?: string }>
  leaveSession: (sessionId: string) => Promise<{ success: boolean; message?: string }>
}

export function useRecurringActivities(userId?: string): UseRecurringActivitiesReturn {
  // États pour les activités créées
  const [createdActivities, setCreatedActivities] = useState<Activity[]>([])
  const [loadingCreated, setLoadingCreated] = useState(false)
  const [errorCreated, setErrorCreated] = useState<string | null>(null)

  // États pour les participations
  const [participationActivities, setParticipationActivities] = useState<{
    upcoming: SessionWithParticipants[]
    past: SessionWithParticipants[]
  }>({ upcoming: [], past: [] })
  const [loadingParticipations, setLoadingParticipations] = useState(false)
  const [errorParticipations, setErrorParticipations] = useState<string | null>(null)

  // États pour les sessions disponibles
  const [availableSessions, setAvailableSessions] = useState<SessionWithParticipants[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [errorAvailable, setErrorAvailable] = useState<string | null>(null)

  /**
   * Récupérer les activités créées par l'utilisateur
   */
  const fetchCreatedActivities = useCallback(async () => {
    if (!userId) return

    setLoadingCreated(true)
    setErrorCreated(null)

    try {
      const result = await activitiesApi.getMyCreated()

      if (result.success && result.data) {
        setCreatedActivities(result.data as unknown as Activity[])
      } else {
        setErrorCreated(result.error || 'Erreur lors de la récupération des activités créées')
      }
    } catch (error) {
      setErrorCreated('Erreur de connexion')
    } finally {
      setLoadingCreated(false)
    }
  }, [userId])

  /**
   * Récupérer les participations de l'utilisateur
   */
  const fetchParticipations = useCallback(async () => {
    if (!userId) return

    setLoadingParticipations(true)
    setErrorParticipations(null)

    try {
      const result = await activitiesApi.getMyParticipations()

      if (result.success && result.data) {
        setParticipationActivities({
          upcoming: result.data.upcoming || [],
          past: result.data.past || []
        })
      } else {
        setErrorParticipations(result.error || 'Erreur lors de la récupération des participations')
      }
    } catch (error) {
      setErrorParticipations('Erreur de connexion')
    } finally {
      setLoadingParticipations(false)
    }
  }, [userId])

  /**
   * Récupérer les sessions disponibles
   */
  const fetchAvailableSessions = useCallback(async (sport?: string) => {
    setLoadingAvailable(true)
    setErrorAvailable(null)

    try {
      const result = await activitiesApi.getUpcomingSessions()

      if (result.success) {
        // L'API renvoie directement les sessions dans result.data
        setAvailableSessions(Array.isArray(result.data) ? result.data : [])
      } else {
        setErrorAvailable(result.error || 'Erreur lors de la récupération des sessions')
      }
    } catch (error) {
      setErrorAvailable('Erreur de connexion')
    } finally {
      setLoadingAvailable(false)
    }
  }, [])

  /**
   * Rejoindre une session
   */
  const joinSession = useCallback(async (sessionId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await sessionsApi.join(sessionId)

      if (result.success) {
        // Rafraîchir les participations et les sessions disponibles depuis le serveur
        await Promise.all([
          fetchParticipations(),
          fetchAvailableSessions()
        ])

        return {
          success: true,
          message: result.message || 'Inscription réussie'
        }
      } else {
        return {
          success: false,
          message: result.error || 'Erreur lors de l\'inscription'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur de connexion'
      }
    }
  }, [fetchParticipations, fetchAvailableSessions])

  /**
   * Quitter une session
   */
  const leaveSession = useCallback(async (sessionId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await sessionsApi.leave(sessionId)

      if (result.success) {
        // Rafraîchir les participations et les sessions disponibles depuis le serveur
        await Promise.all([
          fetchParticipations(),
          fetchAvailableSessions()
        ])

        return {
          success: true,
          message: result.message || 'Désinscription réussie'
        }
      } else {
        return {
          success: false,
          message: result.error || 'Erreur lors de la désinscription'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur de connexion'
      }
    }
  }, [fetchParticipations, fetchAvailableSessions])

  // Charger les données au montage du composant
  useEffect(() => {
    if (userId) {
      fetchCreatedActivities()
      fetchParticipations()
      fetchAvailableSessions()
    }
  }, [userId, fetchCreatedActivities, fetchParticipations, fetchAvailableSessions])

  // Recharger les données quand l'utilisateur revient sur la page
  useEffect(() => {
    if (!userId) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchParticipations()
        fetchAvailableSessions()
      }
    }

    const handleFocus = () => {
      fetchParticipations()
      fetchAvailableSessions()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [userId, fetchParticipations, fetchAvailableSessions])

  return {
    // Activités créées
    createdActivities,
    loadingCreated,
    errorCreated,
    fetchCreatedActivities,

    // Participations
    participationActivities,
    loadingParticipations,
    errorParticipations,
    fetchParticipations,

    // Sessions disponibles
    availableSessions,
    loadingAvailable,
    errorAvailable,
    fetchAvailableSessions,

    // Actions
    joinSession,
    leaveSession
  }
}