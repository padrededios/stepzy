import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredMatches, deleteOldCompletedMatches } from '@/lib/cleanup/matches'

export async function POST(request: NextRequest) {
  try {
    // Check for authorization (you might want to add a secret key check)
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CLEANUP_SECRET || 'cleanup-secret'}`

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Clean up expired matches (mark as completed)
    const cleanupResult = await cleanupExpiredMatches()

    // Optionally delete very old completed matches (older than 30 days)
    const deleteResult = await deleteOldCompletedMatches(30)

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: {
        expiredMatchesCompleted: cleanupResult.cleanedCount,
        oldMatchesDeleted: deleteResult.deletedCount
      }
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du nettoyage'
      },
      { status: 500 }
    )
  }
}

// For manual testing/admin use
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const secret = url.searchParams.get('secret')

    if (secret !== (process.env.CLEANUP_SECRET || 'cleanup-secret')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cleanupResult = await cleanupExpiredMatches()

    return NextResponse.json({
      success: true,
      message: 'Manual cleanup completed',
      data: {
        expiredMatchesCompleted: cleanupResult.cleanedCount
      }
    })

  } catch (error) {
    console.error('Manual cleanup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du nettoyage manuel'
      },
      { status: 500 }
    )
  }
}