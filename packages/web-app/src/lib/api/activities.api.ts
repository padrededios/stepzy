/**
 * Activities API wrapper
 */

import { apiClient } from './client'
import type { Activity, CreateActivityData, UpdateActivityData, ActivityFilters } from '@stepzy/shared'

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
   * Get my created activities
   */
  async getMyCreated() {
    return apiClient.get<Activity[]>('/api/activities/my-created')
  },

  /**
   * Get my participations
   */
  async getMyParticipations() {
    return apiClient.get<Activity[]>('/api/activities/my-participations')
  },

  /**
   * Get upcoming sessions
   */
  async getUpcomingSessions() {
    return apiClient.get('/api/activities/upcoming-sessions')
  }
}
