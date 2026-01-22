'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotificationsContext } from '@/contexts/NotificationsContext'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  matchId?: string | null
  sessionId?: string | null
  activityId?: string | null
  createdAt: Date
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const { unreadCount, setUnreadCount } = useNotificationsContext()

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 250)
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_BASE_URL}/api/notifications?limit=20`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const parsedNotifications = data.data.notifications.map((notif: any) => ({
            ...notif,
            createdAt: new Date(notif.createdAt)
          }))
          setNotifications(parsedNotifications)
        }
      }
    } catch (error) {
      // Failed to fetch notifications
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'mark_read' })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, read: true }
              : notif
          )
        )
        setUnreadCount((prev: number) => Math.max(0, prev - 1))
      }
    } catch (error) {
      // Failed to mark as read
    }
  }

  const markAllAsRead = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
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
    } catch (error) {
      // Failed to mark all as read
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match_created':
      case 'new_sessions_available':
        return '🆕'
      case 'match_updated':
        return '📝'
      case 'match_cancelled':
      case 'session_cancelled':
        return '❌'
      case 'match_reminder':
      case 'session_reminder':
        return '⏰'
      case 'match_joined':
      case 'session_confirmed':
        return '✅'
      case 'match_left':
        return '👋'
      case 'waiting_list_promoted':
        return '🎉'
      case 'announcement':
        return '📢'
      default:
        return '🔔'
    }
  }

  const formatNotificationTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.sessionId) return `/sessions/${notification.sessionId}`
    if (notification.activityId) return `/activites/${notification.activityId}`
    if (notification.matchId) return `/matches/${notification.matchId}`
    return null
  }

  if (!isOpen && !isClosing) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 ${isClosing ? 'animate-fade-out-backdrop' : 'animate-fade-in-backdrop'}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col ${isClosing ? 'animate-slide-out-panel' : 'animate-slide-in-panel'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="px-6 py-3 border-b border-gray-100 bg-white">
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Tout marquer comme lu
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500 mt-4">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="text-6xl mb-4">🔔</div>
              <p className="text-gray-500 text-lg">Aucune notification</p>
              <p className="text-gray-400 text-sm mt-1">Vous êtes à jour !</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification)

                return (
                  <div
                    key={notification.id}
                    className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          {link && (
                            <Link
                              href={link}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              onClick={handleClose}
                            >
                              Voir les détails →
                            </Link>
                          )}

                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-gray-500 hover:text-gray-700 ml-auto"
                            >
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Link
            href="/notifications"
            className="block w-full text-center py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            onClick={handleClose}
          >
            Voir toutes les notifications
          </Link>
        </div>
      </div>
    </>
  )
}
