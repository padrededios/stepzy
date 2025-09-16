/**
 * Browser Push Notifications
 * Handles web push notifications for real-time updates
 */

export interface PushNotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
  }>
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return 'denied'
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    return permission
  }

  return Notification.permission
}

/**
 * Send a browser notification
 */
export async function sendBrowserNotification(data: PushNotificationData): Promise<boolean> {
  try {
    const permission = await requestNotificationPermission()
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted')
      return false
    }

    const notification = new Notification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      data: data.data,
      actions: data.actions,
      requireInteraction: false,
      silent: false
    })

    // Handle notification click
    notification.onclick = function(event) {
      event.preventDefault()
      window.focus()
      
      // Navigate to relevant page if data contains a URL
      if (data.data?.url) {
        window.location.href = data.data.url
      }
      
      notification.close()
    }

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close()
    }, 10000)

    return true
  } catch (error) {
    console.error('Error sending browser notification:', error)
    return false
  }
}

/**
 * Check if browser supports notifications and if permission is granted
 */
export function canSendNotifications(): boolean {
  return (
    'Notification' in window && 
    Notification.permission === 'granted'
  )
}

/**
 * Send different types of match notifications
 */
export const MatchNotifications = {
  matchCreated: (matchDate: string) => sendBrowserNotification({
    title: '🆕 Nouveau match disponible',
    body: `Un match est disponible le ${matchDate}`,
    data: { type: 'match_created', url: '/dashboard' }
  }),

  matchReminder: (matchDate: string, time: string) => sendBrowserNotification({
    title: '⏰ Rappel de match',
    body: `Votre match de futsal commence ${time === '2h' ? 'dans 2 heures' : 'demain'} - ${matchDate}`,
    data: { type: 'match_reminder' },
    actions: [
      { action: 'view', title: 'Voir le match' },
      { action: 'dismiss', title: 'Ignorer' }
    ]
  }),

  waitingListPromoted: (matchDate: string) => sendBrowserNotification({
    title: '🎉 Vous êtes confirmé !',
    body: `Une place s'est libérée pour le match du ${matchDate}`,
    data: { type: 'waiting_promoted', url: '/dashboard' }
  }),

  matchCancelled: (matchDate: string) => sendBrowserNotification({
    title: '❌ Match annulé',
    body: `Le match du ${matchDate} a été annulé`,
    data: { type: 'match_cancelled' }
  }),

  announcement: (title: string, content: string) => sendBrowserNotification({
    title: `📢 ${title}`,
    body: content.length > 100 ? content.substring(0, 100) + '...' : content,
    data: { type: 'announcement', url: '/notifications' }
  })
}

/**
 * Initialize push notifications on page load
 */
export function initializePushNotifications() {
  if (!('Notification' in window)) {
    return false
  }

  // Request permission if not already granted/denied
  if (Notification.permission === 'default') {
    console.log('🔔 Push notifications available - permission not requested yet')
  } else if (Notification.permission === 'granted') {
    console.log('✅ Push notifications enabled')
  } else {
    console.log('❌ Push notifications denied')
  }

  return Notification.permission === 'granted'
}

/**
 * Service Worker registration for more advanced push notifications
 * (This is a basic setup - in production you'd want a proper service worker)
 */
export async function registerServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported')
    return false
  }

  try {
    // In a real app, you'd create a service-worker.js file
    // For now, we'll just use the basic browser notifications
    console.log('📝 Service Worker support available (not implemented in this demo)')
    return true
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return false
  }
}