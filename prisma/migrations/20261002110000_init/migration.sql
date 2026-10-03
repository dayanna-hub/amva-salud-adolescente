-- Initial schema for AMVA Salud Adolescente
-- Generated to mirror prisma/schema.prisma

CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN_MUNICIPAL', 'DIGITADOR', 'ANALISTA');
CREATE TYPE "EventType" AS ENUM ('MORBIDITY', 'MORTALITY');
CREATE TYPE "SubmissionSourceType" AS ENUM ('INDIVIDUAL_CASES', 'MONTHLY_CONSOLIDATED');
CREATE TYPE "SubmissionInputMethod" AS ENUM ('FORM', 'CSV', 'XLSX');
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'VALIDATED', 'CLOSED');
CREATE TYPE "Sex" AS ENUM ('FEMALE', 'MALE', 'NOT_REPORTED');
CREATE TYPE "Zone" AS ENUM ('URBAN', 'RURAL');
CREATE TYPE "AdolescentPhase" AS ENUM ('EARLY_10_13', 'MIDDLE_14_17', 'LATE_18_19');
CREATE TYPE "AffiliationRegime" AS ENUM ('UNAFFILIATED', 'SUBSIDIZED', 'CONTRIBUTORY');

CREATE TABLE "Municipality" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Municipality_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "municipalityId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Submission" (
  "id" TEXT NOT NULL,
  "municipalityId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "month" INTEGER NOT NULL,
  "eventType" "EventType" NOT NULL,
  "sourceType" "SubmissionSourceType" NOT NULL,
  "inputMethod" "SubmissionInputMethod" NOT NULL,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT,
  "notes" TEXT,
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CaseRecord" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "eventDate" TIMESTAMP(3) NOT NULL,
  "municipalityIdSnapshot" TEXT NOT NULL,
  "age" INTEGER NOT NULL,
  "phase" "AdolescentPhase" NOT NULL,
  "sex" "Sex" NOT NULL,
  "zone" "Zone",
  "diagnosis" TEXT,
  "cie10Code" TEXT,
  "causeOfDeath" TEXT,
  "deathCie10Code" TEXT,
  "educationLevel" TEXT,
  "stratum" INTEGER,
  "ethnicity" TEXT,
  "affiliationRegime" "AffiliationRegime",
  "sourceFingerprint" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CaseRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsolidatedRow" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "age" INTEGER,
  "phase" "AdolescentPhase",
  "sex" "Sex",
  "zone" "Zone",
  "diagnosis" TEXT,
  "cie10Code" TEXT,
  "causeOfDeath" TEXT,
  "deathCie10Code" TEXT,
  "educationLevel" TEXT,
  "stratum" INTEGER,
  "ethnicity" TEXT,
  "affiliationRegime" "AffiliationRegime",
  "caseCount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConsolidatedRow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Population" (
  "id" TEXT NOT NULL,
  "municipalityId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "age" INTEGER NOT NULL,
  "sex" "Sex" NOT NULL,
  "populationCount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Population_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "beforeData" JSONB,
  "afterData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Municipality_code_key" ON "Municipality"("code");
CREATE UNIQUE INDEX "Municipality_name_key" ON "Municipality"("name");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Submission_municipalityId_year_month_eventType_key" ON "Submission"("municipalityId", "year", "month", "eventType");
CREATE INDEX "Submission_year_month_eventType_status_idx" ON "Submission"("year", "month", "eventType", "status");
CREATE UNIQUE INDEX "CaseRecord_submissionId_sourceFingerprint_key" ON "CaseRecord"("submissionId", "sourceFingerprint");
CREATE INDEX "CaseRecord_submissionId_sex_phase_idx" ON "CaseRecord"("submissionId", "sex", "phase");
CREATE INDEX "CaseRecord_cie10Code_idx" ON "CaseRecord"("cie10Code");
CREATE INDEX "ConsolidatedRow_submissionId_sex_phase_idx" ON "ConsolidatedRow"("submissionId", "sex", "phase");
CREATE INDEX "ConsolidatedRow_cie10Code_idx" ON "ConsolidatedRow"("cie10Code");
CREATE UNIQUE INDEX "Population_municipalityId_year_age_sex_key" ON "Population"("municipalityId", "year", "age", "sex");
CREATE INDEX "Population_year_municipalityId_idx" ON "Population"("year", "municipalityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

ALTER TABLE "User" ADD CONSTRAINT "User_municipalityId_fkey"
  FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Submission" ADD CONSTRAINT "Submission_municipalityId_fkey"
  FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Submission" ADD CONSTRAINT "Submission_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ConsolidatedRow" ADD CONSTRAINT "ConsolidatedRow_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Population" ADD CONSTRAINT "Population_municipalityId_fkey"
  FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
