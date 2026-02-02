'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { SPORTS_CONFIG, type SportType } from '@/config/sports'
import { usersApi, type UserStats } from '@/lib/api/users.api'
import Image from 'next/image'

// ─── Badge System ────────────────────────────────────────────────

type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond'
type BadgeCategory = 'global' | SportType

interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  tier: BadgeTier
  category: BadgeCategory
  check: (stats: UserStats) => boolean
  progress: (stats: UserStats) => { current: number; required: number }
}

const TIER_CONFIG: Record<BadgeTier, { label: string; color: string; bgColor: string; borderColor: string; glowColor: string; ring: string }> = {
  bronze: {
    label: 'Bronze',
    color: 'text-amber-700',
    bgColor: 'bg-gradient-to-br from-amber-50 to-orange-100',
    borderColor: 'border-amber-300',
    glowColor: 'shadow-amber-200/50',
    ring: 'ring-amber-300'
  },
  silver: {
    label: 'Argent',
    color: 'text-slate-600',
    bgColor: 'bg-gradient-to-br from-slate-50 to-gray-200',
    borderColor: 'border-slate-300',
    glowColor: 'shadow-slate-200/50',
    ring: 'ring-slate-300'
  },
  gold: {
    label: 'Or',
    color: 'text-yellow-600',
    bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-200',
    borderColor: 'border-yellow-400',
    glowColor: 'shadow-yellow-200/50',
    ring: 'ring-yellow-400'
  },
  diamond: {
    label: 'Diamant',
    color: 'text-cyan-600',
    bgColor: 'bg-gradient-to-br from-cyan-50 to-blue-200',
    borderColor: 'border-cyan-400',
    glowColor: 'shadow-cyan-300/60',
    ring: 'ring-cyan-400'
  }
}

function sportCompleted(stats: UserStats, sport: SportType): number {
  return stats.sportStats.find(s => s.sport === sport)?.completedMatches ?? 0
}

function sportHours(stats: UserStats, sport: SportType): number {
  return stats.sportStats.find(s => s.sport === sport)?.hoursPlayed ?? 0
}

