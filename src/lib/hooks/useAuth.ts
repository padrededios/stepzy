/**
 * Authentication Hook - React Client-Side Authentication
 * 
 * This custom hook provides authentication state and methods for React components.
 * 
 * Available React hooks used (from 'react'):
 * - useState(): Manage component state (user, loading, error)
 * - useEffect(): Perform side effects (fetch user on mount)
 * - useCallback(): Memoize functions to prevent re-renders
 * - useMemo(): Memoize computed values
 * - useReducer(): Complex state management alternative
 * - useRef(): Access DOM elements or persist values
 * - useContext(): Consume React context
 * - useLayoutEffect(): Synchronous effects before DOM paint
 * - useImperativeHandle(): Customize ref exposure
 * - useDebugValue(): Label custom hooks in DevTools
 * 
 * Hook returns:
 * - user: Current authenticated user or null
 * - loading: Boolean indicating auth check in progress
 * - error: Error message if auth operations fail
 * - login(): Function to authenticate user with email/password
 * - logout(): Function to sign out current user
 * - refreshUser(): Function to refresh current user data
 * 
 * Usage patterns:
 * - Call useAuth() in any component needing auth state
 * - Hook automatically fetches user on component mount
 * - Provides loading states for better UX
 * - Handles errors with user-friendly messages
 * - Works with Better-auth API endpoints
 * 
 * Alternative approaches available:
 * - Use ProtectedRoute component for page-level protection
 * - Use auth utilities for server-side authentication
 * - Use better-auth client for direct API calls
 */

'use client'

import { useState, useEffect } from 'react'

export interface User {
  id: string
  email: string
  pseudo: string
  avatar?: string
  role: 'user' | 'root'
  createdAt: Date
}

export interface UseAuthReturn {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch current user on mount
  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser({
            ...data.user,
            createdAt: new Date(data.user.createdAt)
          })
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (err) {
      setError('Erreur lors de la récupération des informations utilisateur')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser({
          ...data.user,
          createdAt: new Date(data.user.createdAt)
        })
        return true
      } else {
        setError(data.error || 'Erreur de connexion')
        return false
      }
    } catch (err) {
      setError('Erreur de connexion')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      setLoading(true)
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      setUser(null)
    } catch (err) {
      setError('Erreur lors de la déconnexion')
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async (): Promise<void> => {
    await fetchCurrentUser()
  }

  return {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser
  }
}