'use client'

import { useState, useEffect } from 'react'

interface Statistics {
  users: {
    total: number
    active: number
    admins: number
  }
  matches: {
    total: number
    open: number
    full: number
    completed: number
    cancelled: number
  }
  activity: {
    totalPlayers: number
    averagePlayersPerMatch: number
    mostActiveUser?: {
      pseudo: string
      matchCount: number
    }
  }
  recentActivity: Array<{
    id: string
    type: 'match_join' | 'match_leave' | 'match_create' | 'match_cancel'
    user: { pseudo: string }
    match?: { date: Date }
    timestamp: Date
  }>
}

interface AdminStatisticsProps {
  currentUser: {
    id: string
    pseudo: string
    role: 'user' | 'root'
  }
  onError?: (message: string) => void
  onSuccess?: (message: string) => void
}

const AdminStatistics: React.FC<AdminStatisticsProps> = ({ 
  currentUser, 
  onError,
  onSuccess 
}) => {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [timeRange, setTimeRange] = useState('30d')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if user is admin
  if (currentUser.role !== 'root') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchStatistics = async (range = timeRange) => {
    try {
      setLoading(true)
      setError(false)
      
      const response = await fetch(`/api/admin/statistics${range !== '30d' ? `?range=${range}` : ''}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const stats = {
            ...data.data,
            recentActivity: data.data.recentActivity?.map((activity: any) => ({
              ...activity,
              timestamp: new Date(activity.timestamp),
              match: activity.match ? {
                ...activity.match,
                date: new Date(activity.match.date)
              } : undefined
            })) || []
          }
          setStatistics(stats)
          setLastUpdated(new Date())
        } else {
          setError(true)
          onError?.('Erreur lors du chargement des statistiques')
        }
      } else {
        setError(true)
        onError?.('Erreur lors du chargement des statistiques')
      }
    } catch (error) {
      setError(true)
      onError?.('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatistics()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchStatistics()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [loading, timeRange])

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange)
    fetchStatistics(newRange)
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'il y a moins d\'une minute'
    if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} minutes`
    if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} heures`
    return `il y a ${Math.floor(diffInSeconds / 86400)} jours`
  }

  const formatMatchDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const handleExportCSV = () => {
    if (!statistics) return

    const csvData = [
      ['Statistiques Futsal', ''],
      ['', ''],
      ['Utilisateurs', ''],
      ['Total', statistics.users.total.toString()],
      ['Actifs', statistics.users.active.toString()],
      ['Administrateurs', statistics.users.admins.toString()],
      ['', ''],
      ['Matchs', ''],
      ['Total', statistics.matches.total.toString()],
      ['Ouverts', statistics.matches.open.toString()],
      ['Complets', statistics.matches.full.toString()],
      ['Terminés', statistics.matches.completed.toString()],
      ['Annulés', statistics.matches.cancelled.toString()],
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `statistics-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const retryFetch = () => {
    setError(false)
    fetchStatistics()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" data-testid="statistics-loading"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les statistiques</p>
          <button
            onClick={retryFetch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!statistics) return null

  return (
    <div className={`space-y-6 ${isMobile ? '' : ''}`} data-testid={isMobile ? "mobile-stats-layout" : "desktop-stats-layout"}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Statistiques globales</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Période:</span>
            <select
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="3m">3 derniers mois</option>
            </select>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Exporter CSV
            </button>
            <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
              Exporter PDF
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Users Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">Utilisateurs</p>
              <div className="mt-2 space-y-1">
                <p className="text-2xl font-bold text-blue-600">{statistics.users.total}</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{statistics.users.total} total</p>
                  <p>{statistics.users.active} actifs</p>
                  <p>{statistics.users.admins} administrateurs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Matches Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">Matchs</p>
              <div className="mt-2 space-y-1">
                <p className="text-2xl font-bold text-green-600">{statistics.matches.total}</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{statistics.matches.total} total</p>
                  <p>{statistics.matches.open} ouverts</p>
                  <p>{statistics.matches.full} complets</p>
                  <p>{statistics.matches.completed} terminés</p>
                  <p>{statistics.matches.cancelled} annulés</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">Activité</p>
              <div className="mt-2 space-y-1">
                <p className="text-2xl font-bold text-purple-600">{statistics.activity.totalPlayers}</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{statistics.activity.totalPlayers} joueurs inscrits</p>
                  <p>{statistics.activity.averagePlayersPerMatch} joueurs/match en moyenne</p>
                  {statistics.activity.mostActiveUser && (
                    <p>{statistics.activity.mostActiveUser.pseudo} ({statistics.activity.mostActiveUser.matchCount} matchs)</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Répartition des matchs</h3>
          <div data-testid="match-status-chart" className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Graphique des statuts des matchs</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Fréquence des matchs</h3>
          <div data-testid="weekly-frequency-chart" className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Graphique de fréquence hebdomadaire</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Activité des utilisateurs</h3>
        <div data-testid="activity-timeline" className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Timeline d'activité des utilisateurs</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Activité récente</h3>
        </div>
        <div className="p-6">
          {statistics.recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune activité récente</p>
          ) : (
            <div className="space-y-4">
              {statistics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user.pseudo} {activity.type === 'match_join' ? 'a rejoint un match' : 'a quitté un match'}
                    </p>
                    {activity.match && (
                      <p className="text-xs text-gray-500 mt-1">
                        Match du {formatMatchDate(activity.match.date)}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(activity.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminStatistics