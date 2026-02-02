/**
 * Types pour le système de notifications
 */

export type NotificationType =
  // Match notifications
  | 'match_created'
  | 'match_updated'
  | 'match_cancelled'
  | 'match_reminder'
  | 'match_joined'
  | 'match_left'
  | 'waiting_list_promoted'
  // Session notifications
  | 'session_confirmed'
  | 'session_cancelled'
  | 'session_reminder'
  | 'new_sessions_available'
  // System notifications
  | 'announcement'
  | 'system'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  matchId?: string | null
  activityId?: string | null
  sessionId?: string | null
  createdAt: Date
  updatedAt: Date

  // Relations (populated)
  match?: {
    id: string
    date: Date
    status: string
  }
  activity?: {
    id: string
    name: string
    sport: string
  }
  session?: {
    id: string
    date: Date
  }
}

export interface NotificationFilters {
  unreadOnly?: boolean
  type?: NotificationType
  limit?: number
  offset?: number
}

export interface NotificationResponse {
  notifications: Notification[]
  total: number
}

export interface UnreadCount {
  count: number
}

// WebSocket message types for notifications
export interface WSNotificationMessage {
  type: 'notification' | 'connected' | 'error'
  data?: Notification | { message: string }
}
