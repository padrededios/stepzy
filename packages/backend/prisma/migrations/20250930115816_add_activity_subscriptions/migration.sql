-- CreateTable
CREATE TABLE "public"."activity_subscriptions" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_subscriptions_activityId_userId_key" ON "public"."activity_subscriptions"("activityId", "userId");

-- AddForeignKey
ALTER TABLE "public"."activity_subscriptions" ADD CONSTRAINT "activity_subscriptions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_subscriptions" ADD CONSTRAINT "activity_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
