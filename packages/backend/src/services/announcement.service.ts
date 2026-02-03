/**
 * Announcement Service - Business logic for announcements/news
 */

import { prisma } from '../database/prisma'
import type { Priority } from '@prisma/client'

interface CreateAnnouncementOptions {
  title: string
  content: string
  authorId: string
  priority?: Priority
}

interface UpdateAnnouncementOptions {
  title?: string
  content?: string
  priority?: Priority
  active?: boolean
}

export class AnnouncementService {
  /**
   * Get all active announcements (for users)
   */
  static async getActive(limit = 20) {
    return prisma.announcement.findMany({
      where: {
        active: true
      },
      include: {
        author: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })
  }

  /**
   * Get all announcements (for admin)
   */
  static async getAll(options: { includeInactive?: boolean; limit?: number } = {}) {
    const { includeInactive = false, limit = 50 } = options

    return prisma.announcement.findMany({
      where: includeInactive ? {} : { active: true },
      include: {
        author: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  /**
   * Get announcement by ID
   */
  static async getById(id: string) {
    return prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        }
      }
    })
  }

  /**
   * Create a new announcement (admin only)
   */
  static async create(options: CreateAnnouncementOptions) {
    return prisma.announcement.create({
      data: {
        title: options.title,
        content: options.content,
        authorId: options.authorId,
        priority: options.priority || 'normal'
      },
      include: {
        author: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        }
      }
    })
  }

  /**
   * Update an announcement (admin only)
   */
  static async update(id: string, options: UpdateAnnouncementOptions) {
    return prisma.announcement.update({
      where: { id },
      data: {
        ...(options.title !== undefined && { title: options.title }),
        ...(options.content !== undefined && { content: options.content }),
        ...(options.priority !== undefined && { priority: options.priority }),
        ...(options.active !== undefined && { active: options.active })
      },
      include: {
        author: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        }
      }
    })
  }

  /**
   * Delete an announcement (admin only)
   */
  static async delete(id: string) {
    return prisma.announcement.delete({
      where: { id }
    })
  }

  /**
   * Count unread announcements for a user (based on createdAt after last visit)
   * For simplicity, we return count of announcements created in the last 7 days
   */
  static async getRecentCount() {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return prisma.announcement.count({
      where: {
        active: true,
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })
  }
}
