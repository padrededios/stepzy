'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '../../components/layout/ProtectedRoute'
import UserProfile from '../../components/profile/UserProfile'

export default function ProfilePage() {
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
    <ProtectedRoute>
      {(user) => (
        <div className="min-h-screen bg-gray-50">
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

          <UserProfile 
            user={user} 
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      )}
    </ProtectedRoute>
  )
}