'use client'

import { useState, useEffect } from 'react'
import UserMatchHistory from './UserMatchHistory'
import UserBadges from './UserBadges'

interface User {
  id: string
  email: string
  pseudo: string
  avatar: string
  role: 'user' | 'root'
  createdAt: Date
  updatedAt: Date
}

interface UserStats {
  totalMatches: number
  completedMatches: number
  cancelledMatches: number
  attendanceRate: number
  favoriteTime: string
  currentStreak: number
  longestStreak: number
}

interface UserProfile {
  user: User
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

interface NotificationPreferences {
  emailNotifications: boolean
  newMatches: boolean
  matchReminders: boolean
  cancellations: boolean
}

export default function UserProfile({ user, onSuccess, onError }: UserProfile) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ pseudo: user.pseudo, email: user.email })
  const [validationErrors, setValidationErrors] = useState<{ pseudo?: string; email?: string }>({})
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchStats()
    fetchPreferences()
  }, [])

  const fetchStats = async () => {
    try {
      setLoadingStats(true)
      const response = await fetch(`/api/user/${user.id}/stats`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.data.stats)
        } else {
          onError?.('Erreur lors du chargement des statistiques')
        }
      }
    } catch (error) {
      onError?.('Erreur lors du chargement des statistiques')
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPreferences(data.data.preferences)
        }
      }
    } catch (error) {
      // Failed to fetch preferences - setting defaults
      setPreferences({
        emailNotifications: false,
        newMatches: false,
        matchReminders: false,
        cancellations: false
      })
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditData({ pseudo: user.pseudo, email: user.email })
    setValidationErrors({})
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({ pseudo: user.pseudo, email: user.email })
    setValidationErrors({})
  }

  const validateForm = () => {
    const errors: { pseudo?: string; email?: string } = {}
    
    if (!editData.pseudo.trim()) {
      errors.pseudo = 'Le pseudo est obligatoire'
    }
    
    if (!editData.email.trim()) {
      errors.email = 'L\'email est obligatoire'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pseudo: editData.pseudo,
          email: editData.email
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setIsEditing(false)
          onSuccess?.('Profil mis à jour avec succès')
        } else {
          onError?.(data.error || 'Erreur lors de la mise à jour')
        }
      } else {
        const data = await response.json()
        onError?.(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      onError?.('Erreur lors de la mise à jour')
    }
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Seuls les fichiers image sont autorisés')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      onError?.('La taille du fichier ne doit pas dépasser 2MB')
      return
    }

    uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          onSuccess?.('Avatar mis à jour avec succès')
          setShowAvatarUpload(false)
        }
      }
    } catch (error) {
      onError?.('Erreur lors de l\'upload de l\'avatar')
    }
  }

  const handlePreferenceChange = async (key: keyof NotificationPreferences) => {
    if (!preferences) return
    
    const newPreferences = { ...preferences, [key]: !preferences[key] }
    setPreferences(newPreferences)

    try {
      await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      })
    } catch (error) {
      // Failed to save preferences - handled silently
    }
  }

  const formatMemberSince = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  if (loadingStats) {
    return (
      <div data-testid="stats-loading" className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  const layoutClass = isMobile ? 'profile-mobile-layout' : 'profile-desktop-layout'

  return (
    <div data-testid={layoutClass} className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
        </div>

        <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={`Avatar de ${user.pseudo}`}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <button
                    onClick={() => setShowAvatarUpload(!showAvatarUpload)}
                    className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 text-xs"
                  >
                    📷
                  </button>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  {!isEditing ? (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900">{user.pseudo}</h2>
                      <p className="text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Membre depuis {formatMemberSince(user.createdAt)}
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="pseudo" className="block text-sm font-medium text-gray-700">
                          Pseudo
                        </label>
                        <input
                          id="pseudo"
                          type="text"
                          value={editData.pseudo}
                          onChange={(e) => setEditData({ ...editData, pseudo: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {validationErrors.pseudo && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.pseudo}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {validationErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Modifier le profil
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
                      >
                        Annuler
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Avatar Upload */}
              {showAvatarUpload && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => setShowAvatarUpload(false)}
                    className="mb-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Changer l'avatar
                  </button>
                  <input
                    data-testid="avatar-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              )}
            </div>

            {/* Personal Statistics */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mes Statistiques</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalMatches}</div>
                    <div className="text-sm text-gray-600">Matchs Total</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.completedMatches}</div>
                    <div className="text-sm text-gray-600">Matchs Joués</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stats.attendanceRate}%</div>
                    <div className="text-sm text-gray-600">Taux Présence</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.currentStreak}</div>
                    <div className="text-sm text-gray-600">Série Actuelle</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">Créneau préféré</div>
                    <div className="text-xl font-bold text-gray-700">{stats.favoriteTime}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">Record de participation</div>
                    <div className="text-xl font-bold text-gray-700">{stats.longestStreak} matchs consécutifs</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Préférences de notifications</h3>
              
              {preferences ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                      Notifications par email
                    </label>
                    <input
                      id="emailNotifications"
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={() => handlePreferenceChange('emailNotifications')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="newMatches" className="text-sm font-medium text-gray-700">
                      Nouveaux matchs
                    </label>
                    <input
                      id="newMatches"
                      type="checkbox"
                      checked={preferences.newMatches}
                      onChange={() => handlePreferenceChange('newMatches')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="matchReminders" className="text-sm font-medium text-gray-700">
                      Rappels de match
                    </label>
                    <input
                      id="matchReminders"
                      type="checkbox"
                      checked={preferences.matchReminders}
                      onChange={() => handlePreferenceChange('matchReminders')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="cancellations" className="text-sm font-medium text-gray-700">
                      Annulations
                    </label>
                    <input
                      id="cancellations"
                      type="checkbox"
                      checked={preferences.cancellations}
                      onChange={() => handlePreferenceChange('cancellations')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Chargement des préférences...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="mt-8">
          <UserBadges userId={user.id} stats={stats} />
        </div>

        {/* Match History Section */}
        <div className="mt-8">
          <UserMatchHistory userId={user.id} onError={onError} />
        </div>
      </div>
    </div>
  )
}