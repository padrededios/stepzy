'use client'

import { useState } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import AdminUserList from '@/components/admin/AdminUserList'

export default function AdminUsersPage() {
  const user = useCurrentUser()
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
    <>
      {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              messageType === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <AdminUserList
            currentUser={user}
            onSuccess={handleSuccess}
            onError={handleError}
          />
    </>
  )
}