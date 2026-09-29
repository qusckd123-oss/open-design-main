-- Additive LOOK-only foundation. Existing Editorial, Market and Archive tables are untouched.
CREATE TYPE "LookPlatform" AS ENUM ('INSTAGRAM', 'WEB');
CREATE TYPE "LookGenderScope" AS ENUM ('MEN', 'WOMEN', 'MIXED', 'UNKNOWN');
CREATE TYPE "LookGender" AS ENUM ('MEN', 'WOMEN', 'UNKNOWN');
CREATE TYPE "LookReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "LookClusterStatus" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');
CREATE TYPE "LookTagDimension" AS ENUM ('OUTERWEAR', 'TOP', 'BOTTOM', 'FOOTWEAR', 'FIT', 'LAYERING', 'DETAIL');

CREATE TABLE "LookSourceAccount" (
    "id" TEXT NOT NULL,
    "platform" "LookPlatform" NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "profileUrl" TEXT NOT NULL,
    "genderScope" "LookGenderScope" NOT NULL DEFAULT 'UNKNOWN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "collectionMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "LookSourceAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LookObservation" (
    "id" TEXT NOT NULL,
    "sourceAccountId" TEXT NOT NULL,
    "platform" "LookPlatform" NOT NULL,
    "postUrl" TEXT NOT NULL,
    "postIdentity" TEXT NOT NULL,
    "postExternalId" TEXT,
    "publishedAt" TIMESTAMPTZ(3),
    "observedAt" TIMESTAMPTZ(3) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageIndex" INTEGER NOT NULL DEFAULT 0,
    "captionText" TEXT,
    "genderCandidate" "LookGender" NOT NULL DEFAULT 'UNKNOWN',
    "collectionMethod" TEXT NOT NULL DEFAULT 'MANUAL',
    "reviewStatus" "LookReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "LookObservation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LookObservation_imageIndex_nonnegative" CHECK ("imageIndex" >= 0)
);

CREATE TABLE "LookCluster" (
    "id" TEXT NOT NULL,
    "gender" "LookGender" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "LookClusterStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "LookCluster_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LookClusterObservation" (
    "clusterId" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LookClusterObservation_pkey" PRIMARY KEY ("clusterId", "observationId")
);

CREATE TABLE "ReviewedLookTag" (
    "id" TEXT NOT NULL,
    "observationId" TEXT,
    "clusterId" TEXT,
    "dimension" "LookTagDimension" NOT NULL,
    "value" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewedLookTag_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReviewedLookTag_one_parent" CHECK (("observationId" IS NOT NULL) <> ("clusterId" IS NOT NULL))
);

CREATE INDEX "LookSourceAccount_active_platform_idx" ON "LookSourceAccount"("active", "platform");
CREATE UNIQUE INDEX "LookSourceAccount_platform_handle_key" ON "LookSourceAccount"("platform", "handle");
CREATE INDEX "LookObservation_reviewStatus_observedAt_idx" ON "LookObservation"("reviewStatus", "observedAt");
CREATE INDEX "LookObservation_sourceAccountId_observedAt_idx" ON "LookObservation"("sourceAccountId", "observedAt");
CREATE UNIQUE INDEX "LookObservation_platform_postIdentity_imageIndex_key" ON "LookObservation"("platform", "postIdentity", "imageIndex");
CREATE INDEX "LookCluster_status_gender_idx" ON "LookCluster"("status", "gender");
CREATE INDEX "LookClusterObservation_observationId_idx" ON "LookClusterObservation"("observationId");
CREATE INDEX "ReviewedLookTag_observationId_idx" ON "ReviewedLookTag"("observationId");
CREATE INDEX "ReviewedLookTag_clusterId_idx" ON "ReviewedLookTag"("clusterId");
CREATE UNIQUE INDEX "ReviewedLookTag_observationId_dimension_value_key" ON "ReviewedLookTag"("observationId", "dimension", "value");
CREATE UNIQUE INDEX "ReviewedLookTag_clusterId_dimension_value_key" ON "ReviewedLookTag"("clusterId", "dimension", "value");

ALTER TABLE "LookObservation" ADD CONSTRAINT "LookObservation_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "LookSourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LookClusterObservation" ADD CONSTRAINT "LookClusterObservation_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "LookCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LookClusterObservation" ADD CONSTRAINT "LookClusterObservation_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "LookObservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReviewedLookTag" ADD CONSTRAINT "ReviewedLookTag_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "LookObservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewedLookTag" ADD CONSTRAINT "ReviewedLookTag_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "LookCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
