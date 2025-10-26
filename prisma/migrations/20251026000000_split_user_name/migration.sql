-- AlterTable - Split name field into firstName and lastName
-- Step 1: Add lastName column with default empty string
ALTER TABLE "users" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';

-- Step 2: Rename name column to firstName
ALTER TABLE "users" RENAME COLUMN "name" TO "firstName";
