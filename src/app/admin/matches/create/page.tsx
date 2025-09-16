'use client'

import { useState } from 'react'
import { ProtectedRoute } from '../../../../components/layout/ProtectedRoute'
import MatchCreationForm from '../../../../components/admin/MatchCreationForm'

export default function AdminMatchCreatePage() {
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const handleSuccess = (msg: string) => {
    setMessage(msg)
    setMessageType('success')
    setTimeout(() => setMessage(''), 5000)
  }

  const handleError = (msg: string) => {
    setMessage(msg)
    setMessageType('error')
    setTimeout(() => setMessage(''), 5000)
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      {(user) => (
        <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Créer des matchs</h1>
                <p className="mt-2 text-gray-600">
                  Organisez de nouveaux matchs pour la communauté futsal
                </p>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              messageType === 'success' 
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              <div className="flex items-center">
                <div className={`mr-3 ${
                  messageType === 'success' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {messageType === 'success' ? '✅' : '❌'}
                </div>
                <span>{message}</span>
              </div>
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-blue-500 text-2xl mr-3">🕐</div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Horaires</h3>
                  <p className="text-sm text-blue-700">Toute heure disponible</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-green-500 text-2xl mr-3">📅</div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Jours</h3>
                  <p className="text-sm text-green-700">Lundi au vendredi uniquement</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-orange-500 text-2xl mr-3">⏱️</div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">Avance</h3>
                  <p className="text-sm text-orange-700">4h minimum à l'avance</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-purple-500 text-2xl mr-3">👥</div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Joueurs</h3>
                  <p className="text-sm text-purple-700">2 à 12 joueurs par match</p>
                </div>
              </div>
            </div>
          </div>

          {/* Match Creation Form */}
          <MatchCreationForm
            currentUser={user}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
        </div>
      )}
    </ProtectedRoute>
  )
}