function sportTotal(stats: UserStats, sport: SportType): number {
  return stats.sportStats.find(s => s.sport === sport)?.totalMatches ?? 0
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ── Global badges ──────────────────────────
  // Participation
  { id: 'first-step', name: 'Premier Pas', description: 'Participer à sa première activité', icon: '👶', tier: 'bronze', category: 'global',
    check: s => s.totalSessions >= 1, progress: s => ({ current: Math.min(s.totalSessions, 1), required: 1 }) },
  { id: 'regular', name: 'Habitué', description: 'Participer à 10 activités', icon: '📅', tier: 'bronze', category: 'global',
    check: s => s.totalSessions >= 10, progress: s => ({ current: Math.min(s.totalSessions, 10), required: 10 }) },
  { id: 'active-player', name: 'Joueur Actif', description: 'Participer à 25 activités', icon: '⚡', tier: 'silver', category: 'global',
    check: s => s.totalSessions >= 25, progress: s => ({ current: Math.min(s.totalSessions, 25), required: 25 }) },
  { id: 'veteran', name: 'Vétéran', description: 'Participer à 50 activités', icon: '🎖️', tier: 'gold', category: 'global',
    check: s => s.totalSessions >= 50, progress: s => ({ current: Math.min(s.totalSessions, 50), required: 50 }) },
  { id: 'legend', name: 'Légende', description: 'Participer à 100 activités', icon: '👑', tier: 'diamond', category: 'global',
    check: s => s.totalSessions >= 100, progress: s => ({ current: Math.min(s.totalSessions, 100), required: 100 }) },

  // Completion
  { id: 'finisher', name: 'Finisseur', description: 'Terminer 5 activités', icon: '✅', tier: 'bronze', category: 'global',
    check: s => s.completedSessions >= 5, progress: s => ({ current: Math.min(s.completedSessions, 5), required: 5 }) },
  { id: 'completionist', name: 'Complétionniste', description: 'Terminer 20 activités', icon: '🏁', tier: 'silver', category: 'global',
    check: s => s.completedSessions >= 20, progress: s => ({ current: Math.min(s.completedSessions, 20), required: 20 }) },
  { id: 'marathon', name: 'Marathonien', description: 'Terminer 50 activités', icon: '🏃', tier: 'gold', category: 'global',
    check: s => s.completedSessions >= 50, progress: s => ({ current: Math.min(s.completedSessions, 50), required: 50 }) },

  // Streaks
  { id: 'streak-3', name: 'Série de 3', description: '3 sessions d\'affilée', icon: '🔥', tier: 'bronze', category: 'global',
    check: s => s.longestStreak >= 3, progress: s => ({ current: Math.min(s.longestStreak, 3), required: 3 }) },
  { id: 'streak-5', name: 'En Feu', description: '5 sessions d\'affilée', icon: '🔥', tier: 'silver', category: 'global',
    check: s => s.longestStreak >= 5, progress: s => ({ current: Math.min(s.longestStreak, 5), required: 5 }) },
  { id: 'streak-10', name: 'Invincible', description: '10 sessions d\'affilée', icon: '💎', tier: 'gold', category: 'global',
    check: s => s.longestStreak >= 10, progress: s => ({ current: Math.min(s.longestStreak, 10), required: 10 }) },
  { id: 'streak-20', name: 'Inarrêtable', description: '20 sessions d\'affilée', icon: '⚡', tier: 'diamond', category: 'global',
    check: s => s.longestStreak >= 20, progress: s => ({ current: Math.min(s.longestStreak, 20), required: 20 }) },

  // Attendance
  { id: 'reliable', name: 'Fiable', description: 'Taux de participation > 80%', icon: '🤝', tier: 'bronze', category: 'global',
    check: s => s.attendanceRate >= 80 && s.totalSessions >= 5, progress: s => ({ current: s.attendanceRate, required: 80 }) },
  { id: 'dedicated', name: 'Assidu', description: 'Taux de participation > 90%', icon: '💪', tier: 'silver', category: 'global',
    check: s => s.attendanceRate >= 90 && s.totalSessions >= 10, progress: s => ({ current: s.attendanceRate, required: 90 }) },
  { id: 'perfect', name: 'Parfait', description: 'Taux de participation 100% (10+ sessions)', icon: '🌟', tier: 'diamond', category: 'global',
    check: s => s.attendanceRate >= 100 && s.totalSessions >= 10, progress: s => ({ current: s.attendanceRate, required: 100 }) },

  // Hours
  { id: 'beginner-hours', name: 'Échauffement', description: 'Cumuler 5 heures de jeu', icon: '⏱️', tier: 'bronze', category: 'global',
    check: s => s.totalHours >= 5, progress: s => ({ current: Math.min(s.totalHours, 5), required: 5 }) },
  { id: 'player-hours', name: 'Sportif', description: 'Cumuler 20 heures de jeu', icon: '⏳', tier: 'silver', category: 'global',
    check: s => s.totalHours >= 20, progress: s => ({ current: Math.min(s.totalHours, 20), required: 20 }) },
  { id: 'athlete-hours', name: 'Athlète', description: 'Cumuler 50 heures de jeu', icon: '🏋️', tier: 'gold', category: 'global',
    check: s => s.totalHours >= 50, progress: s => ({ current: Math.min(s.totalHours, 50), required: 50 }) },
  { id: 'pro-hours', name: 'Pro', description: 'Cumuler 100 heures de jeu', icon: '🏆', tier: 'diamond', category: 'global',
    check: s => s.totalHours >= 100, progress: s => ({ current: Math.min(s.totalHours, 100), required: 100 }) },

  // Polyvalence
  { id: 'multi-sport-2', name: 'Curieux', description: 'Essayer 2 sports différents', icon: '🔄', tier: 'bronze', category: 'global',
    check: s => s.uniqueSports >= 2, progress: s => ({ current: Math.min(s.uniqueSports, 2), required: 2 }) },
  { id: 'multi-sport-3', name: 'Polyvalent', description: 'Essayer 3 sports différents', icon: '🎯', tier: 'silver', category: 'global',
    check: s => s.uniqueSports >= 3, progress: s => ({ current: Math.min(s.uniqueSports, 3), required: 3 }) },
  { id: 'multi-sport-5', name: 'Pentathlon', description: 'Jouer aux 5 sports', icon: '🏅', tier: 'diamond', category: 'global',
    check: s => s.uniqueSports >= 5, progress: s => ({ current: Math.min(s.uniqueSports, 5), required: 5 }) },

  // ── Per-sport badges (generated for each sport) ─────────────
  ...(['football', 'badminton', 'volley', 'pingpong', 'rugby'] as SportType[]).flatMap(sport => {
    const sportName = SPORTS_CONFIG[sport].name
    return [
      { id: `${sport}-starter`, name: `Débutant ${sportName}`, description: `Jouer 1 match de ${sportName}`, icon: '🌱', tier: 'bronze' as BadgeTier, category: sport as BadgeCategory,
        check: (s: UserStats) => sportTotal(s, sport) >= 1, progress: (s: UserStats) => ({ current: Math.min(sportTotal(s, sport), 1), required: 1 }) },
      { id: `${sport}-fan`, name: `Fan de ${sportName}`, description: `Jouer 5 matchs de ${sportName}`, icon: '⭐', tier: 'silver' as BadgeTier, category: sport as BadgeCategory,
        check: (s: UserStats) => sportCompleted(s, sport) >= 5, progress: (s: UserStats) => ({ current: Math.min(sportCompleted(s, sport), 5), required: 5 }) },
      { id: `${sport}-expert`, name: `Expert ${sportName}`, description: `Jouer 15 matchs de ${sportName}`, icon: '🔶', tier: 'gold' as BadgeTier, category: sport as BadgeCategory,
        check: (s: UserStats) => sportCompleted(s, sport) >= 15, progress: (s: UserStats) => ({ current: Math.min(sportCompleted(s, sport), 15), required: 15 }) },
      { id: `${sport}-master`, name: `Maître ${sportName}`, description: `Jouer 30 matchs de ${sportName}`, icon: '💎', tier: 'diamond' as BadgeTier, category: sport as BadgeCategory,
        check: (s: UserStats) => sportCompleted(s, sport) >= 30, progress: (s: UserStats) => ({ current: Math.min(sportCompleted(s, sport), 30), required: 30 }) },
      { id: `${sport}-hours-10`, name: `${sportName} 10h`, description: `Cumuler 10h de ${sportName}`, icon: '⏱️', tier: 'gold' as BadgeTier, category: sport as BadgeCategory,
        check: (s: UserStats) => sportHours(s, sport) >= 10, progress: (s: UserStats) => ({ current: Math.min(sportHours(s, sport), 10), required: 10 }) },
    ]
  })
]

