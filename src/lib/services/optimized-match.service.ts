/**
 * Optimized Match Service
 * High-performance match operations with caching and query optimization
 */

import { prisma } from '../database/prisma'
import { cache, CACHE_KEYS, CACHE_TTL } from '../cache/redis'
import { monitorPerformance, cachedDatabaseQuery } from '../middleware/monitoring'
import { metrics, BusinessMetrics } from '../monitoring/metrics'

export class OptimizedMatchService {
  
  /**
   * Get upcoming matches with optimized query and caching
   */
  @monitorPerformance('match.service.upcoming')
  async getUpcomingMatches(limit: number = 20, offset: number = 0) {
    const cacheKey = `${CACHE_KEYS.MATCHES_UPCOMING}:${limit}:${offset}`
    
    return cachedDatabaseQuery(
      cacheKey,
      async () => {
        const now = new Date()
        const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

        return prisma.match.findMany({
          where: {
            date: {
              gte: now,
              lte: twoWeeksFromNow
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
                    avatar: true
                  }
                }
              },
              orderBy: {
                joinedAt: 'asc'
              }
            },
            // Only get waiting list count for performance
            _count: {
              select: {
                players: {
                  where: { status: 'waiting' }
                }
              }
            }
          },
          orderBy: {
            date: 'asc'
          },
          take: limit,
          skip: offset
        })
      },
      CACHE_TTL.SHORT, // 1 minute cache for upcoming matches
      'upcoming_matches_with_players'
    )
  }

  /**
   * Get match details with optimized relations
   */
  @monitorPerformance('match.service.details')
  async getMatchDetails(matchId: string, userId?: string) {
    const cacheKey = CACHE_KEYS.MATCH_DETAIL(matchId)
    
    const match = await cachedDatabaseQuery(
      cacheKey,
      async () => {
        return prisma.match.findUnique({
          where: { id: matchId },
          include: {
            players: {
              include: {
                user: {
                  select: {
                    id: true,
                    pseudo: true,
                    avatar: true,
                    role: true
                  }
                }
              },
              orderBy: [
                { status: 'desc' }, // confirmed first, then waiting
                { joinedAt: 'asc' }  // FIFO within same status
              ]
            }
          }
        })
      },
      CACHE_TTL.SHORT,
      'match_details_with_players'
    )

    if (!match) return null

    // Add user-specific data without caching (personalized)
    if (userId) {
      const userPlayer = match.players.find(p => p.user.id === userId)
      return {
        ...match,
        userRegistration: userPlayer ? {
          status: userPlayer.status,
          joinedAt: userPlayer.joinedAt,
          position: match.players
            .filter(p => p.status === userPlayer.status)
            .findIndex(p => p.id === userPlayer.id) + 1
        } : null
      }
    }

    return match
  }

  /**
   * Get user's matches with pagination and filtering
   */
  @monitorPerformance('match.service.user_matches')
  async getUserMatches(
    userId: string, 
    options: {
      status?: 'upcoming' | 'past' | 'cancelled' | 'all'
      limit?: number
      offset?: number
    } = {}
  ) {
    const { status = 'all', limit = 20, offset = 0 } = options
    const cacheKey = `${CACHE_KEYS.MATCHES_USER(userId)}:${status}:${limit}:${offset}`
    
    return cachedDatabaseQuery(
      cacheKey,
      async () => {
        const now = new Date()
        let dateFilter: any = {}
        let statusFilter: any = {}

        // Apply filters based on status
        switch (status) {
          case 'upcoming':
            dateFilter = { gte: now }
            statusFilter = { in: ['open', 'full'] }
            break
          case 'past':
            statusFilter = { in: ['completed'] }
            break
          case 'cancelled':
            statusFilter = { in: ['cancelled'] }
            break
        }

        return prisma.match.findMany({
          where: {
            ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
            ...(Object.keys(statusFilter).length > 0 && { status: statusFilter }),
            players: {
              some: {
                userId,
                status: {
                  in: ['confirmed', 'waiting']
                }
              }
            }
          },
          include: {
            players: {
              where: { userId },
              select: {
                status: true,
                joinedAt: true
              }
            },
            _count: {
              select: {
                players: {
                  where: { status: 'confirmed' }
                }
              }
            }
          },
          orderBy: {
            date: status === 'past' ? 'desc' : 'asc'
          },
          take: limit,
          skip: offset
        })
      },
      CACHE_TTL.MEDIUM, // 5 minutes cache for user matches
      `user_matches_${status}`
    )
  }

  /**
   * Join match with optimized transaction and cache invalidation
   */
  @monitorPerformance('match.service.join')
  async joinMatch(matchId: string, userId: string) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get match with lock
        const match = await tx.match.findUnique({
          where: { id: matchId },
          include: {
            players: {
              where: { status: 'confirmed' }
            }
          }
        })

        if (!match) {
          throw new Error('Match not found')
        }

        // Check if user already joined
        const existingPlayer = await tx.matchPlayer.findUnique({
          where: {
            userId_matchId: {
              userId,
              matchId
            }
          }
        })

        if (existingPlayer) {
          throw new Error('Already registered for this match')
        }

        // Determine status based on capacity
        const confirmedCount = match.players.length
        const status = confirmedCount < match.maxPlayers ? 'confirmed' : 'waiting'

        // Create match player
        const matchPlayer = await tx.matchPlayer.create({
          data: {
            userId,
            matchId,
            status,
            joinedAt: new Date()
          }
        })

        // Update match status if it becomes full
        if (status === 'confirmed' && confirmedCount + 1 === match.maxPlayers) {
          await tx.match.update({
            where: { id: matchId },
            data: { status: 'full' }
          })
        }

        return { matchPlayer, newStatus: status }
      })

      // Invalidate caches
      await this.invalidateMatchCaches(matchId, userId)
      
      // Record business metrics
      BusinessMetrics.matchJoined()
      if (result.newStatus === 'waiting') {
        metrics.recordBusinessMetric('waiting_list.added', 1)
      }

      return result

    } catch (error) {
      metrics.recordError(error as Error, { 
        endpoint: 'match.join',
        additionalTags: { matchId, userId }
      })
      throw error
    }
  }

  /**
   * Leave match with optimized promotion logic
   */
  @monitorPerformance('match.service.leave')
  async leaveMatch(matchId: string, userId: string) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Find and delete match player
        const matchPlayer = await tx.matchPlayer.findUnique({
          where: {
            userId_matchId: { userId, matchId }
          }
        })

        if (!matchPlayer) {
          throw new Error('Not registered for this match')
        }

        await tx.matchPlayer.delete({
          where: { id: matchPlayer.id }
        })

        // If was confirmed player, promote from waiting list
        let promotedUser = null
        if (matchPlayer.status === 'confirmed') {
          const nextWaiting = await tx.matchPlayer.findFirst({
            where: {
              matchId,
              status: 'waiting'
            },
            orderBy: { joinedAt: 'asc' },
            include: { user: true }
          })

          if (nextWaiting) {
            await tx.matchPlayer.update({
              where: { id: nextWaiting.id },
              data: { status: 'confirmed' }
            })
            promotedUser = nextWaiting.user
          } else {
            // No waiting list, update match to open if was full
            await tx.match.updateMany({
              where: {
                id: matchId,
                status: 'full'
              },
              data: { status: 'open' }
            })
          }
        }

        return { leftStatus: matchPlayer.status, promotedUser }
      })

      // Invalidate caches
      await this.invalidateMatchCaches(matchId, userId)
      
      // Record metrics
      if (result.promotedUser) {
        BusinessMetrics.waitingListPromotion()
      }

      return result

    } catch (error) {
      metrics.recordError(error as Error, {
        endpoint: 'match.leave',
        additionalTags: { matchId, userId }
      })
      throw error
    }
  }

  /**
   * Get match statistics with caching
   */
  @monitorPerformance('match.service.statistics')
  async getMatchStatistics() {
    return cachedDatabaseQuery(
      CACHE_KEYS.MATCH_STATS,
      async () => {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const [
          totalMatches,
          upcomingMatches,
          completedMatches,
          cancelledMatches,
          totalPlayers,
          recentActivity
        ] = await Promise.all([
          prisma.match.count(),
          prisma.match.count({
            where: {
              date: { gte: now },
              status: { in: ['open', 'full'] }
            }
          }),
          prisma.match.count({
            where: { status: 'completed' }
          }),
          prisma.match.count({
            where: { status: 'cancelled' }
          }),
          prisma.matchPlayer.count({
            where: { status: 'confirmed' }
          }),
          prisma.match.findMany({
            where: {
              createdAt: { gte: thirtyDaysAgo }
            },
            select: {
              id: true,
              date: true,
              createdAt: true,
              status: true,
              _count: {
                select: {
                  players: {
                    where: { status: 'confirmed' }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
          })
        ])

        return {
          totalMatches,
          upcomingMatches,
          completedMatches,
          cancelledMatches,
          totalPlayers,
          averagePlayersPerMatch: totalMatches > 0 ? Math.round(totalPlayers / totalMatches * 10) / 10 : 0,
          recentActivity: recentActivity.map(match => ({
            id: match.id,
            date: match.date,
            createdAt: match.createdAt,
            status: match.status,
            playersCount: match._count.players
          }))
        }
      },
      CACHE_TTL.LONG, // 30 minutes cache for statistics
      'match_statistics'
    )
  }

  /**
   * Invalidate related caches when match data changes
   */
  private async invalidateMatchCaches(matchId: string, userId?: string) {
    const keysToDelete = [
      CACHE_KEYS.MATCHES_LIST,
      CACHE_KEYS.MATCHES_UPCOMING,
      CACHE_KEYS.MATCH_DETAIL(matchId),
      CACHE_KEYS.MATCH_STATS
    ]

    if (userId) {
      keysToDelete.push(CACHE_KEYS.MATCHES_USER(userId))
    }

    // Delete all keys in parallel
    await Promise.all(keysToDelete.map(key => cache.del(key)))
    
    // Also delete pattern-based keys
    await cache.deletePattern(`${CACHE_KEYS.MATCHES_UPCOMING}:*`)
    await cache.deletePattern(`${CACHE_KEYS.MATCHES_USER('*')}:*`)
  }
}

// Singleton instance
export const optimizedMatchService = new OptimizedMatchService()