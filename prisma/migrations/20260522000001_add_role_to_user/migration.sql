-- CreateEnum (safe: only creates if it doesn't already exist)
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'SISWA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: add role column with default SISWA
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'SISWA';
