-- CreateTable
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_key" ON "tenants"("slug");

-- Insert default tenant
INSERT INTO "tenants" ("id", "name", "slug", "isActive", "createdAt", "updatedAt")
VALUES ('default-tenant-id', 'Tenant Demo', 'demo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- AlterTable: Add tenantId column (nullable first)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "superuser" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "checkpoints" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "user_place_assignments" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "journey_locations" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "push_tokens" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "journey_monitors" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "journey_adjustments" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Set default tenant for existing records
UPDATE "users" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;
UPDATE "places" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;
UPDATE "checkpoints" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;
UPDATE "user_place_assignments" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;
UPDATE "journey_locations" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;
UPDATE "push_tokens" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;
UPDATE "journey_monitors" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;
UPDATE "journey_adjustments" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;

-- Make tenantId NOT NULL
ALTER TABLE "users" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "places" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "checkpoints" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "user_place_assignments" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "journey_locations" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "push_tokens" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "journey_monitors" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "journey_adjustments" ALTER COLUMN "tenantId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "places" ADD CONSTRAINT "places_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_place_assignments" ADD CONSTRAINT "user_place_assignments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "journey_locations" ADD CONSTRAINT "journey_locations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "journey_monitors" ADD CONSTRAINT "journey_monitors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "journey_adjustments" ADD CONSTRAINT "journey_adjustments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
