-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'banned', 'deactivated');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'pending';
