/**
 * Session Reminder Job
 * Runs periodically to send session reminders 24h before
 */

import { NotificationService } from '../services/notification.service'

// Interval in milliseconds (1 hour)
const REMINDER_CHECK_INTERVAL = 60 * 60 * 1000

let reminderInterval: NodeJS.Timeout | null = null

/**
 * Start the reminder job
 */
export function startReminderJob() {
  if (reminderInterval) {
    console.log('[ReminderJob] Job already running')
    return
  }

  console.log('[ReminderJob] Starting reminder job...')

  // Run immediately on start
  runReminderCheck()

  // Then run every hour
  reminderInterval = setInterval(runReminderCheck, REMINDER_CHECK_INTERVAL)
}

/**
 * Stop the reminder job
 */
export function stopReminderJob() {
  if (reminderInterval) {
    clearInterval(reminderInterval)
    reminderInterval = null
    console.log('[ReminderJob] Reminder job stopped')
  }
}

/**
 * Run the reminder check
 */
async function runReminderCheck() {
  try {
    console.log('[ReminderJob] Running reminder check...')
    const count = await NotificationService.createSessionReminders()
    console.log(`[ReminderJob] Created ${count} reminder notification(s)`)
  } catch (error) {
    console.error('[ReminderJob] Error running reminder check:', error)
  }
}
