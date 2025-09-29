/**
 * Utilities for date formatting and manipulation
 */

export const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d)
}

export const formatTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export const formatDateTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export const formatDateShort = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(d)
}

export const isToday = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export const isFuture = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.getTime() > Date.now()
}

export const isPast = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.getTime() < Date.now()
}

export const getTimeUntil = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = d.getTime() - now.getTime()

  if (diff <= 0) return null

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `Dans ${days} jour${days > 1 ? 's' : ''}`
  if (hours > 0) return `Dans ${hours}h${minutes % 60 > 0 ? (minutes % 60) + 'min' : ''}`
  if (minutes > 0) return `Dans ${minutes} minute${minutes > 1 ? 's' : ''}`

  return 'Bientôt'
}