/**
 * Announcement/News type definitions
 */

export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Announcement {
  id: string
  title: string
  content: string
  authorId: string
  priority: AnnouncementPriority
  active: boolean
  createdAt: Date
  updatedAt: Date
  author?: {
    id: string
    pseudo: string
    avatar?: string | null
  }
}

export interface CreateAnnouncementData {
  title: string
  content: string
  priority?: AnnouncementPriority
}

export interface UpdateAnnouncementData {
  title?: string
  content?: string
  priority?: AnnouncementPriority
  active?: boolean
}
