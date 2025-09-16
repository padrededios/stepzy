import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/middleware/auth'
import { prisma } from '../../../../../lib/database/prisma'

interface Params {
  id: string
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return requireAuth(request, async (req, context) => {
    try {
      // Only admins can update announcements
      if (!context.user || context.user.role !== 'root') {
        return NextResponse.json({
          success: false,
          error: 'Accès non autorisé'
        }, { status: 403 })
      }

      const { id } = await params
      const body = await req.json()
      const { title, content, priority, active } = body

      // Validation
      if (title && title.length > 200) {
        return NextResponse.json({
          success: false,
          error: 'Le titre ne doit pas dépasser 200 caractères'
        }, { status: 400 })
      }

      if (content && content.length > 5000) {
        return NextResponse.json({
          success: false,
          error: 'Le contenu ne doit pas dépasser 5000 caractères'
        }, { status: 400 })
      }

      const validPriorities = ['low', 'normal', 'high', 'urgent']
      if (priority && !validPriorities.includes(priority)) {
        return NextResponse.json({
          success: false,
          error: 'Priorité invalide'
        }, { status: 400 })
      }

      // Build update data
      const updateData: any = {}
      if (title !== undefined) updateData.title = title
      if (content !== undefined) updateData.content = content
      if (priority !== undefined) updateData.priority = priority
      if (active !== undefined) updateData.active = active

      const announcement = await prisma.announcement.update({
        where: { id },
        data: updateData,
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

      return NextResponse.json({
        success: true,
        data: { announcement }
      })

    } catch (error: any) {
      console.error('Update announcement error:', error)
      
      if (error.code === 'P2025') {
        return NextResponse.json({
          success: false,
          error: 'Annonce non trouvée'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la mise à jour'
      }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return requireAuth(request, async (req, context) => {
    try {
      // Only admins can delete announcements
      if (!context.user || context.user.role !== 'root') {
        return NextResponse.json({
          success: false,
          error: 'Accès non autorisé'
        }, { status: 403 })
      }

      const { id } = await params

      await prisma.announcement.delete({
        where: { id }
      })

      return NextResponse.json({
        success: true,
        data: { message: 'Annonce supprimée avec succès' }
      })

    } catch (error: any) {
      console.error('Delete announcement error:', error)
      
      if (error.code === 'P2025') {
        return NextResponse.json({
          success: false,
          error: 'Annonce non trouvée'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la suppression'
      }, { status: 500 })
    }
  })
}