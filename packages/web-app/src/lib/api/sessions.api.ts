/**
 * Sessions API wrapper
 */

import { apiClient } from './client'
import type { ActivitySession, UpdateSessionData } from '@stepzy/shared'

export const sessionsApi = {
  /**
   * Get session by ID
   */
  async getById(id: string) {
    return apiClient.get<ActivitySession>(`/api/sessions/${id}`)
  },

  /**
   * Update session
   */
  async update(id: string, data: UpdateSessionData) {
    return apiClient.put<ActivitySession>(`/api/sessions/${id}`, data)
  },

  /**
   * Join session
   */
  async join(id: string) {
    return apiClient.post(`/api/sessions/${id}/join`)
  },

  /**
   * Leave session
   */
  async leave(id: string) {
    return apiClient.post(`/api/sessions/${id}/leave`)
  },

  /**
   * Swap a field player with a substitute (creator only)
   */
  async swapPlayers(id: string, fieldPlayerId: string, substitutePlayerId: string) {
    return apiClient.post(`/api/sessions/${id}/swap-players`, {
      fieldPlayerId,
      substitutePlayerId
    })
  }
}
