/**
 * Script to retrieve activity codes for testing
 */
import { prisma } from '../src/database/prisma'

async function getActivityCodes() {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        creator: {
          select: {
            pseudo: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('\n📋 CODES D\'ACTIVITÉS DISPONIBLES\n')
    console.log('='.repeat(80))

    if (activities.length === 0) {
      console.log('Aucune activité trouvée.')
    } else {
      activities.forEach((activity, index) => {
        console.log(`\n${index + 1}. ${activity.name}`)
        console.log(`   Code: ${activity.code}`)
        console.log(`   Sport: ${activity.sport}`)
        console.log(`   Créateur: ${activity.creator.pseudo} (${activity.creator.email})`)
        console.log(`   Récurrence: ${activity.recurringType} - ${activity.recurringDays.join(', ')}`)
        console.log(`   Horaires: ${activity.startTime} - ${activity.endTime}`)
      })
    }

    console.log('\n' + '='.repeat(80))
    console.log(`\nTotal: ${activities.length} activité(s)\n`)

  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getActivityCodes()
