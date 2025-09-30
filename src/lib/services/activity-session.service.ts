/**
 * Service pour la gestion et génération automatique des sessions d'activités
 */

import { prisma } from '@/lib/database/prisma'
import { Activity, RecurringType, DayOfWeek, ActivitySession, SessionStatus } from '@/types/activity'
import { addDays, addWeeks, addMonths, startOfDay, isSameDay, getDay } from 'date-fns'

export class ActivitySessionService {
  /**
   * Génère les sessions pour une activité sur une période donnée
   */
  static async generateSessions(activityId: string, fromDate: Date, weeksAhead: number = 2): Promise<ActivitySession[]> {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if (!activity) {
      throw new Error('Activity not found')
    }

    const sessions: ActivitySession[] = []
    const endDate = addWeeks(fromDate, weeksAhead)

    // Générer les sessions selon le type de récurrence
    if (activity.recurringType === 'weekly') {
      sessions.push(...await this.generateWeeklySessions(activity, fromDate, endDate))
    } else if (activity.recurringType === 'monthly') {
      sessions.push(...await this.generateMonthlySessions(activity, fromDate, endDate))
    }

    return sessions
  }

  /**
   * Génère les sessions hebdomadaires
   */
  private static async generateWeeklySessions(
    activity: Activity,
    fromDate: Date,
    endDate: Date
  ): Promise<ActivitySession[]> {
    const sessions: ActivitySession[] = []
    const dayMapping: Record<DayOfWeek, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    }

    // Pour chaque jour de récurrence
    for (const dayOfWeek of activity.recurringDays as DayOfWeek[]) {
      const targetDayNumber = dayMapping[dayOfWeek]
      let currentDate = new Date(fromDate)

      // Trouver le prochain jour correspondant
      while (getDay(currentDate) !== targetDayNumber) {
        currentDate = addDays(currentDate, 1)
      }

      // Générer les sessions hebdomadaires
      while (currentDate <= endDate) {
        // Vérifier si la session n'existe pas déjà
        const existingSession = await prisma.activitySession.findFirst({
          where: {
            activityId: activity.id,
            date: {
              gte: startOfDay(currentDate),
              lt: addDays(startOfDay(currentDate), 1)
            }
          }
        })

        if (!existingSession) {
          // Créer la session à 12h00 par défaut
          const sessionDate = new Date(currentDate)
          sessionDate.setHours(12, 0, 0, 0)

          const session = await prisma.activitySession.create({
            data: {
              activityId: activity.id,
              date: sessionDate,
              maxPlayers: activity.maxPlayers,
              status: 'active'
            }
          })

          sessions.push(session as ActivitySession)
        }

        currentDate = addWeeks(currentDate, 1)
      }
    }

