'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ChatRoomWithStats, UnreadCounts } from '@stepzy/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface UseChatRoomsReturn {
  rooms: ChatRoomWithStats[]
  unreadCounts: UnreadCounts | null
  loading: boolean
  error: string | null
  refreshRooms: () => Promise<void>
  refreshUnreadCounts: () => Promise<void>
}

export function useChatRooms(): UseChatRoomsReturn {
  const [rooms, setRooms] = useState<ChatRoomWithStats[]>([])
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch rooms
  const refreshRooms = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/rooms`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des salons')
      }

      const data = await response.json()
      if (data.success) {
        const parsedRooms = data.data.map((room: any) => ({
          ...room,
          createdAt: new Date(room.createdAt),
          updatedAt: new Date(room.updatedAt)
        }))
        setRooms(parsedRooms)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      console.error('Error fetching rooms:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch unread counts
  const refreshUnreadCounts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/unread`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUnreadCounts(data.data)

          // Update rooms with unread counts
          setRooms(prev =>
            prev.map(room => {
              const unreadData = data.data.rooms.find((r: any) => r.roomId === room.id)
              return {
                ...room,
                unreadCount: unreadData?.unreadCount || 0
              }
            })
          )
        }
      }
    } catch (err) {
      console.error('Error fetching unread counts:', err)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    refreshRooms()
    refreshUnreadCounts()
  }, [refreshRooms, refreshUnreadCounts])

  // Poll unread counts every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [refreshUnreadCounts])

  return {
    rooms,
    unreadCounts,
    loading,
    error,
    refreshRooms,
    refreshUnreadCounts
  }
}
