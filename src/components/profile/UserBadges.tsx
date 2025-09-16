'use client'

import { useState, useEffect } from 'react'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  condition: string
  earned: boolean
  earnedAt?: Date
  progress?: {
    current: number
    required: number
  }
}

interface UserBadgesProps {
  userId: string
  stats: {
    totalMatches: number
    completedMatches: number
    currentStreak: number
    longestStreak: number
    attendanceRate: number
  } | null
}

export default function UserBadges({ userId, stats }: UserBadgesProps) {
  const [badges, setBadges] = useState<Badge[]>([])

  useEffect(() => {
    if (stats) {
      calculateBadges(stats)
    }
  }, [stats, userId])

  const calculateBadges = (userStats: NonNullable<typeof stats>) => {
    const badgeDefinitions: Omit<Badge, 'earned' | 'earnedAt' | 'progress'>[] = [
      {
        id: 'first-match',
        name: 'Premier Match',
        description: 'Participer à son premier match',
        icon: '🎯',
        condition: 'totalMatches >= 1'
      },
      {
        id: 'regular-player',
        name: 'Joueur Régulier',
        description: 'Participer à 5 matchs',
        icon: '⚽',
        condition: 'totalMatches >= 5'
      },
      {
        id: 'veteran',
        name: 'Vétéran',
        description: 'Participer à 20 matchs',
        icon: '🏆',
        condition: 'totalMatches >= 20'
      },
      {
        id: 'dedicated',
        name: 'Assidu',
        description: 'Maintenir un taux de présence de 90%+',
        icon: '💎',
        condition: 'attendanceRate >= 90'
      },
      {
        id: 'streak-5',
        name: 'Série de 5',
        description: 'Jouer 5 matchs consécutifs',
        icon: '🔥',
        condition: 'longestStreak >= 5'
      },
      {
        id: 'streak-10',
        name: 'Invincible',
        description: 'Jouer 10 matchs consécutifs',
        icon: '⚡',
        condition: 'longestStreak >= 10'
      },
      {
        id: 'completionist',
        name: 'Completionniste',
        description: 'Terminer 15 matchs',
        icon: '✅',
        condition: 'completedMatches >= 15'
      },
      {
        id: 'reliable',
        name: 'Fiable',
        description: 'Maintenir un taux de présence de 100%',
        icon: '🎖️',
        condition: 'attendanceRate >= 100'
      }
    ]

    const calculatedBadges = badgeDefinitions.map(badgeDef => {
      let earned = false
      let progress = undefined

      switch (badgeDef.id) {
        case 'first-match':
          earned = userStats.totalMatches >= 1
          progress = { current: Math.min(userStats.totalMatches, 1), required: 1 }
          break
        case 'regular-player':
          earned = userStats.totalMatches >= 5
          progress = { current: Math.min(userStats.totalMatches, 5), required: 5 }
          break
        case 'veteran':
          earned = userStats.totalMatches >= 20
          progress = { current: Math.min(userStats.totalMatches, 20), required: 20 }
          break
        case 'dedicated':
          earned = userStats.attendanceRate >= 90 && userStats.totalMatches >= 3
          progress = { current: userStats.attendanceRate, required: 90 }
          break
        case 'streak-5':
          earned = userStats.longestStreak >= 5
          progress = { current: Math.min(userStats.longestStreak, 5), required: 5 }
          break
        case 'streak-10':
          earned = userStats.longestStreak >= 10
          progress = { current: Math.min(userStats.longestStreak, 10), required: 10 }
          break
        case 'completionist':
          earned = userStats.completedMatches >= 15
          progress = { current: Math.min(userStats.completedMatches, 15), required: 15 }
          break
        case 'reliable':
          earned = userStats.attendanceRate >= 100 && userStats.totalMatches >= 5
          progress = { current: userStats.attendanceRate, required: 100 }
          break
      }

      return {
        ...badgeDef,
        earned,
        progress,
        earnedAt: earned ? new Date() : undefined // In real app, this would come from the database
      }
    })

    setBadges(calculatedBadges)
  }

  const earnedBadges = badges.filter(badge => badge.earned)
  const availableBadges = badges.filter(badge => !badge.earned)

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Badges et Récompenses</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des badges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Badges et Récompenses</h3>
        <div className="text-sm text-gray-600">
          {earnedBadges.length}/{badges.length} badges obtenus
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progression générale</span>
          <span className="text-sm text-gray-600">
            {Math.round((earnedBadges.length / badges.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(earnedBadges.length / badges.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
            <span className="text-green-500 mr-2">🏅</span>
            Badges obtenus ({earnedBadges.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="relative bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4 transition-transform hover:scale-105"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{badge.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-semibold text-gray-900 truncate">
                      {badge.name}
                    </h5>
                    <p className="text-xs text-gray-600 mt-1">
                      {badge.description}
                    </p>
                    {badge.earnedAt && (
                      <p className="text-xs text-green-600 mt-2 font-medium">
                        ✓ Obtenu
                      </p>
                    )}
                  </div>
                </div>
                {/* Shine effect for earned badges */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform -skew-x-12 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Badges */}
      {availableBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
            <span className="text-gray-400 mr-2">🎯</span>
            Badges à débloquer ({availableBadges.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-75 hover:opacity-90 transition-opacity"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl grayscale">{badge.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-700 truncate">
                      {badge.name}
                    </h5>
                    <p className="text-xs text-gray-500 mt-1">
                      {badge.description}
                    </p>
                    
                    {/* Progress bar for available badges */}
                    {badge.progress && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            Progression
                          </span>
                          <span className="text-xs text-gray-600">
                            {badge.progress.current}/{badge.progress.required}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min((badge.progress.current / badge.progress.required) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {badges.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎖️</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Système de badges</h4>
          <p className="text-gray-600">
            Participez à des matchs pour débloquer des badges et récompenses !
          </p>
        </div>
      )}
    </div>
  )
}