    return sessions
  }

  /**
   * Génère les sessions mensuelles
   */
  private static async generateMonthlySessions(
    activity: Activity,
    fromDate: Date,
    endDate: Date
  ): Promise<ActivitySession[]> {
    const sessions: ActivitySession[] = []
    const dayMapping: Record<DayOfWeek, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    }

    // Pour chaque jour de récurrence (par exemple premier lundi du mois)
    for (const dayOfWeek of activity.recurringDays as DayOfWeek[]) {
      const targetDayNumber = dayMapping[dayOfWeek]
      let currentMonth = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)

      while (currentMonth <= endDate) {
        // Trouver le premier jour correspondant du mois
        let sessionDate = new Date(currentMonth)
        while (getDay(sessionDate) !== targetDayNumber) {
          sessionDate = addDays(sessionDate, 1)
        }

        // Si la date est dans notre fenêtre
        if (sessionDate >= fromDate && sessionDate <= endDate) {
          // Vérifier si la session n'existe pas déjà
          const existingSession = await prisma.activitySession.findFirst({
            where: {
              activityId: activity.id,
              date: {
                gte: startOfDay(sessionDate),
                lt: addDays(startOfDay(sessionDate), 1)
              }
            }
          })

          if (!existingSession) {
            // Créer la session à 12h00 par défaut
            sessionDate.setHours(12, 0, 0, 0)

            const session = await prisma.activitySession.create({
              data: {
                activityId: activity.id,
                date: sessionDate,
                maxPlayers: activity.maxPlayers,
                status: 'active'
              }
            })

            sessions.push(session as ActivitySession)
          }
        }

        currentMonth = addMonths(currentMonth, 1)
      }
    }

    return sessions
  }

  /**
   * Génère les sessions pour toutes les activités actives
   * À appeler via cron job quotidien
   */
  static async generateAllUpcomingSessions(weeksAhead: number = 2): Promise<void> {
    const activities = await prisma.activity.findMany({
      where: {
        isPublic: true
      }
    })

    const now = new Date()

    for (const activity of activities) {
      try {
        await this.generateSessions(activity.id, now, weeksAhead)
      } catch (error) {
        console.error(`Erreur lors de la génération des sessions pour l'activité ${activity.id}:`, error)
      }
    }
  }

  /**
   * Récupère les sessions à venir pour une activité
   */
  static async getUpcomingSessions(
    activityId: string,
    weeksAhead: number = 2
  ): Promise<ActivitySession[]> {
    const now = new Date()
    const endDate = addWeeks(now, weeksAhead)

    return await prisma.activitySession.findMany({
      where: {
        activityId,
        date: {
          gte: now,
          lte: endDate
        },
        status: 'active',
        isCancelled: false
      },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        activity: true
      },
      orderBy: {
        date: 'asc'
      }
    }) as ActivitySession[]
  }

  /**
   * Récupère toutes les sessions à venir pour un utilisateur
   */
  static async getUserUpcomingSessions(
    userId: string,
    weeksAhead: number = 2
  ): Promise<ActivitySession[]> {
    const now = new Date()
    const endDate = addWeeks(now, weeksAhead)

    return await prisma.activitySession.findMany({
      where: {
        date: {
          gte: now,
          lte: endDate
        },
        status: 'active',
        isCancelled: false,
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        activity: {
          include: {
            creator: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    }) as ActivitySession[]
  }

  /**
   * Récupère toutes les sessions disponibles (avec places libres)
   * Si userId est fourni, ne retourne que les sessions des activités auxquelles l'utilisateur est abonné
   */
  static async getAvailableSessions(
    weeksAhead: number = 2,
    sportFilter?: string,
    userId?: string
  ): Promise<ActivitySession[]> {
    const now = new Date()
    const endDate = addWeeks(now, weeksAhead)

    const whereClause: any = {
      date: {
        gte: now,
        lte: endDate
      },
      status: 'active',
      isCancelled: false
    }

    if (sportFilter) {
      whereClause.activity = {
        sport: sportFilter
      }
    }

    // Si userId est fourni, récupérer uniquement les activités auxquelles l'utilisateur est abonné
    if (userId) {
      // Trouver les IDs des activités auxquelles l'utilisateur est abonné
      const userSubscriptions = await prisma.activitySubscription.findMany({
        where: {
          userId
        },
        select: {
          activityId: true
        }
      })

      const subscribedActivityIds = userSubscriptions.map(sub => sub.activityId)

      if (subscribedActivityIds.length === 0) {
        return []
      }

      whereClause.activityId = {
        in: subscribedActivityIds
      }
    }

    const sessions = await prisma.activitySession.findMany({
      where: whereClause,
      include: {
        participants: {
          include: {
            user: true
          }
        },
        activity: {
          include: {
            creator: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Retourner toutes les sessions (l'état du bouton sera géré côté client)
    // Ne plus filtrer les sessions où l'utilisateur est déjà inscrit
    return sessions as ActivitySession[]
  }

  /**
   * Met à jour le statut des sessions terminées
   */
  static async updateCompletedSessions(): Promise<void> {
    const now = new Date()

    await prisma.activitySession.updateMany({
      where: {
        date: {
          lt: now
        },
        status: 'active'
      },
      data: {
        status: 'completed'
      }
    })
  }

  /**
   * Supprime les sessions anciennes (plus de 30 jours)
   */
  static async cleanupOldSessions(): Promise<void> {
    const thirtyDaysAgo = addDays(new Date(), -30)

    await prisma.activitySession.deleteMany({
      where: {
        date: {
          lt: thirtyDaysAgo
        },
        status: 'completed'
      }
    })
  }
}