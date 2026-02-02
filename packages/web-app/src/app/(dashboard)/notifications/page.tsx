'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/useNotifications'

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Memoize filters object to prevent infinite re-renders
  const filters = useMemo(() => ({
    unreadOnly: filter === 'unread'
  }), [filter])

  const {
    notifications,
    unreadCount,
    loading,
    selectedIds,
    selectAll,
    markAsRead,
    markAllAsRead,
    deleteSelected,
    deleteAll,
    toggleSelect,
    toggleSelectAll,
    clearSelection
  } = useNotifications(filters)

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
      case 'session_confirmed':
        return '✅'
      case 'session_cancelled':
        return '❌'
      case 'session_reminder':
        return '⏰'
      case 'new_sessions_available':
        return '🆕'
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

  const handleDeleteSelected = async () => {
    if (confirm(`Supprimer ${selectedIds.size} notification(s) ?`)) {
      await deleteSelected()
    }
  }

  const handleDeleteAll = async () => {
    if (confirm('Supprimer toutes les notifications ?')) {
      await deleteAll()
    }
  }

  const getNotificationLink = (notification: any) => {
    if (notification.sessionId) {
      return `/sessions/${notification.sessionId}`
    }
    if (notification.activityId) {
      return `/mes-activites` // Could navigate to specific activity
    }
    if (notification.matchId) {
      return `/matches/${notification.matchId}`
    }
    return null
  }

  return (
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

        {/* Bulk actions */}
        {notifications.length > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectAll ? 'Tout désélectionner' : 'Tout sélectionner'}
              </span>
            </label>

            {selectedIds.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedIds.size} sélectionnée(s)
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                >
                  Supprimer la sélection
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                >
                  Annuler
                </button>
              </>
            )}

            {notifications.length > 0 && selectedIds.size === 0 && (
              <button
                onClick={handleDeleteAll}
                className="ml-auto px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
              >
                Supprimer tout
              </button>
            )}
          </div>
        )}
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
          {notifications.map((notification) => {
            const link = getNotificationLink(notification)
            const isSelected = selectedIds.has(notification.id)

            return (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border p-6 transition-colors ${
                  !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'hover:bg-gray-50'
                } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(notification.id)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />

                  {/* Icon */}
                  <div className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
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

                    {/* Activity/Session info */}
                    {(notification.activity || notification.session) && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-600">
                          {notification.activity && (
                            <span className="font-medium">{notification.activity.name}</span>
                          )}
                          {notification.session && (
                            <span className="ml-2">
                              - {new Date(notification.session.date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        {link && (
                          <Link
                            href={link}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                          >
                            Voir →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
