/**
 * Users API wrapper
 */

import { apiClient } from './client'
import type { User } from '@stepzy/shared'

export interface UserStats {
  totalSessions: number
  completedSessions: number
  cancelledSessions: number
  activeSessions: number
  attendanceRate: number
  favoriteTime: string
  currentStreak: number
  longestStreak: number
}

export interface UpdateProfileData {
  pseudo: string
  email: string
  avatar?: string | null
}

export interface UpdatePreferencesData {
  notifications?: boolean
  emailNotifications?: boolean
  theme?: 'light' | 'dark' | 'auto'
}

export const usersApi = {
  /**
   * Get current user profile
   */
  async getMe() {
    return apiClient.get<{ user: User }>('/api/users/me')
  },

  /**
   * Get user by ID
   */
  async getById(id: string) {
    return apiClient.get<{ user: User }>(`/api/users/${id}`)
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateProfileData) {
    return apiClient.put<{ user: User }>('/api/users/profile', data)
  },

  /**
   * Get user statistics
   */
  async getStats(id: string) {
    return apiClient.get<{ stats: UserStats }>(`/api/users/${id}/stats`)
  },

  /**
   * Get user activities
   */
  async getActivities(id: string) {
    return apiClient.get(`/api/users/${id}/activities`)
  },

  /**
   * Update user preferences
   */
  async updatePreferences(data: UpdatePreferencesData) {
    return apiClient.put('/api/users/preferences', data)
  }
}
