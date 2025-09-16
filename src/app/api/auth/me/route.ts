import { NextRequest, NextResponse } from 'next/server'
import { withOptionalAuth } from '@/lib/middleware/auth'

// GET /api/auth/me - Get current authenticated user
export async function GET(request: NextRequest) {
  return withOptionalAuth(request, async (req, context) => {
    if (!context.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: context.user.id,
        email: context.user.email,
        pseudo: context.user.pseudo,
        avatar: context.user.avatar,
        role: context.user.role
      }
    })
  })
}