import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/middleware/auth'
import { prisma } from '../../../../lib/database/prisma'

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    try {
      if (!context.user) {
        return NextResponse.json({
          success: false,
          error: 'Utilisateur non authentifié'
        }, { status: 401 })
      }

      const formData = await req.formData()
      const file = formData.get('avatar') as File

      if (!file) {
        return NextResponse.json({
          success: false,
          error: 'Aucun fichier fourni'
        }, { status: 400 })
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({
          success: false,
          error: 'Seuls les fichiers image sont autorisés'
        }, { status: 400 })
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({
          success: false,
          error: 'La taille du fichier ne doit pas dépasser 2MB'
        }, { status: 400 })
      }

      // In a real implementation, you would:
      // 1. Upload the file to a storage service (AWS S3, Cloudinary, etc.)
      // 2. Generate a unique filename
      // 3. Store the URL in the database
      
      // For now, we'll simulate a successful upload
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${context.user.pseudo}-${Date.now()}`

      // Update user's avatar URL in database
      await prisma.user.update({
        where: { id: context.user.id },
        data: {
          avatar: avatarUrl,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: { avatarUrl }
      })

    } catch (error) {
      console.error('Avatar upload error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de l\'upload de l\'avatar'
      }, { status: 500 })
    }
  })
}