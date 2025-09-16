import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/middleware/auth'
import { prisma } from '../../../../lib/database/prisma'
import { notifyMatchEvent } from '../../../../lib/notifications/service'

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    try {
      const { searchParams } = new URL(req.url)
      const activeOnly = searchParams.get('activeOnly') === 'true'
      const limit = parseInt(searchParams.get('limit') || '20')

      const where: any = {}
      if (activeOnly) {
        where.active = true
      }

      const announcements = await prisma.announcement.findMany({
        where,
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
        take: Math.min(limit, 50)
      })

      return NextResponse.json({
        success: true,
        data: { announcements }
      })

    } catch (error) {
      console.error('Get announcements error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du chargement des annonces'
      }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    try {
      // Only admins can create announcements
      if (context.user.role !== 'root') {
        return NextResponse.json({
          success: false,
          error: 'Accès non autorisé'
        }, { status: 403 })
      }

      const body = await req.json()
      const { title, content, priority = 'normal', sendNotifications = false } = body

      // Validation
      if (!title || !content) {
        return NextResponse.json({
          success: false,
          error: 'Titre et contenu sont obligatoires'
        }, { status: 400 })
      }

      if (title.length > 200) {
        return NextResponse.json({
          success: false,
          error: 'Le titre ne doit pas dépasser 200 caractères'
        }, { status: 400 })
      }

      if (content.length > 5000) {
        return NextResponse.json({
          success: false,
          error: 'Le contenu ne doit pas dépasser 5000 caractères'
        }, { status: 400 })
      }

      const validPriorities = ['low', 'normal', 'high', 'urgent']
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({
          success: false,
          error: 'Priorité invalide'
        }, { status: 400 })
      }

      // Create announcement
      const announcement = await prisma.announcement.create({
        data: {
          title,
          content,
          priority,
          authorId: context.user.id
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

      // Send notifications if requested
      if (sendNotifications) {
        // Get all active users
        const users = await prisma.user.findMany({
          select: { id: true }
        })

        if (users.length > 0) {
          await notifyMatchEvent(
            'announcement',
            '', // No match ID for announcements
            users.map(u => u.id),
            `📢 ${title}`,
            content.length > 100 ? content.substring(0, 100) + '...' : content,
            {
              announcementId: announcement.id,
              priority
            }
          )
        }
      }

      return NextResponse.json({
        success: true,
        data: { announcement }
      })

    } catch (error) {
      console.error('Create announcement error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la création de l\'annonce'
      }, { status: 500 })
    }
  })
}