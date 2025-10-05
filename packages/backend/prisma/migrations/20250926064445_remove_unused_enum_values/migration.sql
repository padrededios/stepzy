/*
  Warnings:

  - The values [scheduled] on the enum `MatchStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [titulaire,remplaçant] on the enum `player_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."sport_type" AS ENUM ('football', 'badminton', 'volley', 'pingpong', 'rugby');

-- CreateEnum
CREATE TYPE "public"."notification_type" AS ENUM ('match_created', 'match_updated', 'match_cancelled', 'match_reminder', 'match_joined', 'match_left', 'waiting_list_promoted', 'announcement', 'system');

-- CreateEnum
CREATE TYPE "public"."priority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."MatchStatus_new" AS ENUM ('open', 'full', 'cancelled', 'completed');
ALTER TABLE "public"."matches" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."matches" ALTER COLUMN "status" TYPE "public"."MatchStatus_new" USING ("status"::text::"public"."MatchStatus_new");
ALTER TYPE "public"."MatchStatus" RENAME TO "MatchStatus_old";
ALTER TYPE "public"."MatchStatus_new" RENAME TO "MatchStatus";
DROP TYPE "public"."MatchStatus_old";
ALTER TABLE "public"."matches" ALTER COLUMN "status" SET DEFAULT 'open';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."player_status_new" AS ENUM ('confirmed', 'waiting');
ALTER TABLE "public"."match_players" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."match_players" ALTER COLUMN "status" TYPE "public"."player_status_new" USING ("status"::text::"public"."player_status_new");
ALTER TYPE "public"."player_status" RENAME TO "player_status_old";
ALTER TYPE "public"."player_status_new" RENAME TO "player_status";
DROP TYPE "public"."player_status_old";
ALTER TABLE "public"."match_players" ALTER COLUMN "status" SET DEFAULT 'confirmed';
COMMIT;

-- AlterTable
ALTER TABLE "public"."match_players" ALTER COLUMN "status" SET DEFAULT 'confirmed';

-- AlterTable
ALTER TABLE "public"."matches" ADD COLUMN     "maxPlayers" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "sport" "public"."sport_type" NOT NULL DEFAULT 'football',
ALTER COLUMN "status" SET DEFAULT 'open';

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "matchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "priority" "public"."priority" NOT NULL DEFAULT 'normal',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "public"."notifications"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
