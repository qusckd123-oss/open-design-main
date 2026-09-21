-- CreateTable
CREATE TABLE "WatchlistSnapshot" (
    "id" TEXT NOT NULL,
    "capturedAt" TIMESTAMPTZ(3) NOT NULL,
    "businessDate" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "dataMode" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "sourceEditorialPostCount" INTEGER NOT NULL,
    "sourceLatestPublishedAt" TIMESTAMPTZ(3),
    "triggeredBy" TEXT NOT NULL DEFAULT 'manual',
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistSnapshotItem" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "bundleKey" TEXT NOT NULL,
    "specificItem" TEXT NOT NULL,
    "signalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "directAttributes" TEXT NOT NULL,
    "evidenceStrength" TEXT NOT NULL,
    "bundleArticlePresence" INTEGER NOT NULL,
    "bundleSourceSpread" INTEGER NOT NULL,
    "independentEvidenceClusterCount" INTEGER NOT NULL,
    "publisherFamilySpread" INTEGER NOT NULL,
    "latestObservedAt" TIMESTAMPTZ(3),
    "observedFact" TEXT NOT NULL,
    "unknowns" TEXT NOT NULL,
    "planningQuestion" TEXT NOT NULL,
    "isPrimarySignal" BOOLEAN NOT NULL DEFAULT false,
    "directionStatus" TEXT NOT NULL DEFAULT 'NOT_COMPARABLE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistSnapshotItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WatchlistSnapshot_businessDate_idx" ON "WatchlistSnapshot"("businessDate");

-- CreateIndex
CREATE INDEX "WatchlistSnapshot_dataMode_idx" ON "WatchlistSnapshot"("dataMode");

-- CreateIndex
CREATE INDEX "WatchlistSnapshot_gender_idx" ON "WatchlistSnapshot"("gender");

-- CreateIndex
CREATE INDEX "WatchlistSnapshot_capturedAt_idx" ON "WatchlistSnapshot"("capturedAt");

-- CreateIndex
CREATE INDEX "WatchlistSnapshotItem_snapshotId_idx" ON "WatchlistSnapshotItem"("snapshotId");

-- CreateIndex
CREATE INDEX "WatchlistSnapshotItem_specificItem_idx" ON "WatchlistSnapshotItem"("specificItem");

-- CreateIndex
CREATE INDEX "WatchlistSnapshotItem_bundleKey_idx" ON "WatchlistSnapshotItem"("bundleKey");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistSnapshotItem_snapshotId_rank_key" ON "WatchlistSnapshotItem"("snapshotId", "rank");

-- AddForeignKey
ALTER TABLE "WatchlistSnapshotItem" ADD CONSTRAINT "WatchlistSnapshotItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "WatchlistSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

