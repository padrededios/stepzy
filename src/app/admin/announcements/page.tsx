'use client'

import { useState } from 'react'
import { ProtectedRoute } from '../../../components/layout/ProtectedRoute'
import { DashboardLayout } from '../../../components/layout/DashboardLayout'
import AdminAnnouncements from '../../../components/admin/AdminAnnouncements'

export default function AdminAnnouncementsPage() {
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
  }

  const handleSuccess = (msg: string) => {
    showMessage(msg, 'success')
  }

  const handleError = (msg: string) => {
    showMessage(msg, 'error')
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      {(user) => (
        <DashboardLayout user={user}>
          {/* Success/Error Messages */}
          {message && (
            <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-md ${
              messageType === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              <div className="flex items-center">
                <span className="mr-2">
                  {messageType === 'success' ? '✅' : '❌'}
                </span>
                {message}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Annonces</h1>
            <p className="mt-2 text-gray-600">
              Créez et gérez les annonces pour informer tous les utilisateurs
            </p>
          </div>

          <AdminAnnouncements
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </DashboardLayout>
      )}
    </ProtectedRoute>
  )
}