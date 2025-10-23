'use client'

import { useState } from 'react'
import { sanitizeActivityCode, isValidActivityCode, formatActivityCode } from '@stepzy/shared'
import { activitiesApi } from '@/lib/api'
import { Toast } from '@/components/ui/Toast'

interface JoinByCodeCardProps {
  onJoin: (code: string) => Promise<{ success: boolean; error?: string; message?: string }>
}

export function JoinByCodeCard({ onJoin }: JoinByCodeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activityPreview, setActivityPreview] = useState<any>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const handleCodeChange = (value: string) => {
    const sanitized = sanitizeActivityCode(value)
    setCode(sanitized.slice(0, 8)) // Limiter à 8 caractères
    setError(null)
    setActivityPreview(null)
  }

  const handlePreview = async () => {
    if (!code) {
      setError('Veuillez saisir un code')
      return
    }

    if (!isValidActivityCode(code)) {
      setError('Code invalide. Le code doit contenir 8 caractères (lettres majuscules et chiffres)')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await activitiesApi.getByCode(code)

      if (result.success) {
        setActivityPreview(result.data)
      } else {
        setError(result.error || 'Code d\'activité invalide')
      }
    } catch (err) {
      setError('Erreur lors de la vérification du code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    setIsLoading(true)
    setError(null)
    setInfoMessage(null)

    try {
      const result = await onJoin(code)

      if (result.success) {
        // Check if user was already a member
        const isAlreadyMember = result.message?.includes('déjà membre')

        if (isAlreadyMember) {
          // If already a member, show info message in modal and don't auto-close
          setInfoMessage(result.message || 'Vous êtes déjà membre de cette activité')
          setActivityPreview(null)
        } else {
          // New member: show success message and close modal after delay
          setMessage({ type: 'success', text: result.message || 'Activité rejointe avec succès' })
          setCode('')
          setActivityPreview(null)
          setTimeout(() => {
            setIsModalOpen(false)
            setMessage(null)
          }, 2000)
        }
      } else {
        setError(result.error || 'Erreur lors de la tentative de rejoindre l\'activité')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setCode('')
    setError(null)
    setActivityPreview(null)
    setMessage(null)
    setInfoMessage(null)
  }

  return (
    <>
      {/* Toast Notification */}
      {message && (
        <Toast
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}

      {/* Card */}
      <div
        className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-105"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Header with gradient */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-600">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Rejoindre avec un code</h3>
              <p className="text-sm text-white opacity-90">
                Entrez le code d'une activité
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-600 text-sm mb-4">
            Vous avez reçu un code d'invitation ? Entrez-le ici pour rejoindre une activité privée.
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Code de 8 caractères</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Accès sécurisé à l'activité</span>
            </div>
          </div>

          {/* Action button */}
          <button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            Entrer un code
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Rejoindre une activité</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Code input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code de l'activité
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Ex: A1B2C3D4"
                maxLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-center text-lg font-mono tracking-widest uppercase"
                disabled={isLoading}
              />
              {code && (
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {formatActivityCode(code)}
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Info message (for "already member" case) */}
            {infoMessage && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700 font-medium">{infoMessage}</p>
                <p className="text-xs text-blue-600 mt-1">L'activité est déjà présente dans votre liste.</p>
              </div>
            )}

            {/* Activity preview */}
            {activityPreview && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{activityPreview.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Sport :</span> {activityPreview.sport}</p>
                  <p><span className="font-medium">Créateur :</span> {activityPreview.creator.pseudo}</p>
                  <p><span className="font-medium">Joueurs :</span> {activityPreview.minPlayers}-{activityPreview.maxPlayers}</p>
                  <p><span className="font-medium">Récurrence :</span> {activityPreview.recurringType === 'weekly' ? 'Hebdomadaire' : 'Mensuelle'}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              {infoMessage ? (
                // Already member: show only OK button
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  OK
                </button>
              ) : !activityPreview ? (
                // No preview yet: show Cancel and Verify buttons
                <>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handlePreview}
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !code || code.length !== 8}
                  >
                    {isLoading ? 'Vérification...' : 'Vérifier'}
                  </button>
                </>
              ) : (
                // Preview shown: show Back and Join buttons
                <>
                  <button
                    onClick={() => {
                      setActivityPreview(null)
                      setCode('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleJoin}
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Inscription...' : 'Rejoindre'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
