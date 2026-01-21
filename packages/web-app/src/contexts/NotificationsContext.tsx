'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface NotificationsContextType {
  unreadCount: number
  setUnreadCount: (count: number | ((prev: number) => number)) => void
  fetchUnreadCount: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/count`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUnreadCount(data.data.count)
        }
      }
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  return (
    <NotificationsContext.Provider value={{ unreadCount, setUnreadCount, fetchUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotificationsContext() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider')
  }
  return context
}
