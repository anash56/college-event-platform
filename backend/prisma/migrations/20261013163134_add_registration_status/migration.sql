-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "status" "RegistrationStatus" NOT NULL DEFAULT 'ACTIVE';
