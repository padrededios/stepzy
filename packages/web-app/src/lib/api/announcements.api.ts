/**
 * Announcements/News API wrapper
 */

import { apiClient } from './client'
import type { Announcement } from '@stepzy/shared'

export const announcementsApi = {
  /**
   * Get all active announcements
   */
  async getAll(limit = 20) {
    return apiClient.get<{ announcements: Announcement[] }>(`/api/announcements?limit=${limit}`)
  },

  /**
   * Get recent announcements count (for badge)
   */
  async getCount() {
    return apiClient.get<{ count: number }>('/api/announcements/count')
  },

  /**
   * Get single announcement by ID
   */
  async getById(id: string) {
    return apiClient.get<{ announcement: Announcement }>(`/api/announcements/${id}`)
  }
}
