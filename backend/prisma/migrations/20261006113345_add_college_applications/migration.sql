/*
  Warnings:

  - You are about to drop the column `aicteId` on the `College` table. All the data in the column will be lost.
  - You are about to drop the column `domain` on the `College` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `College` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[governmentInstitutionId]` on the table `College` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `governmentInstitutionId` to the `College` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CollegeApplicationStatus" AS ENUM ('PENDING_EMAIL_VERIFICATION', 'PENDING_ADMIN_REVIEW', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "College_aicteId_key";

-- DropIndex
DROP INDEX "College_domain_key";

-- AlterTable
ALTER TABLE "College" DROP COLUMN "aicteId",
DROP COLUMN "domain",
DROP COLUMN "name",
ADD COLUMN     "governmentInstitutionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "CollegeApplication" (
    "id" TEXT NOT NULL,
    "governmentInstitutionId" TEXT NOT NULL,
    "representativeName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "status" "CollegeApplicationStatus" NOT NULL DEFAULT 'PENDING_EMAIL_VERIFICATION',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollegeApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollegeApplication_governmentInstitutionId_idx" ON "CollegeApplication"("governmentInstitutionId");

-- CreateIndex
CREATE INDEX "CollegeApplication_status_idx" ON "CollegeApplication"("status");

-- CreateIndex
CREATE INDEX "CollegeApplication_email_idx" ON "CollegeApplication"("email");

-- CreateIndex
CREATE UNIQUE INDEX "College_governmentInstitutionId_key" ON "College"("governmentInstitutionId");

-- AddForeignKey
ALTER TABLE "College" ADD CONSTRAINT "College_governmentInstitutionId_fkey" FOREIGN KEY ("governmentInstitutionId") REFERENCES "GovernmentInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeApplication" ADD CONSTRAINT "CollegeApplication_governmentInstitutionId_fkey" FOREIGN KEY ("governmentInstitutionId") REFERENCES "GovernmentInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeApplication" ADD CONSTRAINT "CollegeApplication_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
