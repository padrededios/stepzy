/**
 * Script to clean orphan activity list entries
 * (entries in user_activity_lists without corresponding subscription)
 */
import { prisma } from '../src/database/prisma'

async function cleanOrphanEntries() {
  try {
    // Trouver toutes les entrées dans user_activity_lists
    const listEntries = await prisma.userActivityList.findMany({
      include: {
        user: {
          select: { pseudo: true, email: true }
        },
        activity: {
          select: { name: true }
        }
      }
    })

    console.log(`\n🔍 Vérification de ${listEntries.length} entrées dans les listes personnelles...\n`)

    let orphanCount = 0
    let validCount = 0

    for (const entry of listEntries) {
      // Vérifier si une inscription existe
      const subscription = await prisma.activitySubscription.findFirst({
        where: {
          userId: entry.userId,
          activityId: entry.activityId
        }
      })

      if (!subscription) {
        console.log(`❌ Orphelin détecté:`)
        console.log(`   Utilisateur: ${entry.user.pseudo} (${entry.user.email})`)
        console.log(`   Activité: ${entry.activity.name}`)
        console.log(`   → Suppression...`)

        await prisma.userActivityList.delete({
          where: { id: entry.id }
        })

        orphanCount++
      } else {
        validCount++
      }
    }

    console.log(`\n✅ Nettoyage terminé:`)
    console.log(`   - ${validCount} entrée(s) valide(s)`)
    console.log(`   - ${orphanCount} entrée(s) orpheline(s) supprimée(s)\n`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanOrphanEntries()
