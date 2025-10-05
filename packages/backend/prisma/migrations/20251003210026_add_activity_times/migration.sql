-- AlterTable
ALTER TABLE "public"."activities" ADD COLUMN     "endTime" TEXT NOT NULL DEFAULT '13:00',
ADD COLUMN     "startTime" TEXT NOT NULL DEFAULT '12:00';
