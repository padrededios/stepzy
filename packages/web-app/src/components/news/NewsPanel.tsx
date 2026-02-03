'use client'

import { useState, useEffect } from 'react'
import type { Announcement, AnnouncementPriority } from '@stepzy/shared'

interface NewsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NewsPanel({ isOpen, onClose }: NewsPanelProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements()
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

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_BASE_URL}/api/announcements?limit=20`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const parsedAnnouncements = data.data.announcements.map((ann: any) => ({
            ...ann,
            createdAt: new Date(ann.createdAt),
            updatedAt: new Date(ann.updatedAt)
          }))
          setAnnouncements(parsedAnnouncements)
        }
      }
    } catch (error) {
      // Failed to fetch announcements
    } finally {
      setLoading(false)
    }
  }

  const getPriorityConfig = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgent':
        return {
          icon: '🚨',
          bgColor: 'bg-red-50',
          borderColor: 'border-l-red-500',
          textColor: 'text-red-700',
          badge: 'bg-red-500'
        }
      case 'high':
        return {
          icon: '⚡',
          bgColor: 'bg-orange-50',
          borderColor: 'border-l-orange-500',
          textColor: 'text-orange-700',
          badge: 'bg-orange-500'
        }
      case 'normal':
        return {
          icon: '📰',
          bgColor: 'bg-blue-50',
          borderColor: 'border-l-blue-500',
          textColor: 'text-blue-700',
          badge: 'bg-blue-500'
        }
      case 'low':
      default:
        return {
          icon: '📋',
          bgColor: 'bg-gray-50',
          borderColor: 'border-l-gray-400',
          textColor: 'text-gray-700',
          badge: 'bg-gray-500'
        }
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Aujourd\'hui'
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getPriorityLabel = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgent': return 'Urgent'
      case 'high': return 'Important'
      case 'normal': return 'Actualité'
      case 'low': return 'Info'
      default: return 'Info'
    }
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📰</span>
            <h2 className="text-xl font-bold text-white">Actualités</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-sm text-gray-500 mt-4">Chargement...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg text-center">Aucune actualité</p>
              <p className="text-gray-400 text-sm mt-1 text-center">
                Les nouvelles fonctionnalités et événements apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {announcements.map((announcement) => {
                const config = getPriorityConfig(announcement.priority)

                return (
                  <div
                    key={announcement.id}
                    className={`px-6 py-5 ${config.bgColor} border-l-4 ${config.borderColor} hover:bg-opacity-80 transition-colors`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl flex-shrink-0">
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${config.badge}`}>
                              {getPriorityLabel(announcement.priority)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(announcement.createdAt)}
                            </span>
                          </div>
                        </div>

                        <h3 className={`text-sm font-semibold ${config.textColor} mb-2`}>
                          {announcement.title}
                        </h3>

                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {announcement.content}
                        </p>

                        {announcement.author && (
                          <div className="flex items-center mt-3 text-xs text-gray-400">
                            <span>Publié par</span>
                            <span className="font-medium text-gray-600 ml-1">
                              {announcement.author.pseudo}
                            </span>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-center text-sm text-gray-500">
            🎉 Restez informé des nouvelles fonctionnalités !
          </p>
        </div>
      </div>
    </>
  )
}
