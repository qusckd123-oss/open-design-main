-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'musinsa',
    "brand" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL,
    "gender" TEXT,
    "color" TEXT,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingSnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "price" INTEGER,
    "salePrice" INTEGER,
    "discountRate" INTEGER,
    "reviewCount" INTEGER,
    "likeCount" INTEGER,
    "isSoldOut" BOOLEAN NOT NULL DEFAULT false,
    "collectedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RankingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3),
    "status" TEXT NOT NULL,
    "productCount" INTEGER NOT NULL DEFAULT 0,
    "fetchedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionError" (
    "id" TEXT NOT NULL,
    "collectionRunId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "url" TEXT,
    "reason" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendKeyword" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "aliases" TEXT NOT NULL,
    "shoppingKeyword" TEXT,
    "naverShoppingCategory" TEXT,
    "specificItem" TEXT,
    "planningGender" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TrendKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordTrendSnapshot" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'ALL',
    "period" TIMESTAMPTZ(3) NOT NULL,
    "ratio" DOUBLE PRECISION NOT NULL,
    "dataMode" TEXT NOT NULL DEFAULT 'mock',
    "collectedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "KeywordTrendSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordShoppingAgeSnapshot" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'ALL',
    "period" TIMESTAMPTZ(3) NOT NULL,
    "ratio" DOUBLE PRECISION NOT NULL,
    "dataMode" TEXT NOT NULL DEFAULT 'mock',
    "collectedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "KeywordShoppingAgeSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTag" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "itemType" TEXT,
    "fit" TEXT,
    "mainColor" TEXT,
    "subColor" TEXT,
    "material" TEXT,
    "graphicType" TEXT,
    "detail" TEXT,
    "style" TEXT,
    "gender" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalProduct" (
    "id" TEXT NOT NULL,
    "externalProductId" TEXT,
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "season" TEXT,
    "gender" TEXT,
    "imageUrl" TEXT,
    "itemType" TEXT,
    "subItemType" TEXT,
    "fit" TEXT,
    "mainColor" TEXT,
    "subColor" TEXT,
    "material" TEXT,
    "graphicType" TEXT,
    "detail" TEXT,
    "style" TEXT,
    "dataMode" TEXT NOT NULL DEFAULT 'sample',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "InternalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesSnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "periodDate" TIMESTAMPTZ(3) NOT NULL,
    "salesQty" INTEGER,
    "salesAmount" INTEGER,
    "stockQty" INTEGER,
    "orderQty" INTEGER,
    "sellThroughRate" DOUBLE PRECISION,
    "discountRate" DOUBLE PRECISION,
    "normalSalesRate" DOUBLE PRECISION,
    "storeSalesQty" INTEGER,
    "onlineSalesQty" INTEGER,
    "dataMode" TEXT NOT NULL DEFAULT 'sample',
    "importRunId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketProduct" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalProductId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "url" TEXT,
    "imageUrl" TEXT,
    "itemType" TEXT,
    "subItemType" TEXT,
    "fit" TEXT,
    "mainColor" TEXT,
    "subColor" TEXT,
    "material" TEXT,
    "graphicType" TEXT,
    "detail" TEXT,
    "style" TEXT,
    "gender" TEXT,
    "dataMode" TEXT NOT NULL DEFAULT 'sample',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MarketProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketRankingSnapshot" (
    "id" TEXT NOT NULL,
    "marketProductId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "periodDate" TIMESTAMPTZ(3) NOT NULL,
    "rankingCategory" TEXT NOT NULL DEFAULT 'ALL',
    "observedCategory" TEXT NOT NULL DEFAULT 'ALL',
    "audienceSegment" TEXT NOT NULL DEFAULT 'ALL',
    "metricType" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "rankingVerified" BOOLEAN NOT NULL DEFAULT false,
    "rankingScope" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "sourcePosition" INTEGER,
    "rank" INTEGER,
    "price" INTEGER,
    "salePrice" INTEGER,
    "discountRate" INTEGER,
    "reviewCount" INTEGER,
    "likeCount" INTEGER,
    "dataMode" TEXT NOT NULL DEFAULT 'sample',
    "importRunId" TEXT,
    "rawData" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketRankingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialPost" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalPostId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "title" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "imageUrl" TEXT,
    "excerpt" TEXT,
    "text" TEXT,
    "audienceGender" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "fashionRelevance" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "dataMode" TEXT NOT NULL DEFAULT 'sample',
    "collectedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "EditorialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialMention" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "audienceGender" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "evidence" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorialMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fileName" TEXT,
    "rankingCategory" TEXT,
    "audienceSegment" TEXT,
    "dataMode" TEXT NOT NULL DEFAULT 'sample',
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3),
    "status" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "fetchedRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportError" (
    "id" TEXT NOT NULL,
    "importRunId" TEXT NOT NULL,
    "rowNumber" INTEGER,
    "field" TEXT,
    "reason" TEXT NOT NULL,
    "rawRow" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_externalId_key" ON "Product"("externalId");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_source_idx" ON "Product"("source");

-- CreateIndex
CREATE INDEX "RankingSnapshot_rank_idx" ON "RankingSnapshot"("rank");

-- CreateIndex
CREATE INDEX "RankingSnapshot_collectedAt_idx" ON "RankingSnapshot"("collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RankingSnapshot_productId_collectedAt_key" ON "RankingSnapshot"("productId", "collectedAt");

-- CreateIndex
CREATE INDEX "CollectionRun_source_idx" ON "CollectionRun"("source");

-- CreateIndex
CREATE INDEX "CollectionRun_startedAt_idx" ON "CollectionRun"("startedAt");

-- CreateIndex
CREATE INDEX "CollectionRun_status_idx" ON "CollectionRun"("status");

-- CreateIndex
CREATE INDEX "CollectionError_source_idx" ON "CollectionError"("source");

-- CreateIndex
CREATE INDEX "CollectionError_timestamp_idx" ON "CollectionError"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "TrendKeyword_name_key" ON "TrendKeyword"("name");

-- CreateIndex
CREATE INDEX "TrendKeyword_category_idx" ON "TrendKeyword"("category");

-- CreateIndex
CREATE INDEX "TrendKeyword_active_idx" ON "TrendKeyword"("active");

-- CreateIndex
CREATE INDEX "TrendKeyword_specificItem_idx" ON "TrendKeyword"("specificItem");

-- CreateIndex
CREATE INDEX "TrendKeyword_planningGender_idx" ON "TrendKeyword"("planningGender");

-- CreateIndex
CREATE INDEX "KeywordTrendSnapshot_source_idx" ON "KeywordTrendSnapshot"("source");

-- CreateIndex
CREATE INDEX "KeywordTrendSnapshot_ageGroup_idx" ON "KeywordTrendSnapshot"("ageGroup");

-- CreateIndex
CREATE INDEX "KeywordTrendSnapshot_period_idx" ON "KeywordTrendSnapshot"("period");

-- CreateIndex
CREATE INDEX "KeywordTrendSnapshot_collectedAt_idx" ON "KeywordTrendSnapshot"("collectedAt");

-- CreateIndex
CREATE INDEX "KeywordTrendSnapshot_dataMode_idx" ON "KeywordTrendSnapshot"("dataMode");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordTrendSnapshot_keywordId_source_ageGroup_gender_perio_key" ON "KeywordTrendSnapshot"("keywordId", "source", "ageGroup", "gender", "period");

-- CreateIndex
CREATE INDEX "KeywordShoppingAgeSnapshot_source_idx" ON "KeywordShoppingAgeSnapshot"("source");

-- CreateIndex
CREATE INDEX "KeywordShoppingAgeSnapshot_ageGroup_idx" ON "KeywordShoppingAgeSnapshot"("ageGroup");

-- CreateIndex
CREATE INDEX "KeywordShoppingAgeSnapshot_period_idx" ON "KeywordShoppingAgeSnapshot"("period");

-- CreateIndex
CREATE INDEX "KeywordShoppingAgeSnapshot_collectedAt_idx" ON "KeywordShoppingAgeSnapshot"("collectedAt");

-- CreateIndex
CREATE INDEX "KeywordShoppingAgeSnapshot_dataMode_idx" ON "KeywordShoppingAgeSnapshot"("dataMode");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordShoppingAgeSnapshot_keywordId_source_ageGroup_gender_key" ON "KeywordShoppingAgeSnapshot"("keywordId", "source", "ageGroup", "gender", "period");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTag_productId_key" ON "ProductTag"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalProduct_productCode_key" ON "InternalProduct"("productCode");

-- CreateIndex
CREATE INDEX "InternalProduct_brand_idx" ON "InternalProduct"("brand");

-- CreateIndex
CREATE INDEX "InternalProduct_category_idx" ON "InternalProduct"("category");

-- CreateIndex
CREATE INDEX "InternalProduct_itemType_idx" ON "InternalProduct"("itemType");

-- CreateIndex
CREATE INDEX "InternalProduct_subItemType_idx" ON "InternalProduct"("subItemType");

-- CreateIndex
CREATE INDEX "InternalProduct_dataMode_idx" ON "InternalProduct"("dataMode");

-- CreateIndex
CREATE INDEX "SalesSnapshot_periodDate_idx" ON "SalesSnapshot"("periodDate");

-- CreateIndex
CREATE INDEX "SalesSnapshot_dataMode_idx" ON "SalesSnapshot"("dataMode");

-- CreateIndex
CREATE UNIQUE INDEX "SalesSnapshot_productId_periodDate_key" ON "SalesSnapshot"("productId", "periodDate");

-- CreateIndex
CREATE INDEX "MarketProduct_source_idx" ON "MarketProduct"("source");

-- CreateIndex
CREATE INDEX "MarketProduct_category_idx" ON "MarketProduct"("category");

-- CreateIndex
CREATE INDEX "MarketProduct_itemType_idx" ON "MarketProduct"("itemType");

-- CreateIndex
CREATE INDEX "MarketProduct_subItemType_idx" ON "MarketProduct"("subItemType");

-- CreateIndex
CREATE INDEX "MarketProduct_dataMode_idx" ON "MarketProduct"("dataMode");

-- CreateIndex
CREATE UNIQUE INDEX "MarketProduct_source_externalProductId_key" ON "MarketProduct"("source", "externalProductId");

-- CreateIndex
CREATE INDEX "MarketRankingSnapshot_source_idx" ON "MarketRankingSnapshot"("source");

-- CreateIndex
CREATE INDEX "MarketRankingSnapshot_rankingCategory_idx" ON "MarketRankingSnapshot"("rankingCategory");

-- CreateIndex
CREATE INDEX "MarketRankingSnapshot_observedCategory_idx" ON "MarketRankingSnapshot"("observedCategory");

-- CreateIndex
CREATE INDEX "MarketRankingSnapshot_audienceSegment_idx" ON "MarketRankingSnapshot"("audienceSegment");

-- CreateIndex
CREATE INDEX "MarketRankingSnapshot_metricType_idx" ON "MarketRankingSnapshot"("metricType");

-- CreateIndex
CREATE INDEX "MarketRankingSnapshot_rankingVerified_idx" ON "MarketRankingSnapshot"("rankingVerified");

-- CreateIndex
CREATE INDEX "MarketRankingSnapshot_rankingScope_idx" ON "MarketRankingSnapshot"("rankingScope");

-- CreateIndex
CREATE INDEX "MarketRankingSnapshot_rank_idx" ON "MarketRankingSnapshot"("rank");

-- CreateIndex
CREATE INDEX "MarketRankingSnapshot_sourcePosition_idx" ON "MarketRankingSnapshot"("sourcePosition");

-- CreateIndex
CREATE INDEX "MarketRankingSnapshot_periodDate_idx" ON "MarketRankingSnapshot"("periodDate");

-- CreateIndex
CREATE INDEX "MarketRankingSnapshot_dataMode_idx" ON "MarketRankingSnapshot"("dataMode");

-- CreateIndex
CREATE UNIQUE INDEX "MarketRankingSnapshot_marketProductId_source_periodDate_ran_key" ON "MarketRankingSnapshot"("marketProductId", "source", "periodDate", "rankingScope", "rankingCategory", "observedCategory", "audienceSegment");

-- CreateIndex
CREATE INDEX "EditorialPost_source_idx" ON "EditorialPost"("source");

-- CreateIndex
CREATE INDEX "EditorialPost_publishedAt_idx" ON "EditorialPost"("publishedAt");

-- CreateIndex
CREATE INDEX "EditorialPost_audienceGender_idx" ON "EditorialPost"("audienceGender");

-- CreateIndex
CREATE INDEX "EditorialPost_fashionRelevance_idx" ON "EditorialPost"("fashionRelevance");

-- CreateIndex
CREATE INDEX "EditorialPost_dataMode_idx" ON "EditorialPost"("dataMode");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialPost_source_externalPostId_key" ON "EditorialPost"("source", "externalPostId");

-- CreateIndex
CREATE INDEX "EditorialMention_type_idx" ON "EditorialMention"("type");

-- CreateIndex
CREATE INDEX "EditorialMention_value_idx" ON "EditorialMention"("value");

-- CreateIndex
CREATE INDEX "EditorialMention_audienceGender_idx" ON "EditorialMention"("audienceGender");

-- CreateIndex
CREATE INDEX "EditorialMention_confidence_idx" ON "EditorialMention"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialMention_postId_type_value_key" ON "EditorialMention"("postId", "type", "value");

-- CreateIndex
CREATE INDEX "ImportRun_type_idx" ON "ImportRun"("type");

-- CreateIndex
CREATE INDEX "ImportRun_source_idx" ON "ImportRun"("source");

-- CreateIndex
CREATE INDEX "ImportRun_rankingCategory_idx" ON "ImportRun"("rankingCategory");

-- CreateIndex
CREATE INDEX "ImportRun_status_idx" ON "ImportRun"("status");

-- CreateIndex
CREATE INDEX "ImportRun_startedAt_idx" ON "ImportRun"("startedAt");

-- CreateIndex
CREATE INDEX "ImportRun_dataMode_idx" ON "ImportRun"("dataMode");

-- CreateIndex
CREATE INDEX "ImportError_importRunId_idx" ON "ImportError"("importRunId");

-- CreateIndex
CREATE INDEX "ImportError_createdAt_idx" ON "ImportError"("createdAt");

-- AddForeignKey
ALTER TABLE "RankingSnapshot" ADD CONSTRAINT "RankingSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionError" ADD CONSTRAINT "CollectionError_collectionRunId_fkey" FOREIGN KEY ("collectionRunId") REFERENCES "CollectionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordTrendSnapshot" ADD CONSTRAINT "KeywordTrendSnapshot_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "TrendKeyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordShoppingAgeSnapshot" ADD CONSTRAINT "KeywordShoppingAgeSnapshot_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "TrendKeyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesSnapshot" ADD CONSTRAINT "SalesSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InternalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketRankingSnapshot" ADD CONSTRAINT "MarketRankingSnapshot_marketProductId_fkey" FOREIGN KEY ("marketProductId") REFERENCES "MarketProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialMention" ADD CONSTRAINT "EditorialMention_postId_fkey" FOREIGN KEY ("postId") REFERENCES "EditorialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportError" ADD CONSTRAINT "ImportError_importRunId_fkey" FOREIGN KEY ("importRunId") REFERENCES "ImportRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

