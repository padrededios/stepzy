'use client'

import { useState } from 'react'
import { ProtectedRoute } from '../../../components/layout/ProtectedRoute'
import { DashboardLayout } from '../../../components/layout/DashboardLayout'
import AdminStatistics from '../../../components/admin/AdminStatistics'

export default function AdminStatisticsPage() {
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
        <DashboardLayout user={user}>
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              messageType === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <AdminStatistics
            currentUser={user}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </DashboardLayout>
      )}
    </ProtectedRoute>
  )
}