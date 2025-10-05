/**
 * Types pour le système d'activités récurrentes
 */

import { SportType } from '@/config/sports'
import { User } from './user'

export type RecurringType = 'weekly' | 'monthly'
export type SessionStatus = 'active' | 'cancelled' | 'completed'
export type ParticipantStatus = 'interested' | 'confirmed' | 'waiting'

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface Activity {
  id: string
  name: string
  description?: string
  sport: SportType
  minPlayers: number
  maxPlayers: number
  createdBy: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date

  // Récurrence
  recurringDays: DayOfWeek[]
  recurringType: RecurringType
  startTime: string // Format HH:MM
  endTime: string   // Format HH:MM

  // Relations
  creator: User
  sessions?: ActivitySession[]
}

export interface ActivitySession {
  id: string
  activityId: string
  date: Date
  status: SessionStatus
  maxPlayers: number
  isCancelled: boolean
  createdAt: Date
  updatedAt: Date

  // Relations
  activity?: Activity
  participants?: ActivityParticipant[]

  // Computed fields
  currentParticipants?: number
  confirmedParticipants?: number
  waitingParticipants?: number
}

export interface ActivityParticipant {
  id: string
  sessionId: string
  userId: string
  status: ParticipantStatus
  joinedAt: Date

  // Relations
  session?: ActivitySession
  user: User
}

// Types pour les formulaires
export interface CreateActivityData {
  name: string
  description?: string
  sport: SportType
  minPlayers: number
  maxPlayers: number
  recurringDays: DayOfWeek[]
  recurringType: RecurringType
  startTime: string
  endTime: string
}

export interface UpdateActivityData {
  name?: string
  description?: string
  minPlayers?: number
  maxPlayers?: number
  recurringDays?: DayOfWeek[]
  recurringType?: RecurringType
}

export interface UpdateSessionData {
  maxPlayers?: number
  isCancelled?: boolean
}

// Types pour les vues
export interface ActivityWithStats extends Activity {
  totalSessions: number
  upcomingSessions: number
  totalParticipants: number
  averageParticipation: number
}

export interface SessionWithParticipants extends ActivitySession {
  participants: ActivityParticipant[]
  currentParticipants: number
  confirmedParticipants: number
  waitingParticipants: number
  userParticipation?: ActivityParticipant | null
  stats: {
    confirmedCount: number
    waitingCount: number
    interestedCount: number
    availableSpots: number
  }
  userStatus: {
    isParticipant: boolean
    canJoin: boolean
    participantStatus: ParticipantStatus | null
  }
}

// Types pour les requêtes API
export interface ActivityFilters {
  sport?: SportType
  createdBy?: string
  isPublic?: boolean
  recurringType?: RecurringType
  recurringDays?: DayOfWeek[]
}

export interface SessionFilters {
  activityId?: string
  status?: SessionStatus
  dateFrom?: Date
  dateTo?: Date
  hasSpots?: boolean
}

// Configuration des jours de la semaine
export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche'
}

export const RECURRING_TYPE_LABELS: Record<RecurringType, string> = {
  weekly: 'Chaque semaine',
  monthly: 'Chaque mois'
}

export const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  interested: 'Intéressé',
  confirmed: 'Confirmé',
  waiting: 'En attente'
}