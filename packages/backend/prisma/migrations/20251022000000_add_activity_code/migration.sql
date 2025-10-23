-- AlterTable
ALTER TABLE "activities" ADD COLUMN "code" TEXT;

-- Generate unique codes for existing activities
DO $$
DECLARE
    activity_record RECORD;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    FOR activity_record IN SELECT id FROM "activities" LOOP
        LOOP
            new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || activity_record.id) FROM 1 FOR 8));
            SELECT EXISTS(SELECT 1 FROM "activities" WHERE code = new_code) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        UPDATE "activities" SET code = new_code WHERE id = activity_record.id;
    END LOOP;
END $$;

-- Make code NOT NULL after populating
ALTER TABLE "activities" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "activities_code_key" ON "activities"("code");
