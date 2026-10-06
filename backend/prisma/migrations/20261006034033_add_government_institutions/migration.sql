-- CreateTable
CREATE TABLE "GovernmentInstitution" (
    "id" TEXT NOT NULL,
    "aisheCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "website" TEXT,
    "yearOfEstablishment" INTEGER,
    "location" TEXT,
    "collegeType" TEXT,
    "management" TEXT,
    "universityAisheCode" TEXT,
    "universityName" TEXT,
    "universityType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernmentInstitution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GovernmentInstitution_aisheCode_key" ON "GovernmentInstitution"("aisheCode");