// ─── XP / Level System ────────────────────────────────────────────

function calculateXPAndLevel(stats: UserStats, earnedCount: number) {
  const xp =
    stats.completedSessions * 100 +
    stats.totalHours * 50 +
    stats.currentStreak * 30 +
    earnedCount * 200

  // Logarithmic leveling: each level requires more XP
  let level = 1
  let xpForNextLevel = 500
  let xpAccumulated = 0
  let remaining = xp

  while (remaining >= xpForNextLevel) {
    remaining -= xpForNextLevel
    level++
    xpAccumulated += xpForNextLevel
    xpForNextLevel = Math.floor(xpForNextLevel * 1.3)
  }

  return {
    totalXP: xp,
    level,
    currentLevelXP: remaining,
    xpForNextLevel,
    progressPercent: Math.round((remaining / xpForNextLevel) * 100)
  }
}

function getLevelTitle(level: number): string {
  if (level >= 30) return 'Champion Suprême'
  if (level >= 25) return 'Légende Vivante'
  if (level >= 20) return 'Grand Champion'
  if (level >= 15) return 'Athlète Confirmé'
  if (level >= 10) return 'Sportif Engagé'
  if (level >= 7) return 'Joueur Régulier'
  if (level >= 4) return 'Apprenti Sportif'
  return 'Débutant'
}

