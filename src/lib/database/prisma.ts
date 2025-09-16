/**
 * Prisma Database Client - PostgreSQL ORM
 * 
 * This file exports a singleton Prisma client instance for database operations.
 * 
 * Available Prisma client methods:
 * - prisma.user.findUnique(): Find a single user by unique field
 * - prisma.user.findMany(): Find multiple users with filtering
 * - prisma.user.create(): Create a new user
 * - prisma.user.update(): Update existing user
 * - prisma.user.delete(): Delete user
 * - prisma.user.upsert(): Update or create user
 * - prisma.user.count(): Count users matching criteria
 * - prisma.user.aggregate(): Perform aggregations on user data
 * - prisma.user.groupBy(): Group users by field
 * 
 * Similar methods available for all models: match, matchPlayer, notification
 * 
 * Transaction methods:
 * - prisma.$transaction(): Execute multiple operations atomically
 * - prisma.$executeRaw(): Execute raw SQL queries
 * - prisma.$queryRaw(): Execute raw SQL queries with return
 * 
 * Connection methods:
 * - prisma.$connect(): Manually connect to database
 * - prisma.$disconnect(): Manually disconnect from database
 * 
 * Utility methods:
 * - prisma.$use(): Add middleware to queries
 * - prisma.$on(): Listen to database events
 * - prisma.$extends(): Extend Prisma client functionality
 * 
 * The client is configured as a singleton to prevent multiple connections
 * in development mode through global variable caching.
 */
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma
}