import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function cleanupExpiredMatches() {
  try {
    const now = new Date()

    // Find all matches that have ended (current time > match date + 2 hours buffer)
    const endedMatches = await prisma.match.findMany({
      where: {
        date: {
          lt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        status: {
          not: 'completed'
        }
      },
      include: {
        players: true
      }
    })

    if (endedMatches.length === 0) {
      console.log('No matches to clean up')
      return { cleanedCount: 0 }
    }

    // Mark matches as completed
    const updateResult = await prisma.match.updateMany({
      where: {
        id: {
          in: endedMatches.map(match => match.id)
        }
      },
      data: {
        status: 'completed'
      }
    })

    console.log(`Cleaned up ${updateResult.count} expired matches`)
    return { cleanedCount: updateResult.count }

  } catch (error) {
    console.error('Error cleaning up expired matches:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteOldCompletedMatches(daysOld = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Delete match players first (foreign key constraint)
    await prisma.matchPlayer.deleteMany({
      where: {
        match: {
          status: 'completed',
          date: {
            lt: cutoffDate
          }
        }
      }
    })

    // Then delete the matches
    const deleteResult = await prisma.match.deleteMany({
      where: {
        status: 'completed',
        date: {
          lt: cutoffDate
        }
      }
    })

    console.log(`Deleted ${deleteResult.count} old completed matches`)
    return { deletedCount: deleteResult.count }

  } catch (error) {
    console.error('Error deleting old completed matches:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}