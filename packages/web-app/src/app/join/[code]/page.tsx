'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { activitiesApi } from '@/lib/api'
import { SPORTS_CONFIG } from '@/config/sports'
import { formatActivityCode, isValidActivityCode, sanitizeActivityCode } from '@stepzy/shared'
import { Toast } from '@/components/ui/Toast'
import Image from 'next/image'

export default function JoinByCodePage() {
  const params = useParams()
  const router = useRouter()

  const [code, setCode] = useState<string>('')
  const [activityPreview, setActivityPreview] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    // Extract and validate code from URL
    const urlCode = Array.isArray(params.code) ? params.code[0] : params.code
    const sanitized = sanitizeActivityCode(urlCode || '')

    if (!isValidActivityCode(sanitized)) {
      setError('Code d\'activité invalide')
      setIsLoading(false)
      return
    }

    setCode(sanitized)
    fetchActivityPreview(sanitized)
  }, [params.code])

  const fetchActivityPreview = async (activityCode: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await activitiesApi.getByCode(activityCode)

      if (result.success) {
        setActivityPreview(result.data)
      } else {
        setError(result.error || 'Code d\'activité invalide')
      }
    } catch (err) {
      setError('Erreur lors de la récupération de l\'activité')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    setIsJoining(true)
    setError(null)

    try {
      const result = await activitiesApi.joinByCode(code)

      if (result.success) {
        const isAlreadyMember = result.data?.alreadyMember

        if (isAlreadyMember) {
          setMessage({ type: 'success', text: 'Vous êtes déjà membre de cette activité' })
          setTimeout(() => {
            router.push('/s-inscrire')
          }, 2000)
        } else {
          setMessage({ type: 'success', text: `Vous avez rejoint l'activité "${activityPreview.name}" avec succès !` })
          setTimeout(() => {
            router.push('/s-inscrire')
          }, 2000)
        }
      } else {
        // Check if error is due to authentication
        if (result.error?.includes('non authentifié') || result.error?.includes('connecté')) {
          // Redirect to login with return URL
          const returnUrl = encodeURIComponent(`/join/${code}`)
          router.push(`/login?redirect=${returnUrl}`)
        } else {
          setError(result.error || 'Erreur lors de la tentative de rejoindre l\'activité')
        }
      }
    } catch (err: any) {
      // Check if 401 Unauthorized
      if (err?.status === 401) {
        const returnUrl = encodeURIComponent(`/join/${code}`)
        router.push(`/login?redirect=${returnUrl}`)
      } else {
        setError('Erreur de connexion')
      }
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'activité...</p>
        </div>
      </div>
    )
  }

  if (error && !activityPreview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Code invalide</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/s-inscrire')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
            >
              Retour à la page S'inscrire
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!activityPreview) {
    return null
  }

  const sportConfig = SPORTS_CONFIG[activityPreview.sport]
  const dayLabels: Record<string, string> = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  }
  const formattedDays = activityPreview.recurringDays.map((day: string) => dayLabels[day]).join(', ')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {message && (
        <Toast
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center space-x-3 mb-2">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <h1 className="text-3xl font-bold text-white">Invitation à rejoindre une activité</h1>
          </div>
          <p className="text-white text-opacity-90">Code : {formatActivityCode(code)}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Activity Header */}
          <div className={`px-8 py-6 bg-gradient-to-r ${sportConfig.gradient}`}>
            <div className="flex items-start space-x-4">
              <div className="relative w-16 h-16 flex-shrink-0 bg-white rounded-lg overflow-hidden">
                <Image
                  src={sportConfig.icon}
                  alt={sportConfig.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{activityPreview.name}</h2>
                <p className="text-white text-opacity-90 text-lg">{sportConfig.name}</p>
              </div>
            </div>
          </div>

          {/* Activity Details */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Créateur */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Créateur</p>
                  <p className="text-base font-semibold text-gray-900">{activityPreview.creator.pseudo}</p>
                </div>
              </div>

              {/* Joueurs */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre de joueurs</p>
                  <p className="text-base font-semibold text-gray-900">{activityPreview.minPlayers} - {activityPreview.maxPlayers} joueurs</p>
                </div>
              </div>

              {/* Récurrence */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Jours</p>
                  <p className="text-base font-semibold text-gray-900">{formattedDays}</p>
                </div>
              </div>

              {/* Type */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Récurrence</p>
                  <p className="text-base font-semibold text-gray-900">
                    {activityPreview.recurringType === 'weekly' ? 'Hebdomadaire' : 'Mensuelle'}
                  </p>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/s-inscrire')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                disabled={isJoining}
              >
                Annuler
              </button>
              <button
                onClick={handleJoin}
                className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isJoining}
              >
                {isJoining ? 'Inscription en cours...' : 'Rejoindre cette activité'}
              </button>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">À propos de cette invitation</h3>
              <p className="text-sm text-blue-700">
                Vous avez été invité à rejoindre cette activité par {activityPreview.creator.pseudo}.
                En cliquant sur "Rejoindre", vous serez ajouté à l'activité et pourrez voir toutes les sessions à venir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
