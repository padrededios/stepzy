'use client'

import { createContext, useContext } from 'react'
import { User } from '@/types'

export const CurrentUserContext = createContext<User | null>(null)

export function useCurrentUser(): User {
  const user = useContext(CurrentUserContext)
  if (!user) {
    throw new Error('useCurrentUser must be used within CurrentUserContext.Provider')
  }
  return user
}