// ─── Page Component ────────────────────────────────────────────

export default function MesStatistiquesPage() {
  const user = useCurrentUser()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'badges'>('overview')
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'earned' | 'locked'>('all')
  const [badgeCategoryFilter, setBadgeCategoryFilter] = useState<'all' | 'global' | SportType>('all')

  useEffect(() => {
    loadUserStats(user.id)
  }, [user.id])

  const loadUserStats = async (userId: string) => {
    setDataLoading(true)
    try {
      const response = await usersApi.getStats(userId)
      if (response.success && response.data) {
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const badges = useMemo(() => {
    if (!stats) return []
    return BADGE_DEFINITIONS.map(def => ({
      ...def,
      earned: def.check(stats),
      progressData: def.progress(stats)
    }))
  }, [stats])

  const earnedBadges = useMemo(() => badges.filter(b => b.earned), [badges])
  const lockedBadges = useMemo(() => badges.filter(b => !b.earned), [badges])

  const filteredBadges = useMemo(() => {
    let list = badges
    if (badgeFilter === 'earned') list = earnedBadges
    if (badgeFilter === 'locked') list = lockedBadges
    if (badgeCategoryFilter !== 'all') {
      list = list.filter(b => b.category === badgeCategoryFilter)
    }
    return list
  }, [badges, earnedBadges, lockedBadges, badgeFilter, badgeCategoryFilter])

  const xpData = useMemo(() => {
    if (!stats) return null
    return calculateXPAndLevel(stats, earnedBadges.length)
  }, [stats, earnedBadges.length])

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Chargement de vos statistiques...</p>
        </div>
      </div>
    )
  }

  if (!stats || !xpData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pas encore de données</h2>
          <p className="text-gray-600">Participez à des activités pour voir vos statistiques !</p>
        </div>
      </div>
    )
  }

  const completionRate = stats.totalSessions > 0 ? (stats.completedSessions / stats.totalSessions) * 100 : 0

  return (
    <div className="space-y-6">
      {/* ── Hero: Level & XP ──────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm text-3xl font-bold">
              {xpData.level}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{getLevelTitle(xpData.level)}</h1>
              <p className="text-blue-100 text-sm mt-0.5">Niveau {xpData.level} — {xpData.totalXP.toLocaleString()} XP</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-center px-3 py-1 bg-white/10 rounded-lg">
              <div className="font-bold text-lg">{earnedBadges.length}</div>
              <div className="text-blue-200 text-xs">Badges</div>
            </div>
            <div className="text-center px-3 py-1 bg-white/10 rounded-lg">
              <div className="font-bold text-lg">{stats.currentStreak}</div>
              <div className="text-blue-200 text-xs">Série</div>
            </div>
            <div className="text-center px-3 py-1 bg-white/10 rounded-lg">
              <div className="font-bold text-lg">{stats.totalHours}h</div>
              <div className="text-blue-200 text-xs">Jouées</div>
            </div>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="relative mt-5">
          <div className="flex items-center justify-between text-xs text-blue-200 mb-1.5">
            <span>Niv. {xpData.level}</span>
            <span>{xpData.currentLevelXP} / {xpData.xpForNextLevel} XP</span>
            <span>Niv. {xpData.level + 1}</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${xpData.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────── */}
      <div className="flex gap-1 bg-white rounded-xl shadow p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Vue d&apos;ensemble
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'badges'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Badges ({earnedBadges.length}/{badges.length})
        </button>
      </div>

      {/* ── Overview Tab ──────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Activités"
              value={stats.totalSessions}
              subtitle={`${stats.completedSessions} terminées`}
              icon="📊"
              gradient="from-blue-500 to-blue-600"
            />
            <StatCard
              title="Participation"
              value={`${completionRate.toFixed(0)}%`}
              subtitle={`${stats.completedSessions}/${stats.totalSessions}`}
              icon="✅"
              gradient="from-green-500 to-emerald-600"
            />
            <StatCard
              title="Heures jouées"
              value={stats.totalHours}
              subtitle="temps total"
              icon="⏱️"
              gradient="from-purple-500 to-indigo-600"
            />
            <StatCard
              title="Série actuelle"
              value={stats.currentStreak}
              subtitle={`Record: ${stats.longestStreak}`}
              icon="🔥"
              gradient="from-orange-500 to-red-500"
            />
          </div>

          {/* Sport Breakdown + Monthly Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sport Breakdown */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Répartition par sport</h3>
              {stats.sportStats.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">Aucune donnée pour le moment</p>
              ) : (
                <div className="space-y-3">
                  {stats.sportStats.map((sportStat) => {
                    const sportConfig = SPORTS_CONFIG[sportStat.sport as SportType]
                    if (!sportConfig) return null
                    const pct = stats.totalSessions > 0 ? (sportStat.totalMatches / stats.totalSessions) * 100 : 0

                    return (
                      <div key={sportStat.sport} className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                        <div className="relative w-10 h-10 shrink-0">
                          <Image src={sportConfig.icon} alt={sportConfig.name} fill className="rounded-lg object-cover" sizes="40px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900">{sportConfig.name}</h4>
                            <span className="text-xs font-semibold text-gray-600">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${sportConfig.color.replace('bg-', 'bg-')}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {sportStat.completedMatches} match{sportStat.completedMatches > 1 ? 's' : ''} &middot; {sportStat.hoursPlayed}h
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Monthly Activity */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Activité mensuelle</h3>
              {stats.monthlyActivity.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">Aucune donnée pour le moment</p>
              ) : (
                <div className="space-y-3">
                  {stats.monthlyActivity.map((month, index) => {
                    const maxMatches = Math.max(...stats.monthlyActivity.map(m => m.matches), 1)
                    const width = (month.matches / maxMatches) * 100
                    const isCurrentMonth = index === stats.monthlyActivity.length - 1

                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-10 text-xs font-medium ${isCurrentMonth ? 'text-blue-600' : 'text-gray-500'}`}>
                          {month.month}
                        </div>
                        <div className="flex-1">
                          <div className="h-6 bg-gray-100 rounded-lg overflow-hidden relative">
                            <div
                              className={`h-full rounded-lg transition-all duration-700 ${
                                isCurrentMonth
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                  : 'bg-gradient-to-r from-gray-300 to-gray-400'
                              }`}
                              style={{ width: `${width}%` }}
                            />
                            {month.matches > 0 && (
                              <span className={`absolute inset-y-0 flex items-center text-xs font-semibold ${
                                width > 30 ? 'right-2 text-white' : 'left-2 text-gray-600'
                              }`} style={width > 30 ? { right: `${100 - width + 2}%` } : { left: `${width + 2}%` }}>
                                {month.matches}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Badge Preview */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Badges récents</h3>
              <button
                onClick={() => setActiveTab('badges')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir tous &rarr;
              </button>
            </div>

            {/* Global progress */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-gray-600">Progression globale</span>
                <span className="font-semibold text-gray-900">{earnedBadges.length}/{badges.length}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${badges.length > 0 ? (earnedBadges.length / badges.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Show first earned badges and next to earn */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {earnedBadges.slice(0, 3).map(badge => (
                <BadgeCard key={badge.id} badge={badge} compact />
              ))}
              {lockedBadges
                .sort((a, b) => {
                  const aP = a.progressData.required > 0 ? a.progressData.current / a.progressData.required : 0
                  const bP = b.progressData.required > 0 ? b.progressData.current / b.progressData.required : 0
                  return bP - aP
                })
                .slice(0, 3)
                .map(badge => (
                  <BadgeCard key={badge.id} badge={badge} compact />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Badges Tab ──────────────────────── */}
      {activeTab === 'badges' && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Status filter */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {([['all', 'Tous'], ['earned', 'Obtenus'], ['locked', 'À débloquer']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setBadgeFilter(val)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      badgeFilter === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {label} {val === 'earned' ? `(${earnedBadges.length})` : val === 'locked' ? `(${lockedBadges.length})` : ''}
                  </button>
                ))}
              </div>
              {/* Category filter */}
              <div className="flex gap-1 flex-wrap">
                <CategoryButton value="all" label="Global + Sports" active={badgeCategoryFilter} onClick={setBadgeCategoryFilter} />
                <CategoryButton value="global" label="Global" active={badgeCategoryFilter} onClick={setBadgeCategoryFilter} />
                {(['football', 'badminton', 'volley', 'pingpong', 'rugby'] as SportType[]).map(sport => (
                  <CategoryButton key={sport} value={sport} label={SPORTS_CONFIG[sport].name} active={badgeCategoryFilter} onClick={setBadgeCategoryFilter} />
                ))}
              </div>
            </div>
          </div>

          {/* Badge tier sections */}
          {(['diamond', 'gold', 'silver', 'bronze'] as BadgeTier[]).map(tier => {
            const tierBadges = filteredBadges.filter(b => b.tier === tier)
            if (tierBadges.length === 0) return null
            const config = TIER_CONFIG[tier]

            return (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm font-bold ${config.color} uppercase tracking-wider`}>{config.label}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-500">
                    {tierBadges.filter(b => b.earned).length}/{tierBadges.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {tierBadges.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>
              </div>
            )
          })}

          {filteredBadges.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🏅</div>
              <p className="text-gray-500">Aucun badge dans cette catégorie</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient
}: {
  title: string
  value: string | number
  subtitle: string
  icon: string
  gradient: string
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`bg-gradient-to-br ${gradient} rounded-xl p-2.5 text-white shadow-sm`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

interface BadgeWithProgress extends BadgeDefinition {
  earned: boolean
  progressData: { current: number; required: number }
}

function BadgeCard({ badge, compact }: { badge: BadgeWithProgress; compact?: boolean }) {
  const tier = TIER_CONFIG[badge.tier]
  const progressPct = badge.progressData.required > 0
    ? Math.min((badge.progressData.current / badge.progressData.required) * 100, 100)
    : 0

  return (
    <div
      className={`relative rounded-xl border-2 transition-all ${
        badge.earned
          ? `${tier.bgColor} ${tier.borderColor} shadow-md ${tier.glowColor} hover:scale-105`
          : 'bg-gray-50 border-gray-200 opacity-70 hover:opacity-90'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* Earned glow */}
      {badge.earned && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
      )}

      <div className="relative text-center">
        <div className={`${compact ? 'text-2xl' : 'text-3xl'} mb-1 ${badge.earned ? '' : 'grayscale'}`}>
          {badge.icon}
        </div>
        <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold ${
          badge.earned ? 'text-gray-900' : 'text-gray-500'
        } leading-tight`}>
          {badge.name}
        </h4>
        {!compact && (
          <p className={`text-xs mt-1 ${badge.earned ? 'text-gray-600' : 'text-gray-400'} leading-snug`}>
            {badge.description}
          </p>
        )}

        {/* Tier label */}
        <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider ${tier.color}`}>
          {tier.label}
        </span>

        {/* Progress bar for locked badges */}
        {!badge.earned && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {badge.progressData.current}/{badge.progressData.required}
            </p>
          </div>
        )}

        {badge.earned && (
          <div className="mt-1.5">
            <span className="inline-block text-[10px] font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
              Obtenu
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryButton({
  value,
  label,
  active,
  onClick
}: {
  value: string
  label: string
  active: string
  onClick: (v: any) => void
}) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        active === value
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
      }`}
    >
      {label}
    </button>
  )
}
