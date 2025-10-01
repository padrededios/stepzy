/**
 * Hook pour gérer les nouvelles activités récurrentes et sessions
 */

import { useState, useEffect, useCallback } from 'react'
import { Activity, ActivitySession, SessionWithParticipants } from '@/types/activity'

interface UseRecurringActivitiesReturn {
  // Activités créées par l'utilisateur
  createdActivities: Activity[]
  loadingCreated: boolean
  errorCreated: string | null
  fetchCreatedActivities: () => Promise<void>

  // Participations utilisateur
  participationActivities: {
    upcoming: Activity[]
    past: Activity[]
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
    upcoming: Activity[]
    past: Activity[]
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
      const response = await fetch('/api/activities/my-created?includeStats=true')
      const data = await response.json()

      if (data.success) {
        setCreatedActivities(data.data.activities)
      } else {
        setErrorCreated(data.error || 'Erreur lors de la récupération des activités créées')
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
      const response = await fetch('/api/activities/my-participations?includePast=true')
      const data = await response.json()

      if (data.success) {
        setParticipationActivities({
          upcoming: data.data.upcoming || [],
          past: data.data.past || []
        })
      } else {
        setErrorParticipations(data.error || 'Erreur lors de la récupération des participations')
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
      const params = new URLSearchParams()
      if (sport) params.set('sport', sport)
      params.set('availableOnly', 'true')

      const response = await fetch(`/api/activities/upcoming-sessions?${params}`)
      const data = await response.json()

      if (data.success) {
        setAvailableSessions(data.data.sessions || [])
      } else {
        setErrorAvailable(data.error || 'Erreur lors de la récupération des sessions')
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
      const response = await fetch(`/api/activities/sessions/${sessionId}/join`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        // Mise à jour optimiste de l'état local pour les sessions disponibles
        setAvailableSessions(prev => prev.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              userStatus: {
                ...session.userStatus,
                isParticipant: true,
                canJoin: false
              },
              stats: {
                ...session.stats,
                confirmedCount: session.stats.confirmedCount + 1,
                availableSpots: Math.max(0, session.stats.availableSpots - 1)
              }
            }
          }
          return session
        }))

        // Mise à jour optimiste des participations
        setParticipationActivities(prev => {
          const session = availableSessions.find(s => s.id === sessionId)
          if (!session) return prev

          // Chercher si l'activité existe déjà dans upcoming
          const existingActivityIndex = prev.upcoming.findIndex(a => a.id === session.activity.id)

          if (existingActivityIndex >= 0) {
            // L'activité existe, ajouter la session
            const updatedUpcoming = [...prev.upcoming]
            updatedUpcoming[existingActivityIndex] = {
              ...updatedUpcoming[existingActivityIndex],
              sessions: [
                ...updatedUpcoming[existingActivityIndex].sessions,
                {
                  id: session.id,
                  date: session.date,
                  maxPlayers: session.maxPlayers,
                  confirmedParticipants: session.stats.confirmedCount + 1,
                  userParticipation: { status: 'confirmed' }
                }
              ]
            }
            return { ...prev, upcoming: updatedUpcoming }
          } else {
            // L'activité n'existe pas, la créer
            const newActivity: Activity = {
              id: session.activity.id,
              name: session.activity.name,
              sport: session.activity.sport,
              description: session.activity.description,
              creator: session.activity.creator,
              sessions: [{
                id: session.id,
                date: session.date,
                maxPlayers: session.maxPlayers,
                confirmedParticipants: session.stats.confirmedCount + 1,
                userParticipation: { status: 'confirmed' }
              }]
            }
            return { ...prev, upcoming: [...prev.upcoming, newActivity] }
          }
        })

        return {
          success: true,
          message: data.data?.message || 'Inscription réussie'
        }
      } else {
        return {
          success: false,
          message: data.error || 'Erreur lors de l\'inscription'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur de connexion'
      }
    }
  }, [])

  /**
   * Quitter une session
   */
  const leaveSession = useCallback(async (sessionId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`/api/activities/sessions/${sessionId}/join`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        // Mise à jour optimiste de l'état local pour les sessions disponibles
        setAvailableSessions(prev => prev.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              userStatus: {
                ...session.userStatus,
                isParticipant: false,
                canJoin: true
              },
              stats: {
                ...session.stats,
                confirmedCount: Math.max(0, session.stats.confirmedCount - 1),
                availableSpots: session.stats.availableSpots + 1
              }
            }
          }
          return session
        }))

        // Mise à jour optimiste des participations
        setParticipationActivities(prev => {
          const updatedUpcoming = prev.upcoming.map(activity => {
            // Filtrer la session de cette activité
            const filteredSessions = activity.sessions.filter(s => s.id !== sessionId)

            if (filteredSessions.length !== activity.sessions.length) {
              // La session a été trouvée et retirée
              return {
                ...activity,
                sessions: filteredSessions
              }
            }
            return activity
          }).filter(activity => activity.sessions.length > 0) // Retirer l'activité si elle n'a plus de sessions

          return { ...prev, upcoming: updatedUpcoming }
        })

        return {
          success: true,
          message: data.data?.message || 'Désinscription réussie'
        }
      } else {
        return {
          success: false,
          message: data.error || 'Erreur lors de la désinscription'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur de connexion'
      }
    }
  }, [])

  // Charger les données au montage du composant
  useEffect(() => {
    if (userId) {
      fetchCreatedActivities()
      fetchParticipations()
      fetchAvailableSessions()
    }
  }, [userId, fetchCreatedActivities, fetchParticipations, fetchAvailableSessions])

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