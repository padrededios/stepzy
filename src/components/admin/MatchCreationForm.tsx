'use client'

import { useState, useEffect } from 'react'
import {
  validateMatchCreation,
  getAvailableTimeSlots,
  getAvailableDurations,
  calculateRecurringDates,
  formatDateForInput,
  formatTimeForInput,
  createDateFromInputs,
  getQuickPresets,
  type RecurringFrequency
} from '../../lib/utils/time-constraints'
import { SportType, getSportConfig, getAllSports } from '@/config/sports'
import Image from 'next/image'

interface MatchCreationFormProps {
  currentUser: {
    id: string
    pseudo: string
    role: 'user' | 'root'
  }
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

interface RecurringOptions {
  enabled: boolean
  frequency: RecurringFrequency
  count: number
  endDate?: Date
}

const MatchCreationForm: React.FC<MatchCreationFormProps> = ({ 
  currentUser, 
  onSuccess, 
  onError 
}) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    time: '12:00',
    duration: 60, // in minutes
    sport: 'football' as SportType,
    maxPlayers: 12,
    description: '',
    adminCreate: false,
    notify: true
  })
  const [recurring, setRecurring] = useState<RecurringOptions>({
    enabled: false,
    frequency: 'week' as RecurringFrequency,
    count: 3
  })
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Check if user is admin
  if (currentUser.role !== 'root') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600">Seuls les administrateurs peuvent créer des matchs.</p>
        </div>
      </div>
    )
  }

  const availableTimeSlots = getAvailableTimeSlots()
  const availableDurations = getAvailableDurations()
  const quickPresets = getQuickPresets()

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      // Auto-adjust maxPlayers based on selected sport
      if (field === 'sport') {
        const sportConfig = getSportConfig(value as SportType)
        newData.maxPlayers = sportConfig.maxPlayers
      }
      return newData
    })
    setValidationErrors([]) // Clear errors on input change
  }

  const handleRecurringChange = (field: keyof RecurringOptions, value: any) => {
    setRecurring(prev => ({ ...prev, [field]: value }))
  }

  const handleQuickPreset = (preset: 'today' | 'tomorrow' | 'nextWeek') => {
    const presets = getQuickPresets()
    let targetDate: Date
    
    switch (preset) {
      case 'today':
        targetDate = presets.today
        break
      case 'tomorrow':
        targetDate = presets.tomorrow
        break
      case 'nextWeek':
        targetDate = presets.nextWeek
        break
      default:
        return
    }
    
    // Ensure it's a weekday
    while (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
      targetDate.setDate(targetDate.getDate() + 1)
    }
    
    setFormData(prev => ({
      ...prev,
      date: formatDateForInput(targetDate),
      time: '12:00'
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.date) {
      setValidationErrors(['La date est obligatoire'])
      return false
    }

    const matchDate = createDateFromInputs(formData.date, formData.time)
    const matchData = {
      date: matchDate,
      maxPlayers: formData.maxPlayers,
      description: formData.description
    }

    const validation = validateMatchCreation(matchData)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      if (recurring.enabled) {
        await handleRecurringSubmit()
      } else {
        await handleSingleSubmit()
      }
    } catch (error) {
      onError?.('Une erreur inattendue s\'est produite')
    } finally {
      setLoading(false)
    }
  }

  const handleSingleSubmit = async () => {
    const matchDate = createDateFromInputs(formData.date, formData.time)
    
    const response = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: matchDate.toISOString(),
        sport: formData.sport,
        maxPlayers: formData.maxPlayers,
        description: formData.description
      })
    })

    const data = await response.json()
    
    if (response.ok && data.success) {
      onSuccess?.('Match créé avec succès')
      resetForm()
    } else {
      onError?.(data.error || 'Erreur lors de la création du match')
    }
  }

  const handleRecurringSubmit = async () => {
    const startDate = createDateFromInputs(formData.date, formData.time)
    
    const response = await fetch('/api/matches/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: startDate.toISOString(),
        sport: formData.sport,
        maxPlayers: formData.maxPlayers,
        description: formData.description,
        recurring: {
          frequency: recurring.frequency,
          count: recurring.count
        }
      })
    })

    const data = await response.json()
    
    if (response.ok && data.success) {
      const matchCount = data.data?.matches?.length || recurring.count
      onSuccess?.(`${matchCount} matchs récurrents créés avec succès`)
      resetForm()
    } else {
      onError?.(data.error || 'Erreur lors de la création des matchs récurrents')
    }
  }

  const resetForm = () => {
    setFormData({
      date: '',
      time: '12:00',
      duration: 60,
      sport: 'football' as SportType,
      maxPlayers: 12,
      description: '',
      adminCreate: false,
      notify: true
    })
    setRecurring({
      enabled: false,
      frequency: 'week',
      count: 3
    })
    setValidationErrors([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" data-testid="creation-loading"></div>
          <p className="text-gray-600">Création en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Créer une nouvelle activité</h2>
          <p className="text-gray-600">
            Créez des activités sportives individuelles ou récurrentes pour la communauté.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Actions rapides</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset('today')}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
              disabled={loading}
            >
              Aujourd'hui 12h
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('tomorrow')}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
              disabled={loading}
            >
              Demain 12h
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('nextWeek')}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
              disabled={loading}
            >
              Cette semaine
            </button>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-sm font-medium text-red-800 mb-2">Erreurs de validation :</h4>
            <ul className="text-sm text-red-600 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sport Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de sport *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {getAllSports().map((sport) => (
                <label
                  key={sport.id}
                  className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.sport === sport.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="sport"
                    value={sport.id}
                    checked={formData.sport === sport.id}
                    onChange={(e) => handleInputChange('sport', e.target.value)}
                    className="sr-only"
                  />
                  <div className="relative w-12 h-12 mb-2">
                    <Image
                      src={sport.icon}
                      alt={sport.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium text-center">{sport.name}</span>
                  <span className="text-xs text-gray-500 text-center">{sport.minPlayers}-{sport.maxPlayers} joueurs</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date, Time and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date du match *
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                Heure de début *
              </label>
              <select
                id="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableTimeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Durée *
              </label>
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableDurations.map(duration => (
                  <option key={duration.value} value={duration.value}>{duration.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Max Players */}
          <div>
            <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre maximum de joueurs *
            </label>
            <input
              type="number"
              id="maxPlayers"
              value={formData.maxPlayers}
              onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value) || 0)}
              min={getSportConfig(formData.sport).minPlayers}
              max={getSportConfig(formData.sport).maxPlayers}
              disabled={loading}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Pour {getSportConfig(formData.sport).name}: {getSportConfig(formData.sport).minPlayers} à {getSportConfig(formData.sport).maxPlayers} joueurs
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={loading}
              rows={3}
              placeholder="Informations supplémentaires sur le match..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Recurring Options */}
          <div className="border-t pt-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="recurring"
                checked={recurring.enabled}
                onChange={(e) => handleRecurringChange('enabled', e.target.checked)}
                disabled={loading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="recurring" className="ml-2 text-sm font-medium text-gray-700">
                Match récurrent
              </label>
            </div>

            {recurring.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6 p-4 bg-gray-50 rounded-md">
                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
                    Répéter chaque
                  </label>
                  <select
                    id="frequency"
                    value={recurring.frequency}
                    onChange={(e) => handleRecurringChange('frequency', e.target.value as RecurringFrequency)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="day">Jour (lun-ven)</option>
                    <option value="week">Semaine</option>
                    <option value="month">Mois</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de matchs à créer
                  </label>
                  <input
                    type="number"
                    id="count"
                    value={recurring.count}
                    onChange={(e) => handleRecurringChange('count', parseInt(e.target.value) || 1)}
                    min={1}
                    max={10}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Fin des récurrences
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={recurring.endDate ? formatDateForInput(recurring.endDate) : ''}
                    onChange={(e) => handleRecurringChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Admin Options */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Options administrateur</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="adminCreate"
                  checked={formData.adminCreate}
                  onChange={(e) => handleInputChange('adminCreate', e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="adminCreate" className="ml-2 text-sm text-gray-700">
                  Créer comme administrateur
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notify"
                  checked={formData.notify}
                  onChange={(e) => handleInputChange('notify', e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notify" className="ml-2 text-sm text-gray-700">
                  Notifier les utilisateurs
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? 'Création en cours...' 
                : recurring.enabled 
                  ? 'Créer les matchs' 
                  : 'Créer le match'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MatchCreationForm