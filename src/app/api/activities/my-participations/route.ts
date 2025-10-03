import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { addWeeks } from 'date-fns'

/**
 * GET /api/activities/my-participations - Récupérer les activités auxquelles l'utilisateur participe
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get('cookie')
    let sessionToken = null

    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

      sessionToken = cookies['futsal.session-token']
    }

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Find session in database
    const sessionData = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: true
      }
    })

    if (!sessionData || sessionData.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = sessionData.user

    const { searchParams } = new URL(request.url)
    const weeksAhead = parseInt(searchParams.get('weeksAhead') || '2')
    const includePast = searchParams.get('includePast') === 'true'

    const now = new Date()
    const futureLimit = addWeeks(now, weeksAhead)

    // 1. Récupérer toutes les participations directes de l'utilisateur
    const participations = await prisma.activityParticipant.findMany({
      where: {
        userId: user.id,
        session: includePast ? {} : {
          date: {
            gte: now
          }
        }
      },
      include: {
        session: {
          include: {
            activity: {
              include: {
                creator: {
                  select: {
                    id: true,
                    pseudo: true,
                    avatar: true
                  }
                }
              }
            },
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    pseudo: true,
                    avatar: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        session: {
          date: includePast ? 'desc' : 'asc'
        }
      }
    })

    // 2. Récupérer les abonnements de l'utilisateur (activités auxquelles il est inscrit)
    const subscriptions = await prisma.activitySubscription.findMany({
      where: {
        userId: user.id
      },
      include: {
        activity: {
          include: {
            creator: {
              select: {
                id: true,
                pseudo: true,
                avatar: true
              }
            },
            sessions: {
              where: includePast ? {} : {
                date: {
                  gte: now
                }
              },
              include: {
                participants: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        pseudo: true,
                        avatar: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                date: includePast ? 'desc' : 'asc'
              }
            }
          }
        }
      }
    })

    // 3. Grouper par activité et enrichir les données
    const activitiesMap = new Map()

    // Traiter les participations directes
    for (const participation of participations) {
      const activityId = participation.session.activity.id

      if (!activitiesMap.has(activityId)) {
        activitiesMap.set(activityId, {
          activity: participation.session.activity,
          sessions: [],
          userStatus: {
            isSubscribed: false,
            totalParticipations: 0,
            confirmedParticipations: 0,
            waitingParticipations: 0
          }
        })
      }

      const activityData = activitiesMap.get(activityId)

      // Enrichir la session avec les stats
      const enrichedSession = {
        ...participation.session,
        userParticipation: {
          id: participation.id,
          status: participation.status,
          joinedAt: participation.joinedAt
        },
        confirmedParticipants: participation.session.participants.filter(p => p.status === 'confirmed').length,
        waitingParticipants: participation.session.participants.filter(p => p.status === 'waiting').length,
        totalParticipants: participation.session.participants.length,
        availableSpots: participation.session.maxPlayers - participation.session.participants.filter(p => p.status === 'confirmed').length
      }

      activityData.sessions.push(enrichedSession)

      // Mettre à jour les stats utilisateur
      activityData.userStatus.totalParticipations++
      if (participation.status === 'confirmed') {
        activityData.userStatus.confirmedParticipations++
      } else if (participation.status === 'waiting') {
        activityData.userStatus.waitingParticipations++
      }
    }

    // Marquer les activités auxquelles l'utilisateur est abonné
    for (const subscription of subscriptions) {
      const activityId = subscription.activity.id

      if (activitiesMap.has(activityId)) {
        // L'activité existe déjà (via participations), juste marquer comme abonné
        activitiesMap.get(activityId).userStatus.isSubscribed = true
      }
      // Note: On n'ajoute PAS toutes les sessions d'une activité juste parce qu'on y est abonné
      // L'abonnement sert uniquement à faciliter l'inscription, pas à afficher toutes les sessions
    }

    // Convertir en array et separer passe/futur si necessaire
    const activities = Array.from(activitiesMap.values()).map(activityData => ({
      ...activityData.activity,
      sessions: activityData.sessions,
      userStatus: activityData.userStatus
    }))

    let result
    if (includePast) {
      const upcomingActivities = activities.filter(a =>
        a.sessions.some(s => s.date >= now)
      ).map(a => ({
        ...a,
        sessions: a.sessions.filter(s => s.date >= now)
      }))

      const pastActivities = activities.filter(a =>
        a.sessions.some(s => s.date < now)
      ).map(a => ({
        ...a,
        sessions: a.sessions.filter(s => s.date < now)
      }))

      result = {
        upcoming: upcomingActivities,
        past: pastActivities,
        totalUpcoming: upcomingActivities.length,
        totalPast: pastActivities.length
      }
    } else {
      result = {
        activities,
        totalCount: activities.length
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des participations:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des participations' },
      { status: 500 }
    )
  }
}