/**
 * Activities API wrapper
 */

import { apiClient } from './client'
import type {
  Activity,
  CreateActivityData,
  UpdateActivityData,
  ActivityFilters,
  JoinActivityByCodeData,
  ActivityCodeResponse,
  ActivityCodeInfo
} from '@stepzy/shared'

export const activitiesApi = {
  /**
   * Get all activities with filters
   */
  async getAll(filters?: ActivityFilters & { page?: number; limit?: number }) {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const endpoint = `/api/activities${params.toString() ? `?${params.toString()}` : ''}`
    return apiClient.get<{
      activities: Activity[]
      pagination: {
        page: number
        limit: number
        totalCount: number
        totalPages: number
      }
    }>(endpoint)
  },

  /**
   * Get activity by ID
   */
  async getById(id: string) {
    return apiClient.get<Activity>(`/api/activities/${id}`)
  },

  /**
   * Create new activity
   */
  async create(data: CreateActivityData) {
    return apiClient.post<Activity>('/api/activities', data)
  },

  /**
   * Update activity
   */
  async update(id: string, data: UpdateActivityData) {
    return apiClient.put<Activity>(`/api/activities/${id}`, data)
  },

  /**
   * Delete activity
   */
  async delete(id: string) {
    return apiClient.delete(`/api/activities/${id}`)
  },

  /**
   * Subscribe to activity
   */
  async subscribe(id: string) {
    return apiClient.post(`/api/activities/${id}/subscribe`)
  },

  /**
   * Unsubscribe from activity
   */
  async unsubscribe(id: string) {
    return apiClient.delete(`/api/activities/${id}/subscribe`)
  },

  /**
   * Leave activity (remove from user's list)
   */
  async leave(id: string) {
    return apiClient.delete(`/api/activities/${id}/leave`)
  },

  /**
   * Get my created activities
   */
  async getMyCreated() {
    return apiClient.get<Activity[]>('/api/activities/my-created')
  },

  /**
   * Get my participations
   */
  async getMyParticipations() {
    return apiClient.get<{ upcoming: SessionWithParticipants[], past: SessionWithParticipants[] }>('/api/activities/my-participations')
  },

  /**
   * Get upcoming sessions
   */
  async getUpcomingSessions() {
    return apiClient.get('/api/activities/upcoming-sessions')
  },

  /**
   * Join activity by code
   */
  async joinByCode(code: string) {
    return apiClient.post<ActivityCodeResponse>('/api/activities/join-by-code', { code })
  },

  /**
   * Get activity info by code (preview before joining)
   */
  async getByCode(code: string) {
    return apiClient.get<ActivityCodeInfo>(`/api/activities/code/${code}`)
  },

  /**
   * Copy code to clipboard
   */
  async copyCodeToClipboard(code: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(code)
      return true
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = code
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      } catch (err) {
        document.body.removeChild(textArea)
        return false
      }
    }
  },

  /**
   * Generate share link for activity
   */
  generateShareLink(code: string): string {
    if (typeof window === 'undefined') {
      return `Utilisez ce code pour rejoindre l'activité : ${code}`
    }
    return `${window.location.origin}/join/${code}`
  },

  /**
   * Send activity invitation by email
   */
  async sendInvitation(activityId: string, email: string) {
    return apiClient.post(`/api/activities/${activityId}/send-invitation`, { email })
  }
}
