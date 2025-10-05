/**
 * Auth API wrapper using Better-auth
 */

import { createAuthClient } from 'better-auth/react'

const AUTH_URL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3001'

export const authClient = createAuthClient({
  baseURL: AUTH_URL
})

export interface SignInData {
  email: string
  password: string
}

export interface SignUpData {
  email: string
  password: string
  pseudo: string
  avatar?: string
}

export const authApi = {
  /**
   * Sign in with email/password
   */
  async signIn(data: SignInData) {
    return authClient.signIn.email(data)
  },

  /**
   * Sign up with email/password
   */
  async signUp(data: SignUpData) {
    return authClient.signUp.email(data)
  },

  /**
   * Sign out
   */
  async signOut() {
    return authClient.signOut()
  },

  /**
   * Get current session
   */
  async getSession() {
    return authClient.getSession()
  },

  /**
   * Update user
   */
  async updateUser(data: { name?: string; image?: string }) {
    return authClient.updateUser(data)
  }
}

// Better-auth hooks
// Note: better-auth v1.3.8 uses authClient directly for session management
// Use authClient.useSession() or create custom hooks as needed
export const useSession = () => {
  // This is a placeholder - better-auth session management
  // should be accessed via authClient methods
  return authClient.getSession()
}
