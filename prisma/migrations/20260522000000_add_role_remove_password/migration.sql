-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SISWA');

-- AlterTable: add role column with default, then drop password column
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'SISWA';

-- AlterTable: remove password column (authentication is handled by Supabase Auth)
ALTER TABLE "User" DROP COLUMN "password";
