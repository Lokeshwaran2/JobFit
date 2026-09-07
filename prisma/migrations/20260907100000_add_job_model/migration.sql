-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "originalData" JSONB,
ADD COLUMN     "templateId" TEXT NOT NULL DEFAULT 'classic';

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobHash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT,
    "workplaceType" TEXT,
    "jobType" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceUrl" TEXT,
    "sourceDomain" TEXT,
    "rawDescription" TEXT NOT NULL,
    "parsedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_userId_createdAt_idx" ON "Job"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Job_jobHash_idx" ON "Job"("jobHash");

-- CreateIndex
CREATE UNIQUE INDEX "Job_userId_jobHash_key" ON "Job"("userId", "jobHash");

-- CreateIndex
CREATE INDEX "Resume_userId_jobId_idx" ON "Resume"("userId", "jobId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
