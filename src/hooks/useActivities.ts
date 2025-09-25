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

export interface UserRegistration {
  activityId: string
  status: 'confirmed' | 'waiting'
  registeredAt: string
}

// Données mockées des activités disponibles
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    maxPlayers: 12,
    currentPlayers: 8,
    description: 'Match de football amical au stade municipal',
    sport: 'football',
    status: 'open',
    isParticipant: false,
    isWaitingList: false
  },
  {
    id: '2',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    maxPlayers: 4,
    currentPlayers: 4,
    description: 'Tournoi de badminton - tous niveaux',
    sport: 'badminton',
    status: 'full',
    isParticipant: false,
    isWaitingList: false
  },
  {
    id: '3',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxPlayers: 12,
    currentPlayers: 6,
    description: 'Match de volleyball en salle',
    sport: 'volley',
    status: 'open',
    isParticipant: false,
    isWaitingList: false
  },
  {
    id: '4',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    maxPlayers: 4,
    currentPlayers: 2,
    description: 'Partie de ping-pong conviviale',
    sport: 'pingpong',
    status: 'open',
    isParticipant: false,
    isWaitingList: false
  },
  {
    id: '5',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    maxPlayers: 15,
    currentPlayers: 12,
    description: 'Match de rugby - niveau débutant/intermédiaire',
    sport: 'rugby',
    status: 'open',
    isParticipant: false,
    isWaitingList: false
  }
]

export function useActivities(userId?: string) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [userRegistrations, setUserRegistrations] = useState<UserRegistration[]>([])
  const [loading, setLoading] = useState(true)

  // Charger les données depuis le localStorage
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const savedRegistrations = localStorage.getItem(`user-registrations-${userId}`)
    const registrations = savedRegistrations ? JSON.parse(savedRegistrations) : []
    setUserRegistrations(registrations)

    // Mettre à jour les activités avec les statuts utilisateur
    const updatedActivities = MOCK_ACTIVITIES.map(activity => {
      const userReg = registrations.find((reg: UserRegistration) => reg.activityId === activity.id)
      return {
        ...activity,
        isParticipant: userReg?.status === 'confirmed',
        isWaitingList: userReg?.status === 'waiting',
        currentPlayers: activity.currentPlayers + (userReg?.status === 'confirmed' ? 1 : 0)
      }
    })

    setActivities(updatedActivities)
    setLoading(false)
  }, [userId])

  // Sauvegarder dans le localStorage
  const saveRegistrations = (registrations: UserRegistration[]) => {
    if (userId) {
      localStorage.setItem(`user-registrations-${userId}`, JSON.stringify(registrations))
      setUserRegistrations(registrations)
    }
  }

  // S'inscrire à une activité
  const registerForActivity = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId)
    if (!activity || !userId) return

    const isActivityFull = activity.currentPlayers >= activity.maxPlayers
    const status: 'confirmed' | 'waiting' = isActivityFull ? 'waiting' : 'confirmed'

    const newRegistration: UserRegistration = {
      activityId,
      status,
      registeredAt: new Date().toISOString()
    }

    const updatedRegistrations = [...userRegistrations, newRegistration]
    saveRegistrations(updatedRegistrations)

    // Mettre à jour les activités
    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          isParticipant: status === 'confirmed',
          isWaitingList: status === 'waiting',
          currentPlayers: status === 'confirmed' ? activity.currentPlayers + 1 : activity.currentPlayers
        }
      }
      return activity
    }))
  }

  // Se désinscrire d'une activité
  const unregisterFromActivity = (activityId: string) => {
    if (!userId) return

    const updatedRegistrations = userRegistrations.filter(reg => reg.activityId !== activityId)
    saveRegistrations(updatedRegistrations)

    // Mettre à jour les activités
    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        const wasConfirmed = activity.isParticipant
        return {
          ...activity,
          isParticipant: false,
          isWaitingList: false,
          currentPlayers: wasConfirmed ? Math.max(0, activity.currentPlayers - 1) : activity.currentPlayers
        }
      }
      return activity
    }))
  }

  // Rejoindre la liste d'attente
  const joinWaitingList = (activityId: string) => {
    if (!userId) return

    const newRegistration: UserRegistration = {
      activityId,
      status: 'waiting',
      registeredAt: new Date().toISOString()
    }

    const updatedRegistrations = [...userRegistrations, newRegistration]
    saveRegistrations(updatedRegistrations)

    // Mettre à jour les activités
    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          isWaitingList: true,
          isParticipant: false
        }
      }
      return activity
    }))
  }

  // Obtenir les activités de l'utilisateur (pour "Mes activités")
  const getUserActivities = () => {
    const userActivityIds = userRegistrations.map(reg => reg.activityId)
    const userActivities = activities.filter(activity => userActivityIds.includes(activity.id))

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
    userRegistrations,
    loading,
    registerForActivity,
    unregisterFromActivity,
    joinWaitingList,
    getUserActivities,
    getAvailableActivities
  }
}