import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/middleware/auth'
import { prisma } from '../../../../lib/database/prisma'
import { validateEmail, validatePseudo } from '../../../../lib/auth/validators'

export async function PUT(request: NextRequest) {
  return requireAuth(request, async (req, context) => {
    try {
      const body = await req.json()
      const { pseudo, email } = body

      // Validation
      if (!pseudo || !email) {
        return NextResponse.json({
          success: false,
          error: 'Pseudo et email sont obligatoires'
        }, { status: 400 })
      }

      const pseudoError = validatePseudo(pseudo)
      if (pseudoError) {
        return NextResponse.json({
          success: false,
          error: pseudoError
        }, { status: 400 })
      }

      const emailError = validateEmail(email)
      if (emailError) {
        return NextResponse.json({
          success: false,
          error: emailError
        }, { status: 400 })
      }

      // Check if pseudo is already taken by another user
      if (pseudo !== context.user.pseudo) {
        const existingUser = await prisma.user.findFirst({
          where: {
            pseudo,
            id: { not: context.user.id }
          }
        })

        if (existingUser) {
          return NextResponse.json({
            success: false,
            error: 'Ce pseudo est déjà utilisé'
          }, { status: 400 })
        }
      }

      // Check if email is already taken by another user
      if (email !== context.user.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            id: { not: context.user.id }
          }
        })

        if (existingUser) {
          return NextResponse.json({
            success: false,
            error: 'Cet email est déjà utilisé'
          }, { status: 400 })
        }
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: context.user.id },
        data: {
          pseudo,
          email,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: { user: updatedUser }
      })

    } catch (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur serveur'
      }, { status: 500 })
    }
  })
}