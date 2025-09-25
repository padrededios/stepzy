/**
 * Match Reminder System
 * Handles automatic reminders for upcoming matches
 */

import { prisma } from '../database/prisma'
import { notifyMatchEvent } from './service'

/**
 * Sends reminders for matches happening in the next 24 hours
 */
export async function sendMatchReminders() {
  try {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Find matches that are:
    // 1. Happening in the next 24 hours
    // 2. Not cancelled or completed
    // 3. Have confirmed players
    const upcomingMatches = await prisma.match.findMany({
      where: {
        date: {
          gte: now,
          lte: tomorrow
        },
        status: {
          in: ['open', 'full']
        }
      },
      include: {
        players: {
          where: {
            status: 'confirmed'
          },
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                email: true
              }
            }
          }
        }
      }
    })

    let remindersSent = 0

    for (const match of upcomingMatches) {
      if (match.players.length === 0) continue

      const matchTime = match.date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })

      const matchDate = match.date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })

      const userIds = match.players.map(player => player.user.id)
      
      await notifyMatchEvent(
        'match_reminder',
        match.id,
        userIds,
        `⏰ Rappel : Match demain à ${matchTime}`,
        `N'oubliez pas votre activité sportive prévue ${matchDate} à ${matchTime}. Pensez à vous équiper !`,
        {
          matchDate: match.date,
          playersCount: match.players.length,
          maxPlayers: match.maxPlayers
        }
      )

      remindersSent += match.players.length
    }

    console.log(`📅 Sent ${remindersSent} match reminders for ${upcomingMatches.length} matches`)
    return { matchesFound: upcomingMatches.length, remindersSent }

  } catch (error) {
    console.error('Error sending match reminders:', error)
    throw error
  }
}

/**
 * Sends notification when a match is about to start (2 hours before)
 */
export async function sendMatchStartingSoon() {
  try {
    const now = new Date()
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    const startingMatches = await prisma.match.findMany({
      where: {
        date: {
          gte: now,
          lte: twoHoursFromNow
        },
        status: {
          in: ['open', 'full']
        }
      },
      include: {
        players: {
          where: {
            status: 'confirmed'
          },
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                email: true
              }
            }
          }
        }
      }
    })

    let notificationsSent = 0

    for (const match of startingMatches) {
      if (match.players.length === 0) continue

      const userIds = match.players.map(player => player.user.id)
      
      await notifyMatchEvent(
        'match_reminder',
        match.id,
        userIds,
        '🚀 Votre match commence dans 2h !',
        'Préparez-vous, votre activité sportive commence bientôt. Bon match !',
        {
          matchDate: match.date,
          timeUntilMatch: '2 heures',
          playersCount: match.players.length
        }
      )

      notificationsSent += match.players.length
    }

    console.log(`🕐 Sent ${notificationsSent} "starting soon" notifications for ${startingMatches.length} matches`)
    return { matchesFound: startingMatches.length, notificationsSent }

  } catch (error) {
    console.error('Error sending starting soon notifications:', error)
    throw error
  }
}

/**
 * Promotes users from waiting list when a confirmed player leaves
 */
export async function promoteFromWaitingList(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: {
          orderBy: { joinedAt: 'asc' }
        }
      }
    })

    if (!match) {
      throw new Error('Match not found')
    }

    const confirmedPlayers = match.players.filter(p => p.status === 'confirmed')
    const waitingPlayers = match.players.filter(p => p.status === 'waiting')

    // If there's space and people waiting, promote the first person
    if (confirmedPlayers.length < match.maxPlayers && waitingPlayers.length > 0) {
      const playerToPromote = waitingPlayers[0]

      // Update player status to confirmed
      await prisma.matchPlayer.update({
        where: { id: playerToPromote.id },
        data: { status: 'confirmed' }
      })

      // Get user info for notification
      const userToPromote = await prisma.user.findUnique({
        where: { id: playerToPromote.userId }
      })

      if (userToPromote) {
        await notifyMatchEvent(
          'waiting_list_promoted',
          match.id,
          [userToPromote.id],
          '🎉 Vous avez été confirmé pour le match !',
          `Bonne nouvelle ! Une place s'est libérée et vous êtes maintenant confirmé pour le match du ${match.date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
          })}.`,
          {
            matchDate: match.date,
            previousStatus: 'waiting',
            newStatus: 'confirmed'
          }
        )
      }

      // Update match status if it becomes full
      const newConfirmedCount = confirmedPlayers.length + 1
      if (newConfirmedCount === match.maxPlayers && match.status === 'open') {
        await prisma.match.update({
          where: { id: match.id },
          data: { status: 'full' }
        })
      }

      console.log(`✅ Promoted user ${userToPromote?.pseudo} from waiting list for match ${matchId}`)
      return true
    }

    return false
  } catch (error) {
    console.error('Error promoting from waiting list:', error)
    throw error
  }
}

/**
 * Automatically updates completed matches and sends notifications
 */
export async function updateCompletedMatches() {
  try {
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    // Find matches that ended more than 2 hours ago but are not marked as completed
    const finishedMatches = await prisma.match.findMany({
      where: {
        date: {
          lte: twoHoursAgo
        },
        status: {
          in: ['open', 'full']
        }
      },
      include: {
        players: {
          where: { status: 'confirmed' },
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                email: true
              }
            }
          }
        }
      }
    })

    let updatedCount = 0

    for (const match of finishedMatches) {
      // Mark match as completed
      await prisma.match.update({
        where: { id: match.id },
        data: { status: 'completed' }
      })

      // Send completion notification to all players
      if (match.players.length > 0) {
        const userIds = match.players.map(p => p.user.id)
        
        await notifyMatchEvent(
          'system',
          match.id,
          userIds,
          '✅ Match terminé !',
          `Le match du ${match.date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })} a été marqué comme terminé. Merci d'avoir participé !`,
          {
            matchDate: match.date,
            participantsCount: match.players.length
          }
        )
      }

      updatedCount++
    }

    console.log(`🏁 Updated ${updatedCount} matches to completed status`)
    return { updatedCount }

  } catch (error) {
    console.error('Error updating completed matches:', error)
    throw error
  }
}

/**
 * Main function to run all periodic notification tasks
 */
export async function runNotificationTasks() {
  console.log('🔄 Running notification tasks...')
  
  const results = {
    reminders: await sendMatchReminders(),
    startingSoon: await sendMatchStartingSoon(),
    completed: await updateCompletedMatches()
  }

  console.log('✅ Notification tasks completed:', results)
  return results
}