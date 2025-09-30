'use client'

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { SPORTS_CONFIG, type SportType } from '@/config/sports'
import Image from 'next/image'

interface SportStats {
  sport: SportType
  totalMatches: number
  completedMatches: number
  cancelledMatches: number
  hoursPlayed: number
  winRate?: number
}

interface UserStats {
  totalMatches: number
  completedMatches: number
  cancelledMatches: number
  totalHours: number
  favoritesSports: SportType[]
  currentStreak: number
  longestStreak: number
  sportStats: SportStats[]
  monthlyActivity: Array<{
    month: string
    matches: number
  }>
}

export default function MesStatistiquesPage() {
  const user = useCurrentUser()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    loadUserStats(user.id)
  }, [user.id])

  const loadUserStats = async (userId: string) => {
    setDataLoading(true)
    try {
      // Pour l'instant, données fictives - à remplacer par de vrais appels API
      const mockStats: UserStats = {
        totalMatches: 25,
        completedMatches: 22,
        cancelledMatches: 3,
        totalHours: 44,
        favoritesSports: ['football', 'badminton'],
        currentStreak: 5,
        longestStreak: 8,
        sportStats: [
          {
            sport: 'football',
            totalMatches: 12,
            completedMatches: 10,
            cancelledMatches: 2,
            hoursPlayed: 20,
            winRate: 75
          },
          {
            sport: 'badminton',
            totalMatches: 8,
            completedMatches: 8,
            cancelledMatches: 0,
            hoursPlayed: 12,
            winRate: 62.5
          },
          {
            sport: 'volley',
            totalMatches: 3,
            completedMatches: 3,
            cancelledMatches: 0,
            hoursPlayed: 6
          },
          {
            sport: 'pingpong',
            totalMatches: 2,
            completedMatches: 1,
            cancelledMatches: 1,
            hoursPlayed: 2
          }
        ],
        monthlyActivity: [
          { month: 'Jan', matches: 3 },
          { month: 'Fév', matches: 5 },
          { month: 'Mar', matches: 8 },
          { month: 'Avr', matches: 4 },
          { month: 'Mai', matches: 6 },
          { month: 'Juin', matches: 9 }
        ]
      }

      setStats(mockStats)
    } catch (error) {
      console.error('Error loading user stats:', error)
    } finally {
      setDataLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Erreur de chargement</h2>
          <p className="text-gray-600">Impossible de charger vos statistiques</p>
        </div>
      </div>
    )
  }

  const completionRate = stats.totalMatches > 0 ? (stats.completedMatches / stats.totalMatches) * 100 : 0

  return (
    <div className="space-y-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes statistiques</h1>
          <p className="mt-2 text-gray-600">
            Suivez vos performances et votre progression sportive
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Activités totales"
            value={stats.totalMatches}
            subtitle="depuis le début"
            icon="📊"
            color="bg-blue-500"
          />
          <StatCard
            title="Taux de participation"
            value={`${completionRate.toFixed(1)}%`}
            subtitle={`${stats.completedMatches}/${stats.totalMatches} terminées`}
            icon="✅"
            color="bg-green-500"
          />
          <StatCard
            title="Heures jouées"
            value={stats.totalHours}
            subtitle="temps total"
            icon="⏱️"
            color="bg-purple-500"
          />
          <StatCard
            title="Série actuelle"
            value={stats.currentStreak}
            subtitle={`Record: ${stats.longestStreak}`}
            icon="🔥"
            color="bg-orange-500"
          />
        </div>

        {/* Sports Statistics */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Sport Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Répartition par sport</h3>
            <div className="space-y-4">
              {stats.sportStats.map((sportStat) => {
                const sportConfig = SPORTS_CONFIG[sportStat.sport]
                const participation = stats.totalMatches > 0 ? (sportStat.totalMatches / stats.totalMatches) * 100 : 0

                return (
                  <div key={sportStat.sport} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-10 h-10">
                        <Image
                          src={sportConfig.icon}
                          alt={sportConfig.name}
                          fill
                          className="rounded-lg object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{sportConfig.name}</h4>
                        <p className="text-sm text-gray-500">
                          {sportStat.completedMatches} match{sportStat.completedMatches > 1 ? 's' : ''} • {sportStat.hoursPlayed}h
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {participation.toFixed(0)}%
                      </div>
                      {sportStat.winRate && (
                        <div className="text-sm text-green-600">
                          {sportStat.winRate}% victoires
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Monthly Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Activité mensuelle</h3>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'quarter' | 'year')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="month">6 derniers mois</option>
                <option value="quarter">Trimestre</option>
                <option value="year">Année</option>
              </select>
            </div>

            <div className="space-y-3">
              {stats.monthlyActivity.map((month, index) => {
                const maxMatches = Math.max(...stats.monthlyActivity.map(m => m.matches))
                const width = maxMatches > 0 ? (month.matches / maxMatches) * 100 : 0

                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-12 text-sm text-gray-600 font-medium">
                      {month.month}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-8 text-sm text-gray-900 font-medium">
                      {month.matches}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Badges et réalisations</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            <AchievementBadge
              title="Première activité"
              description="Participer à votre première activité"
              earned={stats.totalMatches > 0}
              icon="🎯"
            />
            <AchievementBadge
              title="Régulier"
              description="10 activités terminées"
              earned={stats.completedMatches >= 10}
              icon="📅"
            />
            <AchievementBadge
              title="Endurant"
              description="5 activités d'affilée"
              earned={stats.currentStreak >= 5}
              icon="💪"
            />
            <AchievementBadge
              title="Polyvalent"
              description="3 sports différents"
              earned={stats.sportStats.length >= 3}
              icon="🏆"
            />
            <AchievementBadge
              title="Champion"
              description="Taux de victoire > 70%"
              earned={stats.sportStats.some(s => s.winRate && s.winRate > 70)}
              icon="👑"
            />
            <AchievementBadge
              title="Marathonien"
              description="50 heures jouées"
              earned={stats.totalHours >= 50}
              icon="⌚"
            />
          </div>
        </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color
}: {
  title: string
  value: string | number
  subtitle: string
  icon: string
  color: string
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${color} rounded-lg p-3 mr-4`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

function AchievementBadge({
  title,
  description,
  earned,
  icon
}: {
  title: string
  description: string
  earned: boolean
  icon: string
}) {
  return (
    <div className={`text-center p-4 rounded-lg border-2 ${
      earned
        ? 'border-yellow-400 bg-yellow-50'
        : 'border-gray-200 bg-gray-50'
    }`}>
      <div className={`text-3xl mb-2 ${earned ? '' : 'grayscale opacity-50'}`}>
        {icon}
      </div>
      <h4 className={`text-sm font-semibold ${
        earned ? 'text-yellow-800' : 'text-gray-500'
      }`}>
        {title}
      </h4>
      <p className={`text-xs mt-1 ${
        earned ? 'text-yellow-700' : 'text-gray-400'
      }`}>
        {description}
      </p>
    </div>
  )
}