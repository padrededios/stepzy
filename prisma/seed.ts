import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seed...')

  // Créer l'utilisateur root
  const hashedPassword = await bcrypt.hash('admin123!', 10)
  
  const rootUser = await prisma.user.upsert({
    where: { email: 'admin@stepzy.local' },
    update: {},
    create: {
      email: 'admin@stepzy.local',
      password: hashedPassword,
      pseudo: 'Admin',
      avatar: null,
      role: 'root',
    },
  })

  console.log('✅ Utilisateur root créé:', rootUser.email)

  // Créer quelques utilisateurs de test
  const testUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'player1@test.com' },
      update: {},
      create: {
        email: 'player1@test.com',
        password: await bcrypt.hash('password123', 10),
        pseudo: 'Player1',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player1',
        role: 'user',
      },
    }),
    prisma.user.upsert({
      where: { email: 'player2@test.com' },
      update: {},
      create: {
        email: 'player2@test.com',
        password: await bcrypt.hash('password123', 10),
        pseudo: 'Player2',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player2',
        role: 'user',
      },
    }),
    prisma.user.upsert({
      where: { email: 'player3@test.com' },
      update: {},
      create: {
        email: 'player3@test.com',
        password: await bcrypt.hash('password123', 10),
        pseudo: 'Player3',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player3',
        role: 'user',
      },
    }),
  ])

  console.log(`✅ ${testUsers.length} utilisateurs de test créés`)

  // Créer quelques activités de démonstration multisports
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  tomorrow.setHours(12, 30, 0, 0) // 12h30

  const nextWeek = new Date(now)
  nextWeek.setDate(now.getDate() + 7)
  nextWeek.setHours(13, 0, 0, 0) // 13h00

  const dayAfterTomorrow = new Date(now)
  dayAfterTomorrow.setDate(now.getDate() + 2)
  dayAfterTomorrow.setHours(14, 0, 0, 0) // 14h00

  // Supprimer les anciens matchs de démonstration
  await prisma.match.deleteMany({
    where: {
      OR: [
        { date: tomorrow },
        { date: nextWeek },
        { date: dayAfterTomorrow },
      ],
    },
  })

  const demoMatches = await Promise.all([
    prisma.match.create({
      data: {
        date: tomorrow,
        sport: 'football',
        maxPlayers: 12,
        status: 'open',
      },
    }),
    prisma.match.create({
      data: {
        date: nextWeek,
        sport: 'badminton',
        maxPlayers: 4,
        status: 'open',
      },
    }),
    prisma.match.create({
      data: {
        date: dayAfterTomorrow,
        sport: 'volley',
        maxPlayers: 12,
        status: 'open',
      },
    }),
  ])

  console.log(`✅ ${demoMatches.length} activités de démonstration créées`)

  // Inscrire quelques joueurs au premier match
  await Promise.all([
    prisma.matchPlayer.upsert({
      where: {
        userId_matchId: {
          userId: testUsers[0].id,
          matchId: demoMatches[0].id,
        },
      },
      update: {},
      create: {
        userId: testUsers[0].id,
        matchId: demoMatches[0].id,
        status: 'confirmed',
      },
    }),
    prisma.matchPlayer.upsert({
      where: {
        userId_matchId: {
          userId: testUsers[1].id,
          matchId: demoMatches[0].id,
        },
      },
      update: {},
      create: {
        userId: testUsers[1].id,
        matchId: demoMatches[0].id,
        status: 'confirmed',
      },
    }),
  ])

  console.log('✅ Joueurs inscrits aux matchs de démonstration')

  // --- Test Activity: Football 4v4 with substitutes for testing swap ---
  // Create extra test users for substitutes
  const extraPassword = await bcrypt.hash('password123', 10)
  const extraUsers = await Promise.all(
    Array.from({ length: 7 }, (_, i) =>
      prisma.user.upsert({
        where: { email: `testplayer${i + 4}@test.com` },
        update: {},
        create: {
          email: `testplayer${i + 4}@test.com`,
          password: extraPassword,
          pseudo: `Joueur${i + 4}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Joueur${i + 4}`,
          role: 'user',
        },
      })
    )
  )
  console.log(`✅ ${extraUsers.length} joueurs de test supplémentaires créés`)

  // Create Football 4v4 activity (max 8 players) created by player1
  const testActivityCode = 'SWAPTEST'
  const existingTestActivity = await prisma.activity.findUnique({
    where: { code: testActivityCode }
  })
  if (existingTestActivity) {
    await prisma.activity.delete({ where: { code: testActivityCode } })
  }

  const swapTestActivity = await prisma.activity.create({
    data: {
      name: 'Football 4v4 - Test Remplacements',
      description: 'Activité de test pour la fonctionnalité de remplacement de joueurs',
      sport: 'football',
      maxPlayers: 8,
      minPlayers: 4,
      createdBy: testUsers[0].id,
      isPublic: true,
      code: testActivityCode,
      recurringDays: ['friday'],
      recurringType: 'weekly',
      startTime: '19:00',
      endTime: '20:30',
    },
  })
  console.log(`✅ Activité de test remplacements créée: ${swapTestActivity.name} (code: ${testActivityCode})`)

  // Create a session for tomorrow
  const testSessionDate = new Date()
  testSessionDate.setDate(testSessionDate.getDate() + 1)
  testSessionDate.setHours(19, 0, 0, 0)

  const testSession = await prisma.activitySession.create({
    data: {
      activityId: swapTestActivity.id,
      date: testSessionDate,
      maxPlayers: 8,
      status: 'active',
    },
  })

  // Add 8 confirmed players + 2 substitutes and subscribe them all
  const allTestPlayers = [rootUser, ...testUsers, ...extraUsers]
  const totalParticipants = Math.min(10, allTestPlayers.length)

  for (let i = 0; i < totalParticipants; i++) {
    // Subscribe every participant to the activity
    await prisma.activitySubscription.upsert({
      where: {
        activityId_userId: {
          activityId: swapTestActivity.id,
          userId: allTestPlayers[i].id,
        },
      },
      update: {},
      create: {
        activityId: swapTestActivity.id,
        userId: allTestPlayers[i].id,
      },
    })

    // Add as participant: first 8 confirmed, last 2 waiting
    await prisma.activityParticipant.upsert({
      where: {
        sessionId_userId: {
          sessionId: testSession.id,
          userId: allTestPlayers[i].id,
        },
      },
      update: {},
      create: {
        sessionId: testSession.id,
        userId: allTestPlayers[i].id,
        status: i < 8 ? 'confirmed' : 'waiting',
      },
    })
  }

  console.log(`✅ Session de test créée avec 8 joueurs confirmés + 2 remplaçants`)
  console.log(`   Session ID: ${testSession.id}`)
  console.log(`   Pour tester: se connecter et aller sur /sessions/${testSession.id}`)

  console.log('🌱 Seed terminé avec succès!')
  console.log('')
  console.log('🔐 Identifiants administrateur:')
  console.log('Email: admin@stepzy.local')
  console.log('Mot de passe: admin123!')
  console.log('')
  console.log('👤 Identifiants joueurs de test:')
  console.log('Email: player1@test.com / player2@test.com / player3@test.com')
  console.log('Mot de passe: password123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Erreur lors du seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })