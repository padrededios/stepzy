'use client'

import { useState, useEffect } from 'react'

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: Date
  author: {
    pseudo: string
  }
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
    
    // Get dismissed announcements from localStorage
    const dismissedIds = localStorage.getItem('dismissedAnnouncements')
    if (dismissedIds) {
      setDismissed(new Set(JSON.parse(dismissedIds)))
    }
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/announcements?activeOnly=true&limit=5')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const parsedAnnouncements = data.data.announcements.map((ann: any) => ({
            ...ann,
            createdAt: new Date(ann.createdAt)
          }))
          setAnnouncements(parsedAnnouncements)
        }
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissAnnouncement = (id: string) => {
    const newDismissed = new Set([...dismissed, id])
    setDismissed(newDismissed)
    
    // Save to localStorage
    localStorage.setItem('dismissedAnnouncements', JSON.stringify([...newDismissed]))
  }

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-500 text-red-800'
      case 'high':
        return 'bg-orange-100 border-orange-500 text-orange-800'
      case 'normal':
        return 'bg-blue-100 border-blue-500 text-blue-800'
      case 'low':
        return 'bg-gray-100 border-gray-500 text-gray-800'
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '🚨'
      case 'high':
        return '⚠️'
      case 'normal':
        return '📢'
      case 'low':
        return 'ℹ️'
      default:
        return '📢'
    }
  }

  const visibleAnnouncements = announcements.filter(ann => !dismissed.has(ann.id))

  if (loading || visibleAnnouncements.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mb-8">
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className={`rounded-lg border-l-4 p-4 ${getPriorityStyles(announcement.priority)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{getPriorityIcon(announcement.priority)}</span>
                <h3 className="text-lg font-semibold">{announcement.title}</h3>
              </div>
              
              <p className="whitespace-pre-wrap mb-3">{announcement.content}</p>
              
              <p className="text-sm opacity-75">
                Par {announcement.author.pseudo} • {announcement.createdAt.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            <button
              onClick={() => dismissAnnouncement(announcement.id)}
              className="ml-4 p-1 hover:bg-black/10 rounded transition-colors"
              title="Masquer cette annonce"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}