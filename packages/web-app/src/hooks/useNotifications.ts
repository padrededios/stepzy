'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Notification, NotificationFilters } from '@stepzy/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const WS_URL = API_URL.replace('http', 'ws')

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  selectedIds: Set<string>
  selectAll: boolean
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  deleteSelected: () => Promise<void>
  deleteAll: () => Promise<void>
  toggleSelect: (id: string) => void
  toggleSelectAll: () => void
  clearSelection: () => void
}

export function useNotifications(filters?: NotificationFilters): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())
      if (filters?.unreadOnly) params.append('unreadOnly', 'true')

      const response = await fetch(`${API_URL}/api/notifications?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des notifications')
      }

      const data = await response.json()
      if (data.success) {
        const parsedNotifications = data.data.notifications.map((notif: any) => ({
          ...notif,
          createdAt: new Date(notif.createdAt),
          updatedAt: new Date(notif.updatedAt),
          match: notif.match ? {
            ...notif.match,
            date: new Date(notif.match.date)
          } : undefined,
          session: notif.session ? {
            ...notif.session,
            date: new Date(notif.session.date)
          } : undefined
        }))
        setNotifications(parsedNotifications)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Fetch unread count
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

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'mark_read' })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, read: true } : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'mark_all_read' })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true }))
        )
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        const notif = notifications.find(n => n.id === id)
        setNotifications(prev => prev.filter(n => n.id !== id))
        if (notif && !notif.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }, [notifications])

  // Delete selected notifications
  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return

    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      })

      if (response.ok) {
        const deletedUnreadCount = notifications
          .filter(n => selectedIds.has(n.id) && !n.read)
          .length

        setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)))
        setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount))
        setSelectedIds(new Set())
        setSelectAll(false)
      }
    } catch (err) {
      console.error('Error deleting selected notifications:', err)
    }
  }, [selectedIds, notifications])

  // Delete all notifications
  const deleteAll = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ all: true })
      })

      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
        setSelectedIds(new Set())
        setSelectAll(false)
      }
    } catch (err) {
      console.error('Error deleting all notifications:', err)
    }
  }, [])

  // Toggle selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // Toggle select all
  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedIds(new Set())
      setSelectAll(false)
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)))
      setSelectAll(true)
    }
  }, [selectAll, notifications])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectAll(false)
  }, [])

  // WebSocket connection for real-time notifications
  useEffect(() => {
    let isMounted = true
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connectWebSocket = () => {
      if (!isMounted) return

      try {
        // Get session token from cookies
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, ...valueParts] = cookie.trim().split('=')
          acc[key] = valueParts.join('=')
          return acc
        }, {} as Record<string, string>)

        const sessionToken = cookies['better-auth.session_token']
        if (!sessionToken) {
          // No token, skip WebSocket (REST API still works)
          return
        }

        const wsUrl = `${WS_URL}/ws/notifications?token=${encodeURIComponent(sessionToken)}`
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (!isMounted) {
            ws.close()
            return
          }
        }

        ws.onmessage = (event) => {
          if (!isMounted) return

          try {
            const message = JSON.parse(event.data)

            if (message.type === 'notification') {
              const newNotif = {
                ...message.data,
                createdAt: new Date(message.data.createdAt),
                updatedAt: new Date(message.data.updatedAt)
              }

              // Add new notification to the list (avoid duplicates)
              setNotifications(prev => {
                if (prev.some(n => n.id === newNotif.id)) return prev
                return [newNotif, ...prev]
              })

              // Increment unread count if unread
              if (!newNotif.read) {
                setUnreadCount(prev => prev + 1)
              }
            }
          } catch (err) {
            console.warn('[Notifications] Error parsing WebSocket message:', err)
          }
        }

        ws.onerror = () => {
          // WebSocket errors are not critical - REST API still works
          console.warn('[Notifications] WebSocket connection error (REST API still available)')
        }

        ws.onclose = () => {
          if (!isMounted) return
          // Only reconnect if still mounted
          reconnectTimeout = setTimeout(connectWebSocket, 5000)
        }
      } catch (err) {
        console.warn('[Notifications] WebSocket setup error:', err)
      }
    }

    connectWebSocket()

    return () => {
      isMounted = false
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [fetchNotifications, fetchUnreadCount])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    selectedIds,
    selectAll,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteSelected,
    deleteAll,
    toggleSelect,
    toggleSelectAll,
    clearSelection
  }
}
