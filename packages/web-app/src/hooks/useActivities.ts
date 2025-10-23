'use client'

import { useState, useEffect } from 'react'
import { SportType } from '@/config/sports'
import { activitiesApi } from '@/lib/api'

export interface Activity {
  id: string
  name: string
  description?: string
  sport: SportType
  maxPlayers: number
  recurringDays: string[]
  recurringType: 'weekly' | 'monthly'
  isPublic: boolean
  createdBy: string
  code: string // Code unique pour rejoindre l'activité
  creator: {
    id: string
    pseudo: string
    avatar?: string
  }
  upcomingSessionsCount: number
  totalParticipants: number
  isParticipant: boolean
  isSubscribed: boolean // Nouveau champ
  canManage: boolean
}


// Fonction pour récupérer les activités récurrentes depuis l'API
const fetchActivitiesFromAPI = async (userId?: string): Promise<Activity[]> => {
  try {
    const result = await activitiesApi.getAll()

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch activities')
    }

    // Transformer les activités en format Activity
    return result.data.activities.map((activity: any) => {
      return {
        id: activity.id,
        name: activity.name,
        description: activity.description,
        sport: activity.sport,
        maxPlayers: activity.maxPlayers,
        recurringDays: activity.recurringDays,
        recurringType: activity.recurringType,
        isPublic: activity.isPublic,
        createdBy: activity.createdBy,
        code: activity.code,
        creator: activity.creator,
        upcomingSessionsCount: activity.upcomingSessionsCount || 0,
        totalParticipants: activity.totalParticipants || 0,
        isParticipant: activity.userStatus?.isParticipant || false,
        isSubscribed: activity.userStatus?.isSubscribed || false,
        canManage: userId === activity.createdBy
      }
    })
  } catch (error) {
    // Si l'API des activités ne fonctionne pas, revenir aux matches
    return await fetchMatchesFromAPI(userId)
  }
}

// Fonction pour récupérer les matches depuis l'API (fallback)
const fetchMatchesFromAPI = async (userId?: string): Promise<Activity[]> => {
  try {
    const response = await fetch('/api/matches')
    if (!response.ok) {
      throw new Error('Failed to fetch matches')
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch matches')
    }

    // Transformer les matches en format Activity pour compatibilité
    return result.data.matches.map((match: any) => {
      const isParticipant = match.currentUserStatus === 'active'

      return {
        id: match.id,
        name: `Match de ${match.sport}`,
        description: `Match de ${match.sport}`,
        sport: match.sport,
        maxPlayers: match.maxPlayers,
        recurringDays: [],
        recurringType: 'weekly' as const,
        isPublic: true,
        createdBy: '',
        creator: { id: '', pseudo: 'Système', avatar: null },
        upcomingSessionsCount: 1,
        totalParticipants: match.players ? match.players.length : 0,
        isParticipant,
        isSubscribed: false,
        canManage: false
      }
    })
  } catch (error) {
    // Failed to fetch matches from API
    return []
  }
}

export function useActivities(userId?: string) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  // Charger les données depuis l'API et localStorage
  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      // Récupérer les activités récurrentes depuis l'API avec les statuts utilisateur
      const fetchedActivities = await fetchActivitiesFromAPI(userId)

      // Les activités ont déjà les bons statuts depuis l'API
      setActivities(fetchedActivities)

      // Nettoyer le localStorage des anciennes inscriptions (optionnel)
      localStorage.removeItem(`user-registrations-${userId}`)
      setLoading(false)
    }

    loadData()
  }, [userId])


  // S'inscrire à une activité via l'API
  const registerForActivity = async (activityId: string) => {
    if (!userId) return

    try {
      const result = await activitiesApi.subscribe(activityId)

      if (result.success) {
        // Recharger les activités depuis l'API avec les statuts à jour
        const fetchedActivities = await fetchActivitiesFromAPI(userId)
        setActivities(fetchedActivities)
        return { success: true }
      } else {
        throw new Error(result.error || 'Erreur lors de l\'inscription')
      }
    } catch (error) {
      // Failed to register for activity
      return { success: false, error: error instanceof Error ? error.message : 'Erreur lors de l\'inscription' }
    }
  }

  // Se désinscrire d'une activité via l'API
  const unregisterFromActivity = async (activityId: string) => {
    if (!userId) return

    try {
      const result = await activitiesApi.unsubscribe(activityId)

      if (result.success) {
        // Recharger les activités depuis l'API avec les statuts à jour
        const fetchedActivities = await fetchActivitiesFromAPI(userId)
        setActivities(fetchedActivities)
        return { success: true }
      } else {
        throw new Error(result.error || 'Erreur lors de la désinscription')
      }
    } catch (error) {
      // Failed to unregister from activity
      return { success: false, error: error instanceof Error ? error.message : 'Erreur lors de la désinscription' }
    }
  }

  // La liste d'attente est maintenant gérée automatiquement par l'API lors de l'inscription

  // Obtenir les activités de l'utilisateur (pour "Mes activités")
  const getUserActivities = () => {
    // Filtrer les activités où l'utilisateur est inscrit (confirmé ou en liste d'attente)
    const userActivities = activities.filter(activity =>
      activity.isParticipant || activity.isWaitingList
    )

    const now = new Date()

    return {
      upcoming: userActivities.filter(activity => new Date(activity.date) > now),
      past: userActivities.filter(activity => new Date(activity.date) <= now)
    }
  }

  // Obtenir toutes les activités disponibles (pour "S'inscrire")
  // Le backend filtre déjà selon la liste personnelle de l'utilisateur
  const getAvailableActivities = () => {
    return activities
  }

  // Rejoindre une activité avec un code
  const joinByCode = async (code: string) => {
    if (!userId) return { success: false, error: 'Utilisateur non connecté' }

    try {
      const result = await activitiesApi.joinByCode(code)

      if (result.success) {
        // Recharger les activités depuis l'API
        const fetchedActivities = await fetchActivitiesFromAPI(userId)
        setActivities(fetchedActivities)

        return {
          success: true,
          activity: result.data,
          alreadyMember: result.alreadyMember || false,
          message: result.message || (result.alreadyMember
            ? 'Vous êtes déjà membre de cette activité'
            : `Vous avez rejoint l'activité avec succès`)
        }
      } else {
        throw new Error(result.error || 'Erreur lors de la tentative de rejoindre l\'activité')
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion'
      }
    }
  }

  // Quitter une activité (retirer de la liste personnelle)
  const leaveActivity = async (activityId: string) => {
    if (!userId) return

    try {
      const result = await activitiesApi.leave(activityId)

      if (result.success) {
        // Recharger les activités depuis l'API avec les statuts à jour
        const fetchedActivities = await fetchActivitiesFromAPI(userId)
        setActivities(fetchedActivities)
        return { success: true }
      } else {
        throw new Error(result.error || 'Erreur lors de la tentative de quitter l\'activité')
      }
    } catch (error) {
      // Failed to leave activity
      return { success: false, error: error instanceof Error ? error.message : 'Erreur lors de la tentative de quitter l\'activité' }
    }
  }

  return {
    activities,
    loading,
    registerForActivity,
    unregisterFromActivity,
    getUserActivities,
    getAvailableActivities,
    joinByCode,
    leaveActivity
  }
}