import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

// GET /api/auth/me - Get current authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get('cookie')
    let sessionToken = null

    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

      sessionToken = cookies['futsal.session-token']
    }

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        },
        { status: 401 }
      )
    }

    // Find session in database
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            pseudo: true,
            avatar: true,
            role: true
          }
        }
      }
    })

    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session
      if (session) {
        await prisma.session.delete({ where: { id: session.id } })
      }

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
      user: session.user
    })

  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication check failed',
        code: 'AUTH_ERROR'
      },
      { status: 500 }
    )
  }
}