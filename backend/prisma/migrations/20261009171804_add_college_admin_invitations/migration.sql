-- CreateTable
CREATE TABLE "CollegeAdminInvitation" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollegeAdminInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollegeAdminInvitation_tokenHash_key" ON "CollegeAdminInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "CollegeAdminInvitation_collegeId_idx" ON "CollegeAdminInvitation"("collegeId");

-- CreateIndex
CREATE INDEX "CollegeAdminInvitation_email_idx" ON "CollegeAdminInvitation"("email");

-- CreateIndex
CREATE INDEX "CollegeAdminInvitation_expiresAt_idx" ON "CollegeAdminInvitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "CollegeAdminInvitation" ADD CONSTRAINT "CollegeAdminInvitation_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
