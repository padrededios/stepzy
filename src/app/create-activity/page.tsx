'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SPORTS_CONFIG, getAllSports } from '@/config/sports'
import { CreateActivityData, DayOfWeek, RecurringType, DAY_LABELS, RECURRING_TYPE_LABELS } from '@/types/activity'
import { User } from '@/types'
import Image from 'next/image'

function CreateActivityContent({ user }: { user: User }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateActivityData>({
    name: '',
    description: '',
    sport: 'football',
    maxPlayers: 12,
    recurringDays: [],
    recurringType: 'weekly'
  })

  const availableDays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  const handleInputChange = (field: keyof CreateActivityData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }

      // Auto-adjust maxPlayers based on selected sport
      if (field === 'sport') {
        const sportConfig = SPORTS_CONFIG[value]
        newData.maxPlayers = sportConfig.maxPlayers
      }

      return newData
    })

    // Clear messages on input change
    setError(null)
    setSuccess(null)
  }

  const handleDayToggle = (day: DayOfWeek) => {
    setFormData(prev => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter(d => d !== day)
        : [...prev.recurringDays, day]
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Le nom de l\'activité est obligatoire')
      return false
    }

    if (formData.name.length < 3) {
      setError('Le nom doit faire au moins 3 caractères')
      return false
    }

    if (formData.recurringDays.length === 0) {
      setError('Vous devez sélectionner au moins un jour de la semaine')
      return false
    }

    const sportConfig = SPORTS_CONFIG[formData.sport]
    if (formData.maxPlayers < sportConfig.minPlayers || formData.maxPlayers > sportConfig.maxPlayers) {
      setError(`Le nombre de joueurs doit être entre ${sportConfig.minPlayers} et ${sportConfig.maxPlayers} pour ${sportConfig.name}`)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(data.message)
        // Réinitialiser le formulaire
        setFormData({
          name: '',
          description: '',
          sport: 'football',
          maxPlayers: 12,
          recurringDays: [],
          recurringType: 'weekly'
        })

        // Rediriger vers mes activités après 2 secondes
        setTimeout(() => {
          router.push('/mes-activites')
        }, 2000)
      } else {
        setError(data.error || 'Erreur lors de la création de l\'activité')
      }
    } catch (error) {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Créer une nouvelle activité</h1>
          <p className="mt-2 text-gray-600">
            Créez une activité récurrente que les autres utilisateurs pourront rejoindre
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
            <p className="text-xs text-green-500 mt-1">Redirection vers mes activités...</p>
          </div>
        )}

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom de l'activité */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'activité *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Foot entre collègues, Badminton du mardi..."
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
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
                placeholder="Informations supplémentaires sur l'activité..."
                disabled={loading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            {/* Sport */}
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
                    } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="sport"
                      value={sport.id}
                      checked={formData.sport === sport.id}
                      onChange={(e) => handleInputChange('sport', e.target.value)}
                      disabled={loading}
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
                    <span className="text-xs text-gray-900 font-semibold text-center">
                      {sport.minPlayers}-{sport.maxPlayers} joueurs
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Nombre de joueurs */}
            <div>
              <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre maximum de joueurs *
              </label>
              <input
                type="number"
                id="maxPlayers"
                value={formData.maxPlayers}
                onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value) || 0)}
                min={SPORTS_CONFIG[formData.sport].minPlayers}
                max={SPORTS_CONFIG[formData.sport].maxPlayers}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <p className="mt-1 text-sm text-gray-500">
                Pour {SPORTS_CONFIG[formData.sport].name}: {SPORTS_CONFIG[formData.sport].minPlayers} à {SPORTS_CONFIG[formData.sport].maxPlayers} joueurs
              </p>
            </div>

            {/* Type de récurrence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type de récurrence *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(RECURRING_TYPE_LABELS).map(([type, label]) => (
                  <label
                    key={type}
                    className={`relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.recurringType === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="recurringType"
                      value={type}
                      checked={formData.recurringType === type}
                      onChange={(e) => handleInputChange('recurringType', e.target.value as RecurringType)}
                      disabled={loading}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Jours de la semaine */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Jours de récurrence *
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Sélectionnez les jours où l'activité aura lieu
              </p>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                {availableDays.map((day) => (
                  <label
                    key={day}
                    className={`relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.recurringDays.includes(day)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.recurringDays.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      disabled={loading}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-900">{DAY_LABELS[day]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bouton de soumission */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création en cours...
                  </>
                ) : (
                  'Créer l\'activité'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview des sessions */}
        {formData.recurringDays.length > 0 && (
          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aperçu</h3>
            <p className="text-sm text-gray-600">
              Cette activité aura lieu <strong>{RECURRING_TYPE_LABELS[formData.recurringType]}</strong> les{' '}
              <strong>{formData.recurringDays.map(day => DAY_LABELS[day]).join(', ')}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Les sessions seront générées automatiquement et visibles 2 semaines à l'avance
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function CreateActivityPage() {
  return (
    <ProtectedRoute>
      {(user) => <CreateActivityContent user={user} />}
    </ProtectedRoute>
  )
}