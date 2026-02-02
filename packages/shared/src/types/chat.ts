/**
 * Types pour le système de chat
 */

import type { SportType } from '../constants/sports'

export interface ChatRoom {
  id: string
  activityId: string
  createdAt: Date
  updatedAt: Date

  // Relations (populated)
  activity?: {
    id: string
    name: string
    sport: SportType
    creator?: {
      id: string
      pseudo: string
      avatar: string | null
    }
  }
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  content: string
  originalContent?: string | null
  isModerated: boolean
  createdAt: Date
  updatedAt: Date

  // Relations (populated)
  sender: {
    id: string
    pseudo: string
    avatar: string | null
  }
}

export interface ChatRoomReadStatus {
  id: string
  roomId: string
  userId: string
  lastReadAt: Date
  lastMessageId?: string | null
  createdAt: Date
  updatedAt: Date
}

// Extended room with stats
export interface ChatRoomWithStats extends ChatRoom {
  activityName: string
  sport: SportType
  messageCount: number
  unreadCount?: number
}

// WebSocket message types
export type WSChatMessageType = 'message' | 'typing' | 'read' | 'error' | 'connected'

export interface WSChatMessage {
  type: WSChatMessageType
  data?: ChatMessage | TypingIndicator | ErrorMessage
}

export interface TypingIndicator {
  userId: string
  pseudo: string
  isTyping: boolean
}

export interface ErrorMessage {
  message: string
}

// Send message request
export interface SendMessageRequest {
  content: string
}

// Typing indicator request
export interface TypingRequest {
  isTyping: boolean
}

// Unread counts
export interface UnreadCounts {
  rooms: Array<{
    roomId: string
    activityId: string
    activityName: string
    unreadCount: number
  }>
  total: number
}

// Message pagination
export interface GetMessagesOptions {
  limit?: number
  before?: string // ISO date string
}
