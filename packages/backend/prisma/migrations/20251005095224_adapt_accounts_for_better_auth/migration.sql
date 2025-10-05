-- Adapt Account model for Better Auth schema
-- Rename columns to match Better Auth expectations

-- Rename provider to providerId
ALTER TABLE "public"."accounts" RENAME COLUMN "provider" TO "providerId";

-- Rename providerAccountId to accountId
ALTER TABLE "public"."accounts" RENAME COLUMN "providerAccountId" TO "accountId";

-- Drop unused columns from NextAuth
ALTER TABLE "public"."accounts" DROP COLUMN IF EXISTS "type";
ALTER TABLE "public"."accounts" DROP COLUMN IF EXISTS "token_type";
ALTER TABLE "public"."accounts" DROP COLUMN IF EXISTS "session_state";

-- Rename expires_at to keep consistent naming (it's used for accessTokenExpiresAt)
-- Note: We're keeping the column name as expires_at but mapping it in Prisma

-- Drop the old unique constraint
ALTER TABLE "public"."accounts" DROP CONSTRAINT IF EXISTS "accounts_provider_providerAccountId_key";

-- Add new unique constraint
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_providerId_accountId_key" UNIQUE ("providerId", "accountId");
