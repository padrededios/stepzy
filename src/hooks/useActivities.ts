'use client'

import { useState, useEffect } from 'react'
import { SportType } from '@/config/sports'

export interface Activity {
  id: string
  date: string
  maxPlayers: number
  currentPlayers: number
  description?: string
  sport: SportType
  status: 'open' | 'full' | 'cancelled' | 'completed'
  isParticipant: boolean
  isWaitingList: boolean
}


// Fonction pour récupérer les matches depuis l'API
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

    // Transformer les matches en format Activity
    return result.data.matches.map((match: any) => {
      // Utiliser directement currentUserStatus de l'API
      const isParticipant = match.currentUserStatus === 'active'
      const isWaitingList = match.currentUserStatus === 'waiting'

      return {
        id: match.id,
        date: match.date,
        maxPlayers: match.maxPlayers,
        currentPlayers: match.players ? match.players.length : 0,
        description: `Match de ${match.sport}`,
        sport: match.sport,
        status: match.status,
        isParticipant,
        isWaitingList
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

      // Récupérer les matches depuis l'API avec les statuts utilisateur
      const fetchedActivities = await fetchMatchesFromAPI(userId)

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
      const response = await fetch(`/api/matches/${activityId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        // Recharger les activités depuis l'API avec les statuts à jour
        const fetchedActivities = await fetchMatchesFromAPI(userId)
        setActivities(fetchedActivities)
        return { success: true, status: result.data.status }
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
      const response = await fetch(`/api/matches/${activityId}/leave`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        // Recharger les activités depuis l'API avec les statuts à jour
        const fetchedActivities = await fetchMatchesFromAPI(userId)
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
  const getAvailableActivities = () => {
    return activities.filter(activity => activity.status !== 'cancelled')
  }

  return {
    activities,
    loading,
    registerForActivity,
    unregisterFromActivity,
    getUserActivities,
    getAvailableActivities
  }
}