'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '../../components/layout/ProtectedRoute'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  matchId?: string | null
  createdAt: Date
  match?: {
    id: string
    date: Date
    status: string
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const url = `/api/notifications?limit=50${filter === 'unread' ? '&unreadOnly=true' : ''}`
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const parsedNotifications = data.data.notifications.map((notif: any) => ({
            ...notif,
            createdAt: new Date(notif.createdAt),
            match: notif.match ? {
              ...notif.match,
              date: new Date(notif.match.date)
            } : null
          }))
          setNotifications(parsedNotifications)
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match_created':
        return '🆕'
      case 'match_updated':
        return '📝'
      case 'match_cancelled':
        return '❌'
      case 'match_reminder':
        return '⏰'
      case 'match_joined':
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
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffDays === 1) {
      return 'Hier'
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: diffDays > 365 ? 'numeric' : undefined
      })
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!user) return null

  return (
    <ProtectedRoute>
      {(user) => (
        <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="mt-2 text-gray-600">
                  Restez informé des dernières actualités et événements
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Filter buttons */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      filter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Toutes ({notifications.length})
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      filter === 'unread'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Non lues ({unreadCount})
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
              </h3>
              <p className="text-gray-600 mb-8">
                {filter === 'unread' 
                  ? 'Toutes vos notifications ont été lues.'
                  : 'Vous n\'avez encore reçu aucune notification.'}
              </p>
              {filter === 'unread' && (
                <button
                  onClick={() => setFilter('all')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Voir toutes les notifications
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow-sm border p-6 transition-colors ${
                    !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-2">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                  </div>

                  {notification.matchId && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        {notification.match && (
                          <span>
                            Match prévu le {notification.match.date.toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/matches/${notification.matchId}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                      >
                        Voir le match →
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}
    </ProtectedRoute>
  )
}