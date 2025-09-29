/**
 * Service pour la gestion des participations aux sessions d'activités
 */

import { prisma } from '@/lib/database/prisma'
import { ActivityParticipant, ParticipantStatus } from '@/types/activity'

export class ActivityParticipationService {
  /**
   * Inscrit un utilisateur à une session
   */
  static async joinSession(sessionId: string, userId: string): Promise<ActivityParticipant> {
    // Vérifier si l'utilisateur n'est pas déjà inscrit
    const existingParticipation = await prisma.activityParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId
        }
      }
    })

    if (existingParticipation) {
      throw new Error('Vous êtes déjà inscrit à cette session')
    }

    // Récupérer la session avec ses participants
    const session = await prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
        activity: true
      }
    })

    if (!session) {
      throw new Error('Session non trouvée')
    }

    if (session.isCancelled) {
      throw new Error('Cette session a été annulée')
    }

    // Vérifier si l'activité est dans le passé
    if (session.date < new Date()) {
      throw new Error('Impossible de s\'inscrire à une session passée')
    }

    // Compter les participants confirmés
    const confirmedCount = session.participants.filter(p => p.status === 'confirmed').length

    // Déterminer le statut du nouveau participant
    let status: ParticipantStatus = 'interested'
    if (confirmedCount < session.maxPlayers) {
      status = 'confirmed'
    } else {
      status = 'waiting'
    }

    // Créer la participation
    const participation = await prisma.activityParticipant.create({
      data: {
        sessionId,
        userId,
        status
      },
      include: {
        user: true,
        session: {
          include: {
            activity: true
          }
        }
      }
    })

    // Si c'est une confirmation, envoyer une notification
    if (status === 'confirmed') {
      await this.notifyParticipationConfirmed(participation)
    } else {
      await this.notifyAddedToWaitingList(participation)
    }

    return participation as ActivityParticipant
  }

  /**
   * Désinscrit un utilisateur d'une session
   */
  static async leaveSession(sessionId: string, userId: string): Promise<void> {
    const participation = await prisma.activityParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId
        }
      },
      include: {
        session: {
          include: {
            activity: true
          }
        }
      }
    })

    if (!participation) {
      throw new Error('Vous n\'êtes pas inscrit à cette session')
    }

    const wasConfirmed = participation.status === 'confirmed'

    // Supprimer la participation
    await prisma.activityParticipant.delete({
      where: {
        sessionId_userId: {
          sessionId,
          userId
        }
      }
    })

    // Si c'était un participant confirmé, promouvoir quelqu'un de la liste d'attente
    if (wasConfirmed) {
      await this.promoteFromWaitingList(sessionId)
    }
  }

  /**
   * Promeut le premier participant de la liste d'attente
   */
  static async promoteFromWaitingList(sessionId: string): Promise<void> {
    // Trouver le premier participant en attente
    const nextInLine = await prisma.activityParticipant.findFirst({
      where: {
        sessionId,
        status: 'waiting'
      },
      orderBy: {
        joinedAt: 'asc'
      },
      include: {
        user: true,
        session: {
          include: {
            activity: true
          }
        }
      }
    })

    if (nextInLine) {
      // Le promouvoir
      await prisma.activityParticipant.update({
        where: {
          id: nextInLine.id
        },
        data: {
          status: 'confirmed'
        }
      })

      // Envoyer une notification
      await this.notifyPromotedFromWaitingList(nextInLine as ActivityParticipant)
    }
  }

  /**
   * Récupère les statistiques d'une session
   */
  static async getSessionStats(sessionId: string): Promise<{
    confirmedCount: number
    waitingCount: number
    totalCount: number
    availableSpots: number
  }> {
    const session = await prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: {
        participants: true
      }
    })

    if (!session) {
      throw new Error('Session non trouvée')
    }

    const confirmedCount = session.participants.filter(p => p.status === 'confirmed').length
    const waitingCount = session.participants.filter(p => p.status === 'waiting').length
    const totalCount = session.participants.length
    const availableSpots = Math.max(0, session.maxPlayers - confirmedCount)

    return {
      confirmedCount,
      waitingCount,
      totalCount,
      availableSpots
    }
  }

  /**
   * Vérifie si un utilisateur peut s'inscrire à une session
   */
  static async canUserJoinSession(sessionId: string, userId: string): Promise<{
    canJoin: boolean
    reason?: string
    wouldBeWaiting: boolean
  }> {
    // Vérifier si déjà inscrit
    const existingParticipation = await prisma.activityParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId
        }
      }
    })

    if (existingParticipation) {
      return {
        canJoin: false,
        reason: 'Vous êtes déjà inscrit à cette session',
        wouldBeWaiting: false
      }
    }

    // Récupérer la session
    const session = await prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: {
        participants: true
      }
    })

    if (!session) {
      return {
        canJoin: false,
        reason: 'Session non trouvée',
        wouldBeWaiting: false
      }
    }

    if (session.isCancelled) {
      return {
        canJoin: false,
        reason: 'Cette session a été annulée',
        wouldBeWaiting: false
      }
    }

    if (session.date < new Date()) {
      return {
        canJoin: false,
        reason: 'Impossible de s\'inscrire à une session passée',
        wouldBeWaiting: false
      }
    }

    const confirmedCount = session.participants.filter(p => p.status === 'confirmed').length
    const wouldBeWaiting = confirmedCount >= session.maxPlayers

    return {
      canJoin: true,
      wouldBeWaiting
    }
  }

  /**
   * Récupère le statut de participation d'un utilisateur pour une session
   */
  static async getUserParticipationStatus(
    sessionId: string,
    userId: string
  ): Promise<ActivityParticipant | null> {
    return await prisma.activityParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId
        }
      },
      include: {
        user: true,
        session: {
          include: {
            activity: true
          }
        }
      }
    }) as ActivityParticipant | null
  }

  /**
   * Fonctions de notification (à implémenter avec le système existant)
   */
  private static async notifyParticipationConfirmed(participation: ActivityParticipant): Promise<void> {
    // TODO: Intégrer avec le système de notifications existant
    console.log(`Notification: Participation confirmée pour ${participation.user.pseudo}`)
  }

  private static async notifyAddedToWaitingList(participation: ActivityParticipant): Promise<void> {
    // TODO: Intégrer avec le système de notifications existant
    console.log(`Notification: Ajouté à la liste d'attente pour ${participation.user.pseudo}`)
  }

  private static async notifyPromotedFromWaitingList(participation: ActivityParticipant): Promise<void> {
    // TODO: Intégrer avec le système de notifications existant
    console.log(`Notification: Promu de la liste d'attente pour ${participation.user.pseudo}`)
  }

  /**
   * Met à jour le statut de tous les participants intéressés en confirmé si des places se libèrent
   */
  static async processInterestedParticipants(sessionId: string): Promise<void> {
    const session = await prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          orderBy: {
            joinedAt: 'asc'
          }
        }
      }
    })

    if (!session) return

    const confirmedCount = session.participants.filter(p => p.status === 'confirmed').length
    const availableSpots = session.maxPlayers - confirmedCount

    if (availableSpots > 0) {
      const waitingParticipants = session.participants.filter(p => p.status === 'waiting')
      const toPromote = waitingParticipants.slice(0, availableSpots)

      for (const participant of toPromote) {
        await prisma.activityParticipant.update({
          where: { id: participant.id },
          data: { status: 'confirmed' }
        })

        await this.notifyPromotedFromWaitingList(participant as ActivityParticipant)
      }
    }
  }
}