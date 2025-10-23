-- CreateTable
CREATE TABLE "user_activity_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_lists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_activity_lists_userId_activityId_key" ON "user_activity_lists"("userId", "activityId");

-- AddForeignKey
ALTER TABLE "user_activity_lists" ADD CONSTRAINT "user_activity_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_lists" ADD CONSTRAINT "user_activity_lists_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing subscriptions to activity lists
INSERT INTO "user_activity_lists" ("id", "userId", "activityId", "joinedAt")
SELECT
    'ual_' || SUBSTRING(MD5(RANDOM()::TEXT || sub."userId" || sub."activityId") FROM 1 FOR 20) as id,
    sub."userId",
    sub."activityId",
    sub."subscribedAt" as "joinedAt"
FROM "activity_subscriptions" sub
ON CONFLICT ("userId", "activityId") DO NOTHING;
