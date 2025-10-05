'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'
import { authApi } from '@/lib/api'

interface ProtectedRouteProps {
  children: (user: User) => React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authApi.getSession()

        if (!session || !session.data) {
          throw new Error('Not authenticated')
        }

        if (session.data.user) {
          setUser(session.data.user as User)
        } else {
          throw new Error('Invalid response')
        }
      } catch (err) {
        // Authentication check failed
        setError('Non authentifié')

        // Redirect to login with current path as redirect parameter
        const currentPath = window.location.pathname + window.location.search
        const redirectUrl = `/login?redirect=${encodeURIComponent(currentPath)}`
        router.replace(redirectUrl)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-600">Vérification de l'authentification...</p>
          </div>
        </div>
      )
    )
  }

  if (error || !user) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Accès refusé</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
          </div>
        </div>
      )
    )
  }

  return <>{children(user)}</>
}

// Higher-order component version
export function withAuth<P extends object>(
  Component: React.ComponentType<P & { user: User }>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute>
        {(user) => <Component {...props} user={user} />}
      </ProtectedRoute>
    )
  }
}