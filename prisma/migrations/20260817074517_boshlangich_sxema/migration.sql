-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'LEADER', 'DEVELOPER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING', 'BLOCKED');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('MINISTRY', 'STATE_COMMITTEE', 'AGENCY', 'KHOKIMIYAT', 'EDUCATION', 'HEALTHCARE', 'STATE_ENTERPRISE', 'OTHER');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('KARAKALPAKSTAN', 'ANDIJAN', 'BUKHARA', 'FERGANA', 'JIZZAKH', 'KHOREZM', 'NAMANGAN', 'NAVOIY', 'QASHQADARYO', 'SAMARKAND', 'SIRDARYO', 'SURKHANDARYO', 'TASHKENT_REGION', 'TASHKENT_CITY');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'TAKEN', 'SOLUTION_OFFERED', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PainType" AS ENUM ('MANUAL_REPETITIVE', 'PAPERWORK', 'DATA_LOSS_ERRORS', 'DATA_SCATTERED', 'DELAYS_WAITING', 'NO_CONTROL', 'HARD_REPORTING', 'BAD_EXISTING_SOFTWARE');

-- CreateEnum
CREATE TYPE "ToolUsed" AS ENUM ('PAPER', 'EXCEL', 'WORD', 'TELEGRAM', 'EMAIL', 'ONE_C', 'INTERNAL_APP', 'GOV_SYSTEM', 'NONE');

-- CreateEnum
CREATE TYPE "FrequencyUnit" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "Consequence" AS ENUM ('TIME_LOST', 'ERRORS_FINES', 'CITIZEN_COMPLAINTS', 'REPORT_DELAYS', 'LEGAL_NONCOMPLIANCE');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DataVolume" AS ENUM ('UNDER_100', 'FROM_100_TO_1000', 'FROM_1000_TO_10000', 'OVER_10000');

-- CreateEnum
CREATE TYPE "UsersCount" AS ENUM ('FROM_1_TO_5', 'FROM_5_TO_20', 'FROM_20_TO_100', 'OVER_100');

-- CreateEnum
CREATE TYPE "DataSensitivity" AS ENUM ('PUBLIC', 'INTERNAL', 'PERSONAL', 'CONFIDENTIAL');

-- CreateEnum
CREATE TYPE "IntegrationTarget" AS ENUM ('ONE_C', 'E_IJRO', 'MY_GOV', 'TAX', 'BANK', 'SMS', 'OTHER');

-- CreateEnum
CREATE TYPE "AccessLocation" AS ENUM ('OFFICE_ONLY', 'INTERNET', 'MOBILE', 'BRANCHES');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL DEFAULT 'OTHER',
    "region" "Region" NOT NULL,
    "district" TEXT,
    "stir" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skills" TEXT[],
    "portfolioUrl" TEXT,
    "about" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectedNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "refCode" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "painTypes" "PainType"[],
    "currentProcess" TEXT,
    "toolsUsed" "ToolUsed"[],
    "toolsNote" TEXT,
    "rolesInvolved" TEXT[],
    "frequency" INTEGER,
    "frequencyUnit" "FrequencyUnit",
    "minutesPerCase" INTEGER,
    "peopleAffected" INTEGER,
    "citizensAffected" INTEGER,
    "consequence" "Consequence",
    "urgency" "Urgency" NOT NULL DEFAULT 'MEDIUM',
    "deadline" TIMESTAMP(3),
    "deadlineReason" TEXT,
    "dataVolume" "DataVolume",
    "usersCount" "UsersCount",
    "dataSensitivity" "DataSensitivity",
    "integrations" "IntegrationTarget"[],
    "integrationsNote" TEXT,
    "accessFrom" "AccessLocation"[],
    "previousAttempt" BOOLEAN NOT NULL DEFAULT false,
    "previousAttemptNote" TEXT,
    "desiredOutcome" TEXT,
    "successMetric" TEXT,
    "contactName" TEXT,
    "contactPosition" TEXT,
    "contactPhone" TEXT,
    "monthlyHoursLost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completeness" INTEGER NOT NULL DEFAULT 0,
    "impactScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ProblemStatus" NOT NULL DEFAULT 'DRAFT',
    "moderationNote" TEXT,
    "canonicalId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemSupporter" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemSupporter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemAttachment" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemStatusHistory" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "fromStatus" "ProblemStatus",
    "toStatus" "ProblemStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemAssignment" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "note" TEXT,
    "activeKey" TEXT,

    CONSTRAINT "ProblemAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stir_key" ON "Organization"("stir");

-- CreateIndex
CREATE INDEX "Organization_region_idx" ON "Organization"("region");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperProfile_userId_key" ON "DeveloperProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_refCode_key" ON "Problem"("refCode");

-- CreateIndex
CREATE INDEX "Problem_status_idx" ON "Problem"("status");

-- CreateIndex
CREATE INDEX "Problem_organizationId_idx" ON "Problem"("organizationId");

-- CreateIndex
CREATE INDEX "Problem_categoryId_idx" ON "Problem"("categoryId");

-- CreateIndex
CREATE INDEX "Problem_canonicalId_idx" ON "Problem"("canonicalId");

-- CreateIndex
CREATE INDEX "Problem_status_impactScore_createdAt_idx" ON "Problem"("status", "impactScore" DESC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ProblemSupporter_problemId_idx" ON "ProblemSupporter"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemSupporter_problemId_organizationId_key" ON "ProblemSupporter"("problemId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemAttachment_storedName_key" ON "ProblemAttachment"("storedName");

-- CreateIndex
CREATE INDEX "ProblemAttachment_problemId_idx" ON "ProblemAttachment"("problemId");

-- CreateIndex
CREATE INDEX "ProblemStatusHistory_problemId_createdAt_idx" ON "ProblemStatusHistory"("problemId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemAssignment_activeKey_key" ON "ProblemAssignment"("activeKey");

-- CreateIndex
CREATE INDEX "ProblemAssignment_problemId_idx" ON "ProblemAssignment"("problemId");

-- CreateIndex
CREATE INDEX "ProblemAssignment_developerId_idx" ON "ProblemAssignment"("developerId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperProfile" ADD CONSTRAINT "DeveloperProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_canonicalId_fkey" FOREIGN KEY ("canonicalId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemSupporter" ADD CONSTRAINT "ProblemSupporter_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemSupporter" ADD CONSTRAINT "ProblemSupporter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemSupporter" ADD CONSTRAINT "ProblemSupporter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemAttachment" ADD CONSTRAINT "ProblemAttachment_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemStatusHistory" ADD CONSTRAINT "ProblemStatusHistory_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemStatusHistory" ADD CONSTRAINT "ProblemStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemAssignment" ADD CONSTRAINT "ProblemAssignment_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemAssignment" ADD CONSTRAINT "ProblemAssignment_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
