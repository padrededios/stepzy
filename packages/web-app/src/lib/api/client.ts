/**
 * API client utilities for consistent fetch patterns
 */

import { ApiResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export class ApiClient {
  private static async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Prepend API base URL if not already absolute
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`

      // Only add Content-Type if there's a body
      const headers: HeadersInit = {
        ...options.headers,
      }

      if (options.body) {
        headers['Content-Type'] = 'application/json'
      }

      const response = await fetch(fullUrl, {
        headers,
        credentials: 'include', // Include cookies for auth
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle deleted user account - force logout
        if (response.status === 401 && data.requiresLogout === true) {
          // User account was deleted, force logout and redirect to login
          if (typeof window !== 'undefined') {
            // Import authClient dynamically to avoid circular dependencies
            import('./auth.api').then(({ authApi }) => {
              authApi.signOut().finally(() => {
                window.location.href = '/login'
              })
            }).catch(() => {
              // If auth import fails, just redirect to login
              window.location.href = '/login'
            })
          }
        }

        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  static async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' })
  }

  static async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  static async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  static async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' })
  }

  static async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

// Convenience functions for common patterns
export const api = {
  get: <T>(url: string) => ApiClient.get<T>(url),
  post: <T>(url: string, data?: any) => ApiClient.post<T>(url, data),
  put: <T>(url: string, data?: any) => ApiClient.put<T>(url, data),
  delete: <T>(url: string) => ApiClient.delete<T>(url),
  patch: <T>(url: string, data?: any) => ApiClient.patch<T>(url, data),
}

// Export apiClient as an alias for api (for compatibility)
export const apiClient = api