/**
 * Seed script for Stepzy
 * Uses Better-auth compatible password hashing (scrypt)
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'
import { generateActivityCode } from '@stepzy/shared'

const prisma = new PrismaClient()
const scryptAsync = promisify(scrypt)

/**
 * Hash password using scrypt (Better-auth compatible)
 * Better-auth uses scrypt with specific parameters: N=16384, r=16, p=1, dklen=64
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')

  // Better-auth scrypt parameters
  const N = 16384
  const r = 16
  const p = 1
  const maxmem = 128 * N * r * 2

  const buf = (await scryptAsync(password, salt, 64, { N, r, p, maxmem })) as Buffer
  return `${salt}:${buf.toString('hex')}`
}

async function main() {
  console.log('🌱 Démarrage du seed...')

  // Clean up existing test data
  console.log('🧹 Nettoyage des données de test existantes...')

  // Delete in correct order to respect foreign key constraints
  await prisma.matchPlayer.deleteMany({})
  await prisma.match.deleteMany({})
  await prisma.activityParticipant.deleteMany({})
  await prisma.activitySubscription.deleteMany({})
  await prisma.activitySession.deleteMany({})
  await prisma.activity.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.announcement.deleteMany({})
  await prisma.account.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'admin@stepzy.local',
          'player1@test.com',
          'player2@test.com',
          'player3@test.com',
        ],
      },
    },
  })

  // Créer l'utilisateur root avec Better-auth compatible password
  const adminPassword = await hashPassword('RootPass123!')

  const rootUser = await prisma.user.create({
    data: {
      email: 'admin@stepzy.local',
      pseudo: 'Admin',
      avatar: null,
      role: 'root',
      emailVerified: true,
      accounts: {
        create: {
          providerId: 'credential',
          accountId: 'admin@stepzy.local',
          password: adminPassword, // Better-auth scrypt hash
        },
      },
    },
  })

  console.log('✅ Utilisateur root créé:', rootUser.email)

  // Créer quelques utilisateurs de test
  const testPassword = await hashPassword('password123')

  const player1 = await prisma.user.create({
    data: {
      email: 'player1@test.com',
      pseudo: 'Player1',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player1',
      role: 'user',
      emailVerified: true,
      accounts: {
        create: {
          providerId: 'credential',
          accountId: 'player1@test.com',
          password: testPassword,
        },
      },
    },
  })

  const player2 = await prisma.user.create({
    data: {
      email: 'player2@test.com',
      pseudo: 'Player2',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player2',
      role: 'user',
      emailVerified: true,
      accounts: {
        create: {
          providerId: 'credential',
          accountId: 'player2@test.com',
          password: testPassword,
        },
      },
    },
  })

  const player3 = await prisma.user.create({
    data: {
      email: 'player3@test.com',
      pseudo: 'Player3',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player3',
      role: 'user',
      emailVerified: true,
      accounts: {
        create: {
          providerId: 'credential',
          accountId: 'player3@test.com',
          password: testPassword,
        },
      },
    },
  })

  const testUsers = [player1, player2, player3]

  console.log(`✅ ${testUsers.length} utilisateurs de test créés`)

  // Créer des activités récurrentes de démonstration
  const now = new Date()

  // Activity 1: Football du mardi (créée par player1)
  const footballActivity = await prisma.activity.create({
    data: {
      name: 'Football du mardi',
      description: 'Match de football hebdomadaire tous les mardis',
      sport: 'football',
      recurringDays: ['tuesday'],
      recurringType: 'weekly',
      startTime: '18:30',
      endTime: '20:00',
      minPlayers: 8,
      maxPlayers: 12,
      createdBy: player1.id,
      isPublic: true,
      code: generateActivityCode(),
    },
  })

  // Activity 2: Badminton du mercredi (créée par player2)
  const badmintonActivity = await prisma.activity.create({
    data: {
      name: 'Badminton du mercredi',
      description: 'Badminton en double tous les mercredis',
      sport: 'badminton',
      recurringDays: ['wednesday'],
      recurringType: 'weekly',
      startTime: '19:00',
      endTime: '20:00',
      minPlayers: 2,
      maxPlayers: 4,
      createdBy: player2.id,
      isPublic: true,
      code: generateActivityCode(),
    },
  })

  // Activity 3: Volleyball du jeudi (créée par player3)
  const volleyActivity = await prisma.activity.create({
    data: {
      name: 'Volleyball du jeudi',
      description: 'Match de volleyball tous les jeudis',
      sport: 'volley',
      recurringDays: ['thursday'],
      recurringType: 'weekly',
      startTime: '17:00',
      endTime: '19:00',
      minPlayers: 6,
      maxPlayers: 12,
      createdBy: player3.id,
      isPublic: true,
      code: generateActivityCode(),
    },
  })

  // Activity 4: Ping-Pong du samedi (créée par admin)
  const pingpongActivity = await prisma.activity.create({
    data: {
      name: 'Ping-Pong du samedi',
      description: 'Tournoi de ping-pong tous les samedis',
      sport: 'pingpong',
      recurringDays: ['saturday'],
      recurringType: 'weekly',
      startTime: '14:00',
      endTime: '15:30',
      minPlayers: 2,
      maxPlayers: 8,
      createdBy: rootUser.id,
      isPublic: true,
      code: generateActivityCode(),
    },
  })

  const activities = [footballActivity, badmintonActivity, volleyActivity, pingpongActivity]
  console.log(`✅ ${activities.length} activités récurrentes créées`)

  // Générer des sessions pour les 4 prochaines semaines
  const sessions: any[] = []

  // Mapping des jours de la semaine
  const dayMap: Record<string, number> = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
  }

  for (const activity of activities) {
    for (let week = 0; week < 4; week++) {
      for (const dayName of activity.recurringDays) {
        const dayOfWeek = dayMap[dayName]
        const sessionDate = new Date(now)
        sessionDate.setDate(now.getDate() + (dayOfWeek - now.getDay() + 7) % 7 + (week * 7))

        // Parse startTime (format "HH:MM")
        const [hours, minutes] = activity.startTime.split(':').map(Number)
        sessionDate.setHours(hours, minutes, 0, 0)

        // Skip sessions in the past
        if (sessionDate > now) {
          const session = await prisma.activitySession.create({
            data: {
              activityId: activity.id,
              date: sessionDate,
              maxPlayers: activity.maxPlayers,
              status: 'active',
            },
          })
          sessions.push(session)
        }
      }
    }
  }

  console.log(`✅ ${sessions.length} sessions générées pour les 4 prochaines semaines`)

  // Inscrire quelques utilisateurs aux activités
  await Promise.all([
    // Player1 s'inscrit au badminton ET au football
    prisma.activitySubscription.create({
      data: {
        userId: player1.id,
        activityId: badmintonActivity.id,
      },
    }),
    prisma.activitySubscription.create({
      data: {
        userId: player1.id,
        activityId: footballActivity.id,
      },
    }),
    // Player2 s'inscrit au football ET au volleyball
    prisma.activitySubscription.create({
      data: {
        userId: player2.id,
        activityId: footballActivity.id,
      },
    }),
    prisma.activitySubscription.create({
      data: {
        userId: player2.id,
        activityId: volleyActivity.id,
      },
    }),
    // Player3 s'inscrit au ping-pong ET au volleyball
    prisma.activitySubscription.create({
      data: {
        userId: player3.id,
        activityId: pingpongActivity.id,
      },
    }),
    prisma.activitySubscription.create({
      data: {
        userId: player3.id,
        activityId: volleyActivity.id,
      },
    }),
  ])

  console.log('✅ Utilisateurs inscrits aux activités')

  // Inscrire quelques joueurs aux premières sessions
  const footballSessions = sessions.filter(s => s.activityId === footballActivity.id).slice(0, 2)
  const badmintonSessions = sessions.filter(s => s.activityId === badmintonActivity.id).slice(0, 2)
  const volleySessions = sessions.filter(s => s.activityId === volleyActivity.id).slice(0, 1)

  if (footballSessions.length > 0) {
    await Promise.all([
      prisma.activityParticipant.create({
        data: {
          userId: player1.id,
          sessionId: footballSessions[0].id,
          status: 'confirmed',
        },
      }),
      prisma.activityParticipant.create({
        data: {
          userId: player2.id,
          sessionId: footballSessions[0].id,
          status: 'confirmed',
        },
      }),
    ])
  }

  if (badmintonSessions.length > 0) {
    await prisma.activityParticipant.create({
      data: {
        userId: player1.id,
        sessionId: badmintonSessions[0].id,
        status: 'confirmed',
      },
    })
  }

  if (volleySessions.length > 0) {
    await Promise.all([
      prisma.activityParticipant.create({
        data: {
          userId: player2.id,
          sessionId: volleySessions[0].id,
          status: 'confirmed',
        },
      }),
      prisma.activityParticipant.create({
        data: {
          userId: player3.id,
          sessionId: volleySessions[0].id,
          status: 'confirmed',
        },
      }),
    ])
  }

  console.log('✅ Joueurs inscrits aux sessions de démonstration')

  console.log('🌱 Seed terminé avec succès!')
  console.log('')
  console.log('🔐 Identifiants administrateur:')
  console.log('Email: admin@stepzy.local')
  console.log('Mot de passe: RootPass123!')
  console.log('')
  console.log('👤 Identifiants joueurs de test:')
  console.log('Email: player1@test.com / player2@test.com / player3@test.com')
  console.log('Mot de passe: password123')
  console.log('')
  console.log('📅 Activités créées:')
  console.log('- Football du mardi 18h30-20h00 (8-12 joueurs)')
  console.log('- Badminton du mercredi 19h00-20h00 (2-4 joueurs)')
  console.log('- Volleyball du jeudi 17h00-19h00 (6-12 joueurs)')
  console.log('- Ping-Pong du samedi 14h00-15h30 (2-8 joueurs)')
  console.log('')
  console.log('🔔 Abonnements aux activités:')
  console.log('- Player1: Badminton + Football')
  console.log('- Player2: Football + Volleyball')
  console.log('- Player3: Ping-Pong + Volleyball')
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
