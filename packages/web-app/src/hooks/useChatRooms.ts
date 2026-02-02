'use client'

import { useChatContext } from '@/contexts/ChatContext'
import type { ChatRoomWithStats, UnreadCounts } from '@stepzy/shared'

interface UseChatRoomsReturn {
  rooms: ChatRoomWithStats[]
  unreadCounts: UnreadCounts | null
  loading: boolean
  error: string | null
  refreshRooms: () => Promise<void>
  refreshUnreadCounts: () => Promise<void>
}

export function useChatRooms(): UseChatRoomsReturn {
  // Use global chat context
  return useChatContext()
}
