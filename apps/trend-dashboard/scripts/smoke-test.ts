import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { assortmentCollectorSources, createMarketCollector, verifiedRankingCollectorSources } from "../src/collectors/market/index";
import { classifyMarketAttributes, validateSubItemForCategory } from "../src/collectors/market/classification";
import { inferEditorialGender } from "../src/collectors/editorial/gender";
import { editorialRules, extractEditorialMentions } from "../src/collectors/editorial/mentions";
import { extractDirectAttributeRelations } from "../src/collectors/editorial/attribute-relations";
import { bundleEvidenceStrength, countIndependentEvidenceClusters, getAttributeBundles, getPrimaryBundleForItem, getSpecificItemDirectAttributes, selectBundleHeroImage, selectPrimaryPlanningBundle } from "../src/services/attribute-bundle-service";
import { contentBlocksFromStoredText, resolveEvidenceImage, type ContentBlock } from "../src/collectors/editorial/image-relation";
import { attributeBarWidthPercent } from "../src/lib/attribute-visual";
import { selectEditorialVisualContext } from "../src/lib/editorial-visual-context";
import { composeBundleName } from "../src/lib/korean-labels";
import { classifyFashionRelevance, EditorialRateLimitedError, getHypebeastFashionEntries, parseArticlePage, parseEsquireKrArticlePage, parseEsquireKrBody, parseEsquireKrSitemap, parseEyesmagRichBody, parseGenericSitemap, parseHarpersBazaarKrArticlePage, parseHarpersBazaarKrBody, parseHarpersBazaarKrSitemap, parseHypebeastListing, parseHypebeastRichBody, parseNewsSitemap, parseRssItems, parseSitemapIndex, parseVislaRichBody } from "../src/collectors/editorial/rss";
import { extractProductNameColorRelations, findDescriptionCandidates } from "../src/collectors/product-reference/attributes";
import { extractProductObjectRelations, resolveSpecificItem } from "../src/collectors/product-reference/object-relations";
import { frozenEditorialRules } from "../src/collectors/product-reference/frozen-editorial-vocabulary";
import { editorialSourceConfigs } from "../src/config/editorial-sources";
import { aggregateEditorialMentions, auditUnmatchedFashionPhrases, getSpecificItemEditorialDetail, partitionCoOccurrence } from "../src/services/editorial-analytics-service";
import { classifyDomesticTrendDemandInsight, classifyPlanningInsight, getPlanningDashboardData, matchesPlanningGender, planningItemKey } from "../src/services/planning-dashboard-service";
import { getDemandSignalRows, getNaverCredentialStatus } from "../src/services/demand-signal-service";
import { fashionKeywordSeeds } from "../src/collectors/naver/keywords";
import { categoryOfItemType, categoryOfSpecificItem, isKnownSpecificItem, matchesCategoryFilter } from "../src/config/taxonomy";
import { matchesGenderFilterValue } from "../src/lib/planning-filters";
import { evidenceStrengthLabel, hasVerifiedMarketEvidence } from "../src/lib/market-ui";
import { extractEndHits, inferRankingCategory, normalizeEndHit, verifyBestsellerSemantic } from "../src/collectors/market/end";
import { normalizeShopifyProduct } from "../src/collectors/market/normalize";
import { extractRakutenRankingItems, inferRakutenRankingCategory, normalizeRakutenRankingItem, parseRakutenItemDetails, verifyRakutenRankingSemantic } from "../src/collectors/market/rakuten-fashion";
import { parseRobotsAllowed as parseMarketRobotsAllowed } from "../src/collectors/market/robots";
import { MusinsaMockAdapter } from "../src/collectors/musinsa";
import { normalizeMusinsaProduct, parseRobotsAllowed } from "../src/collectors/musinsa-real";
import { NaverSearchTrendRealAdapter } from "../src/collectors/naver/search-trend";
import { NaverShoppingInsightRealAdapter } from "../src/collectors/naver/shopping-insight-keyword-age";
import type { CollectionResult, CollectorAdapter } from "../src/collectors/types";
import { featureFlags } from "../src/config/feature-flags";
import { suggestColumnMapping } from "../src/config/import-mapping";
import { prisma } from "../src/db/client";
import { combinedTrendSignal, percentChange, targetAgeSignal } from "../src/lib/search-trend-signals";
import { classifyTrend, rankChange } from "../src/lib/trend-signals";
import { applyMarketPresenceStatuses, classifyAssortmentItemSignal, classifyItemSignal, classifyMarketSignal, classifySalesSignal, getBusinessDashboardData, getItemTrendRows, getMarketRows, getSourceFreshness, rankChangeByDays, signalConfidence, toMarketRow } from "../src/services/business-analytics-service";
import { persistCollectionResult } from "../src/services/collection-service";
import { parseImportFile, parsePastedTable } from "../src/services/import-file-service";
import { canonicalizeUrl, importRows } from "../src/services/import-service";
import { persistMarketCollectionResult } from "../src/services/market-collection-service";
import { getSearchTrendRows } from "../src/services/search-trend-service";

async function main() {
  await verifyLegacyRanking();
  await verifyNaverHelpers();
  await verifyImportMappingAndParsing();
  await verifySalesImportUpsert();
  await verifyMarketImportUpsert();
  await verifyEndBestsellerCollectorHelpers();
  await verifyRakutenFashionCollectorHelpers();
  verifyEditorialHelpers();
  verifyEditorialBodyParsers();
  await verifyHypebeastFashionListingPartialReturn();
  await verifySpecificItemEditorialCoOccurrence();
  verifyLegacyMarketBlockVisibility();
  verifyDirectAttributeRelations();
  verifyProductReferenceAttributes();
  verifyProductReferenceTaxonomy();
  verifyMultiBrandPortability();
  verifyEditorialProductReferenceScopeIsolation();
  verifyColorAdjacencyGate();
  verifyItemLanguageAliases();
  verifyEvidenceImageResolution();
  verifyAttributeBarWidth();
  verifyEditorialVisualContextSelection();
  verifyIndependentEvidenceClusterCount();
  await verifyAttributeBundles();
  verifyPlanningDashboardHelpers();
  verifyDomesticFirstTaxonomy();
  verifyEvidenceStrengthLabels();
  await verifyDomesticFirstFiltering();
  await verifyDemandSignalHelpers();
  await verifyRealMarketCollectorHelpers();
  await verifyMarketCollectionPartialPersistence();
  verifyBusinessSignals();

  const dashboard = await getBusinessDashboardData();
  const sampleMarket = await getMarketRows({ dataMode: "sample" });
  const defaultMarket = await getMarketRows();
  const items = await getItemTrendRows();
  assert.ok(sampleMarket.rows.length >= 200, "Expected expanded sample market products.");
  assert.equal(defaultMarket.dataMode, dashboard.summary.dataMode, "Dashboard must use the preferred market dataset.");
  assert.ok(items.length > 0, "Expected item trend rows.");
  assert.ok((await prisma.marketRankingSnapshot.count({ where: { dataMode: "real" } })) >= 472, "Ranking scope migration must preserve existing REAL snapshots while allowing later real collections.");
  assert.ok(dashboard.summary.verifiedRankingSources >= 2, "Expected END and Rakuten Fashion verified ranking sources.");
  assert.equal(dashboard.summary.assortmentSources, 2, "SLAM_JAM/STUSSY assortment sources must remain separate from verified ranking.");
  assert.ok(defaultMarket.rows.some((row) => row.source === "END" && row.rankingVerified && row.rankingScope === "DEPARTMENT" && row.rankingCategory === "CLOTHING" && row.observedCategory != null), "END rows must preserve DEPARTMENT/CLOTHING scope and observed category.");
  assert.ok(defaultMarket.rows.some((row) => row.source === "RAKUTEN_FASHION" && row.rankingVerified && row.metricType === "RANKING" && row.rankingScope === "SITEWIDE" && row.rankingCategory === "ALL_FASHION" && row.rank != null), "Rakuten verified ranking rows must retain SITEWIDE rank.");
  assert.ok(defaultMarket.rows.some((row) => row.source === "STUSSY" && !row.rankingVerified && row.metricType === "COLLECTION_ORDER" && row.rank == null), "Collection-order rows must not become ranking rows.");
  assert.ok(items.some((row) => row.top10Presence >= 0 && row.top20Presence >= row.top10Presence && row.top50Presence >= row.top20Presence), "Item rows must expose TOP10/TOP20/TOP50 verified ranking presence.");
  assert.ok(dashboard.summary.signalConfidence === "BASELINE" || dashboard.summary.signalConfidence === "EARLY_DATA" || dashboard.summary.signalConfidence === "ACTIVE_SIGNAL", "Verified ranking signal confidence must be derived from collected snapshot dates.");
  assert.deepEqual(verifiedRankingCollectorSources().sort(), ["END", "RAKUTEN_FASHION"].sort(), "Verified-only collection must include only END and Rakuten Fashion.");
  assert.deepEqual(assortmentCollectorSources().sort(), ["SLAM_JAM", "STUSSY"].sort(), "Assortment collection must include only Shopify assortment sources.");
  const verifiedFreshness = await getSourceFreshness("real", true);
  assert.ok(verifiedFreshness.some((row) => row.source === "END"));
  assert.ok(verifiedFreshness.some((row) => row.source === "RAKUTEN_FASHION"));
  assert.ok(!verifiedFreshness.some((row) => row.source === "SLAM_JAM" || row.source === "STUSSY"), "Verified freshness must exclude assortment sources.");
  assert.equal(featureFlags.enableNaverTrends, false, "NAVER trends should be disabled by default.");

  console.log(
    `Smoke test passed: marketAnalysisRows=${dashboard.summary.marketProducts}, mode=${dashboard.summary.dataMode}, sources=${dashboard.summary.sources}, items=${items.length}, naver=${featureFlags.enableNaverTrends ? "enabled" : "disabled"}.`
  );
}

function verifyEditorialVisualContextSelection() {
  const fixtures = [
    { imageUrl: "https://cdn.example.com/image.jpg?width=800", url: "https://example.com/article-1", id: "first" },
    { imageUrl: "https://cdn.example.com/image.jpg?width=1200", url: "https://example.com/article-2", id: "duplicate-transform" },
    { imageUrl: "https://cdn.example.com/second.jpg", url: "https://example.com/article-3", id: "second" },
    { imageUrl: null, url: "https://example.com/article-4", id: "no-image" },
    { imageUrl: "https://cdn.example.com/third.jpg", url: "", id: "no-article-link" },
    { imageUrl: "https://cdn.example.com/fourth.jpg", url: "https://example.com/article-5", id: "fourth" },
    { imageUrl: "https://cdn.example.com/fifth.jpg", url: "https://example.com/article-6", id: "fifth" },
    { imageUrl: "https://cdn.example.com/sixth.jpg", url: "https://example.com/article-7", id: "sixth" },
    { imageUrl: "https://cdn.example.com/seventh.jpg", url: "https://example.com/article-8", id: "seventh" },
    { imageUrl: "https://cdn.example.com/eighth.jpg", url: "https://example.com/article-9", id: "eighth" },
  ];

  assert.deepEqual(
    selectEditorialVisualContext(fixtures).map((article) => article.id),
    ["first", "second", "fourth", "fifth", "sixth", "seventh"],
    "Editorial visual context must preserve evidence order, require article links, and deduplicate transformed image URLs."
  );
  assert.equal(selectEditorialVisualContext(fixtures, 1).length, 1, "Editorial visual context must respect its display limit.");
  assert.equal(selectEditorialVisualContext(fixtures, 0).length, 0, "Editorial visual context must allow an explicitly empty display.");
  assert.equal(selectEditorialVisualContext(fixtures, 99).length, 6, "Editorial visual context must cap selection at six without duplicating images.");
}

async function verifyLegacyRanking() {
  const productCount = await prisma.product.count();
  const snapshotCount = await prisma.rankingSnapshot.count();
  assert.ok(productCount >= 50, `Expected at least 50 legacy products, got ${productCount}.`);
  assert.ok(snapshotCount >= productCount * 14, `Expected 14 ranking snapshots per product, got ${snapshotCount}.`);
  assert.equal(rankChange(11, 37), 26, "37 -> 11 must be +26.");
  assert.equal(rankChange(37, 11), -26, "11 -> 37 must be -26.");
  assert.equal(classifyTrend([{ rank: 11, collectedAt: new Date("2026-08-27T09:00:00+09:00") }]), "INSUFFICIENT_DATA");
  assert.equal(
    classifyTrend([
      { rank: 11, collectedAt: new Date("2026-08-27T09:00:00+09:00") },
      { rank: 130, collectedAt: new Date("2026-08-26T09:00:00+09:00") }
    ]),
    "NEW_ENTRY"
  );

  const mockAdapter: CollectorAdapter = new MusinsaMockAdapter();
  const mockResult = await mockAdapter.collect({ limit: 2 });
  assertAdapterResult(mockResult);
  assert.equal(mockResult.items.length, 2, "Mock adapter must honor limit.");

  const normalized = normalizeMusinsaProduct(
    {
      externalId: "musinsa-test-real-001",
      brand: "TEST BRAND",
      name: "Graphic T-Shirt",
      url: "/app/goods/1",
      rank: 7
    },
    1,
    new Date("2026-08-27T09:00:00+09:00")
  );
  assert.ok(normalized.category, "Musinsa normalization must provide a category.");
  assert.equal(parseRobotsAllowed("User-agent: *\nDisallow: /", "TrendSignalDashboard/0.1", "/main/musinsa/ranking"), false);
  assert.equal(parseRobotsAllowed("User-agent: TestBot\nAllow: /\nUser-agent: *\nDisallow: /", "TestBot", "/main"), true);
  await verifyRankingPersistenceBehavior();
}

async function verifyNaverHelpers() {
  const keywordCount = await prisma.trendKeyword.count();
  const keywordSnapshotCount = await prisma.keywordTrendSnapshot.count();
  const shoppingSnapshotCount = await prisma.keywordShoppingAgeSnapshot.count();
  assert.equal(keywordCount, 25, "Expected 25 seeded fashion keywords.");
  assert.ok(keywordSnapshotCount >= 25 * 12 * 3, "Expected search trend snapshots.");
  assert.ok(shoppingSnapshotCount >= 25 * 12 * 2, "Expected shopping age snapshots.");
  assert.equal(percentChange(68, 41)?.toFixed(1), "65.9", "68 vs 41 should be +65.9%.");
  assert.equal(combinedTrendSignal({ maxSearchChange1w: 18, maxSearchChange4w: 42, maxShoppingRatio: 71 }), "HOT");
  assert.equal(targetAgeSignal({ teenSearchChange4w: 34, twentiesSearchChange4w: 9, teenShoppingRatio: 66, twentiesShoppingRatio: 32 }), "TEEN");

  const searchRows = await getSearchTrendRows();
  assert.ok(
    searchRows.every((row) => row.strongestMomentumAge == null || row.searchMomentumByAge[row.strongestMomentumAge].change4w != null),
    "Strongest search age must be based on 4W momentum, not current ratio comparison."
  );

  const originalKeyId = process.env.NAVER_API_KEY_ID;
  const originalKey = process.env.NAVER_API_KEY;
  const originalHubId = process.env.NAVER_API_HUB_CLIENT_ID;
  const originalHubSecret = process.env.NAVER_API_HUB_CLIENT_SECRET;
  delete process.env.NAVER_API_KEY_ID;
  delete process.env.NAVER_API_KEY;
  delete process.env.NAVER_API_HUB_CLIENT_ID;
  delete process.env.NAVER_API_HUB_CLIENT_SECRET;
  const missingSearchKeyResult = await new NaverSearchTrendRealAdapter().collect({ limit: 1 });
  const missingShoppingKeyResult = await new NaverShoppingInsightRealAdapter().collect({ limit: 1 });
  restoreEnv("NAVER_API_KEY_ID", originalKeyId);
  restoreEnv("NAVER_API_KEY", originalKey);
  restoreEnv("NAVER_API_HUB_CLIENT_ID", originalHubId);
  restoreEnv("NAVER_API_HUB_CLIENT_SECRET", originalHubSecret);
  assert.equal(missingSearchKeyResult.failures.length, 1, "Real NAVER Search adapter should fail clearly without keys.");
  assert.equal(missingShoppingKeyResult.failures.length, 1, "Real Shopping Insight adapter should fail clearly without keys.");
}

async function verifyImportMappingAndParsing() {
  const salesMapping = suggestColumnMapping("SALES", ["품번", "품명", "판매수량", "매출", "재고", "판매율", "기준일"]);
  assert.equal(salesMapping.productCode, "품번");
  assert.equal(salesMapping.salesQty, "판매수량");
  assert.equal(salesMapping.periodDate, "기준일");

  const marketMapping = suggestColumnMapping("MARKET", ["플랫폼", "상품URL", "브랜드", "상품명", "순위", "날짜", "랭킹카테고리"]);
  assert.equal(marketMapping.source, "플랫폼");
  assert.equal(marketMapping.url, "상품URL");
  assert.equal(marketMapping.rank, "순위");
  assert.equal(marketMapping.rankingCategory, "랭킹카테고리");

  const csv = "품번,품명,기준일,판매수량\nODT001,Test Tee,2026-08-23,10\n";
  const parsedCsv = await parseImportFile("sales.csv", new TextEncoder().encode(csv).buffer);
  assert.equal(parsedCsv.rows[0]?.["품번"], "ODT001");

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["품번", "품명", "기준일", "판매수량"], ["ODT002", "Test Hoodie", "2026-08-23", 12]]), "Sheet1");
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const parsedXlsx = await parseImportFile("sales.xlsx", buffer);
  assert.equal(parsedXlsx.rows[0]?.["품번"], "ODT002");

  const pasted = parsePastedTable("rank\tbrand\tproductName\turl\n1\tNike\tProduct A\thttps://example.com/a?utm=1\n");
  assert.equal(pasted.rows[0]?.rank, "1");
  assert.equal(canonicalizeUrl("https://example.com/a/?utm_source=x#top"), "https://example.com/a");
}

async function verifySalesImportUpsert() {
  const productCode = "TEST-SALES-UPsert";
  await prisma.salesSnapshot.deleteMany({ where: { product: { productCode } } });
  await prisma.internalProduct.deleteMany({ where: { productCode } });

  const rows = [
    { productCode, productName: "Test Ringer Tee", periodDate: "2026-08-16", salesQty: "37", stockQty: "100", sellThroughRate: "40", itemType: "T_SHIRT" },
    { productCode, productName: "Test Ringer Tee", periodDate: "2026-08-23", salesQty: "74", stockQty: "48", sellThroughRate: "72", itemType: "T_SHIRT" }
  ];
  const mapping = Object.fromEntries(Object.keys(rows[0]!).map((key) => [key, key]));
  await importRows({ type: "SALES", source: "TEST", fileName: "sales-test.csv", dataMode: "import", rows, mapping });
  await importRows({ type: "SALES", source: "TEST", fileName: "sales-test.csv", dataMode: "import", rows, mapping });
  const products = await prisma.internalProduct.findMany({ where: { productCode }, include: { salesSnapshots: true } });
  assert.equal(products.length, 1, "Same sales productCode must upsert into one InternalProduct.");
  assert.equal(products[0]?.salesSnapshots.length, 2, "SalesSnapshot must not duplicate on repeated import.");
  await prisma.salesSnapshot.deleteMany({ where: { product: { productCode } } });
  await prisma.internalProduct.deleteMany({ where: { productCode } });
  await prisma.importRun.deleteMany({ where: { source: "TEST" } });
}

async function verifyMarketImportUpsert() {
  const externalProductId = "TEST-MARKET-UPsert";
  await prisma.marketRankingSnapshot.deleteMany({ where: { marketProduct: { externalProductId } } });
  await prisma.marketProduct.deleteMany({ where: { externalProductId } });
  const rows = [
    { source: "TEST_MARKET", externalProductId, productName: "Market Ringer Tee", brand: "TEST", periodDate: "2026-08-16", rank: "67", itemType: "T_SHIRT", rankingCategory: "SHORT_SLEEVE_TSHIRT" },
    { source: "TEST_MARKET", externalProductId, productName: "Market Ringer Tee", brand: "TEST", periodDate: "2026-08-23", rank: "21", itemType: "T_SHIRT", rankingCategory: "SHORT_SLEEVE_TSHIRT" }
  ];
  const mapping = Object.fromEntries(Object.keys(rows[0]!).map((key) => [key, key]));
  await importRows({ type: "MARKET", source: "TEST_MARKET", fileName: "market-test.csv", dataMode: "import", rows, mapping });
  await importRows({ type: "MARKET", source: "TEST_MARKET", fileName: "market-test.csv", dataMode: "import", rows, mapping });
  const products = await prisma.marketProduct.findMany({ where: { externalProductId }, include: { rankingSnapshots: true } });
  assert.equal(products.length, 1, "Same source/externalProductId must upsert into one MarketProduct.");
  assert.equal(products[0]?.rankingSnapshots.length, 2, "MarketRankingSnapshot must not duplicate on repeated import.");
  assert.equal(products[0]?.rankingSnapshots[0]?.rankingCategory, "SHORT_SLEEVE_TSHIRT");
  assert.equal(classifyMarketSignal({ rank: 21, change1w: 46, change2w: 46, change4w: 46, isNewEntry: false }), "FAST_RISING");
  await prisma.marketRankingSnapshot.deleteMany({ where: { marketProduct: { externalProductId } } });
  await prisma.marketProduct.deleteMany({ where: { externalProductId } });
  await prisma.importRun.deleteMany({ where: { source: "TEST_MARKET" } });
}

async function verifyRealMarketCollectorHelpers() {
  const normalized = normalizeShopifyProduct({
    raw: {
      id: 123,
      title: "Vintage Ringer T-Shirt Black",
      handle: "vintage-ringer-t-shirt-black",
      vendor: "TEST BRAND",
      product_type: "T-Shirt",
      tags: ["ringer", "black"],
      images: [{ src: "https://cdn.example.com/a.jpg" }],
      variants: [{ price: "39.00", compare_at_price: "49.00" }]
    },
    source: "SLAM_JAM",
    baseUrl: "https://www.slamjam.com",
    rank: 7,
    rankingCategory: "SHORT_SLEEVE_TSHIRT",
    periodDate: new Date("2026-08-28T00:00:00.000Z"),
    audienceSegment: "ALL",
    metricType: "COLLECTION_ORDER",
    rankingVerified: false,
    rankingScope: "CATEGORY",
    sourcePosition: 7
  });
  assert.equal(normalized.subItemType, "RINGER_TEE", "Shopify fixture should normalize obvious ringer tee.");
  assert.equal(normalized.rankingCategory, "SHORT_SLEEVE_TSHIRT");
  assert.equal(normalized.observedCategory, "SHORT_SLEEVE_TSHIRT");
  assert.equal(normalized.metricType, "COLLECTION_ORDER");
  assert.equal(normalized.rank, null, "Shopify collection order must not be treated as verified rank.");
  assert.equal(normalized.sourcePosition, 7);
  assert.equal(parseMarketRobotsAllowed("User-agent: *\nDisallow: /collections/*sort_by*", "TrendSignalDashboard/0.1", "/collections/tees/products.json"), true);
  assert.equal(parseMarketRobotsAllowed("User-agent: *\nDisallow: /", "TrendSignalDashboard/0.1", "/ranking"), false);

  const unsupported = await createMarketCollector("MUSINSA").collect({ category: "SHORT_SLEEVE_TSHIRT", limit: 1 });
  assert.equal(unsupported.status, "UNSUPPORTED", "Restricted/non-registered sources should not be collected through fallback scraping.");
  const restricted = await createMarketCollector("SSENSE").collect({ category: "SHORT_SLEEVE_TSHIRT", limit: 1 });
  assert.equal(restricted.status, "UNSUPPORTED", "Restricted source should not be saved as verified ranking data.");
  assert.equal(classifyMarketSignal({ rank: 1, change1w: null, change2w: null, change4w: null, isNewEntry: false }), "INSUFFICIENT_DATA");
}

async function verifyEndBestsellerCollectorHelpers() {
  const html = endFixtureHtml();
  verifyBestsellerSemantic(html);
  const hits = extractEndHits(html);
  assert.equal(hits.length, 3);
  assert.equal(inferRankingCategory(hits[0]!), "SHORT_SLEEVE_TSHIRT");
  assert.equal(inferRankingCategory(hits[1]!), "JACKET");
  assert.equal(inferRankingCategory(hits[2]!), "PANTS");
  const product = normalizeEndHit({
    hit: hits[0]!,
    rank: 1,
    category: "SHORT_SLEEVE_TSHIRT",
    periodDate: new Date("2026-09-01T00:00:00.000Z"),
    audienceSegment: "ALL"
  });
  assert.equal(product.source, "END");
  assert.equal(product.metricType, "BEST_SELLER");
  assert.equal(product.rankingVerified, true);
  assert.equal(product.rankingScope, "DEPARTMENT");
  assert.equal(product.rank, 1);
  assert.equal(product.sourcePosition, 1);
  assert.equal(product.rankingCategory, "CLOTHING");
  assert.equal(product.observedCategory, "SHORT_SLEEVE_TSHIRT");

  const externalProductId = "END-FIXTURE-DEDUP";
  await prisma.marketRankingSnapshot.deleteMany({ where: { marketProduct: { externalProductId } } });
  await prisma.marketProduct.deleteMany({ where: { externalProductId } });
  await prisma.importRun.deleteMany({ where: { source: "END", fileName: "collector:TEST_PUBLIC_BESTSELLER_PAGE" } });
  const periodDate = new Date("2026-09-01T00:00:00.000Z");
  const collectedProduct = { ...product, externalProductId, periodDate };
  await persistMarketCollectionResult({
    source: "END",
    category: "SHORT_SLEEVE_TSHIRT",
    audienceSegment: "ALL",
    collectedAt: new Date("2026-09-01T09:00:00.000Z"),
    status: "SUCCESS",
    method: "TEST_PUBLIC_BESTSELLER_PAGE",
    fetchedCount: 1,
    products: [collectedProduct],
    errors: []
  });
  await persistMarketCollectionResult({
    source: "END",
    category: "SHORT_SLEEVE_TSHIRT",
    audienceSegment: "ALL",
    collectedAt: new Date("2026-09-01T10:00:00.000Z"),
    status: "SUCCESS",
    method: "TEST_PUBLIC_BESTSELLER_PAGE",
    fetchedCount: 1,
    products: [{ ...collectedProduct, rank: 2, sourcePosition: 2 }],
    errors: []
  });
  const saved = await prisma.marketProduct.findUnique({ where: { source_externalProductId: { source: "END", externalProductId } }, include: { rankingSnapshots: true } });
  assert.equal(saved?.rankingSnapshots.length, 1, "END duplicate snapshot should upsert by product/source/date/category/audience.");
  assert.equal(saved?.rankingSnapshots[0]?.metricType, "BEST_SELLER");
  assert.equal(saved?.rankingSnapshots[0]?.rankingVerified, true);
  assert.equal(saved?.rankingSnapshots[0]?.rank, 2);
  const firstSnapshotRow = toMarketRow({
    id: "end-first-snapshot",
    source: "END",
    externalProductId,
    brand: "MKI",
    name: "MKI Presented by END. Swallow T-Shirt",
    category: "SHORT_SLEEVE_TSHIRT",
    url: "https://www.endclothing.com/us/example.html",
    imageUrl: null,
    itemType: "T_SHIRT",
    subItemType: "OTHER",
    fit: null,
    mainColor: null,
    subColor: null,
    material: null,
    graphicType: null,
    detail: null,
    style: null,
    gender: null,
    dataMode: "real",
    createdAt: periodDate,
    rankingSnapshots: [{ periodDate, rankingScope: "DEPARTMENT", rankingCategory: "CLOTHING", observedCategory: "SHORT_SLEEVE_TSHIRT", audienceSegment: "ALL", metricType: "BEST_SELLER", rankingVerified: true, sourcePosition: 1, rank: 1, price: 49, salePrice: 49, discountRate: null, reviewCount: null, likeCount: null }]
  });
  assert.equal(firstSnapshotRow.rank, 1);
  assert.equal(firstSnapshotRow.signal, "INSUFFICIENT_DATA", "First END ranking snapshot should not create movement signal.");
  await prisma.marketRankingSnapshot.deleteMany({ where: { marketProduct: { externalProductId } } });
  await prisma.marketProduct.deleteMany({ where: { externalProductId } });
  await prisma.importRun.deleteMany({ where: { source: "END", fileName: "collector:TEST_PUBLIC_BESTSELLER_PAGE" } });
}

async function verifyRakutenFashionCollectorHelpers() {
  const rankingHtml = rakutenRankingFixtureHtml();
  verifyRakutenRankingSemantic(rankingHtml);
  const items = extractRakutenRankingItems(rankingHtml);
  assert.equal(items.length, 3);
  assert.equal(items[0]?.rank, 1, "Rakuten fixture should parse public ranking position.");
  assert.equal(items[0]?.url, "https://brandavenue.rakuten.co.jp/item/SS3089/");

  const details = parseRakutenItemDetails(rakutenItemFixtureHtml());
  assert.equal(details.name, "<ユニセックス>別注 配色 パイピング ボア ブルゾン 限定展開");
  assert.equal(details.brand, "FREAK’S STORE");
  assert.equal(inferRakutenRankingCategory(details, items[0]), "JACKET");
  assert.equal(inferRakutenRankingCategory({ name: "LACOSTE ピケ クルーネック ロンT 26AW", brand: "LACOSTE", breadcrumb: ["トップス", "Tシャツ"], imageUrl: null, price: 13200, salePrice: null, gender: "UNISEX" }, items[1]), "LONG_SLEEVE_TSHIRT");
  assert.equal(inferRakutenRankingCategory({ name: "ロゴ 半袖 Tシャツ", brand: "SHIPS", breadcrumb: ["トップス", "Tシャツ"], imageUrl: null, price: 4840, salePrice: null, gender: "UNISEX" }, items[1]), "SHORT_SLEEVE_TSHIRT");
  const coachBag = classifyMarketAttributes({ observedCategory: "BAG", text: "COACH OUTLET ローアン バケット バッグ シグネチャー キャンバス" });
  assert.equal(coachBag.itemType, "BAG", "BAG observed category must remain bag item type.");
  assert.equal(coachBag.subItemType, "OTHER", "COACH brand text must not become COACH_JACKET inside BAG.");
  assert.equal(validateSubItemForCategory("HEADWEAR", "COACH_JACKET", "COACH cap"), "BALL_CAP", "HEADWEAR must not allow apparel jacket subtypes.");
  const longSleeveClassification = classifyMarketAttributes({ observedCategory: "SHORT_SLEEVE_TSHIRT", text: "LACOSTE ピケ クルーネック ロンT 26AW" });
  assert.equal(longSleeveClassification.observedCategory, "LONG_SLEEVE_TSHIRT", "Long sleeve keywords must override ambiguous tee category.");

  const product = normalizeRakutenRankingItem({
    item: items[0]!,
    details,
    category: "JACKET",
    periodDate: new Date("2026-09-01T00:00:00.000Z"),
    audienceSegment: "ALL"
  });
  assert.equal(product.source, "RAKUTEN_FASHION");
  assert.equal(product.metricType, "RANKING");
  assert.equal(product.rankingVerified, true);
  assert.equal(product.rankingScope, "SITEWIDE");
  assert.equal(product.rank, 1);
  assert.equal(product.sourcePosition, 1);
  assert.equal(product.rankingCategory, "ALL_FASHION");
  assert.equal(product.observedCategory, "JACKET");
  assert.equal(product.audienceSegment, "ALL");

  const externalProductId = "RAKUTEN-FIXTURE-DEDUP";
  await prisma.marketRankingSnapshot.deleteMany({ where: { marketProduct: { externalProductId } } });
  await prisma.marketProduct.deleteMany({ where: { externalProductId } });
  await prisma.importRun.deleteMany({ where: { source: "RAKUTEN_FASHION", fileName: "collector:TEST_PUBLIC_RANKING_PAGE" } });
  const periodDate = new Date("2026-09-01T00:00:00.000Z");
  const collectedProduct = { ...product, externalProductId, periodDate };
  await persistMarketCollectionResult({
    source: "RAKUTEN_FASHION",
    category: "JACKET",
    audienceSegment: "ALL",
    collectedAt: new Date("2026-09-01T09:00:00.000Z"),
    status: "SUCCESS",
    method: "TEST_PUBLIC_RANKING_PAGE",
    fetchedCount: 1,
    products: [collectedProduct],
    errors: []
  });
  await persistMarketCollectionResult({
    source: "RAKUTEN_FASHION",
    category: "JACKET",
    audienceSegment: "ALL",
    collectedAt: new Date("2026-09-01T10:00:00.000Z"),
    status: "SUCCESS",
    method: "TEST_PUBLIC_RANKING_PAGE",
    fetchedCount: 1,
    products: [{ ...collectedProduct, rank: 3, sourcePosition: 3 }],
    errors: []
  });
  const saved = await prisma.marketProduct.findUnique({ where: { source_externalProductId: { source: "RAKUTEN_FASHION", externalProductId } }, include: { rankingSnapshots: true } });
  assert.equal(saved?.rankingSnapshots.length, 1, "Rakuten duplicate snapshot should upsert by product/source/date/category/audience.");
  assert.equal(saved?.rankingSnapshots[0]?.metricType, "RANKING");
  assert.equal(saved?.rankingSnapshots[0]?.rankingVerified, true);
  assert.equal(saved?.rankingSnapshots[0]?.rank, 3);
  const firstSnapshotRow = toMarketRow({
    id: "rakuten-first-snapshot",
    source: "RAKUTEN_FASHION",
    externalProductId,
    brand: "FREAK’S STORE",
    name: "<ユニセックス>別注 配色 パイピング ボア ブルゾン 限定展開",
    category: "JACKET",
    url: "https://brandavenue.rakuten.co.jp/item/SS3089/",
    imageUrl: null,
    itemType: "JACKET",
    subItemType: "OTHER",
    fit: null,
    mainColor: null,
    subColor: null,
    material: null,
    graphicType: null,
    detail: null,
    style: null,
    gender: "UNISEX",
    dataMode: "real",
    createdAt: periodDate,
    rankingSnapshots: [{ periodDate, rankingScope: "SITEWIDE", rankingCategory: "ALL_FASHION", observedCategory: "JACKET", audienceSegment: "ALL", metricType: "RANKING", rankingVerified: true, sourcePosition: 1, rank: 1, price: 11990, salePrice: 11990, discountRate: null, reviewCount: null, likeCount: null }]
  });
  assert.equal(firstSnapshotRow.signal, "INSUFFICIENT_DATA", "First Rakuten ranking snapshot should not create movement signal.");

  await prisma.marketRankingSnapshot.deleteMany({ where: { marketProduct: { externalProductId } } });
  await prisma.marketProduct.deleteMany({ where: { externalProductId } });
  await prisma.importRun.deleteMany({ where: { source: "RAKUTEN_FASHION", fileName: "collector:TEST_PUBLIC_RANKING_PAGE" } });
}

function verifyEditorialHelpers() {
  assert.equal(editorialSourceConfigs.VISLA.signalType, "EDITORIAL", "VISLA must be configured as editorial signal.");
  assert.equal(editorialSourceConfigs.HYPEBEAST_KR.collectionMethod, "PUBLIC_RSS_FEED", "Hypebeast Korea must use public RSS feed.");
  assert.equal(editorialSourceConfigs.EYESMAG.collectionMethod, "PUBLIC_NEWS_SITEMAP", "EYESMAG must use public news sitemap.");
  assert.equal(editorialSourceConfigs.NONLABEL.collectionMethod, "PUBLIC_HTML_LISTING", "NONLABEL must use public HTML listing.");
  assert.equal(inferEditorialGender({ title: "women's fashion week bag trend", text: "" }), "WOMEN", "Official women/title signal should classify WOMEN.");
  assert.equal(inferEditorialGender({ title: "men's tailoring trend", text: "" }), "MEN", "MEN content must remain MEN.");
  assert.notEqual(inferEditorialGender({ title: "men's tailoring trend", text: "" }), "UNISEX", "MEN must not be auto-converted to UNI.");
  assert.equal(inferEditorialGender({ title: "genderless unisex bag", text: "" }), "UNISEX", "Explicit unisex text should classify UNISEX.");
  assert.equal(inferEditorialGender({ title: "women and men fashion week recap", text: "" }), "MIXED", "Explicit women and men title should classify MIXED.");
  assert.equal(inferEditorialGender({ title: "seasonal objects", text: "women styling and men's styling are both shown" }), "MIXED", "Mixed body content should classify MIXED.");
  assert.equal(inferEditorialGender({ title: "new exhibition opens", text: "gallery installation" }), "UNKNOWN", "Unclear editorial content should remain UNKNOWN.");

  const mentions = extractEditorialMentions({ title: "Body bag and track jacket trend", text: "Nylon body bag, piping detail, Nike and Stone Island styling." });
  assert.ok(mentions.some((mention) => mention.type === "ITEM" && mention.value === "BAG"), "Editorial mention extraction should detect ITEM.");
  assert.ok(mentions.some((mention) => mention.type === "SUB_ITEM" && mention.value === "BODY_BAG"), "Editorial mention extraction should detect SUB_ITEM.");
  assert.ok(mentions.some((mention) => mention.type === "DETAIL" && mention.value === "PIPING"), "Editorial mention extraction should detect DETAIL.");
  assert.ok(mentions.some((mention) => mention.type === "MATERIAL" && mention.value === "NYLON"), "Editorial mention extraction should detect MATERIAL.");
  assert.ok(mentions.some((mention) => mention.type === "BRAND" && mention.value === "NIKE"), "Editorial mention extraction should detect BRAND.");
  assert.ok(mentions.some((mention) => mention.value === "BAG" && mention.audienceGender === "UNKNOWN"), "BAG with no gender evidence must remain UNKNOWN.");
  assert.ok(mentions.some((mention) => mention.value === "BODY_BAG" && mention.audienceGender === "UNKNOWN"), "Specific bag mentions with no gender evidence must remain UNKNOWN.");
  assert.ok(extractEditorialMentions({ title: "Headwear styling", text: "A cap anchors the look." }).some((mention) => mention.value === "HEADWEAR" && mention.audienceGender === "UNKNOWN"), "HEADWEAR with no gender evidence must remain UNKNOWN.");
  assert.ok(extractEditorialMentions({ title: "Backpack styling", text: "A backpack anchors the look." }).some((mention) => mention.value === "BACKPACK" && mention.audienceGender === "UNKNOWN"), "BACKPACK with no gender evidence must remain UNKNOWN.");
  assert.ok(extractEditorialMentions({ title: "Track jacket styling", text: "A track jacket anchors the look." }).some((mention) => mention.value === "TRACK_JACKET" && mention.audienceGender === "UNKNOWN"), "TRACK_JACKET with no gender evidence must remain UNKNOWN.");
  assert.ok(extractEditorialMentions({ title: "Tote bag styling", text: "A tote bag anchors the look." }).some((mention) => mention.value === "TOTE_BAG" && mention.audienceGender === "UNKNOWN"), "TOTE_BAG with no gender evidence must remain UNKNOWN.");
  assert.ok(extractEditorialMentions({ title: "Women's backpack styling", text: "A backpack anchors the women styling." }).some((mention) => mention.value === "BACKPACK" && mention.audienceGender === "WOMEN"), "Explicit WOMEN context must classify mention-level gender as WOMEN.");
  assert.ok(extractEditorialMentions({ title: "Unisex track jacket styling", text: "A unisex track jacket anchors the look." }).some((mention) => mention.value === "TRACK_JACKET" && mention.audienceGender === "UNISEX"), "Explicit UNISEX context must classify mention-level gender as UNISEX.");
  assert.ok(extractEditorialMentions({ title: "Men's tote bag styling", text: "A tote bag anchors the men's styling." }).some((mention) => mention.value === "TOTE_BAG" && mention.audienceGender === "MEN"), "Explicit MEN context must classify mention-level gender as MEN.");
  assert.ok(extractEditorialMentions({ title: "Tote bag styling", text: "A tote bag anchors the look.", postGender: "MIXED" }).some((mention) => mention.value === "TOTE_BAG" && mention.audienceGender === "MIXED"), "Explicit post-level MIXED context must be preserved.");
  assert.ok(!extractEditorialMentions({ title: "Men's tote bag styling", text: "A tote bag anchors the men's styling." }).some((mention) => mention.value === "TOTE_BAG" && mention.audienceGender === "UNISEX"), "MEN mention-level evidence must not be converted to UNISEX.");
  assert.equal(extractEditorialMentions({ title: "Coach campaign", text: "COACH opened a new store." }).some((mention) => mention.value === "COACH_JACKET"), false, "COACH brand text must not become coach jacket.");
  assert.equal(extractEditorialMentions({ title: "Music track release", text: "The new track is out." }).some((mention) => mention.value === "TRACK_JACKET"), false, "Music track context must not become track jacket.");
  assert.ok(extractEditorialMentions({ title: "Long sleeve tee styling", text: "A long sleeve tee leads the look." }).some((mention) => mention.type === "ITEM" && mention.value === "T_SHIRT"), "Long sleeve tee should remain an editorial item mention.");

  const rss = `<?xml version="1.0"?><rss><channel><item><title><![CDATA[Body bag trend]]></title><link>https://example.com/post/1?utm=1</link><guid>post-1</guid><pubDate>Wed, 02 Sep 2026 01:00:00 +0000</pubDate><description><![CDATA[Body bag and denim.]]></description></item></channel></rss>`;
  const parsed = parseRssItems(rss);
  assert.equal(parsed.length, 1, "Editorial RSS parser should parse item rows.");
  assert.equal(parsed[0]?.guid, "post-1", "Editorial duplicate detection should have a stable external post id.");
  assert.equal(parsed[0]?.title, "Body bag trend", "Editorial RSS parser should decode CDATA title.");
  const eyesSitemap = `<urlset><url><loc>https://eyesmag.com/posts/1/fashion</loc><news:news><news:publication_date>2026-09-02T00:00:00.000Z</news:publication_date><news:title>Denim campaign</news:title></news:news></url></urlset>`;
  assert.equal(parseNewsSitemap(eyesSitemap)[0]?.url, "https://eyesmag.com/posts/1/fashion", "EYESMAG news sitemap parser should extract canonical URL.");
  const sitemapIndex = `<sitemapindex><sitemap><loc>https://cdn.eyesmag.com/sitemap/sitemap-posts-2026-09.xml.gz</loc></sitemap></sitemapindex>`;
  assert.equal(parseSitemapIndex(sitemapIndex)[0], "https://cdn.eyesmag.com/sitemap/sitemap-posts-2026-09.xml.gz", "EYESMAG sitemap index parser should extract monthly sitemap URLs.");
  const genericSitemap = `<urlset><url><loc>https://eyesmag.com/posts/2</loc><lastmod>2026-09-01T00:00:00.000Z</lastmod></url></urlset>`;
  assert.equal(parseGenericSitemap(genericSitemap)[0]?.publishedAt, "2026-09-01T00:00:00.000Z", "Historical sitemap parser should preserve lastmod for exact window metrics.");
  const nonlabelArticle = `<html><head><meta property="og:title" content="thisisneverthat WEATHER GEAR : archive"><meta property="article:published_time" content="2026-09-02T12:49:24+09:00"><meta property="og:url" content="https://nonlabel.co.kr/archive/?idx=1&amp;bmode=view"><meta property="og:image" content="https://cdn.example/image.png"><meta name="description" content="Outdoor fleece collection"></head></html>`;
  const article = parseArticlePage(nonlabelArticle, "https://nonlabel.co.kr/archive/?idx=1&bmode=view");
  assert.equal(article.title, "thisisneverthat WEATHER GEAR : archive", "NONLABEL parser should extract title.");
  assert.equal(article.imageUrl, "https://cdn.example/image.png", "NONLABEL parser should extract thumbnail.");
  assert.equal(classifyFashionRelevance({ sourceCategory: "fashion", title: "Music news", text: "", mentionCount: 0 }), "FASHION_RELEVANT", "Official fashion category should mark posts as fashion relevant.");
  assert.equal(classifyFashionRelevance({ title: "Movie trailer", text: "A new movie opens.", mentionCount: 0 }), "NON_FASHION", "Non-fashion editorial should not enter trend metrics.");

  const aggregate = aggregateEditorialMentions([
    { type: "ITEM", value: "BAG", audienceGender: "UNISEX", confidence: 0.95, post: { source: "EYESMAG", title: "Bag now", url: "https://example.com/1", publishedAt: new Date("2026-09-02T00:00:00.000Z"), imageUrl: "https://example.com/bag-hero.jpg" } },
    { type: "ITEM", value: "BAG", audienceGender: "WOMEN", confidence: 0.75, post: { source: "NONLABEL", title: "Bag earlier", url: "https://example.com/2", publishedAt: new Date("2026-08-27T00:00:00.000Z") } },
    { type: "ITEM", value: "JACKET", audienceGender: "MEN", confidence: 0.75, post: { source: "HYPEBEAST_KR", title: "Jacket", url: "https://example.com/3", publishedAt: new Date("2026-09-02T00:00:00.000Z") } }
  ], { EYESMAG: 10, NONLABEL: 5, HYPEBEAST_KR: 20 });
  const bag = aggregate.find((row) => row.value === "BAG");
  assert.equal(bag?.sourceSpread, 2, "Editorial source spread should count distinct sources.");
  assert.equal(bag?.genderSplit.UNISEX, 1, "Editorial gender split should retain UNI mention count.");
  assert.equal(bag?.genderSplit.WOMEN, 1, "Editorial gender split should retain WOMEN mention count.");
  assert.equal(bag?.mentionRateBySource.EYESMAG, 0.1, "Editorial mention rate should normalize by source post count.");
  assert.equal(bag?.articlePresence, 2, "Editorial trends should prioritize distinct article presence.");
  assert.equal(bag?.sourceArticleRate.EYESMAG, 0.1, "Editorial source article rate should normalize distinct article presence.");
  assert.equal(bag?.current7d, 2, "Current 7D window should use actual publishedAt dates.");
  assert.equal(bag?.previous7d, 0, "Previous 7D window should remain zero instead of becoming an infinite percentage.");
  assert.equal(bag?.change7d, 2, "7D absolute change should be calculable when previous window is zero.");
  assert.equal(bag?.current7dArticlePresence, 2, "7D momentum should be available as article presence.");
  assert.equal(bag?.observation, "NEWLY_OBSERVED", "Previous zero and current positive article presence should be newly observed.");
  assert.equal(bag?.sourceContext, "MULTI_SOURCE", "Cross-source editorial trend context should be explicit.");
  assert.equal(bag?.evidenceArticles.length, 2, "Editorial trend rows should retain evidence articles.");
  assert.equal(bag?.evidenceArticles[0]?.imageUrl, "https://example.com/bag-hero.jpg", "Evidence articles must carry the post image (newest article first) for article-card thumbnails.");
  assert.equal(bag?.evidenceArticles[1]?.imageUrl, null, "A post with no image must report imageUrl null, never a fabricated fallback.");
  const sourceBuzz = aggregateEditorialMentions([
    { type: "ITEM", value: "CAP", audienceGender: "UNKNOWN", confidence: 0.75, post: { source: "HYPEBEAST_KR", title: "Cap 1", url: "https://example.com/cap-1", publishedAt: new Date("2026-09-02T00:00:00.000Z") } },
    { type: "ITEM", value: "CAP", audienceGender: "UNKNOWN", confidence: 0.75, post: { source: "HYPEBEAST_KR", title: "Cap 2", url: "https://example.com/cap-2", publishedAt: new Date("2026-09-02T00:00:00.000Z") } }
  ]);
  assert.equal(sourceBuzz[0]?.sourceContext, "SINGLE_SOURCE", "Single-source buzz should not be marked as cross-editorial.");
  const unmatched = auditUnmatchedFashionPhrases([
    { source: "NONLABEL", title: "Layered styling", text: "Layered styling and football jersey.", mentions: [] },
    { source: "EYESMAG", title: "Football jersey", text: "A football jersey collaboration.", mentions: [] }
  ]);
  assert.equal(unmatched.find((row) => row.suggestedNormalizedValue === "FOOTBALL_JERSEY")?.articles, 2, "Unmatched phrase audit should count distinct articles.");
}

function verifyEditorialBodyParsers() {
  // EYESMAG: the page's own __NEXT_DATA__ hydration script (sent to every
  // browser, not a private endpoint) embeds the full post as a TipTap JSON
  // document under props.pageProps.initialPost.content. parseArticlePage's
  // meta-description-based `text` is a ~15-char tagline on this source;
  // parseEyesmagRichBody must recover the real body instead.
  const eyesmagDoc = {
    type: "doc",
    content: [
      { type: "slider", attrs: { images: [{ url: "https://cdn.eyesmag.com/a.jpg" }] } },
      { type: "paragraph", content: [{ type: "text", text: "완벽한 핏 하나로 완성되는 자신감" }] },
      { type: "paragraph", content: [{ type: "text", text: "캘빈클라인이 세이디 싱크와 함께한 26 가을 데님 캠페인을 공개했다." }] },
      { type: "embed", attrs: { url: "https://instagram.com/p/xyz" } }
    ]
  };
  const eyesmagHtml = `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: { pageProps: { initialPost: { content: JSON.stringify(eyesmagDoc) } } }
  })}</script></body></html>`;
  const eyesmagBody = parseEyesmagRichBody(eyesmagHtml);
  assert.ok(eyesmagBody, "EYESMAG rich body must be extracted from __NEXT_DATA__.");
  assert.ok(eyesmagBody!.includes("캘빈클라인이 세이디 싱크와 함께한"), "EYESMAG rich body must contain the real paragraph text.");
  assert.ok(eyesmagBody!.length > 20, "EYESMAG rich body must be longer than a bare meta-description tagline.");
  assert.equal(parseEyesmagRichBody("<html><body>no next data here</body></html>"), null, "Missing __NEXT_DATA__ must return null, not throw or fabricate text.");
  assert.equal(
    parseEyesmagRichBody(`<script id="__NEXT_DATA__">${JSON.stringify({ props: { pageProps: { initialPost: { content: "not json" } } } })}</script>`),
    null,
    "A non-JSON content field must return null rather than crash the collector."
  );

  // VISLA: full body is plain public HTML inside <div class="entry-content">.
  // The region must be cut at the first tag-list/byline/share marker so
  // hashtag lists, the "VISLA Magazine" byline block, the share widget, and
  // any further-down "related articles" teaser section are all excluded -
  // while a real product line containing a brand/material phrase survives.
  const vislaHtml = `<html><body>
    <div class="entry-content visla-single-content">
      <p>DJ 현희의 맥시멀리스트 개러지를 소개한다.</p>
      <p>Vintage Stüssy Jacket(XL) / ₩80,000 나일론 소재의 빈티지 스투시 재킷, 가슴팍의 커다란 로고가 포인트.</p>
      <p># HYUNHXEE # visla department store # VISLA GARAGE</p>
      <p>VISLA Magazine visla.kr https://www.instagram.com/vislamag</p>
      <p>SHARE THIS ARTICLE</p>
    </div>
    <div class="related-articles"><p>ARTICLE 다른 기사 제목 - 이 텍스트는 절대 포함되면 안 됨</p></div>
  </body></html>`;
  const vislaBody = parseVislaRichBody(vislaHtml);
  assert.ok(vislaBody, "VISLA rich body must be extracted from entry-content.");
  assert.ok(vislaBody!.includes("나일론 소재의 빈티지 스투시 재킷"), "VISLA rich body must preserve real product/material text.");
  assert.equal(vislaBody!.includes("HYUNHXEE"), false, "VISLA rich body must exclude the trailing hashtag/tag-list block.");
  assert.equal(vislaBody!.includes("VISLA Magazine"), false, "VISLA rich body must exclude the publisher byline/social block.");
  assert.equal(vislaBody!.includes("SHARE THIS"), false, "VISLA rich body must exclude the share widget text.");
  assert.equal(vislaBody!.includes("다른 기사 제목"), false, "VISLA rich body must exclude a related-articles teaser section beyond the cut point.");
  assert.equal(parseVislaRichBody("<html><body>no entry-content here</body></html>"), null, "Missing entry-content must return null, not fabricate text.");

  // HYPEBEAST_KR: the public article page has no JSON-LD articleBody, but the
  // body is plain public HTML in <div class="post-body-content">. Needed
  // because the RSS feed only exposes the newest items, so historical
  // collection has to read article pages instead.
  const hypebeastHtml = `<html><body>
    <div class="post-body-content">
      <p>요약 BÉIS와 KidSuper는 9피스 트래블 캡슐 컬렉션을 위해 협업을 진행하였다.</p>
      <p>크로커다일 엠보싱을 더한 Carrousel 백과 나일론 소재의 트랙 재킷이 포함된다.</p>
      <div class="post-body-content-tags"><a href="#">KidSuper</a><a href="#">BEIS</a></div>
    </div>
    <section class="related-posts"><p>다른 기사 제목 - 절대 포함되면 안 됨</p></section>
  </body></html>`;
  const hypebeastBody = parseHypebeastRichBody(hypebeastHtml);
  assert.ok(hypebeastBody, "HYPEBEAST_KR body must be extracted from post-body-content.");
  assert.ok(hypebeastBody!.includes("트래블 캡슐 컬렉션"), "HYPEBEAST_KR body must keep the real article prose.");
  assert.ok(hypebeastBody!.includes("나일론 소재의 트랙 재킷"), "HYPEBEAST_KR body must keep product/material phrasing - the whole point of the source.");
  assert.equal(hypebeastBody!.includes("KidSuper</a>"), false, "HYPEBEAST_KR body must not keep raw markup.");
  assert.equal(hypebeastBody!.includes("다른 기사 제목"), false, "HYPEBEAST_KR body must stop before the related-articles section.");
  assert.equal(parseHypebeastRichBody("<html><body>no post body here</body></html>"), null, "Missing post-body-content must return null, not fabricate text.");

  // REGRESSION: a weekly roundup ("이번 주 …8가지 드롭") carries eight products
  // across ~650,000 characters of markup. An earlier fixed 120,000-char slice
  // silently truncated the body and dropped a real "Zantan 토트백" product
  // sentence sitting far past that offset - which is exactly how the
  // 재활용 원단 토트백 bundle lost one of its two articles. The cut must be
  // driven by the trailing-chrome marker, never by a fixed offset.
  const longFiller = "<p>필러 문단입니다. 컬렉션 소개가 이어진다.</p>".repeat(8000);
  const roundupHtml = `<html><body><div class="post-body-content">${longFiller}<p>아카이브 원단을 재활용해 만든 Zantan 토트백을 선보인다.</p><div class="post-body-content-tags"><a href="#">tag</a></div></div></body></html>`;
  assert.ok(roundupHtml.length > 200000, "Fixture must exceed the old 120,000-char cap to be a meaningful regression test.");
  const roundupBody = parseHypebeastRichBody(roundupHtml);
  assert.ok(roundupBody, "A very long roundup must still parse.");
  assert.ok(roundupBody!.includes("재활용해 만든 Zantan 토트백"), "Product evidence far past the old fixed cap must survive - this is the bug that cost 재활용 원단 토트백 an article.");
  assert.equal(roundupBody!.includes("tag"), false, "The tag-list chrome must still be cut.");

  // HYPEBEAST_KR fashion listing: the route is what makes collection
  // fashion-scoped instead of pulling gaming/music/film out of the
  // all-section sitemap. Each post box publishes a machine-readable category
  // class; only the newest few also publish <time datetime=...>, so an entry
  // WITHOUT a listing date must still be returned (requiring one silently
  // limited discovery to a single day and 5 articles).
  const listingHtml = `<html><body>
    <div class="post-box"><div class="post-box-content-container">
      <div class="post-box-content-categories-title"><a href="https://hypebeast.kr/fashion" class="category fashion-category" title="패션">패션</a></div>
      <div class="post-box-content-title"><a href="https://hypebeast.kr/2026/9/dated-fashion-article" class="title"><h2>제목</h2></a></div>
      <span class="time"><time class="timeago" datetime="2026-09-06T14:26:23Z">10 Hrs ago</time></span>
    </div></div>
    <div class="post-box"><div class="post-box-content-container">
      <div class="post-box-content-categories-title"><a href="https://hypebeast.kr/fashion" class="category fashion-category" title="패션">패션</a></div>
      <div class="post-box-content-title"><a href="https://hypebeast.kr/2026/9/undated-fashion-article" class="title"><h2>제목</h2></a></div>
      <span class="time">2 Days ago</span>
    </div></div>
    <div class="post-box"><div class="post-box-content-container">
      <div class="post-box-content-categories-title"><a href="https://hypebeast.kr/footwear" class="category footwear-category" title="신발">신발</a></div>
      <div class="post-box-content-title"><a href="https://hypebeast.kr/2026/9/a-footwear-article" class="title"><h2>제목</h2></a></div>
      <span class="time"><time class="timeago" datetime="2026-09-05T10:00:00Z">1 Day ago</time></span>
    </div></div>
  </body></html>`;
  const listing = parseHypebeastListing(listingHtml);
  assert.equal(listing.length, 3, "Every post box must be parsed, including ones the listing renders without a datetime.");
  assert.deepEqual(
    listing.map((entry) => entry.category),
    ["fashion", "fashion", "footwear"],
    "The machine-readable category class must be read per post box - it is what scopes collection to fashion."
  );
  assert.equal(listing[0]?.url, "https://hypebeast.kr/2026/9/dated-fashion-article");
  assert.equal(listing[0]?.publishedAt, "2026-09-06T14:26:23Z", "A dated box must expose its ISO datetime for window filtering.");
  assert.equal(listing[1]?.publishedAt, "", "An undated box must still be returned, with an empty date, not dropped.");
  assert.equal(listing[1]?.url, "https://hypebeast.kr/2026/9/undated-fashion-article");
  assert.ok(
    listing.some((entry) => entry.category !== "fashion"),
    "The parser must surface non-fashion categories too, so the caller can exclude them explicitly."
  );
  assert.equal(parseHypebeastListing("<html><body>nothing here</body></html>").length, 0, "A page with no post boxes must yield no entries.");

  // A refusal must be its own error type so a collection can stop on the first
  // one instead of grinding through hundreds of blocked requests.
  assert.ok(new EditorialRateLimitedError("x") instanceof Error, "Rate-limit refusal must be a distinguishable Error type.");

  // Fixed trailing site chrome (machine-translation disclaimer, newsletter CTA)
  // must be cut, without touching preceding article prose.
  const chromeHtml = `<html><body><div class="post-body-content"><p>나일론 소재의 트랙 재킷이 포함된다.</p><p>이 문서는 영어에서 자동으로 번역되었습니다.</p><p>뉴스레터를 구독해 최신 뉴스를 놓치지 마세요 구독하기</p></div></body></html>`;
  const chromeBody = parseHypebeastRichBody(chromeHtml);
  assert.ok(chromeBody!.includes("나일론 소재의 트랙 재킷"), "Real prose before the chrome must be kept.");
  assert.equal(chromeBody!.includes("구독하기"), false, "Newsletter CTA chrome must be cut from the body.");

  // HYPEBEAST_KR encodes Korean titles as hex numeric entities; without numeric
  // entity decoding the stored title would be unreadable AND unmatchable by the
  // phrase rules.
  const entityArticle = parseArticlePage(
    `<html><head><meta property="og:title" content="&#xBC84;&#xD37C;, &#x2018;&#xB9AC;&#xC9C0;&#xBAAC;&#xD2B8;&#x2019;"><meta property="og:url" content="https://hypebeast.kr/2026/9/x"><meta name="description" content="&#48260;&#54140; &#53468;&#49472;"></head></html>`,
    "https://hypebeast.kr/2026/9/x"
  );
  assert.equal(entityArticle.title, "버퍼, ‘리지몬트’", "Hex numeric entities in a title must decode to real Korean text.");
  assert.ok(entityArticle.text.includes("버퍼"), "Decimal numeric entities must decode too.");

  // ESQUIRE_KR sitemap: a single flat file mixing dated /article/<id> entries
  // with static section pages (no /article/ path, no lastmod at all). Only
  // the article entries carry real content, so static pages must never be
  // returned as if they were articles.
  const esquireSitemapXml = `<?xml version="1.0" encoding="UTF-8"?><urlset>
    <url><loc>https://www.esquirekorea.co.kr/article/12345</loc><lastmod>2026-09-01T10:00:00+09:00</lastmod></url>
    <url><loc>https://www.esquirekorea.co.kr/article/9999</loc><lastmod>2021-11-02T10:00:00+09:00</lastmod></url>
    <url><loc>https://www.esquirekorea.co.kr/fashion</loc></url>
  </urlset>`;
  const esquireSitemap = parseEsquireKrSitemap(esquireSitemapXml);
  assert.equal(esquireSitemap.length, 2, "Only /article/<id> entries must be returned; the static /fashion page must be excluded.");
  assert.equal(esquireSitemap[0]?.url, "https://www.esquirekorea.co.kr/article/12345");
  assert.equal(esquireSitemap[0]?.lastmod, "2026-09-01T10:00:00+09:00", "lastmod must be exposed for the caller's own window filtering.");
  assert.equal(esquireSitemap[1]?.url, "https://www.esquirekorea.co.kr/article/9999", "An old entry is still parsed here - date-window filtering is the caller's job, not the parser's.");
  assert.equal(parseEsquireKrSitemap("<urlset></urlset>").length, 0, "An empty sitemap must yield no entries.");

  // ESQUIRE_KR body: plain public HTML inside class="atc_body_cont", cut at
  // the first of two trailing markers, with a leading "로그인" UI banner
  // stripped from the front (confirmed by sampling to be chrome shown
  // regardless of login state, not an actual paywall gate).
  const esquireHtml = `<html><body>
    <div class="atc_body_cont">전체 페이지를 읽으시려면 회원가입 및 로그인을 해주세요! LOGIN <p>@ald1.official 스포티한 트랙 재킷과 레드 볼캡을 매치했다.</p>
    <p>관련기사</p><p>다른 기사 제목 - 절대 포함되면 안 됨</p></div>
  </body></html>`;
  const esquireBody = parseEsquireKrBody(esquireHtml);
  assert.ok(esquireBody, "ESQUIRE_KR body must be extracted from atc_body_cont.");
  assert.ok(esquireBody!.includes("스포티한 트랙 재킷"), "ESQUIRE_KR body must keep the real product/style phrasing - the whole point of the source.");
  assert.equal(esquireBody!.startsWith("전체 페이지를"), false, "The leading login-banner chrome must be stripped from the front.");
  assert.equal(esquireBody!.includes("LOGIN"), false, "The login-banner chrome must not survive into the stored body.");
  assert.equal(esquireBody!.includes("다른 기사 제목"), false, "ESQUIRE_KR body must stop before the related-articles marker.");
  assert.equal(parseEsquireKrBody("<html><body>no atc body here</body></html>"), null, "Missing atc_body_cont must return null, not fabricate text.");

  const esquireKeywordHtml = `<html><body><div class="atc_body_cont">실제 기사 본문입니다.<p>이 기사엔 이런 키워드</p><p>태그1 태그2</p></div></body></html>`;
  assert.equal(parseEsquireKrBody(esquireKeywordHtml), "실제 기사 본문입니다.", "The keyword-tag-list marker must also cut the body, not only the related-articles marker.");

  // ESQUIRE_KR article page: canonical/date/image come from public <link
  // rel="canonical">, JSON-LD datePublished, and og:image - no login required.
  const esquireArticleHtml = `<html><head>
    <meta property="og:title" content="ALD와 나이키의 새로운 협업">
    <meta property="og:image" content="https://www.esquirekorea.co.kr/hero.jpg">
    <link rel="canonical" href="https://www.esquirekorea.co.kr/article/12345">
    <script type="application/ld+json">{"datePublished":"2026-09-01T10:00:00+09:00"}</script>
  </head></html>`;
  const esquireArticle = parseEsquireKrArticlePage(esquireArticleHtml, "https://www.esquirekorea.co.kr/article/12345?utm_source=x");
  assert.equal(esquireArticle.title, "ALD와 나이키의 새로운 협업");
  assert.equal(esquireArticle.canonicalUrl, "https://www.esquirekorea.co.kr/article/12345", "The public <link rel=canonical> must win over the fetched (possibly tracking-tagged) URL.");
  assert.equal(esquireArticle.imageUrl, "https://www.esquirekorea.co.kr/hero.jpg");
  assert.equal(esquireArticle.publishedAt?.toISOString(), new Date("2026-09-01T10:00:00+09:00").toISOString(), "JSON-LD datePublished must be parsed.");

  const esquireArticleFallback = parseEsquireKrArticlePage(
    `<html><head><meta property="article:published_time" content="2026-08-15T00:00:00+09:00"></head></html>`,
    "https://www.esquirekorea.co.kr/article/999"
  );
  assert.equal(esquireArticleFallback.canonicalUrl, "https://www.esquirekorea.co.kr/article/999", "Without a canonical link, the fetched URL must be used as a fallback.");
  assert.equal(
    esquireArticleFallback.publishedAt?.toISOString(),
    new Date("2026-08-15T00:00:00+09:00").toISOString(),
    "Without JSON-LD, the article:published_time meta tag must be used as a fallback date source."
  );

  // HARPERSBAZAAR_KR sitemap: same shape as ESQUIRE_KR (a whole-site flat
  // file mixing dated /article/<id> entries with static category pages), but
  // this platform's category pages are touched daily (lastmod always
  // "today"), which a real 2026-09-09 probe found would otherwise dominate a
  // naive "most recent" sort - only /article/<id> entries must survive.
  const hbSitemapXml = `<?xml version="1.0" encoding="UTF-8"?><urlset>
    <url><loc>https://www.harpersbazaar.co.kr/article/1909328</loc><lastmod>2026-09-08</lastmod></url>
    <url><loc>https://www.harpersbazaar.co.kr/article/64093</loc><lastmod>2022-02-23</lastmod></url>
    <url><loc>https://www.harpersbazaar.co.kr/fashion/news</loc><lastmod>2026-09-09</lastmod></url>
  </urlset>`;
  const hbSitemap = parseHarpersBazaarKrSitemap(hbSitemapXml);
  assert.equal(hbSitemap.length, 2, "Only /article/<id> entries must be returned; the daily-touched static /fashion/news page must be excluded.");
  assert.equal(hbSitemap[0]?.url, "https://www.harpersbazaar.co.kr/article/1909328");
  assert.equal(parseHarpersBazaarKrSitemap("<urlset></urlset>").length, 0, "An empty sitemap must yield no entries.");

  // HARPERSBAZAAR_KR body: same atc_body_cont container as ESQUIRE_KR, but a
  // real 2026-09-09 probe found this platform ALSO embeds a site-wide
  // "related reading" recirculation widget ("이 기사도 흥미로우실 거예요!") inside
  // the same container, repeating OTHER articles' headlines verbatim on
  // every page - an early probe pass that didn't cut at this marker produced
  // 2 false-positive relations from the exact same recirculated headline
  // appearing on two unrelated real articles. This must be cut, not kept.
  const hbHtml = `<html><body>
    <div class="atc_body_cont">전체 페이지를 읽으시려면 회원가입 및 로그인을 해주세요! LOGIN <p>화이트 티셔츠와 카키 팬츠처럼 편안한 옷차림에는 체크 셔츠를 허리에 둘러 패턴을 더해도 좋다.</p>
    <p>이 기사도 흥미로우실 거예요!</p><p>CELEBRITY 다른 기사 제목 - 절대 포함되면 안 됨</p></div>
  </body></html>`;
  const hbBody = parseHarpersBazaarKrBody(hbHtml);
  assert.ok(hbBody, "HARPERSBAZAAR_KR body must be extracted from atc_body_cont.");
  assert.ok(hbBody!.includes("체크 셔츠를 허리에 둘러"), "HARPERSBAZAAR_KR body must keep the real product/styling phrasing - the whole point of the source.");
  assert.equal(hbBody!.startsWith("전체 페이지를"), false, "The leading login-banner chrome must be stripped from the front.");
  assert.equal(hbBody!.includes("다른 기사 제목"), false, "HARPERSBAZAAR_KR body must stop before the site-wide recirculation-widget marker, not include another article's recirculated headline.");
  assert.equal(parseHarpersBazaarKrBody("<html><body>no atc body here</body></html>"), null, "Missing atc_body_cont must return null, not fabricate text.");

  const hbRelatedHtml = `<html><body><div class="atc_body_cont">실제 기사 본문입니다.<p>관련기사</p><p>다른 기사 제목</p></div></body></html>`;
  assert.equal(parseHarpersBazaarKrBody(hbRelatedHtml), "실제 기사 본문입니다.", "The shared ESQUIRE_KR '관련기사' marker must also cut HARPERSBAZAAR_KR's body.");

  // HARPERSBAZAAR_KR article page: canonical/date/image come from public
  // <link rel="canonical">, JSON-LD datePublished, and og:image - no login required.
  const hbArticleHtml = `<html><head>
    <meta property="og:title" content="니트와 셔츠, 올가을엔 허리에 입으세요">
    <meta property="og:image" content="https://www.harpersbazaar.co.kr/hero.jpg">
    <link rel="canonical" href="https://www.harpersbazaar.co.kr/article/1909247">
    <script type="application/ld+json">{"datePublished":"2026-09-07T18:00:00+09:00"}</script>
  </head></html>`;
  const hbArticle = parseHarpersBazaarKrArticlePage(hbArticleHtml, "https://www.harpersbazaar.co.kr/article/1909247?utm_source=x");
  assert.equal(hbArticle.title, "니트와 셔츠, 올가을엔 허리에 입으세요");
  assert.equal(hbArticle.canonicalUrl, "https://www.harpersbazaar.co.kr/article/1909247", "The public <link rel=canonical> must win over the fetched (possibly tracking-tagged) URL.");
  assert.equal(hbArticle.imageUrl, "https://www.harpersbazaar.co.kr/hero.jpg");
  assert.equal(hbArticle.publishedAt?.toISOString(), new Date("2026-09-07T18:00:00+09:00").toISOString(), "JSON-LD datePublished must be parsed.");

  const hbArticleFallback = parseHarpersBazaarKrArticlePage(
    `<html><head><meta property="article:published_time" content="2026-08-15T00:00:00+09:00"></head></html>`,
    "https://www.harpersbazaar.co.kr/article/999"
  );
  assert.equal(hbArticleFallback.canonicalUrl, "https://www.harpersbazaar.co.kr/article/999", "Without a canonical link, the fetched URL must be used as a fallback.");
  assert.equal(
    hbArticleFallback.publishedAt?.toISOString(),
    new Date("2026-08-15T00:00:00+09:00").toISOString(),
    "Without JSON-LD, the article:published_time meta tag must be used as a fallback date source."
  );
}

/**
 * REGRESSION (2026-09-07): the fashion listing's pagination loop had no
 * partial-return, unlike the per-article fetch loop right below it in the
 * same file. A real run was refused with HTTP 202 on page 32 of
 * /fashion/page/N - after 31 pages had already been read successfully - and
 * the uncaught throw discarded every entry already collected, reporting the
 * whole batch as zero articles. Verified here by mocking `fetch` (no live
 * network call): page 1 succeeds, page 2 is refused, and page 1's entries
 * must still come back rather than being thrown away.
 */
async function verifyHypebeastFashionListingPartialReturn() {
  const page1Html = `<html><body><div class="post-box-content-container">
    <div class="post-box-content-categories-title"><a href="https://hypebeast.kr/fashion" class="category fashion-category" title="패션">패션</a></div>
    <div class="post-box-content-title"><a href="https://hypebeast.kr/2026/9/page-one-article" class="title"><h2>제목</h2></a></div>
  </div></body></html>`;

  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    if (calls === 1) return new Response(page1Html, { status: 200 });
    return new Response("", { status: 202 }); // page 2 refused, mirroring the real host
  }) as typeof fetch;

  try {
    const entries = await getHypebeastFashionEntries(90);
    assert.equal(calls, 2, "The mock must show pagination actually reached the refused second page.");
    assert.equal(entries.length, 1, "Page 1's entry must be returned, not discarded, when page 2 is rate-limited.");
    assert.equal(entries[0]?.url, "https://hypebeast.kr/2026/9/page-one-article");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function verifySpecificItemEditorialCoOccurrence() {
  const source1 = "TEST_COOCCUR_SOURCE_1";
  const source2 = "TEST_COOCCUR_SOURCE_2";
  await prisma.editorialMention.deleteMany({ where: { post: { source: { in: [source1, source2] } } } });
  await prisma.editorialPost.deleteMany({ where: { source: { in: [source1, source2] } } });

  const postA = await prisma.editorialPost.create({
    data: {
      source: source1,
      externalPostId: "cooccur-a",
      url: "https://example.com/cooccur-a",
      canonicalUrl: "https://example.com/cooccur-a",
      title: "Test cooccur item with stripe detail",
      publishedAt: new Date(),
      fashionRelevance: "FASHION_RELEVANT",
      dataMode: "real"
    }
  });
  const postB = await prisma.editorialPost.create({
    data: {
      source: source2,
      externalPostId: "cooccur-b",
      url: "https://example.com/cooccur-b",
      canonicalUrl: "https://example.com/cooccur-b",
      title: "Test cooccur item in denim",
      publishedAt: new Date(),
      fashionRelevance: "FASHION_RELEVANT",
      dataMode: "real"
    }
  });
  // Same source as postA - repeated STYLE co-occurrence must still count as
  // sourceSpread=1 for that value (both mentions come from source1), never
  // "다수 매체 공통".
  const postC = await prisma.editorialPost.create({
    data: {
      source: source1,
      externalPostId: "cooccur-c",
      url: "https://example.com/cooccur-c",
      canonicalUrl: "https://example.com/cooccur-c",
      title: "Test cooccur item styled sporty",
      publishedAt: new Date(),
      fashionRelevance: "FASHION_RELEVANT",
      dataMode: "real"
    }
  });
  await prisma.editorialMention.createMany({
    data: [
      { postId: postA.id, type: "SUB_ITEM", value: "TEST_COOCCUR_ITEM", audienceGender: "UNKNOWN" },
      { postId: postA.id, type: "DETAIL", value: "STRIPE", audienceGender: "UNKNOWN" },
      { postId: postA.id, type: "STYLE", value: "SPORTY", audienceGender: "UNKNOWN" },
      { postId: postB.id, type: "SUB_ITEM", value: "TEST_COOCCUR_ITEM", audienceGender: "UNKNOWN" },
      { postId: postB.id, type: "MATERIAL", value: "DENIM", audienceGender: "UNKNOWN" },
      { postId: postC.id, type: "SUB_ITEM", value: "TEST_COOCCUR_ITEM", audienceGender: "UNKNOWN" },
      { postId: postC.id, type: "STYLE", value: "SPORTY", audienceGender: "UNKNOWN" }
    ]
  });

  const detail = await getSpecificItemEditorialDetail("TEST_COOCCUR_ITEM", "real");
  assert.ok(detail.trend, "A specific item with real evidence must resolve a trend row.");
  assert.equal(detail.trend?.articlePresence, 3, "Co-occurrence detail must reuse the same article-presence math as the trend row (3 distinct posts).");
  assert.equal(detail.trend?.sourceSpread, 2, "Two distinct sources (source1 used twice, source2 once) must be counted as sourceSpread=2.");
  const stripe = detail.cooccurrence.details.find((row) => row.value === "STRIPE");
  assert.equal(stripe?.articlePresence, 1, "STRIPE co-occurs in exactly one article - must not be inflated by duplicate mention rows.");
  const denim = detail.cooccurrence.materials.find((row) => row.value === "DENIM");
  assert.equal(denim?.articlePresence, 1, "DENIM must appear as a MATERIAL co-occurrence, not mixed into DETAIL.");
  assert.equal(detail.cooccurrence.details.some((row) => row.value === "DENIM"), false, "DENIM (a MATERIAL) must never leak into the DETAIL co-occurrence bucket.");
  assert.equal(detail.cooccurrence.colors.length, 0, "No COLOR mentions were seeded, so the colors bucket must stay empty rather than fabricate evidence.");

  const sporty = detail.cooccurrence.styles.find((row) => row.value === "SPORTY");
  assert.equal(sporty?.articlePresence, 2, "SPORTY co-occurs in 2 distinct articles (postA, postC).");
  assert.equal(sporty?.sourceSpread, 1, "Both SPORTY-co-occurring articles come from source1, so sourceSpread must stay 1, not 2.");

  const { repeated: repeatedStyles, oneOff: oneOffStyles } = partitionCoOccurrence(detail.cooccurrence.styles);
  assert.ok(repeatedStyles.some((row) => row.value === "SPORTY"), "SPORTY (articlePresence=2) must land in the repeated bucket.");
  assert.equal(oneOffStyles.length, 0, "No one-off STYLE co-occurrence was seeded in this fixture.");
  const { repeated: repeatedDetails, oneOff: oneOffDetails } = partitionCoOccurrence(detail.cooccurrence.details);
  assert.equal(repeatedDetails.length, 0, "STRIPE (articlePresence=1) must not land in the repeated bucket.");
  assert.ok(oneOffDetails.some((row) => row.value === "STRIPE"), "STRIPE (articlePresence=1) must land in the one-off bucket.");
  const { repeated: repeatedMaterials, oneOff: oneOffMaterials } = partitionCoOccurrence(detail.cooccurrence.materials);
  assert.equal(repeatedMaterials.length, 0, "DENIM (articlePresence=1) must not land in the repeated bucket.");
  assert.ok(oneOffMaterials.some((row) => row.value === "DENIM"), "DENIM (articlePresence=1) must land in the one-off bucket.");

  await prisma.editorialMention.deleteMany({ where: { post: { source: { in: [source1, source2] } } } });
  await prisma.editorialPost.deleteMany({ where: { source: { in: [source1, source2] } } });
}

function verifyDirectAttributeRelations() {
  const find = (relations: ReturnType<typeof extractDirectAttributeRelations>, item: string, type: string, value: string) =>
    relations.find((relation) => relation.specificItem === item && relation.attributeType === type && relation.attributeValue === value);

  // A colour placed directly before the item noun is a direct modifier.
  const red = extractDirectAttributeRelations({ title: "red track jacket", text: "" });
  assert.ok(find(red, "TRACK_JACKET", "COLOR", "RED"), '"red track jacket" must yield TRACK_JACKET + COLOR:RED.');
  assert.equal(red[0]?.relationKind, "DIRECT_PHRASE", "A modifier adjacent to the item noun is DIRECT_PHRASE evidence.");

  // Same article, unrelated sentences: never a direct relation.
  const separated = extractDirectAttributeRelations({
    title: "이번 주 드롭",
    text: "PLEASURES는 트랙 재킷을 선보인다. 별개로 공개된 러그는 레드 컬러가 특징이다."
  });
  assert.equal(find(separated, "TRACK_JACKET", "COLOR", "RED"), undefined, "A colour mentioned in a different sentence must never attach to the item.");

  // Enumeration must not distribute the modifier across list members - this
  // is the real HYPEBEAST sentence that would otherwise invent an oversized
  // track jacket.
  const enumerated = extractDirectAttributeRelations({
    title: "",
    text: "이번 캡슐은 오버사이즈 축구 셔츠와 트랙 재킷, 트레이닝 기어가 관중석을 벗어난다."
  });
  assert.equal(
    enumerated.some((relation) => relation.specificItem === "TRACK_JACKET"),
    false,
    '"오버사이즈 축구 셔츠와 트랙 재킷" is an enumeration - the modifier belongs to 축구 셔츠, so no TRACK_JACKET relation may be emitted.'
  );

  // Korean direct modifier via an adnominal clause.
  const recycled = extractDirectAttributeRelations({ title: "", text: "재활용 패브릭을 활용한 토트백을 선보인다." });
  assert.ok(find(recycled, "TOTE_BAG", "MATERIAL", "RECYCLED_FABRIC"), '"재활용 패브릭을 활용한 토트백" must yield TOTE_BAG + MATERIAL:RECYCLED_FABRIC.');

  // A modifier attached to a different head noun far from the item must not
  // be captured (real côte&ciel sentence: 블랙 modifies 후드, not 숄더백).
  const otherHead = extractDirectAttributeRelations({
    title: "",
    text: "스무스 블랙 후드가 일체형으로 더해져 입을 수 있는 베스트로 펼쳐지는 RENO 숄더백이 있다."
  });
  assert.equal(find(otherHead, "SHOULDER_BAG", "COLOR", "BLACK"), undefined, "블랙 modifies 후드 here, so SHOULDER_BAG must not inherit it.");

  // Repeating the same phrase inside one article must not multiply evidence.
  const duplicated = extractDirectAttributeRelations({
    title: "red track jacket",
    text: "red track jacket. red track jacket again."
  });
  assert.equal(
    duplicated.filter((relation) => relation.specificItem === "TRACK_JACKET" && relation.attributeValue === "RED").length,
    1,
    "A phrase repeated within one article must collapse to a single relation (no article-presence inflation)."
  );

  // ESQUIRE_KR sample sentence: the corpus's first-ever direct STYLE relation
  // and only its second-ever direct COLOR relation, which is why this source
  // was selected despite falling short of the numeric acceptance bars.
  const esquireSentence = extractDirectAttributeRelations({
    title: "",
    text: "@ald1.official 스포티한 트랙 재킷과 레드 볼캡을 매치했다."
  });
  assert.ok(find(esquireSentence, "TRACK_JACKET", "STYLE", "SPORTY"), "The real ESQUIRE_KR sample sentence must yield TRACK_JACKET + STYLE:SPORTY.");
  assert.ok(find(esquireSentence, "BALL_CAP", "COLOR", "RED"), "The real ESQUIRE_KR sample sentence must yield BALL_CAP + COLOR:RED.");

  // CAMO: added after the 2026-09-07 missed-vocabulary audit found a real,
  // crystal-clear direct modifier the taxonomy had no rule for (1 REAL
  // article, ESQUIRE_KR: "에이티즈 산: 카모 볼캡").
  const camoSentence = extractDirectAttributeRelations({ title: "", text: "에이티즈 산: 카모 볼캡을 착용했다." });
  assert.ok(find(camoSentence, "BALL_CAP", "DETAIL", "CAMO"), '"카모 볼캡" must yield BALL_CAP + DETAIL:CAMO.');

  // HARPERSBAZAAR_KR sample sentences (2026-09-09 cross-source independent
  // signal audit, real 20-article probe): both independently confirm
  // EXISTING repeated bundles from unrelated brands, not merely add new ones
  // - the exact finding that justified selecting this source.
  const hbCheckShirtSentence = extractDirectAttributeRelations({
    title: "",
    text: "화이트 티셔츠와 카키 팬츠처럼 편안한 옷차림에는 체크 셔츠를 허리에 둘러 패턴을 더해도 좋다."
  });
  assert.ok(find(hbCheckShirtSentence, "SHIRT", "DETAIL", "CHECK"), "The real HARPERSBAZAAR_KR sample sentence must yield SHIRT + DETAIL:CHECK, independently confirming the existing 체크 SHIRT bundle from a third, unrelated brand (엔조 블루스).");

  const hbKnitCardiganSentence = extractDirectAttributeRelations({
    title: "",
    text: "「 이럴 땐 이런 아이템! 」 H&M 파인니트 가디건 상품 구매하기"
  });
  assert.ok(find(hbKnitCardiganSentence, "CARDIGAN", "MATERIAL", "KNIT"), "The real HARPERSBAZAAR_KR sample sentence must yield CARDIGAN + MATERIAL:KNIT, independently confirming the existing 니트 CARDIGAN bundle and making it multi-source for the first time.");
}

/**
 * PRODUCT REFERENCE (2026-09-07): a deliberately separate module from the
 * Editorial extractor above, built after a Covernat product-detail probe
 * found real product names put COLOR after the item as a trailing
 * SKU-variant suffix ("루베라 백팩 블랙"), which the Editorial extractor's
 * prefix-only window cannot see and must not be widened to see (that would
 * risk exactly the cross-item bleed the Editorial tests above guard
 * against). This suite proves: (1) the new PRODUCT NAME COLOR rule works
 * both directions, (2) it stays conservative on the same kind of ambiguous
 * case Editorial guards against, and (3) it changes nothing about Editorial
 * behavior - every existing Editorial regression fixture in
 * verifyDirectAttributeRelations must still pass untouched.
 */
function verifyProductReferenceAttributes() {
  const findProduct = (relations: ReturnType<typeof extractProductNameColorRelations>, item: string, color: string) =>
    relations.find((relation) => relation.specificItem === item && relation.attributeValue === color);

  // Real Covernat product names, suffix-COLOR convention.
  const rubera = extractProductNameColorRelations("루베라 백팩 블랙");
  assert.ok(findProduct(rubera, "BACKPACK", "BLACK"), '"루베라 백팩 블랙" must yield BACKPACK + COLOR:BLACK via the suffix rule.');
  assert.equal(findProduct(rubera, "BACKPACK", "BLACK")?.relationKind, "NAME_COLOR_SUFFIX");

  const clover = extractProductNameColorRelations("클로버하트 플러피 토트백 브라운");
  assert.ok(findProduct(clover, "TOTE_BAG", "BROWN"), '"클로버하트 플러피 토트백 브라운" must yield TOTE_BAG + COLOR:BROWN via the suffix rule.');

  // Prefix direction (ordinary Korean adnominal order) must also work - this
  // is not a suffix-only rule, it is genuinely bidirectional for COLOR.
  const blackBackpack = extractProductNameColorRelations("블랙 백팩");
  assert.ok(findProduct(blackBackpack, "BACKPACK", "BLACK"), '"블랙 백팩" must yield BACKPACK + COLOR:BLACK via the prefix rule.');
  assert.equal(findProduct(blackBackpack, "BACKPACK", "BLACK")?.relationKind, "NAME_COLOR_PREFIX");

  // Same guard concern as Editorial, applied to product names: an
  // intervening word between the color and the item - even one that is only
  // a generic `ITEM`-type mention like "후드", not a tracked `SUB_ITEM` -
  // must block the relation. Requiring a whitespace-only gap rejects this
  // by construction, without needing an explicit other-item lookup.
  const ambiguous = extractProductNameColorRelations("블랙 후드 백팩");
  assert.equal(findProduct(ambiguous, "BACKPACK", "BLACK"), undefined, '"블랙 후드 백팩" must NOT promote to BACKPACK + COLOR:BLACK - 후드 sitting between them is ambiguous.');

  // A description-candidate linkage is reported only when the caller
  // supplies the exact surface form - this function must never invent or
  // grow the taxonomy on its own.
  const candidates = findDescriptionCandidates(
    "우먼 핫픽스 로고 티셔츠 라이트 블루",
    "디자인- 소프트한 터치감의 코튼 소재 사용- 짧은 기장의 크롭핏",
    ["크롭핏", "존재하지-않는-표현"]
  );
  assert.equal(candidates.length, 1, "Only surface forms actually present in the description must be reported.");
  assert.equal(candidates[0]?.surfaceForm, "크롭핏");
  assert.ok(candidates[0]?.evidenceText.includes("크롭핏"), "The evidence text must contain the matched surface form.");

  // REGRESSION GUARD: every Editorial fixture from verifyDirectAttributeRelations
  // must still hold - this module must not have changed Editorial behavior.
  const editorialStillGuarded = extractDirectAttributeRelations({
    title: "",
    text: "이번 캡슐은 오버사이즈 축구 셔츠와 트랙 재킷, 트레이닝 기어가 관중석을 벗어난다."
  });
  assert.equal(
    editorialStillGuarded.some((relation) => relation.specificItem === "TRACK_JACKET"),
    false,
    "Adding the Product Reference module must not affect the Editorial enumeration guard."
  );
  const editorialCoordination = extractDirectAttributeRelations({ title: "블랙 후드와 백팩", excerpt: null, text: "" });
  assert.equal(editorialCoordination.length, 0, "Editorial's own coordination guard (와/과) must remain unaffected by the new module.");
}

/**
 * PRODUCT REFERENCE TAXONOMY CLOSURE (2026-09-08): `object-relations.ts` +
 * `taxonomy.ts` close real item/attribute gaps found on a fresh 30-product
 * Covernat resample (the exact URL set from the 2026-09-07 probe could not be
 * recovered byte-for-byte - the sitemap grew from 2,254 to 2,309 URLs
 * overnight - so this pass re-fetched 30 products using the same documented
 * position formula against current data; see
 * `docs/PRODUCT_ATTRIBUTE_REFERENCE_AUDIT.md` for the full disclosure).
 * These fixtures use the real product NAME/description text this pass
 * measured, not invented examples.
 */
function verifyProductReferenceTaxonomy() {
  const find = (relations: ReturnType<typeof extractProductObjectRelations>, item: string, type: string, value: string) =>
    relations.find((r) => r.specificItem === item && r.attributeType === type && r.attributeValue === value);

  const resolvedItem = (name: string) => {
    const resolution = resolveSpecificItem(name);
    return resolution.status === "RESOLVED" ? resolution.item : resolution.status;
  };

  // Generic product item recognition: none of these nouns exist as an
  // editorialRules SUB_ITEM, so they only resolve via the new supplemental
  // vocabulary in taxonomy.ts.
  assert.equal(resolvedItem("우먼 리브드 카라 니트 베이지"), "KNIT");
  assert.equal(resolvedItem("C 로고 맨투맨 더스티 블루"), "SWEATSHIRT");
  assert.equal(resolvedItem("우먼 카고 팬츠 카키"), "PANTS");

  // Existing editorialRules SUB_ITEM values must still win over the new
  // generic fallback - "링거 티셔츠" must resolve to RINGER_TEE, never the new
  // generic T_SHIRT, even though "티셔츠" also matches the new pattern.
  assert.equal(
    resolvedItem("[커버낫x하이다나] 럭키 씨리얼 링거 티셔츠 네이비"),
    "RINGER_TEE",
    "An existing SUB_ITEM (RINGER_TEE) must take priority over the new generic T_SHIRT fallback."
  );

  // Ambiguous multi-item names (a bundled [SET] product naming two different
  // items) must yield NO relations at all - never a guess at which item a
  // color/material belongs to.
  const set = extractProductObjectRelations({ name: "[SET] 스몰 어센틱 다잉 맨투맨&팬츠 Sky Blue", description: null });
  assert.equal(set.length, 0, "A [SET] name listing two different items must be treated as ambiguous, not resolved to either one.");
  assert.equal(resolveSpecificItem("[SET] 테크 나일론 베이직 티셔츠&팬츠 Light Gray(팬츠.ver)").status, "AMBIGUOUS");

  // NAME-level direct-phrase MATERIAL/DETAIL (prefix modifier, same window
  // discipline as Editorial's own extractor).
  const denimPants = extractProductObjectRelations({ name: "우먼 스트레이트 데님 팬츠 블랙", description: null });
  assert.ok(find(denimPants, "PANTS", "MATERIAL", "DENIM"), '"우먼 스트레이트 데님 팬츠 블랙" must yield PANTS + MATERIAL:DENIM.');
  assert.ok(find(denimPants, "PANTS", "COLOR", "BLACK"), "The same name must also yield the bidirectional suffix COLOR:BLACK.");

  const shirringBlouse = extractProductObjectRelations({ name: "우먼 셔링 블라우스 아이보리", description: null });
  assert.ok(find(shirringBlouse, "BLOUSE", "DETAIL", "SHIRRING"), '"우먼 셔링 블라우스 아이보리" must yield BLOUSE + DETAIL:SHIRRING (an existing Editorial DETAIL value, newly reachable via the new BLOUSE item).');

  // DESCRIPTION-level SILHOUETTE - the structured-product-object license:
  // the attribute sits in `description`, never adjacent to the item noun in
  // `name`, and is still attributed to the item resolved from `name`.
  const cropTee = extractProductObjectRelations({
    name: "우먼 아이스 스트링 크롭 반팔티 스카이 블루",
    description: "º디자인- 소프트한 터치감의 냉감 소재를 사용해 시원한 착용감- 짧은 기장의 크롭핏º원단겉감 - polyester 96%, polyurethane 4%"
  });
  assert.ok(find(cropTee, "T_SHIRT", "SILHOUETTE", "CROP_FIT"), "A SILHOUETTE term present only in the description must still attach to the NAME-resolved item.");
  assert.ok(find(cropTee, "T_SHIRT", "COLOR", "SKY_BLUE"), "The compound COLOR value SKY_BLUE must match as a trailing NAME suffix.");

  // DESCRIPTION-level MATERIAL.
  const suedeBoots = extractProductObjectRelations({
    name: "클로버하트 프릴 퍼 부츠 브라운",
    description: "[디자인]\r\n-부드러운 스웨이드 소재와 따듯한 퍼 안감\r\n[원단]\r\n겉감-cow leather (suede) 100%"
  });
  assert.ok(find(suedeBoots, "BOOTS", "MATERIAL", "SUEDE"), "MATERIAL:SUEDE in the description must attach to the new BOOTS item.");

  // Relation deduplication: the same real fact confirmed in BOTH the name
  // (direct-phrase) and the description (restated) must collapse to exactly
  // one relation, never two.
  const dedupBlouse = extractProductObjectRelations({
    name: "우먼 셔링 블라우스 아이보리",
    description: "[디자인]\r\n-볼륨감 있는 실루엣 연출이 가능한 레귤러핏\r\n-어깨와 뒷 절개 셔링 디테일"
  });
  const shirringHits = dedupBlouse.filter((r) => r.attributeType === "DETAIL" && r.attributeValue === "SHIRRING");
  assert.equal(shirringHits.length, 1, "DETAIL:SHIRRING confirmed in both the name and the description must still count as exactly one relation.");

  // Companion-SKU cross-reference lines must be stripped before description
  // scanning - a real, verified hazard in Covernat's own description
  // convention: "-CO2501HZ31(C 로고 후디 집업)와 셋업 연출" describes a
  // DIFFERENT product being suggested as a matching set, not this product.
  const crossRef = extractProductObjectRelations({
    name: "버뮤다 C 로고 스웻 쇼츠 블랙",
    description: "º디자인\r\n- 버뮤다핏\r\n- 레귤러핏 CO2501HZ31(C 로고 후드집업)와 셋업 연출"
  });
  assert.equal(
    crossRef.some((r) => r.attributeType === "SILHOUETTE" && r.attributeValue === "REGULAR_FIT"),
    false,
    "A companion product's own attributes (sitting on a CO-code cross-reference line) must never attach to this product, even when the line also contains an otherwise-valid attribute keyword."
  );

  // REGRESSION GUARD: this module must never affect Editorial mention/
  // relation extraction, even though it reads `editorialRules` for its own
  // item-priority resolution.
  const stillGuarded = extractDirectAttributeRelations({ title: "", text: "이번 캡슐은 오버사이즈 축구 셔츠와 트랙 재킷, 트레이닝 기어가 관중석을 벗어난다." });
  assert.equal(stillGuarded.some((relation) => relation.specificItem === "TRACK_JACKET"), false, "Adding the taxonomy-closure module must not affect the Editorial enumeration guard.");
}

/**
 * MULTI-BRAND PORTABILITY (2026-09-08): fixtures from two brands independent
 * of both B:CAVE and each other - KIRSH (kirsh.co.kr) and POST ARCHIVE
 * FACTION (postarchivefaction.com) - both real product name/description text
 * fetched during the multi-brand validation pass documented in
 * docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md. These prove two things this
 * pass added: (1) SKIRT and GRAY generalize to brands Covernat never
 * informed, and (2) the real KIRSH false-positive this pass found and fixed
 * (an "available colors" list shared across every color variant of one
 * design, restated verbatim on every sibling product page) stays fixed.
 */
function verifyMultiBrandPortability() {
  const find = (relations: ReturnType<typeof extractProductObjectRelations>, item: string, type: string, value: string) =>
    relations.find((r) => r.specificItem === item && r.attributeType === type && r.attributeValue === value);

  // SKIRT: added on real cross-brand evidence (KIRSH + The North Face Korea).
  const kirshSkirt = extractProductObjectRelations({ name: "텍스쳐 패턴 니트 롱 스커트", description: null });
  assert.equal(resolveSpecificItem("텍스쳐 패턴 니트 롱 스커트").status, "AMBIGUOUS", 'Both KNIT ("니트") and SKIRT ("스커트") match this real KIRSH name - correctly ambiguous rather than silently guessing the head noun.');
  assert.deepEqual(kirshSkirt, [], "An ambiguous multi-item name must still yield zero relations after adding SKIRT.");

  const tntSkirt = resolveSpecificItem("걸즈 서프 레깅스 스커트");
  assert.equal(tntSkirt.status === "RESOLVED" && tntSkirt.item, "SKIRT", "A real The North Face Korea product name must resolve to the new SKIRT item.");

  // GRAY: added on real cross-brand TEXTUAL evidence (KIRSH's "멜란지 그레이",
  // The North Face Korea's "GRAY"/"MELANGE_GREY"/"CHARCOAL_GREY"), even
  // though - like NAVY in the Covernat pass - the specific motivating
  // examples above don't actually produce a captured relation: KIRSH wraps
  // its suffix color in brackets ("[멜란지 그레이]"), and TNF's compound forms
  // put another word ("MELANGE_"/"CHARCOAL_") directly before "그레이"/"GREY",
  // both of which the existing whitespace-only-gap adjacency check correctly
  // rejects. See docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md ("Parser Grammar
  // Misses") for the full disclosure. What GRAY *does* correctly capture is
  // a real The North Face Korea naming convention (confirmed on this exact
  // sample's own "반팔 티 WHITE" case) with the color word standing alone as
  // a clean suffix, no bracket/compound-prefix in the way.
  const grayTee = extractProductObjectRelations({ name: "남성 시티 익스플로어 반팔 티 GRAY", description: null });
  assert.ok(find(grayTee, "T_SHIRT", "COLOR", "GRAY"), "The new base GRAY color must match a clean, unwrapped suffix in the same real The North Face Korea naming convention as this pass's other TNF fixtures.");

  // The existing Covernat-derived HEATHER_GRAY compound must still match
  // unaffected by adding the new base GRAY value.
  const heatherGray = extractProductObjectRelations({ name: "우먼 울 블렌드 크롭 가디건 헤더 그레이", description: null });
  assert.ok(find(heatherGray, "CARDIGAN", "COLOR", "HEATHER_GRAY"), "The existing HEATHER_GRAY compound must still match after adding the new base GRAY value.");

  // REGRESSION GUARD (the actual bug this pass found and fixed): a real
  // KIRSH product description restates the full "available colors" list for
  // the whole design, not just the color of the exact page/SKU it appears
  // on - this is genuinely different from Covernat's per-exact-SKU
  // description convention. Before the fix, this fabricated a BEIGE relation
  // for a product whose own name says [블랙] (black).
  const colorListDescription =
    "º디자인- 벨트로 포인트를 줄 수 있는 팬츠º원단겉감 - polyester 100%º제조국 : 중국컬러 : 베이지, 블랙[사이즈]1: 총장 100";
  const blackPants = extractProductObjectRelations({ name: "컬렉션 벨트 포인트 투턱 팬츠 [블랙]", description: colorListDescription });
  assert.equal(find(blackPants, "PANTS", "COLOR", "BEIGE"), undefined, "A sibling color variant named in a shared 'available colors' description list must never be attributed to this product.");
  assert.equal(
    find(blackPants, "PANTS", "COLOR", "BLACK")?.relationKind,
    "NAME_COLOR_SUFFIX",
    "BLACK must be captured (this product's own bracketed name says so, and the color-adjacency gate test - see verifyColorAdjacencyGate - now reaches it), but strictly via the NAME-anchored check, never DESCRIPTION_OBJECT."
  );

  // DETAIL/MATERIAL/SILHOUETTE from the description must be entirely
  // unaffected by removing COLOR from the same scan.
  const kirshCardigan = extractProductObjectRelations({
    name: "체리 브이넥 가디건 셋업 [라이트 레드]",
    description: "디자인 : 브이넥 가디건, 톤온톤 체리 직자수 포인트, 콘트라스트 컬러를 믹스한 스트라이프 배색"
  });
  assert.ok(find(kirshCardigan, "CARDIGAN", "DETAIL", "EMBROIDERY"), "DETAIL from the description must still work after the COLOR-scan fix.");
  assert.ok(find(kirshCardigan, "CARDIGAN", "DETAIL", "STRIPE"), "A second, distinct DETAIL value in the same description must also still work.");

  // PAF: description-level SILHOUETTE/MATERIAL, real fixture, second
  // independent brand, confirms these dimensions are not Covernat-only.
  const pafJacket = extractProductObjectRelations({
    name: "A 자켓",
    description: "내구성이 돋보이는 코듀로이 넥 비조 단추 여밈 후면 래글런 소매 구조 버튼 A® 프론트 지퍼 크롭 핏"
  });
  assert.ok(find(pafJacket, "JACKET", "MATERIAL", "CORDUROY"), "MATERIAL:CORDUROY (an existing, pre-Covernat editorialRules value) must generalize to a real independent-brand (PAF) description.");
  assert.ok(find(pafJacket, "JACKET", "SILHOUETTE", "CROP_FIT"), "SILHOUETTE:CROP_FIT (a Covernat-derived value) must generalize to a real independent-brand (PAF) description.");

  // REGRESSION GUARD: Editorial must remain unaffected by any of this pass's
  // taxonomy additions or the description-scan fix.
  const editorialStillGuarded = extractDirectAttributeRelations({ title: "", text: "이번 캡슐은 오버사이즈 축구 셔츠와 트랙 재킷, 트레이닝 기어가 관중석을 벗어난다." });
  assert.equal(editorialStillGuarded.some((relation) => relation.specificItem === "TRACK_JACKET"), false, "The multi-brand pass must not affect the Editorial enumeration guard.");
}

/**
 * SCOPE ISOLATION TEST (2026-09-08 decoupling pass, see
 * docs/EDITORIAL_ITEM_TAXONOMY_AUDIT.md, "Previous Coupling"): proves the
 * architectural boundary itself, not just individual fixtures.
 *
 * Before this pass, `product-reference/object-relations.ts` imported
 * `editorialRules` LIVE from `editorial/mentions.ts`. Adding COAT/VEST/
 * DOWN_JACKET to Editorial's live taxonomy (a prior, separate pass) silently
 * moved Product Reference's persisted 120-product regression baseline from
 * 58/120 to 61/120 item-bearing - a real, undetected regression, found only
 * by re-running that exact persisted sample before this pass touched
 * anything. `object-relations.ts`/`attributes.ts` now read ONLY
 * `frozen-editorial-vocabulary.ts`, a permanently frozen, hand-copied
 * snapshot with zero import dependency on `editorial/mentions.ts`.
 */
function verifyEditorialProductReferenceScopeIsolation() {
  // Structural pin: the frozen snapshot is a completely separate array from
  // Editorial's live rules, and stays fixed at exactly the commit-7f75410
  // rule count regardless of how much Editorial's live taxonomy grows.
  assert.equal(frozenEditorialRules.length, 57, "frozen-editorial-vocabulary.ts must stay pinned at exactly 57 rules (commit 7f75410) - it must never be edited to track Editorial changes.");
  assert.notEqual(frozenEditorialRules as unknown, editorialRules as unknown, "The frozen snapshot must be a physically distinct array from Editorial's live editorialRules, never a live re-export or alias.");

  // None of Editorial's later additions (this pass's or the prior item-
  // taxonomy pass's) may ever appear in the frozen snapshot.
  for (const value of ["COAT", "VEST", "DOWN_JACKET", "VARSITY_JACKET", "DENIM_JACKET", "SHIRT", "SHORTS", "SKIRT", "SWEATSHIRT", "CARDIGAN"]) {
    assert.equal(
      frozenEditorialRules.some((rule) => rule.type === "SUB_ITEM" && rule.value === value),
      false,
      `${value} must never appear in the frozen Product Reference snapshot, regardless of whether Editorial's live editorialRules recognizes it.`
    );
  }

  // BEHAVIORAL PROOF 1 (real fixture, KIRSH#7321): adding Editorial-only
  // VEST must not change Product Reference's resolution for a name that
  // depends on it. Before the freeze fix, this name newly resolved to VEST
  // in Product Reference too - a real, measured regression on the persisted
  // sample.
  const kirshVestName = "카라 셔링 우븐 베스트 집업 [화이트]";
  assert.equal(resolveSpecificItem(kirshVestName).status, "NONE", "Product Reference must NOT resolve an item for this real KIRSH name via Editorial's VEST rule - VEST is Editorial-only.");
  assert.ok(extractEditorialMentions({ title: kirshVestName, text: "" }).some((m) => m.type === "SUB_ITEM" && m.value === "VEST"), "Editorial's live extractor MUST still recognize VEST for the exact same real text.");

  // BEHAVIORAL PROOF 2 (real fixture, TNF#NJ1DR89A): adding Editorial-only
  // COAT must not create a brand-new Product Reference resolution.
  const tnfCoatName = "여성 버나비 디테쳐블 다운 코트 BLACK NJ1DR89A - 노스페이스";
  assert.equal(resolveSpecificItem(tnfCoatName).status, "NONE", "Product Reference must NOT resolve an item for this real TNF Korea name via Editorial's COAT rule - COAT is Editorial-only.");
  assert.ok(extractEditorialMentions({ title: tnfCoatName, text: "" }).some((m) => m.type === "SUB_ITEM" && m.value === "COAT"), "Editorial's live extractor MUST still recognize COAT for the exact same real text.");

  // BEHAVIORAL PROOF 3 (real fixture, TNF#NJ1DR87C): adding Editorial-only
  // DOWN_JACKET must not RECLASSIFY an existing Product Reference
  // resolution - this product must keep resolving to the old generic
  // JACKET it always resolved to, never the new specific DOWN_JACKET.
  const tnfDownJacketName = "여성 스카이 다운 자켓 (RDS) GRAYISH_PINK NJ1DR87C - 노스페이스";
  const tnfResolved = resolveSpecificItem(tnfDownJacketName);
  assert.equal(tnfResolved.status === "RESOLVED" && tnfResolved.item, "JACKET", "Product Reference must keep resolving this real TNF Korea name to the old generic JACKET, never reclassify it to the new specific DOWN_JACKET.");
  assert.ok(extractEditorialMentions({ title: tnfDownJacketName, text: "" }).some((m) => m.type === "SUB_ITEM" && m.value === "DOWN_JACKET"), "Editorial's live extractor MUST still recognize the more specific DOWN_JACKET for the exact same real text.");

  // Symmetric direction: Product Reference's own supplemental-only items
  // (never in editorialRules) must never leak into Editorial's mention
  // parsing. Editorial's mentions.ts has no import from product-reference/*
  // at all, so this is true by construction - asserted explicitly anyway so
  // a future accidental import is caught immediately.
  const blouseMentions = extractEditorialMentions({ title: "블라우스 스타일링", text: "" });
  assert.equal(blouseMentions.some((m) => m.type === "SUB_ITEM" && m.value === "BLOUSE"), false, "BLOUSE is a Product-Reference-only supplemental item and must never be recognized by Editorial's extractor.");
  const zipHoodieMentions = extractEditorialMentions({ title: "후드집업 착용", text: "" });
  assert.equal(zipHoodieMentions.some((m) => m.type === "SUB_ITEM" && m.value === "ZIP_HOODIE"), false, "ZIP_HOODIE is a Product-Reference-only supplemental item and must never be recognized by Editorial's extractor.");
}

/**
 * COLOR-ADJACENCY GATE TEST (2026-09-08): a narrowly-scoped fix, found and
 * verified against the exact persisted 120-product multi-brand sample (see
 * docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md, "Color Adjacency Gate Test").
 * KIRSH wraps its suffix color in a bracket ("ITEM [COLOR]"); this tolerates
 * exactly one BALANCED bracket/parenthesis pair in the gap between item and
 * color, nothing more - no punctuation stripping, no long-distance relation.
 */
function verifyColorAdjacencyGate() {
  const find = (relations: ReturnType<typeof extractProductObjectRelations>, item: string, type: string, value: string) =>
    relations.find((r) => r.specificItem === item && r.attributeType === type && r.attributeValue === value);

  // Positive, real KIRSH bracket syntax.
  const kirshBracket = extractProductObjectRelations({ name: "빅 체리 후디 [블랙]", description: null });
  assert.ok(find(kirshBracket, "HOODIE", "COLOR", "BLACK"), 'A real KIRSH "ITEM [COLOR]" name must now yield the bracketed color.');

  // Positive, real MMLG parenthesis syntax - color captured once the item
  // itself resolves (MMLG's all-English item nouns are a separate, disclosed
  // out-of-scope limitation - not fixed by this gate test; verified here
  // with a Korean item noun standing in for the same punctuation grammar).
  const parenColor = extractProductObjectRelations({ name: "후디 (BLACK)", description: null });
  assert.ok(find(parenColor, "HOODIE", "COLOR", "BLACK"), 'An "ITEM (COLOR)" name (MMLG\'s real parenthesis convention) must also now yield the wrapped color.');

  // Negative: a stray, UNBALANCED bracket (no matching closer immediately
  // after the color) must still be rejected - this is not "strip
  // punctuation," it is "tolerate one genuinely balanced wrapper."
  const unbalanced = extractProductObjectRelations({ name: "후디 [블랙/레드/블루]", description: null });
  assert.equal(find(unbalanced, "HOODIE", "COLOR", "BLACK"), undefined, "A bracket containing more than just the color (an unbalanced/multi-value wrapper) must not be treated as adjacent.");
  assert.equal(find(unbalanced, "HOODIE", "COLOR", "RED"), undefined, "No sibling color inside the same multi-value bracket may be captured either.");

  // Negative: real KIRSH case with a product code between the item and the
  // bracket ("아치 로고 트랙 팬츠 KA [아이보리]") - the gap contains "KA", not
  // just whitespace and a bracket, so this must still be rejected. This is
  // one of the 5 real, disclosed residual misses this narrow rule does not
  // recover (see the multi-brand audit doc).
  const codeBetween = extractProductObjectRelations({ name: "아치 로고 트랙 팬츠 KA [아이보리]", description: null });
  assert.equal(find(codeBetween, "PANTS", "COLOR", "IVORY"), undefined, "Extra content (a product code) between the item and the bracket must block the relation, not be silently skipped.");

  // Ordinary plain-whitespace suffix (Covernat/TNF convention) must be
  // completely unaffected by adding bracket/paren tolerance.
  const plainSuffix = extractProductObjectRelations({ name: "티셔츠 화이트", description: null });
  assert.ok(find(plainSuffix, "T_SHIRT", "COLOR", "WHITE"), "The original plain-whitespace suffix convention must still work unchanged.");

  // REGRESSION GUARD: description-wide COLOR scanning must remain disabled -
  // the KIRSH "available colors" list bug this project already fixed must
  // never come back, including via this new bracket tolerance.
  const colorListDescription = "º디자인- 벨트로 포인트를 줄 수 있는 팬츠º원단컬러 : 베이지, 블랙[사이즈]1: 총장 100";
  const blackPants = extractProductObjectRelations({ name: "컬렉션 벨트 포인트 투턱 팬츠 [블랙]", description: colorListDescription });
  assert.equal(find(blackPants, "PANTS", "COLOR", "BEIGE"), undefined, "Description-wide COLOR scanning must remain disabled - a sibling color in the description must never appear, bracket tolerance or not.");
  assert.ok(find(blackPants, "PANTS", "COLOR", "BLACK"), "The correct color must still be captured, but only via the NAME-anchored bracket-tolerant check, not the description.");

  // REGRESSION GUARD: Editorial must remain completely unaffected.
  const editorialGuard = extractDirectAttributeRelations({ title: "블랙 후드와 백팩", excerpt: null, text: "" });
  assert.equal(editorialGuard.length, 0, "Editorial's own coordination guard (와/과) must remain unaffected by the color-adjacency gate test.");
}

/**
 * ITEM-LANGUAGE FINAL GATE (2026-09-08): real MMLG fixtures proving the new
 * English item-noun aliases (added to `product-reference/taxonomy.ts` only -
 * `editorial/mentions.ts` was not touched) resolve items MMLG's own English
 * naming previously left unrecognized, without creating any new false
 * matches on brand-specific jargon. See docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md,
 * "Item Language Final Gate", for the full 120-product before/after.
 */
function verifyItemLanguageAliases() {
  const find = (relations: ReturnType<typeof extractProductObjectRelations>, item: string, type: string, value: string) =>
    relations.find((r) => r.specificItem === item && r.attributeType === type && r.attributeValue === value);

  // Real MMLG fixtures, case-insensitive English item nouns.
  assert.equal(resolveSpecificItem("[Mmlg] SLOGAN HOODIE (EVERY BLACK)").status, "RESOLVED");
  const hoodie = resolveSpecificItem("[Mmlg] SLOGAN HOODIE (EVERY BLACK)");
  assert.equal(hoodie.status === "RESOLVED" && hoodie.item, "HOODIE", 'A real MMLG "HOODIE" name must resolve via the new English alias.');

  const pants = resolveSpecificItem("[Mmlg] WE REGULAR SWEAT PANTS (CRANBERRY)");
  assert.equal(pants.status === "RESOLVED" && pants.item, "PANTS", 'A real MMLG "...PANTS..." name must resolve via the new English alias, even with "SWEAT" sitting between the qualifier and "PANTS".');

  const shirt = resolveSpecificItem("[Mmlg] CREW BUDDY MESH HF SHIRT (IVORY)");
  assert.equal(shirt.status === "RESOLVED" && shirt.item, "SHIRT", 'A real MMLG "...SHIRT..." name must resolve via the new English alias.');

  // "ballcap" (no space) resolves to the SAME existing canonical BALL_CAP
  // value as the pre-existing spaced "ball cap" pattern - not a new item.
  const ballcap = resolveSpecificItem("[Mmlg] EMB. MM BALLCAP (GREEN)");
  assert.equal(ballcap.status === "RESOLVED" && ballcap.item, "BALL_CAP", 'MMLG\'s unspaced "BALLCAP" spelling must resolve to the existing BALL_CAP canonical, not a new item type.');
  const ballcapColor = extractProductObjectRelations({ name: "[Mmlg] EMB. MM BALLCAP (GREEN)", description: null });
  assert.ok(find(ballcapColor, "BALL_CAP", "COLOR", "GREEN"), "Once BALL_CAP resolves, the already-existing wrapped-parenthesis COLOR rule (from the color-adjacency gate test) must reach it with zero further grammar changes.");

  // Word-boundary / case-insensitivity safety: "hoodie" must not fire inside
  // an unrelated longer token, and matching must not depend on letter case.
  assert.equal(resolveSpecificItem("HOODIED CREATURE GRAPHIC PRINT").status, "NONE", '"hoodie" must not match as a substring inside an unrelated longer word ("HOODIED").');
  const upperHoodie = resolveSpecificItem("BASIC hoodie zip");
  assert.equal(upperHoodie.status, "RESOLVED", "Matching must be case-insensitive.");

  // T-SHIRT must never resolve as SHIRT via the new English alias. No
  // English alias was added to T_SHIRT this pass (no real sample evidence
  // required one - T_SHIRT stays Korean-only, exactly as before), so the
  // correct, safe outcome is NONE, not a mistaken SHIRT match - proving the
  // lookbehind guard actually blocks the substring, not that T_SHIRT itself
  // gained new coverage.
  assert.equal(resolveSpecificItem("BASIC T-SHIRT").status, "NONE", '"T-SHIRT" must never resolve as SHIRT via the new English alias (the lookbehind guard must block it); no English T_SHIRT alias was added this pass, so NONE is the correct, expected result.');
  assert.equal(resolveSpecificItem("BASIC T SHIRT").status, "NONE", '"T SHIRT" (space form) must likewise never resolve as SHIRT.');

  // Brand-specific jargon must NOT accidentally match: MMLG's own house
  // abbreviations ("HF-T", "LSV-T") are real, repeated tokens in the sample
  // but were deliberately left unaliased (brand-specific, not standard
  // generic nouns) - they must remain unresolved, not silently misread as
  // SHIRT or anything else.
  assert.equal(resolveSpecificItem("[Mmlg W] LINE HF-T (BLACK)").status, "NONE", 'MMLG\'s own "HF-T" house abbreviation must not resolve to any item - it is brand jargon, not a standard noun, and was deliberately not aliased.');
  assert.equal(resolveSpecificItem("[Mmlg] MMLG CURLY LSV-T (AUTHENTIC NAVY)").status, "NONE", 'MMLG\'s own "LSV-T" house abbreviation must likewise remain unresolved.');

  // REGRESSION: bare "SWEAT" (not "SWEATSHIRT"/"SWEATPANTS") was deliberately
  // NOT aliased (too ambiguous a standalone English word) - must stay NONE.
  assert.equal(resolveSpecificItem("[Mmlg W] OBJECT SWEAT (ASH GREY)").status, "NONE", 'Bare "SWEAT" was deliberately rejected as too ambiguous to alias - it must remain unresolved, not silently mapped to SWEATSHIRT.');

  // REGRESSION: KIRSH's existing item resolution and color-wrapper behavior
  // must be completely unaffected by adding English aliases.
  const kirshUnaffected = extractProductObjectRelations({ name: "빅 체리 후디 [블랙]", description: null });
  assert.ok(find(kirshUnaffected, "HOODIE", "COLOR", "BLACK"), "KIRSH's existing Korean HOODIE + bracket-color behavior must be completely unaffected by adding the English alias.");

  // REGRESSION: description-wide COLOR scanning must remain disabled.
  const colorListDescription = "º디자인- 벨트로 포인트를 줄 수 있는 팬츠º원단컬러 : 베이지, 블랙[사이즈]1: 총장 100";
  const blackPants = extractProductObjectRelations({ name: "컬렉션 벨트 포인트 투턱 팬츠 [블랙]", description: colorListDescription });
  assert.equal(find(blackPants, "PANTS", "COLOR", "BEIGE"), undefined, "Description-wide COLOR scanning must remain disabled after adding item-language aliases.");

  // REGRESSION GUARD: Editorial must remain completely unaffected - this
  // pass never touches editorial/mentions.ts.
  const editorialGuard = extractDirectAttributeRelations({ title: "", text: "이번 캡슐은 오버사이즈 축구 셔츠와 트랙 재킷, 트레이닝 기어가 관중석을 벗어난다." });
  assert.equal(editorialGuard.some((relation) => relation.specificItem === "TRACK_JACKET"), false, "Adding Product-Reference-only English item aliases must not affect the Editorial enumeration guard.");
}

/**
 * INDEPENDENT EVIDENCE CLUSTER COUNT (2026-09-09 signal trust pass, see
 * docs/EDITORIAL_SIGNAL_TRUST_AUDIT.md). Unit tests for
 * countIndependentEvidenceClusters using synthetic inputs that model the 4
 * real scenarios the audit actually found, so the deterministic rule itself
 * (not just its effect on one real bundle) is pinned.
 */
function verifyIndependentEvidenceClusterCount() {
  const day = (n: number) => new Date(`2026-09-${String(n).padStart(2, "0")}T00:00:00Z`);

  // Different sources: always independent, regardless of breadth or date -
  // mirrors the real 체크 SHIRT bundle (EYESMAG + HYPEBEAST_KR).
  assert.equal(
    countIndependentEvidenceClusters([
      { source: "EYESMAG", publishedAt: day(1), breadth: 3 },
      { source: "HYPEBEAST_KR", publishedAt: day(1), breadth: 3 }
    ]),
    2,
    "Two different sources must always count as 2 independent clusters, even with identical dates and both roundup-shaped."
  );

  // Same source, one roundup-shaped (breadth >= 3) + one dedicated
  // (breadth < 3), close in time: the real 라글란 시퀸/재활용 원단 pattern -
  // collapses to 1 cluster (a restatement, not a second observation).
  assert.equal(
    countIndependentEvidenceClusters([
      { source: "HYPEBEAST_KR", publishedAt: day(1), breadth: 1 },
      { source: "HYPEBEAST_KR", publishedAt: day(3), breadth: 3 }
    ]),
    1,
    "Same source, one dedicated + one roundup-shaped article 2 days apart must collapse to 1 independent cluster (same case restated)."
  );

  // Same source, BOTH dedicated (breadth < 3), close in time: the real 니트
  // CARDIGAN pattern (Denim Tears x BBC vs. adidas x JENNIE) - stays 2
  // clusters, since breadth never disagrees and genuinely different
  // same-source coverage must not be penalized.
  assert.equal(
    countIndependentEvidenceClusters([
      { source: "HYPEBEAST_KR", publishedAt: day(2), breadth: 2 },
      { source: "HYPEBEAST_KR", publishedAt: day(4), breadth: 1 }
    ]),
    2,
    "Same source, two dedicated (non-roundup) articles must stay 2 independent clusters - same-source coverage of genuinely different products must not be merged."
  );

  // Same source, BOTH roundup-shaped, close in time: two separate weekly
  // digests are not presumed to be restating each other just for both being
  // broad-coverage format - stays 2 clusters.
  assert.equal(
    countIndependentEvidenceClusters([
      { source: "HYPEBEAST_KR", publishedAt: day(1), breadth: 4 },
      { source: "HYPEBEAST_KR", publishedAt: day(8), breadth: 5 }
    ]),
    2,
    "Same source, two roundup-shaped articles must stay 2 independent clusters - breadth symmetry never triggers a merge."
  );

  // Same source, breadth-asymmetric, but FAR apart in time (>7 days): too
  // far apart to be the same news cycle - stays 2 clusters.
  assert.equal(
    countIndependentEvidenceClusters([
      { source: "HYPEBEAST_KR", publishedAt: day(1), breadth: 1 },
      { source: "HYPEBEAST_KR", publishedAt: day(9), breadth: 3 }
    ]),
    2,
    "Same source, breadth-asymmetric but >7 days apart must stay 2 independent clusters - too far apart to presume restatement."
  );

  // Missing publishedAt on either side must never merge (can't establish
  // proximity, so default to independent rather than guessing).
  assert.equal(
    countIndependentEvidenceClusters([
      { source: "HYPEBEAST_KR", publishedAt: null, breadth: 1 },
      { source: "HYPEBEAST_KR", publishedAt: day(1), breadth: 3 }
    ]),
    2,
    "A missing publishedAt must never be treated as 'close enough' - stays 2 independent clusters."
  );

  // Single-article input: always exactly 1 cluster.
  assert.equal(countIndependentEvidenceClusters([{ source: "EYESMAG", publishedAt: day(1), breadth: 1 }]), 1, "A single evidence article is always exactly 1 cluster.");

  // NON-TRANSITIVITY (the exact design flaw this pass caught in its own
  // first draft): a roundup between two UNRELATED dedicated articles must
  // absorb into one of them without fusing the two dedicated articles
  // together. 2 dedicated articles (breadth 1 each, 4 days apart) + 1
  // roundup in between (breadth 4) correlated with both by date/source must
  // produce 2 clusters (the 2 dedicated articles), not 1 - a naive
  // transitive union-find over all pairs would wrongly collapse this to 1.
  assert.equal(
    countIndependentEvidenceClusters([
      { source: "HYPEBEAST_KR", publishedAt: day(1), breadth: 1 },
      { source: "HYPEBEAST_KR", publishedAt: day(3), breadth: 4 },
      { source: "HYPEBEAST_KR", publishedAt: day(5), breadth: 1 }
    ]),
    2,
    "A roundup sitting between two unrelated dedicated articles must absorb into one of them without transitively fusing the two dedicated articles into 1 cluster."
  );
}

async function verifyAttributeBundles() {
  // Evidence strength stays conservative: article count alone never implies
  // breadth, and only 3+ outlets WITH recent movement may be a candidate.
  assert.equal(bundleEvidenceStrength({ articlePresence: 1, sourceSpread: 1 }), "단일 관측");
  // 2026-09-09 signal trust pass: "반복 관측" now requires
  // independentEvidenceClusterCount to distinguish genuinely-different-cases
  // repetition from one outlet's roundup restating its own dedicated piece
  // (see docs/EDITORIAL_SIGNAL_TRUST_AUDIT.md, "Evidence tiers").
  assert.equal(
    bundleEvidenceStrength({ articlePresence: 4, sourceSpread: 1, independentEvidenceClusterCount: 4 }),
    "반복 관측 · 서로 다른 사례",
    "Many articles from ONE outlet, each a genuinely different case, must never read as multi-source but must read as distinct repeated cases."
  );
  assert.equal(
    bundleEvidenceStrength({ articlePresence: 4, sourceSpread: 1, independentEvidenceClusterCount: 1 }),
    "반복 관측 · 동일 사례 재언급",
    "Many articles from ONE outlet that all collapse to the SAME real case (e.g. a roundup restating its own dedicated piece) must read as a restatement, not independent repetition."
  );
  // Omitting independentEvidenceClusterCount must default to trusting the
  // raw article count (backward-compatible for any caller not yet passing
  // it) rather than silently downgrading existing behavior.
  assert.equal(bundleEvidenceStrength({ articlePresence: 4, sourceSpread: 1 }), "반복 관측 · 서로 다른 사례", "Without an explicit cluster count, the label must fall back to trusting articlePresence, not assume a restatement.");
  assert.equal(bundleEvidenceStrength({ articlePresence: 2, sourceSpread: 2 }), "여러 매체 동시 관찰");
  assert.equal(bundleEvidenceStrength({ articlePresence: 5, sourceSpread: 3, recentArticlePresence: 0 }), "여러 매체 동시 관찰", "Three outlets without recent movement is not yet a trend candidate.");
  assert.equal(bundleEvidenceStrength({ articlePresence: 5, sourceSpread: 3, recentArticlePresence: 2 }), "강한 트렌드 후보");

  // Deterministic bundle naming - composed from label maps, never freeform.
  assert.equal(composeBundleName("TOTE_BAG", [{ type: "MATERIAL", value: "RECYCLED_FABRIC" }]), "재활용 원단 토트백");
  assert.equal(composeBundleName("TRACK_JACKET", []), "트랙 재킷", "With no direct attributes the name must stay the bare item - no invented adjective.");
  assert.equal(
    composeBundleName("TOTE_BAG", [{ type: "COLOR", value: "RED" }, { type: "MATERIAL", value: "DENIM" }]),
    "데님 레드 토트백",
    "Attributes compose in a fixed dimension order (MATERIAL before COLOR), so the same evidence always yields the same name."
  );

  // Against REAL data: TRACK_JACKET is a worked example of the direct vs
  // co-occurrence split. The current corpus contains real direct phrases for
  // both "셔링 디테일의 트랙 재킷" and "스포티한 트랙 재킷". Aggregate
  // co-occurrence may overlap a direct value when a separate article supplies
  // genuine direct wording, so overlap itself is not a regression.
  const trackDirect = await getSpecificItemDirectAttributes("TRACK_JACKET", "real");
  const trackDirectKeys = new Set(trackDirect.map((attribute) => `${attribute.type}:${attribute.value}`));
  assert.ok(trackDirectKeys.has("DETAIL:SHIRRING"), "TRACK_JACKET must retain the real direct phrase 셔링 디테일의 트랙 재킷.");
  assert.ok(trackDirectKeys.has("STYLE:SPORTY"), "TRACK_JACKET must retain the real direct phrase 스포티한 트랙 재킷.");
  const trackCoOccurrence = await getSpecificItemEditorialDetail("TRACK_JACKET", "real");
  assert.ok((trackCoOccurrence.cooccurrence.styles.length + trackCoOccurrence.cooccurrence.colors.length) > 0, "TRACK_JACKET must still keep article co-occurrence evidence separate from direct attributes.");

  // The empty-state contract must not depend on a named REAL item staying
  // modifier-free forever; scheduled corpus growth can legitimately add a
  // direct phrase. A sentinel item with no corpus matches must stay empty.
  const absentDirect = await getSpecificItemDirectAttributes("__SMOKE_TEST_MISSING_ITEM__", "real");
  assert.equal(absentDirect.length, 0, "An item with no REAL corpus matches must expose zero direct attributes.");

  const bundles = await getAttributeBundles("real");
  for (const bundle of bundles) {
    assert.ok(bundle.directAttributes.length > 0, "A bundle must be backed by at least one direct attribute relation.");
    assert.ok(bundle.bundleArticlePresence >= 1 && bundle.bundleSourceSpread >= 1, "Bundle counts must come from real articles/sources.");
    assert.ok(bundle.bundleSourceSpread <= bundle.bundleArticlePresence, "Source spread can never exceed article presence.");
    // Regression guard for the "blue t-shirt on the tote bag card" bug: no
    // REAL post currently stores block-level image position (see
    // src/collectors/editorial/image-relation.ts), so today NO bundle may
    // resolve a hero image - every evidence article's imageUrl (article
    // hero) must never leak into evidenceImageUrl/selectBundleHeroImage.
    for (const article of bundle.evidenceArticles) {
      assert.equal(article.evidenceImageUrl, null, `${bundle.displayName}: no REAL evidence article has document-position image data yet, so evidenceImageUrl must stay null.`);
      assert.notEqual(article.imageRelation, "DIRECT_BLOCK", `${bundle.displayName}: DIRECT_BLOCK is not achievable from current REAL storage.`);
      assert.notEqual(article.imageRelation, "ADJACENT_BLOCK", `${bundle.displayName}: ADJACENT_BLOCK is not achievable from current REAL storage.`);
    }
    assert.equal(selectBundleHeroImage(bundle.evidenceArticles), null, `${bundle.displayName}: bundle hero must be null today, never an article's unrelated hero image.`);
  }

  // Hero image selection: reuse the first evidence article that actually has
  // a document-position-confident image (evidenceImageUrl), stay null (never
  // fabricated, and never fall back to the article-hero imageUrl) when none
  // do, and never suppress an image just because another bundle also cites
  // the same evidence article.
  const withEvidenceImage = { source: "TEST", title: "t1", url: "https://example.com/1", publishedAt: null, imageUrl: "https://example.com/article-hero.jpg", evidenceImageUrl: "https://example.com/evidence.jpg", imageRelation: "DIRECT_BLOCK" as const, evidenceText: "", sourceField: "BODY" as const };
  const heroOnlyNoEvidence = { source: "TEST", title: "t2", url: "https://example.com/2", publishedAt: null, imageUrl: "https://example.com/article-hero-2.jpg", evidenceImageUrl: null, imageRelation: "ARTICLE_HERO" as const, evidenceText: "", sourceField: "BODY" as const };
  assert.equal(selectBundleHeroImage([heroOnlyNoEvidence, withEvidenceImage]), "https://example.com/evidence.jpg", "Hero image must be the first evidence article with a document-position-confident image, never the article's overall hero.");
  assert.equal(selectBundleHeroImage([heroOnlyNoEvidence]), null, "An ARTICLE_HERO-only article must never become the bundle hero - hero must stay null, never fabricated.");
  assert.equal(
    selectBundleHeroImage([withEvidenceImage]),
    selectBundleHeroImage([withEvidenceImage]),
    "The same evidence-bound image may legitimately be reused across bundles that cite it - selection must not dedupe it away."
  );

  // Per-item primary selection must follow the same already-sorted bundle
  // order without hard-coding which live bundle wins after future refreshes.
  const totePrimary = await getPrimaryBundleForItem("TOTE_BAG", "real");
  const toteBundles = bundles.filter((bundle) => bundle.specificItem === "TOTE_BAG");
  assert.ok(toteBundles.length > 0, "TOTE_BAG must have at least one REAL direct-attribute bundle.");
  assert.equal(totePrimary?.key, toteBundles[0]?.key, "TOTE_BAG primary must be the first TOTE_BAG bundle in the globally sorted REAL bundle list.");
  const trackPrimary = await getPrimaryBundleForItem("TRACK_JACKET", "real");
  const trackBundles = bundles.filter((bundle) => bundle.specificItem === "TRACK_JACKET");
  assert.ok(trackBundles.length > 0, "TRACK_JACKET must have at least one REAL direct-attribute bundle.");
  assert.equal(trackPrimary?.key, trackBundles[0]?.key, "TRACK_JACKET primary must follow the same sorted-bundle selection rule as every other item.");
  assert.equal(await getPrimaryBundleForItem("__SMOKE_TEST_MISSING_ITEM__", "real"), null, "An item with no REAL corpus matches must have no primary bundle.");

  // Dashboard insight priority (§8): a genuinely independent repeated bundle
  // beats a single-observation bundle, which beats an empty list (caller
  // falls back to the specific-item insight only then - never fabricated
  // here).
  const repeated = { key: "r", specificItem: "X", displayName: "반복", directAttributes: [], bundleArticlePresence: 3, bundleSourceSpread: 1, publisherFamilySpread: 1, independentEvidenceClusterCount: 2, latestObservedAt: null, evidenceArticles: [] };
  const single = { key: "s", specificItem: "Y", displayName: "단일", directAttributes: [], bundleArticlePresence: 1, bundleSourceSpread: 1, publisherFamilySpread: 1, independentEvidenceClusterCount: 1, latestObservedAt: null, evidenceArticles: [] };
  assert.equal(selectPrimaryPlanningBundle([single, repeated])?.displayName, "반복", "A genuinely independent repeated bundle (>=2 clusters) must be preferred over a single-observation bundle regardless of list order.");
  assert.equal(selectPrimaryPlanningBundle([single])?.displayName, "단일", "With no independently-repeated bundle, the single-observation bundle must still be preferred over the specific-item fallback.");
  assert.equal(selectPrimaryPlanningBundle([]), null, "With zero bundles, the caller must fall back to the specific-item insight rather than fabricating one.");

  // REGRESSION GUARD (2026-09-09 signal trust pass): a bundle with 2
  // articles that are really the SAME case restated (independentEvidenceClusterCount
  // stays 1 - e.g. a same-source roundup restating its own dedicated piece)
  // must NOT be preferred over a bundle with 2 articles that are genuinely 2
  // independent cases, even though raw bundleArticlePresence ties at 2 for
  // both. This is the exact real-data contradiction the pass found and fixed
  // (라글란 시퀸 긴팔 티셔츠, 1 cluster, vs. 니트 CARDIGAN, 2 clusters).
  const sameCaseRestated = { key: "sc", specificItem: "X", displayName: "동일사례", directAttributes: [{ type: "DETAIL", value: "A", articlePresence: 2, sourceSpread: 1 }, { type: "DETAIL", value: "B", articlePresence: 2, sourceSpread: 1 }], bundleArticlePresence: 2, bundleSourceSpread: 1, publisherFamilySpread: 1, independentEvidenceClusterCount: 1, latestObservedAt: null, evidenceArticles: [] };
  const distinctCases = { key: "dc", specificItem: "Y", displayName: "서로다른사례", directAttributes: [{ type: "MATERIAL", value: "C", articlePresence: 2, sourceSpread: 1 }], bundleArticlePresence: 2, bundleSourceSpread: 1, publisherFamilySpread: 1, independentEvidenceClusterCount: 2, latestObservedAt: null, evidenceArticles: [] };
  assert.equal(selectPrimaryPlanningBundle([sameCaseRestated, distinctCases])?.displayName, "서로다른사례", "A same-case-restated bundle (1 cluster) must never be preferred over a genuinely-2-cluster bundle, even with fewer raw attributes and identical article/source counts.");
  assert.equal(selectPrimaryPlanningBundle([distinctCases, sameCaseRestated])?.displayName, "서로다른사례", "...and this must hold regardless of list order.");

  // REGRESSION GUARD (2026-09-09 publisher-family ranking pass): 2-source/
  // 1-family evidence must not outrank 2-source/2-family evidence when all
  // else is reasonably comparable. Synthetic, sort-order-only check
  // (constructs bundle-shaped objects and re-sorts with the same 5-key logic
  // getAttributeBundles uses, since that comparator lives inline in the
  // async DB-backed function and cannot be unit-tested standalone) -
  // deliberately gives the same-family bundle a HIGHER cluster count (3 vs
  // 2) to prove publisherFamilySpread is checked BEFORE cluster count, not
  // used only to break an exact tie.
  const sameFamilyDeepCluster = { key: "sf", specificItem: "X", displayName: "동일가족", directAttributes: [], bundleArticlePresence: 3, bundleSourceSpread: 2, publisherFamilySpread: 1, independentEvidenceClusterCount: 3, latestObservedAt: null, evidenceArticles: [] };
  const crossFamilyShallowCluster = { key: "cf", specificItem: "Y", displayName: "교차가족", directAttributes: [], bundleArticlePresence: 2, bundleSourceSpread: 2, publisherFamilySpread: 2, independentEvidenceClusterCount: 2, latestObservedAt: null, evidenceArticles: [] };
  const familySortedAsc = [sameFamilyDeepCluster, crossFamilyShallowCluster].sort(
    (a, b) =>
      b.bundleSourceSpread - a.bundleSourceSpread ||
      b.publisherFamilySpread - a.publisherFamilySpread ||
      b.independentEvidenceClusterCount - a.independentEvidenceClusterCount ||
      b.bundleArticlePresence - a.bundleArticlePresence ||
      b.directAttributes.length - a.directAttributes.length ||
      a.displayName.localeCompare(b.displayName)
  );
  assert.equal(familySortedAsc[0]?.displayName, "교차가족", "2-source/2-family evidence (교차가족) must rank ABOVE 2-source/1-family evidence (동일가족), even though 동일가족 has a deeper cluster count (3 vs 2) - publisherFamilySpread is checked before independentEvidenceClusterCount.");

  // Live bundles must keep publisher-family spread within physical source
  // spread. The exact families for a named bundle are allowed to grow after
  // scheduled refreshes, so this assertion is structural rather than tied to
  // a frozen corpus snapshot.
  for (const bundle of bundles) {
    assert.ok(bundle.publisherFamilySpread >= 1, `${bundle.displayName}: publisherFamilySpread must be at least 1.`);
    assert.ok(bundle.publisherFamilySpread <= bundle.bundleSourceSpread, `${bundle.displayName}: publisherFamilySpread cannot exceed bundleSourceSpread.`);
  }

  // Against REAL data: whenever ANY genuinely-independent repeated bundle
  // exists, the dashboard's primary planning bundle must be one of those,
  // never a same-case-restated one. Asserted structurally because the corpus
  // is re-collected over a rolling window - which specific bundle qualifies
  // changes, the priority rule must not.
  const realPrimary = selectPrimaryPlanningBundle(bundles);
  const realIndependentRepeats = bundles.filter((bundle) => bundle.independentEvidenceClusterCount >= 2);
  assert.ok(realPrimary, "With REAL bundles present, a primary planning bundle must be selected.");
  if (realIndependentRepeats.length > 0) {
    assert.ok(
      (realPrimary?.independentEvidenceClusterCount ?? 0) >= 2,
      `An independently-repeated bundle exists (${realIndependentRepeats.map((bundle) => bundle.displayName).join(", ")}), so the primary planning bundle must be one of those, got "${realPrimary?.displayName}".`
    );
  }

  // Do not pin CURRENT SIGNAL or named bundle counts to a live corpus
  // snapshot here. Scheduled refreshes are expected to change winners and
  // evidence counts. The structural primary-rule assertion above plus the
  // synthetic ranking fixtures below protect semantics without treating
  // legitimate data growth as a test failure.

  // Regression fixture for the actual real-data failure found and fixed this
  // pass (2026-09-09 Cosmopolitan Korea probe prerequisite): an attribute word
  // immediately followed by an attached particle (에/에는/에도/에서/도) marks it
  // as an independent noun phrase, not a modifier of the downstream item.
  const find = (relations: ReturnType<typeof extractDirectAttributeRelations>, item: string, type: string, value: string) =>
    relations.find((relation) => relation.specificItem === item && relation.attributeType === type && relation.attributeValue === value);
  const pairedKnit = extractDirectAttributeRelations({ title: "", text: "깊은 브이넥 니트에 카키 셔츠를 레이어드해 색다른 조합을 선보였습니다." });
  assert.equal(find(pairedKnit, "SHIRT", "MATERIAL", "KNIT"), undefined, '"니트에 카키 셔츠" must NOT yield SHIRT + MATERIAL:KNIT - 니트 is a separate garment being layered WITH the shirt, not describing it.');
  const comparedKnit = extractDirectAttributeRelations({ title: "", text: "도톰한 니트도 허리에 묶어주면 셔츠와 또 다른 느낌을 준다." });
  assert.equal(find(comparedKnit, "SHIRT", "MATERIAL", "KNIT"), undefined, '"니트도 ... 셔츠" must NOT yield SHIRT + MATERIAL:KNIT - 니트 and 셔츠 are being compared as alternatives, not one describing the other.');
  // The guard must not over-reach into legitimate relative-clause modifiers
  // that happen to use 가/이/은/는 (deliberately excluded from the particle
  // set - see ATTACHED_PARTICLE's own comment for the real breakage a first,
  // broader draft caused).
  const embroideryRelativeClause = extractDirectAttributeRelations({ title: "", text: "플로럴 자수가 돋보이는 테일러드 코트를 공개했다." });
  assert.ok(find(embroideryRelativeClause, "COAT", "DETAIL", "EMBROIDERY"), '"자수가 돋보이는 코트" must still yield COAT + DETAIL:EMBROIDERY - a legitimate relative-clause modifier, not the 에/도 pairing pattern.');
  const blackRelativeClause = extractDirectAttributeRelations({ title: "", text: "블랙이 섞인 옴브레 플레이드 셔츠를 선보였다." });
  assert.ok(find(blackRelativeClause, "SHIRT", "COLOR", "BLACK"), '"블랙이 섞인 셔츠" must still yield SHIRT + COLOR:BLACK - a legitimate relative-clause modifier.');

  // Second and third regression fixtures found during the same 2026-09-09
  // Cosmopolitan Korea pre-collection dry run, both real false positives
  // caught before any DB write.
  const notOnlyCoordination = extractDirectAttributeRelations({
    title: "",
    text: "이런 룩은 툭 떨어지는 데님 팬츠는 물론이고 러블리한 미니스커트와도 놀라울 정도로 완벽한 궁합을 자랑하죠."
  });
  assert.equal(find(notOnlyCoordination, "SKIRT", "MATERIAL", "DENIM"), undefined, '"데님 팬츠는 물론이고 ... 미니스커트" must NOT yield SKIRT + MATERIAL:DENIM - DENIM describes 팬츠, not the skirt two items later in a "not only X, but also Y" list.');
  const pairedThenExcluded = extractDirectAttributeRelations({
    title: "",
    text: "시크한 블랙 빅백을 매치해 코트를 제외한 모든 이너와 액세서리를 블랙으로 통일하는 스타일링을 선보였다."
  });
  assert.equal(find(pairedThenExcluded, "COAT", "COLOR", "BLACK"), undefined, '"블랙 빅백을 매치해 코트를 제외한..." must NOT yield COAT + COLOR:BLACK - the bag being matched is a separate object, and the sentence explicitly excludes the coat from the black color scheme.');

  // Fourth and fifth regression fixtures: real false positives found during
  // the 2026-09-09 Marie Claire Korea (MCK_PUBLISHING) collection dry run,
  // both fixed by the new PAIRING_PARTICLE boundary (a bare 에 immediately
  // after a companion noun, distinct from the attached-particle guard above
  // because a noun sits between the attribute word and the 에).
  const pairedTop = extractDirectAttributeRelations({
    title: "",
    text: "상의 중앙에 가로로 컷아웃 디테일이 들어간 화이트 톱에 화려한 실버 시퀸 스커트를 매치했죠."
  });
  assert.equal(find(pairedTop, "SKIRT", "COLOR", "WHITE"), undefined, '"화이트 톱에 ... 스커트를 매치했죠" must NOT yield SKIRT + COLOR:WHITE - 화이트 describes 톱 (the companion top being paired WITH the skirt), not the skirt itself.');
  assert.ok(find(pairedTop, "SKIRT", "DETAIL", "SEQUIN"), '"화려한 실버 시퀸 스커트" must still yield SKIRT + DETAIL:SEQUIN - a genuine adjacent modifier sitting after the 에 boundary.');
  const wornOverPants = extractDirectAttributeRelations({
    title: "",
    text: "레드 팬츠 위에 묵직한 버건디 셔츠와 타이의 톤온톤 연출을 시도합니다."
  });
  assert.equal(find(wornOverPants, "SHIRT", "COLOR", "RED"), undefined, '"레드 팬츠 위에 묵직한 버건디 셔츠" must NOT yield SHIRT + COLOR:RED - 레드 describes 팬츠 (worn UNDER the shirt, via 위에), and the shirt itself is explicitly 버건디, not a recognized color value.');
  // The new boundary must not over-reach into legitimate 위/아래-free adjacent
  // modifiers that simply happen to contain an unrelated bare 에 earlier in a
  // long window - a genuine same-clause modifier sitting AFTER the 에 must
  // still be captured (already covered by the SEQUIN assertion above), and a
  // real modifier with no 에 anywhere in its window must be entirely
  // unaffected.
  const unaffectedByPairingParticle = extractDirectAttributeRelations({ title: "", text: "카본 블랙 ELVO 백팩을 공개했다." });
  assert.ok(find(unaffectedByPairingParticle, "BACKPACK", "COLOR", "BLACK"), '"카본 블랙 ELVO 백팩" (no 에 anywhere nearby) must still yield BACKPACK + COLOR:BLACK - PAIRING_PARTICLE must not affect windows with no pairing particle in them.');

  // 나/이나 ALTERNATION_PARTICLE regression fixtures (2026-09-09 saturation-
  // audit follow-up). "A나 B" / "A이나 B" is Korean alternative coordination
  // ("A or B"), not A modifying B - the same class of false positive as
  // PAIRING_PARTICLE above but the boundary particle attaches to the FIRST
  // coordinated noun instead of appearing after the item.
  const knitOrCardigan = extractDirectAttributeRelations({ title: "", text: "옷차림이 어딘가 허전하게 느껴진다면 니트나 카디건, 셔츠 한 장을 허리에 둘러보자." });
  assert.equal(find(knitOrCardigan, "CARDIGAN", "MATERIAL", "KNIT"), undefined, '"니트나 카디건" (real HARPERSBAZAAR_KR sentence) must NOT yield CARDIGAN + MATERIAL:KNIT - 니트나 lists 니트 as an alternative to 카디건 ("a knit OR a cardigan"), not a modifier of it.');

  // "니트나 가죽 재킷" - the exact false positive documented in
  // docs/EDITORIAL_ITEM_TAXONOMY_AUDIT.md as left unfixed ("a shared-
  // extraction-core gap, not an item-taxonomy gap"). LEATHER_JACKET was never
  // shipped as a SUB_ITEM (its only candidate relation was this exact false
  // positive), so this fixture cannot check a LEATHER_JACKET-keyed relation
  // directly - it asserts the more general, still-meaningful claim that this
  // sentence produces NO relation carrying MATERIAL:KNIT at all, proving the
  // 나 boundary is honored generally, not merely for the one item this pass
  // happened to find on CARDIGAN.
  const knitOrLeatherJacket = extractDirectAttributeRelations({ title: "", text: "니트나 가죽 재킷 중에서 골라보세요." });
  assert.ok(!knitOrLeatherJacket.some((relation) => relation.attributeValue === "KNIT"), '"니트나 가죽 재킷" must not produce any MATERIAL:KNIT relation - 니트나 lists 니트 as an alternative, not a modifier of whatever follows.');

  // Harder case: the 나/이나 particle attaches to a noun that is NOT itself
  // the matched attribute word (an intervening modified noun sits between the
  // attribute and the particle) - "빈티지한 데님이나 와이드 팬츠" (real
  // HARPERSBAZAAR_KR sentence). Both 빈티지 (STYLE, 2 syllables before 데님)
  // and 데님 (MATERIAL, directly before 이나) must be rejected for
  // WIDE_PANTS - both describe 데님, the OTHER 이나-coordinated alternative,
  // not the wide pants.
  const vintageDenimOrWidePants = extractDirectAttributeRelations({ title: "", text: "빈티지한 데님이나 와이드 팬츠를 매치해보세요." });
  assert.equal(find(vintageDenimOrWidePants, "WIDE_PANTS", "MATERIAL", "DENIM"), undefined, '"빈티지한 데님이나 와이드 팬츠" must NOT yield WIDE_PANTS + MATERIAL:DENIM - 데님이나 lists 데님 as the alternative to 와이드 팬츠, not a modifier of it.');
  assert.equal(find(vintageDenimOrWidePants, "WIDE_PANTS", "STYLE", "VINTAGE"), undefined, '"빈티지한 데님이나 와이드 팬츠" must NOT yield WIDE_PANTS + STYLE:VINTAGE either - 빈티지 also describes 데님 (the same alternative), not 와이드 팬츠, even though 빈티지 itself is not directly touching 이나.');

  // A prior pass (docs/EDITORIAL_SIGNAL_SATURATION_AUDIT.md §17) had called
  // "오버사이즈 화이트 탱크 톱이나 셔츠" -> SHIRT+COLOR:WHITE VALID under a
  // narrower reading (화이트 precedes the whole 이나-coordinated pair, so it
  // seemed to describe both alternatives). Re-examined for this pass: 탱크 톱
  // is simply not an independently taxonomized SUB_ITEM, which is the only
  // reason this one survived that earlier check undetected - structurally it
  // is the same "modifier attaches to the NEARER of two 이나-coordinated
  // nouns" pattern as the WIDE_PANTS case above. Corrected here; the
  // saturation-audit doc's "VALID" call for this specific instance is
  // superseded by this pass's finding, disclosed in
  // docs/EDITORIAL_RANKING_FAMILY_DIVERSITY_AUDIT.md.
  const whiteTankTopOrShirt = extractDirectAttributeRelations({ title: "", text: "오버사이즈 화이트 탱크 톱이나 셔츠를 무심하게 매치해보세요." });
  assert.equal(find(whiteTankTopOrShirt, "SHIRT", "COLOR", "WHITE"), undefined, '"화이트 탱크 톱이나 셔츠" must NOT yield SHIRT + COLOR:WHITE - 화이트 modifies 탱크 톱 (the nearer 이나-coordinated alternative), not 셔츠.');

  // Positive control: a legitimate adjacent modifier with no 나/이나 anywhere
  // in its window must be entirely unaffected by the new guard.
  const unaffectedByAlternationParticle = extractDirectAttributeRelations({ title: "", text: "카본 블랙 ELVO 백팩을 공개했다." });
  assert.ok(find(unaffectedByAlternationParticle, "BACKPACK", "COLOR", "BLACK"), '"카본 블랙 ELVO 백팩" (no 나/이나 anywhere nearby) must still yield BACKPACK + COLOR:BLACK - ALTERNATION_PARTICLE must not affect windows with no alternation particle in them.');

  // Collision guard: ALTERNATION_PARTICLE only ever scans the already-bounded
  // (<=20 char) window between one matched attribute and one matched item,
  // never arbitrary article text, so a 나-ending word elsewhere in the
  // sentence (outside any modifier window) can never trigger it.
  const naOutsideWindow = extractDirectAttributeRelations({ title: "", text: "그러나 이 브랜드는 블랙 코트를 새로 공개했다." });
  assert.ok(find(naOutsideWindow, "COAT", "COLOR", "BLACK"), '"그러나 이 브랜드는 블랙 코트" - 그러나 ("however") sits well outside the 20-char modifier window before 코트, so it must not affect the genuine adjacent BLACK modifier.');
}

/**
 * Evidence-bound image resolution (src/collectors/editorial/image-relation.ts):
 * an image may only back a bundle when it sits in the evidence text's own
 * content block, or a block immediately adjacent to it - never a distant or
 * article-wide image. Tested against synthetic block fixtures because no
 * REAL post currently stores block-level image position (see the module's
 * own doc comment and docs/ATTRIBUTE_BUNDLE_AUDIT.md).
 */
function verifyEvidenceImageResolution() {
  const evidence = "재활용 패브릭을 활용한 토트백";

  // Article-hero-only: no block carries an image at all.
  const heroOnly: ContentBlock[] = [{ text: `앞부분 문단. ${evidence}을 선보인다.`, imageUrl: null }];
  assert.deepEqual(resolveEvidenceImage(heroOnly, evidence), { kind: "NONE", imageUrl: null }, "An article with only a hero image (no block-level image) must resolve to NONE, not fabricate a bundle hero.");

  // Direct block: the same block as the evidence text carries an image.
  const directBlock: ContentBlock[] = [{ text: `앞부분 문단. ${evidence}을 선보인다.`, imageUrl: "https://example.com/direct.jpg" }];
  assert.deepEqual(resolveEvidenceImage(directBlock, evidence), { kind: "DIRECT_BLOCK", imageUrl: "https://example.com/direct.jpg" }, "An image in the SAME block as the evidence text must resolve as DIRECT_BLOCK.");

  // Adjacent block (before): the immediately preceding block carries the image.
  const adjacentBefore: ContentBlock[] = [
    { text: "표지 이미지 문단.", imageUrl: "https://example.com/before.jpg" },
    { text: `${evidence}을 선보인다.`, imageUrl: null }
  ];
  assert.deepEqual(resolveEvidenceImage(adjacentBefore, evidence), { kind: "ADJACENT_BLOCK", imageUrl: "https://example.com/before.jpg" }, "An image in the block immediately BEFORE the evidence block must resolve as ADJACENT_BLOCK.");

  // Adjacent block (after): the immediately following block carries the image.
  const adjacentAfter: ContentBlock[] = [
    { text: `${evidence}을 선보인다.`, imageUrl: null },
    { text: "다음 문단.", imageUrl: "https://example.com/after.jpg" }
  ];
  assert.deepEqual(resolveEvidenceImage(adjacentAfter, evidence), { kind: "ADJACENT_BLOCK", imageUrl: "https://example.com/after.jpg" }, "An image in the block immediately AFTER the evidence block must resolve as ADJACENT_BLOCK.");

  // Unrelated distant image: two blocks away must never count.
  const distant: ContentBlock[] = [
    { text: "완전히 다른 문단.", imageUrl: "https://example.com/distant.jpg" },
    { text: "중간 문단, 이미지 없음.", imageUrl: null },
    { text: `${evidence}을 선보인다.`, imageUrl: null }
  ];
  assert.deepEqual(resolveEvidenceImage(distant, evidence), { kind: "NONE", imageUrl: null }, "An image two blocks away must never be treated as evidence-bound - only the same or an immediately adjacent block counts.");

  // Evidence text not found in any block at all.
  assert.deepEqual(resolveEvidenceImage(directBlock, "완전히 다른 텍스트"), { kind: "NONE", imageUrl: null }, "Evidence text absent from every block must resolve to NONE.");

  // Honest adapter: real stored text has no preserved paragraph/image
  // structure, so it must always collapse to at most one imageless block.
  assert.deepEqual(contentBlocksFromStoredText("아무 본문 텍스트"), [{ text: "아무 본문 텍스트", imageUrl: null }], "Stored text with no structure must become exactly one block with no image.");
  assert.deepEqual(contentBlocksFromStoredText(null), [], "Null/empty stored text must yield zero blocks, never a fabricated one.");
  assert.deepEqual(contentBlocksFromStoredText("  "), [], "Whitespace-only stored text must yield zero blocks.");
}

function verifyAttributeBarWidth() {
  // Bar width is a real ratio against the item's strongest attribute, with a
  // 6% legibility floor for genuinely small-but-nonzero counts - it must
  // never invent a score or reorder attributes relative to their real counts.
  assert.equal(attributeBarWidthPercent(2, 2), 100, "The strongest attribute must render at full width.");
  assert.equal(attributeBarWidthPercent(1, 2), 50, "Half the max articlePresence must render at half width.");
  assert.equal(attributeBarWidthPercent(1, 50), 6, "A real but tiny ratio must still render at the visibility floor, not disappear.");
  assert.equal(attributeBarWidthPercent(0, 5), 0, "Zero articlePresence must render as zero width, never floored up.");
  assert.ok(attributeBarWidthPercent(2, 3) > attributeBarWidthPercent(1, 3), "A larger real count must always render wider than a smaller one.");
}

function verifyLegacyMarketBlockVisibility() {
  assert.equal(hasVerifiedMarketEvidence([]), false, "An item with zero market rows must hide the legacy ranking/assortment block.");
  assert.equal(hasVerifiedMarketEvidence([{ rankingVerified: false }]), false, "Assortment-only rows (SLAM_JAM/STUSSY, rankingVerified=false) must not unlock the legacy block - it is not verified ranking evidence.");
  assert.equal(hasVerifiedMarketEvidence([{ rankingVerified: false }, { rankingVerified: true }]), true, "At least one real overseas verified-ranking row (END/RAKUTEN_FASHION) must unlock the legacy block.");
}

function verifyPlanningDashboardHelpers() {
  assert.equal(matchesPlanningGender("UNISEX", "uni"), true, "UNI dashboard filter must include explicit UNISEX evidence.");
  assert.equal(matchesPlanningGender("WOMEN", "women"), true, "WOMEN dashboard filter must include explicit WOMEN evidence.");
  assert.equal(matchesPlanningGender("MEN", "uni"), false, "MEN evidence must not be auto-converted into UNI.");
  assert.equal(matchesPlanningGender("UNKNOWN", "women"), false, "UNKNOWN evidence must not enter WOMEN planning filters.");
  assert.equal(matchesPlanningGender("UNKNOWN", "all"), true, "Overall dashboard may include UNKNOWN evidence.");
  assert.equal(planningItemKey("BODY_BAG"), "BAG", "Editorial sub-item bag evidence should match market BAG item rows.");
  assert.equal(planningItemKey("HEADWEAR"), "CAP", "Editorial headwear evidence should match market cap item rows.");
  assert.equal(classifyPlanningInsight({ trendStrong: true, storeStrong: true, hasTrend: true, hasStore: true }), "기획 우선 검토");
  assert.equal(classifyPlanningInsight({ trendStrong: true, storeStrong: false, hasTrend: true, hasStore: false }), "선행 트렌드");
  assert.equal(classifyPlanningInsight({ trendStrong: false, storeStrong: true, hasTrend: false, hasStore: true }), "상업형 아이템");
  assert.equal(classifyPlanningInsight({ trendStrong: false, storeStrong: false, hasTrend: true, hasStore: true }), "데이터 수집 중");
  assert.equal(classifyPlanningInsight({ trendStrong: false, storeStrong: false, hasTrend: true, hasStore: false }), "트렌드 관찰", "Domestic weak trend with no verified store must be observation, not a planning priority.");
  assert.equal(classifyPlanningInsight({ trendStrong: false, storeStrong: false, hasTrend: false, hasStore: false }), "데이터 수집 중");
}

function verifyDomesticFirstTaxonomy() {
  assert.equal(categoryOfItemType("CAP"), "HEADWEAR", "CAP item type must map to the HEADWEAR broad category.");
  assert.equal(categoryOfSpecificItem("BALL_CAP"), "HEADWEAR", "BALL_CAP is a specific item under HEADWEAR.");
  assert.equal(categoryOfSpecificItem("KNIT_BEANIE"), "HEADWEAR", "KNIT_BEANIE is a specific item under HEADWEAR.");
  assert.equal(categoryOfSpecificItem("RINGER_TEE"), "TOP", "RINGER_TEE is a specific item under TOP, not its own broad category.");
  assert.equal(categoryOfItemType("DENIM"), "PANTS", "DENIM is a material/category alias that must map under PANTS, never its own item card.");
  assert.equal(categoryOfItemType("KNIT"), "TOP", "KNIT is a material/category alias that must map under TOP, never its own item card.");
  assert.equal(isKnownSpecificItem("PIGMENT"), false, "PIGMENT is a DETAIL/finish, not a specific item.");
  assert.equal(matchesCategoryFilter("HEADWEAR", "ALL"), true);
  assert.equal(matchesCategoryFilter("HEADWEAR", "BAG"), false);

  const beanieMentions = extractEditorialMentions({ title: "Knit beanie styling", text: "A knit beanie leads this look, alongside a camp cap and a ball cap." });
  assert.ok(beanieMentions.some((mention) => mention.type === "SUB_ITEM" && mention.value === "KNIT_BEANIE"), "KNIT_BEANIE must be extractable as a specific item.");
  assert.ok(beanieMentions.some((mention) => mention.type === "SUB_ITEM" && mention.value === "CAMP_CAP"), "CAMP_CAP must be extractable as a specific item.");
  assert.ok(beanieMentions.some((mention) => mention.type === "SUB_ITEM" && mention.value === "BALL_CAP"), "BALL_CAP must be extractable as a specific item.");

  // Coverage additions confirmed against real DB text (audit-specific-item-phrases.ts).
  assert.ok(extractEditorialMentions({ title: "baseball cap styling", text: "" }).some((mention) => mention.value === "BALL_CAP"), "baseball cap phrasing must resolve to BALL_CAP.");
  assert.ok(extractEditorialMentions({ title: "토트백 착용", text: "" }).some((mention) => mention.type === "SUB_ITEM" && mention.value === "TOTE_BAG"), "TOTE_BAG must be extractable as a specific item.");
  assert.ok(extractEditorialMentions({ title: "롱슬리브 티셔츠", text: "" }).some((mention) => mention.value === "LONG_SLEEVE_TEE"), "Fixed 롱슬리브 pattern must resolve to LONG_SLEEVE_TEE (previous pattern had a typo and never matched).");
  const checkMentions = extractEditorialMentions({ title: "체크 셔츠 스타일링", text: "" });
  assert.ok(checkMentions.some((mention) => mention.type === "DETAIL" && mention.value === "CHECK"), "CHECK must be a DETAIL mention.");
  assert.ok(!checkMentions.some((mention) => mention.type === "SUB_ITEM" && mention.value === "CHECK"), "CHECK must never be classified as a SPECIFIC_ITEM (dimension separation).");
  const stripeMentions = extractEditorialMentions({ title: "스트라이프 패턴 니트", text: "" });
  assert.ok(stripeMentions.some((mention) => mention.type === "DETAIL" && mention.value === "STRIPE"), "STRIPE must be a DETAIL mention.");
  assert.ok(!stripeMentions.some((mention) => mention.type === "SUB_ITEM" && mention.value === "STRIPE"), "STRIPE must never be classified as a SPECIFIC_ITEM (dimension separation).");

  // 2026-09-08 item taxonomy coverage audit (docs/EDITORIAL_ITEM_TAXONOMY_AUDIT.md).
  // Category mapping for the 5 accepted items.
  assert.equal(categoryOfSpecificItem("COAT"), "OUTER", "COAT is a specific item under OUTER.");
  assert.equal(categoryOfSpecificItem("VEST"), "OUTER", "VEST is a specific item under OUTER.");
  assert.equal(categoryOfSpecificItem("DOWN_JACKET"), "OUTER", "DOWN_JACKET is a specific item under OUTER.");
  assert.equal(categoryOfSpecificItem("VARSITY_JACKET"), "OUTER", "VARSITY_JACKET is a specific item under OUTER.");
  assert.equal(categoryOfSpecificItem("DENIM_JACKET"), "OUTER", "DENIM_JACKET is a specific item under OUTER.");

  // Positive extraction, each phrase drawn from the real corpus.
  assert.ok(extractEditorialMentions({ title: "트렌치코트 스타일링", text: "" }).some((m) => m.type === "SUB_ITEM" && m.value === "COAT"), "트렌치코트 must resolve to COAT (코트 is a true suffix of real coat compounds).");
  assert.ok(extractEditorialMentions({ title: "다운 베스트 스타일링", text: "" }).some((m) => m.type === "SUB_ITEM" && m.value === "VEST"), "베스트 must resolve to VEST.");
  assert.ok(extractEditorialMentions({ title: "리버서블 다운 재킷", text: "" }).some((m) => m.value === "DOWN_JACKET"), "다운 재킷 must resolve to DOWN_JACKET.");
  assert.ok(extractEditorialMentions({ title: "빈티지 무드의 바시티 재킷", text: "" }).some((m) => m.value === "VARSITY_JACKET"), "바시티 재킷 must resolve to VARSITY_JACKET.");
  assert.ok(extractEditorialMentions({ title: "워싱 데님 재킷", text: "" }).some((m) => m.value === "DENIM_JACKET"), "데님 재킷 must resolve to DENIM_JACKET.");

  // REGRESSION GUARDS: real corpus false positives found and excluded during
  // this pass. Each must resolve to zero COAT/VEST mentions.
  assert.ok(!extractEditorialMentions({ title: "코트니 카다시안 인터뷰", text: "" }).some((m) => m.value === "COAT"), "코트니(name) must never resolve to COAT.");
  assert.ok(!extractEditorialMentions({ title: "테니스 코트에서 포착한 스타일", text: "" }).some((m) => m.value === "COAT"), "테니스 코트 must never resolve to COAT.");
  assert.ok(!extractEditorialMentions({ title: "라코스테 코트 스니커즈 출시", text: "" }).some((m) => m.value === "COAT"), "코트 스니커즈 must never resolve to COAT.");
  assert.ok(!extractEditorialMentions({ title: "코트 헤리티지를 담은 신발", text: "" }).some((m) => m.value === "COAT"), "코트 헤리티지 must never resolve to COAT.");
  assert.ok(!extractEditorialMentions({ title: "탁구 코트화 리뷰", text: "" }).some((m) => m.value === "COAT"), "코트화 must never resolve to COAT.");
  assert.ok(!extractEditorialMentions({ title: "이번 프로젝트는 농구 코트가 아닌 야구에서 영감받았다", text: "" }).some((m) => m.value === "COAT"), "농구 코트 (basketball court) must never resolve to COAT.");
  assert.ok(!extractEditorialMentions({ title: "파크를 대표하는 공포 마스코트를 공개했다", text: "" }).some((m) => m.value === "COAT"), "마스코트(mascot) must never resolve to COAT - 코트 is only a substring of the word, not the item.");
  assert.ok(!extractEditorialMentions({ title: "이 시즌 베스트셀러 아이템", text: "" }).some((m) => m.value === "VEST"), "베스트셀러 must never resolve to VEST.");

  // SHIRT/SHORTS/SKIRT/SWEATSHIRT/CARDIGAN were previously blocked because
  // they collide with Product Reference's own supplemental item vocabulary
  // (same value names in ./taxonomy.ts). The 2026-09-08 decoupling pass
  // fixed the actual coupling (Product Reference now reads a permanently
  // frozen snapshot - see frozen-editorial-vocabulary.ts and
  // verifyEditorialProductReferenceScopeIsolation), so all 5 previously
  // blocked candidates ship in this pass.
  assert.equal(categoryOfSpecificItem("SHIRT"), "TOP", "SHIRT is a specific item under TOP.");
  assert.equal(categoryOfSpecificItem("SWEATSHIRT"), "TOP", "SWEATSHIRT is a specific item under TOP.");
  assert.equal(categoryOfSpecificItem("CARDIGAN"), "TOP", "CARDIGAN is a specific item under TOP.");
  assert.equal(categoryOfSpecificItem("SHORTS"), "PANTS", "SHORTS is a specific item under PANTS.");
  assert.equal(categoryOfSpecificItem("SKIRT"), "PANTS", "SKIRT is a specific item under PANTS.");

  // Positive extraction, each phrase drawn from the real corpus.
  assert.ok(extractEditorialMentions({ title: "워크웨어 셔츠 스타일링", text: "" }).some((m) => m.type === "SUB_ITEM" && m.value === "SHIRT"), "셔츠 must resolve to SHIRT.");
  assert.ok(extractEditorialMentions({ title: "레더 소재의 데님 쇼츠", text: "" }).some((m) => m.value === "SHORTS"), "쇼츠 must resolve to SHORTS.");
  assert.ok(extractEditorialMentions({ title: "반바지 스타일링", text: "" }).some((m) => m.value === "SHORTS"), "반바지 must resolve to SHORTS.");
  assert.ok(extractEditorialMentions({ title: "레드 스커트 스타일링", text: "" }).some((m) => m.value === "SKIRT"), "스커트 must resolve to SKIRT.");
  assert.ok(extractEditorialMentions({ title: "워싱된 스웨트셔츠", text: "" }).some((m) => m.value === "SWEATSHIRT"), "스웨트셔츠 must resolve to SWEATSHIRT.");
  assert.ok(extractEditorialMentions({ title: "니트 랩 가디건", text: "" }).some((m) => m.value === "CARDIGAN"), "가디건 must resolve to CARDIGAN.");
  assert.ok(extractEditorialMentions({ title: "청키한 니트 카디건", text: "" }).some((m) => m.value === "CARDIGAN"), "카디건 (alternate spelling) must also resolve to CARDIGAN.");

  // SHIRT COLLISION GUARDS (step 10 of the decoupling pass): generic SHIRT
  // must never swallow the more specific items it could textually overlap
  // with.
  const tshirtMentions = extractEditorialMentions({ title: "화이트 티셔츠 스타일링", text: "" });
  assert.ok(tshirtMentions.some((m) => m.value === "T_SHIRT"), "티셔츠 must still resolve to T_SHIRT.");
  assert.equal(tshirtMentions.some((m) => m.type === "SUB_ITEM" && m.value === "SHIRT"), false, "티셔츠 must NEVER also double-tag as generic SHIRT - a T-shirt is not a dress/collared shirt.");
  assert.equal(extractEditorialMentions({ title: "이번 컬래버레이션은 총 세 가지 T셔츠로 구성된다", text: "" }).some((m) => m.type === "SUB_ITEM" && m.value === "SHIRT"), false, "T셔츠 (fused Latin-T form, distinct from 티셔츠) must also never double-tag as generic SHIRT - a real corpus false positive found and fixed during this pass.");
  const sweatshirtMentions = extractEditorialMentions({ title: "워싱된 스웨트셔츠 스타일링", text: "" });
  assert.ok(sweatshirtMentions.some((m) => m.value === "SWEATSHIRT"), "스웨트셔츠 must still resolve to SWEATSHIRT.");
  assert.equal(sweatshirtMentions.some((m) => m.type === "SUB_ITEM" && m.value === "SHIRT"), false, "스웨트셔츠 must NEVER also double-tag as generic SHIRT (verified real-corpus regression: this used to double-fire SHIRT+WASHED and SWEATSHIRT+WASHED from identical evidence).");
  const rugbyMentions = extractEditorialMentions({ title: "rugby shirt styling", text: "" });
  assert.ok(rugbyMentions.some((m) => m.value === "RUGBY_SHIRT"), "rugby shirt must still resolve to the existing, more specific RUGBY_SHIRT.");
  assert.equal(rugbyMentions.some((m) => m.type === "SUB_ITEM" && m.value === "SHIRT"), false, "rugby shirt must not double-tag generic SHIRT via the English word 'shirt'.");

  // SHORTS boundary: must not fire on the bare English adjective "short".
  assert.equal(extractEditorialMentions({ title: "a short trench coat this season", text: "" }).some((m) => m.value === "SHORTS"), false, "The bare adjective 'short' must never resolve to SHORTS - only the plural noun 'shorts' or Korean 쇼츠/반바지.");
}

function verifyEvidenceStrengthLabels() {
  assert.equal(evidenceStrengthLabel({ articlePresence: 1, sourceSpread: 1 }), "관찰 시작", "A single article from a single source must read as 관찰 시작, not a trend claim.");
  assert.equal(evidenceStrengthLabel({ articlePresence: 3, sourceSpread: 1 }), "특정 매체 집중", "Repeated mentions from ONE outlet must never read as a broad trend, regardless of article count.");
  assert.equal(evidenceStrengthLabel({ articlePresence: 2, sourceSpread: 2 }), "여러 매체 동시 관찰", "Two distinct outlets must read as multi-source observation.");
  assert.equal(evidenceStrengthLabel({ articlePresence: 5, sourceSpread: 3, change7dArticlePresence: 0 }), "다수 매체 공통", "Three+ sources without recent momentum must not claim '상승'.");
  assert.equal(evidenceStrengthLabel({ articlePresence: 5, sourceSpread: 3, change7dArticlePresence: 2 }), "트렌드 상승", "Three+ sources WITH recent momentum may claim 트렌드 상승.");
}

async function verifyDomesticFirstFiltering() {
  // Gender filter: UNKNOWN must never satisfy a UNI/WOMEN filter (never auto-included).
  assert.equal(matchesGenderFilterValue("UNKNOWN", "uni"), false, "UNKNOWN must not satisfy the UNI filter.");
  assert.equal(matchesGenderFilterValue("UNKNOWN", "women"), false, "UNKNOWN must not satisfy the WOMEN filter.");
  assert.equal(matchesGenderFilterValue("UNISEX", "uni"), true, "UNI filter must accept explicit UNISEX evidence.");
  assert.equal(matchesGenderFilterValue("WOMEN", "women"), true, "WOMEN filter must accept explicit WOMEN evidence.");
  assert.equal(matchesGenderFilterValue("MEN", "uni"), false, "MEN must not satisfy the UNI filter.");
  assert.equal(matchesGenderFilterValue(null, "all"), true, "The overall (전체) filter accepts rows with no gender evidence.");

  // Domestic default: no verified domestic STORE ranking source exists yet,
  // so the dashboard must never surface store evidence or a "기획 우선 검토"
  // insight in the default scope.
  const domesticData = await getPlanningDashboardData("all", "domestic");
  assert.equal(domesticData.storeRisers.length, 0, "Domestic scope must not surface overseas store movement as if it were domestic.");
  assert.equal(domesticData.assortment.length, 0, "Domestic scope must not surface overseas assortment.");
  assert.ok(!domesticData.planningInsights.some((insight) => insight.decision === "기획 우선 검토"), "Domestic scope must never auto-combine overseas store evidence into '기획 우선 검토'.");
  assert.ok(!domesticData.planningInsights.some((insight) => insight.usesOverseasReference), "Domestic scope insights must not silently use overseas reference evidence.");

  // Overseas reference: explicitly opting in may surface store evidence, but
  // STORE ranking must exclude SLAM_JAM/STUSSY assortment rows.
  const overseasData = await getPlanningDashboardData("all", "overseas");
  assert.ok(!overseasData.storeRisers.some((row) => row.source === "SLAM_JAM" || row.source === "STUSSY"), "STORE ranking rows must exclude assortment sources even in overseas reference scope.");
  assert.ok(overseasData.storeRisers.every((row) => row.rankingVerified), "STORE movement rows must always be rankingVerified.");

  const marketRows = (await getMarketRows({ dataMode: "real" })).rows;
  const rankingOnly = marketRows.filter((row) => row.rankingVerified);
  assert.ok(!rankingOnly.some((row) => row.source === "SLAM_JAM" || row.source === "STUSSY"), "SLAM_JAM/STUSSY assortment rows must never be rankingVerified STORE rows.");

  // Data preservation: the editorial mention reparse and taxonomy additions
  // must never reduce REAL EditorialPost or MarketRankingSnapshot counts.
  const realEditorialPosts = await prisma.editorialPost.count({ where: { dataMode: "real" } });
  const realMarketSnapshots = await prisma.marketRankingSnapshot.count({ where: { dataMode: "real" } });
  assert.ok(realEditorialPosts >= 148, `Expected REAL EditorialPost count to stay at or above 148, got ${realEditorialPosts}.`);
  assert.ok(realMarketSnapshots >= 667, `Expected REAL MarketRankingSnapshot count to stay at or above 667, got ${realMarketSnapshots}.`);

  // No duplicate EditorialMention rows per post/type/value after reparse.
  const allRealMentions = await prisma.editorialMention.findMany({ where: { post: { dataMode: "real" } }, select: { postId: true, type: true, value: true } });
  const mentionKeys = allRealMentions.map((mention) => `${mention.postId}:${mention.type}:${mention.value}`);
  assert.equal(new Set(mentionKeys).size, mentionKeys.length, "EditorialMention reparse must not create duplicate (postId, type, value) rows.");
}

async function verifyDemandSignalHelpers() {
  // Credential status must reflect the real environment - never fabricate REAL data when missing.
  assert.equal(getNaverCredentialStatus(), "MISSING", "NAVER credentials are not configured in this environment; status must report MISSING.");

  // Specific-item keyword mapping exists for the priority items identified by the editorial coverage audit.
  const bySpecificItem = new Map(fashionKeywordSeeds.filter((keyword) => keyword.specificItem).map((keyword) => [keyword.specificItem, keyword]));
  for (const item of ["TRACK_JACKET", "TOTE_BAG", "BACKPACK", "SHOULDER_BAG", "LONG_SLEEVE_TEE"]) {
    assert.ok(bySpecificItem.has(item), `Expected a NAVER keyword mapped to specificItem=${item}.`);
    assert.equal(bySpecificItem.get(item)?.planningGender, "UNISEX", `${item} keyword should be tagged planningGender=UNISEX.`);
  }

  // TREND x DEMAND decision rules (section 21): DEMAND never substitutes for STORE.
  assert.equal(
    classifyDomesticTrendDemandInsight({ trendStrong: true, hasTrend: true, trendDeclining: false, demandStrong: true, hasDemand: true, demandDeclining: false }),
    "기획 검토 강화"
  );
  assert.equal(
    classifyDomesticTrendDemandInsight({ trendStrong: true, hasTrend: true, trendDeclining: false, demandStrong: false, hasDemand: false, demandDeclining: false }),
    "선행 트렌드"
  );
  assert.equal(
    classifyDomesticTrendDemandInsight({ trendStrong: false, hasTrend: false, trendDeclining: false, demandStrong: true, hasDemand: true, demandDeclining: false }),
    "수요형 아이템"
  );
  assert.equal(
    classifyDomesticTrendDemandInsight({ trendStrong: false, hasTrend: true, trendDeclining: true, demandStrong: false, hasDemand: true, demandDeclining: true }),
    "관찰 우선순위 낮음"
  );
  assert.equal(
    classifyDomesticTrendDemandInsight({ trendStrong: false, hasTrend: false, trendDeclining: false, demandStrong: false, hasDemand: false, demandDeclining: false }),
    "데이터 수집 중"
  );

  // REAL/MOCK separation + 7D/14D point-change (not %) + specific-item + planningGender filtering, via an isolated fixture.
  const testKeywordName = "TEST-DEMAND-KEYWORD";
  await prisma.keywordShoppingAgeSnapshot.deleteMany({ where: { keyword: { name: testKeywordName } } });
  await prisma.trendKeyword.deleteMany({ where: { name: testKeywordName } });
  const keyword = await prisma.trendKeyword.create({
    data: {
      name: testKeywordName,
      category: "TOP",
      aliases: JSON.stringify([]),
      specificItem: "TEST_SPECIFIC_ITEM",
      planningGender: "UNISEX",
      active: true
    }
  });

  const weeks = [-21, -14, -7, 0].map((daysOffset) => new Date(new Date("2026-08-01T00:00:00.000Z").getTime() + daysOffset * 86400000));
  const teenRatios = [40, 46, 52, 60]; // rising REAL series
  for (const [index, period] of weeks.entries()) {
    await prisma.keywordShoppingAgeSnapshot.create({
      data: { keywordId: keyword.id, source: "NAVER_SHOPPING_INSIGHT", ageGroup: "10-19", gender: "ALL", period, ratio: teenRatios[index]!, dataMode: "real", collectedAt: period }
    });
  }
  // A MOCK row must never be read into REAL demand output, even for the same keyword.
  await prisma.keywordShoppingAgeSnapshot.create({
    data: { keywordId: keyword.id, source: "NAVER_SHOPPING_INSIGHT", ageGroup: "20-29", gender: "ALL", period: weeks.at(-1)!, ratio: 99, dataMode: "mock", collectedAt: weeks.at(-1)! }
  });

  const uniRows = await getDemandSignalRows("uni");
  const testRow = uniRows.find((row) => row.keywordName === testKeywordName);
  assert.ok(testRow, "UNI-filtered demand rows must include a UNISEX-tagged keyword.");
  assert.equal(testRow!.byAge["10-19"].current, 60, "Current 10대 ratio must be the latest REAL snapshot.");
  assert.equal(testRow!.byAge["10-19"].change7d, 8, "7D change must be a raw index-point difference (60 - 52 = 8pt), not a percent.");
  assert.equal(testRow!.byAge["10-19"].change14d, 14, "14D change must compare 2 periods back within the SAME series (60 - 46 = 14pt).");
  assert.equal(testRow!.observation, "관심 증가", "A clear positive point-change must classify as 관심 증가, never '수요 폭발'-style wording.");
  assert.equal(testRow!.byAge["20-29"].current, null, "A MOCK-only age group must never surface as REAL demand data (dataMode separation).");

  const womenRows = await getDemandSignalRows("women");
  assert.ok(!womenRows.some((row) => row.keywordName === testKeywordName), "A UNISEX planningGender keyword must not appear in the WOMEN filter (planningGender != shopperGender, and filtering never touches shopperGender).");

  // Store stays a wholly separate axis in the TREND x DEMAND matrix.
  const domesticForDemand = await getPlanningDashboardData("all", "domestic");
  assert.ok(
    domesticForDemand.trendDemandRows.every((row) => row.storeStatus === "국내 스토어 데이터 없음" && row.top20Presence === 0 && row.top50Presence === 0 && row.storeSources.length === 0),
    "TREND x DEMAND rows must never carry STORE evidence - STORE stays a separate, honestly-empty axis."
  );

  await prisma.keywordShoppingAgeSnapshot.deleteMany({ where: { keyword: { name: testKeywordName } } });
  await prisma.trendKeyword.deleteMany({ where: { name: testKeywordName } });
}

async function verifyMarketCollectionPartialPersistence() {
  const externalProductId = "TEST-COLLECTOR-PARTIAL";
  await prisma.marketRankingSnapshot.deleteMany({ where: { marketProduct: { externalProductId } } });
  await prisma.marketProduct.deleteMany({ where: { externalProductId } });
  await prisma.importRun.deleteMany({ where: { source: "BODEGA", fileName: "collector:TEST" } });

  const periodDate = new Date("2026-08-28T00:00:00.000Z");
  const result = await persistMarketCollectionResult({
    source: "BODEGA",
    category: "SHORT_SLEEVE_TSHIRT",
    audienceSegment: "ALL",
    collectedAt: new Date("2026-08-28T09:00:00.000Z"),
    status: "PARTIAL_SUCCESS",
    method: "TEST",
    fetchedCount: 2,
    products: [
      {
        source: "BODEGA",
        externalProductId,
        brand: "TEST",
        name: "Collector Test Tee",
        url: "https://example.com/products/collector-test",
        metricType: "RANKING",
        rankingVerified: true,
        rankingScope: "CATEGORY",
        sourcePosition: 1,
        rank: 1,
        rankingCategory: "SHORT_SLEEVE_TSHIRT",
        observedCategory: "SHORT_SLEEVE_TSHIRT",
        audienceSegment: "ALL",
        periodDate,
        category: "SHORT_SLEEVE_TSHIRT",
        itemType: "T_SHIRT",
        subItemType: "OTHER"
      }
    ],
    errors: [{ source: "BODEGA", category: "SHORT_SLEEVE_TSHIRT", reason: "Fixture parse failure", timestamp: new Date("2026-08-28T09:01:00.000Z") }]
  });
  assert.equal(result.saved, 1);
  assert.equal(result.failed, 1);
  assert.equal(result.status, "PARTIAL_SUCCESS");
  const product = await prisma.marketProduct.findUnique({ where: { source_externalProductId: { source: "BODEGA", externalProductId } }, include: { rankingSnapshots: true } });
  assert.equal(product?.rankingSnapshots.length, 1, "Partial collector result should save valid products.");

  await prisma.marketRankingSnapshot.deleteMany({ where: { marketProduct: { externalProductId } } });
  await prisma.marketProduct.deleteMany({ where: { externalProductId } });
  await prisma.importRun.deleteMany({ where: { source: "BODEGA", fileName: "collector:TEST" } });
}

function verifyBusinessSignals() {
  assert.equal(classifySalesSignal({ salesQty: 181, stockQty: 42, sellThroughRate: 82, change1w: 41 }), "BEST_SELLER");
  assert.equal(classifySalesSignal({ salesQty: 180, stockQty: 20, sellThroughRate: 88, change1w: 30 }), "STOCK_RISK");
  assert.equal(classifySalesSignal({ salesQty: 12, stockQty: 320, sellThroughRate: 12, change1w: -30 }), "OVERSTOCK");
  assert.equal(classifyItemSignal({ itemType: "T_SHIRT", subItemType: "RINGER_TEE", label: "Ringer Tee", marketStyleCount: 20, marketTopCount: 12, sourceCount: 3, sources: ["MUSINSA", "29CM", "KREAM"], rankingSourceCount: 3, assortmentSourceCount: 0, currentCount: 20, newlyAddedCount: 0, removedCount: 0, countChange1w: 4, countChange4w: 8, marketChange1w: 18, marketChange2w: 30, marketChange4w: 44, averageRank: 34, bestRank: 4, avgMarketPrice: 42000, rankingSignal: "INSUFFICIENT_DATA", assortmentSignal: "INSUFFICIENT_DATA" }), "HIGH_OPPORTUNITY");
  assert.equal(classifyItemSignal({ itemType: "PANTS", subItemType: "CARGO_PANTS", label: "Cargo Pants", marketStyleCount: 8, marketTopCount: 4, sourceCount: 2, sources: ["MUSINSA", "29CM"], rankingSourceCount: 2, assortmentSourceCount: 0, currentCount: 8, newlyAddedCount: 0, removedCount: 0, countChange1w: -2, countChange4w: -4, marketChange1w: -25, marketChange2w: -28, marketChange4w: -35, averageRank: 88, bestRank: 42, avgMarketPrice: 69000, rankingSignal: "INSUFFICIENT_DATA", assortmentSignal: "INSUFFICIENT_DATA" }), "COOLING");
  assert.equal(classifyItemSignal({ itemType: "T_SHIRT", subItemType: "RINGER_TEE", label: "Ringer Tee", marketStyleCount: 7, marketTopCount: 0, sourceCount: 2, sources: ["SLAM_JAM", "STUSSY"], rankingSourceCount: 0, assortmentSourceCount: 2, currentCount: 7, newlyAddedCount: 3, removedCount: 0, countChange1w: 3, countChange4w: null, marketChange1w: null, marketChange2w: null, marketChange4w: null, averageRank: null, bestRank: null, avgMarketPrice: 42000, rankingSignal: "NO_VERIFIED_RANKING", assortmentSignal: "INSUFFICIENT_DATA" }), "NO_VERIFIED_RANKING");
  assert.equal(classifyAssortmentItemSignal({ assortmentSourceCount: 2, sourceCount: 2, currentCount: 7, newlyAddedCount: 3, countChange1w: 3, countChange4w: null }), "NEW_ASSORTMENT_SIGNAL");
  const collectionRow = toMarketRow({
    id: "collection-test",
    source: "STUSSY",
    externalProductId: "collection-test",
    brand: "STUSSY",
    name: "Collection Tee",
    category: "SHORT_SLEEVE_TSHIRT",
    url: "https://example.com/collection-test",
    imageUrl: null,
    itemType: "T_SHIRT",
    subItemType: "RINGER_TEE",
    fit: null,
    mainColor: null,
    subColor: null,
    material: null,
    graphicType: null,
    detail: null,
    style: null,
    gender: null,
    dataMode: "real",
    createdAt: new Date("2026-08-28T00:00:00.000Z"),
    rankingSnapshots: [
      { periodDate: new Date("2026-08-28T00:00:00.000Z"), rankingCategory: "SHORT_SLEEVE_TSHIRT", audienceSegment: "ALL", metricType: "COLLECTION_ORDER", rankingVerified: false, sourcePosition: 1, rank: null, price: null, salePrice: 42000, discountRate: null, reviewCount: null, likeCount: null },
      { periodDate: new Date("2026-09-04T00:00:00.000Z"), rankingCategory: "SHORT_SLEEVE_TSHIRT", audienceSegment: "ALL", metricType: "COLLECTION_ORDER", rankingVerified: false, sourcePosition: 20, rank: null, price: null, salePrice: 42000, discountRate: null, reviewCount: null, likeCount: null }
    ]
  });
  assert.equal(collectionRow.signal, "STILL_PRESENT");
  assert.equal(collectionRow.change1w, null, "COLLECTION_ORDER position movement must not create ranking change.");
  assert.equal(collectionRow.bestRank, null, "COLLECTION_ORDER data must not produce bestRank.");
  assert.equal(collectionRow.averageRank, null, "COLLECTION_ORDER data must not produce averageRank.");
  assert.equal(collectionRow.rankVolatility, null, "COLLECTION_ORDER data must not produce rankVolatility.");
  const presenceRows = applyMarketPresenceStatuses([
    collectionRow,
    toMarketRow({
      id: "new-presence-test",
      source: "STUSSY",
      externalProductId: "new-presence-test",
      brand: "STUSSY",
      name: "New Catalog Tee",
      category: "SHORT_SLEEVE_TSHIRT",
      url: "https://example.com/new-presence-test",
      imageUrl: null,
      itemType: "T_SHIRT",
      subItemType: "RINGER_TEE",
      fit: null,
      mainColor: null,
      subColor: null,
      material: null,
      graphicType: null,
      detail: null,
      style: null,
      gender: null,
      dataMode: "real",
      createdAt: new Date("2026-09-04T00:00:00.000Z"),
      rankingSnapshots: [
        { periodDate: new Date("2026-09-04T00:00:00.000Z"), rankingCategory: "SHORT_SLEEVE_TSHIRT", audienceSegment: "ALL", metricType: "COLLECTION_ORDER", rankingVerified: false, sourcePosition: 2, rank: null, price: null, salePrice: 42000, discountRate: null, reviewCount: null, likeCount: null }
      ]
    }),
    toMarketRow({
      id: "removed-presence-test",
      source: "STUSSY",
      externalProductId: "removed-presence-test",
      brand: "STUSSY",
      name: "Removed Catalog Tee",
      category: "SHORT_SLEEVE_TSHIRT",
      url: "https://example.com/removed-presence-test",
      imageUrl: null,
      itemType: "T_SHIRT",
      subItemType: "GRAPHIC_TEE",
      fit: null,
      mainColor: null,
      subColor: null,
      material: null,
      graphicType: null,
      detail: null,
      style: null,
      gender: null,
      dataMode: "real",
      createdAt: new Date("2026-08-28T00:00:00.000Z"),
      rankingSnapshots: [
        { periodDate: new Date("2026-08-28T00:00:00.000Z"), rankingCategory: "SHORT_SLEEVE_TSHIRT", audienceSegment: "ALL", metricType: "COLLECTION_ORDER", rankingVerified: false, sourcePosition: 3, rank: null, price: null, salePrice: 42000, discountRate: null, reviewCount: null, likeCount: null }
      ]
    })
  ]);
  assert.equal(presenceRows.find((row) => row.id === "new-presence-test")?.presenceStatus, "NEWLY_ADDED");
  assert.equal(presenceRows.find((row) => row.id === "removed-presence-test")?.presenceStatus, "REMOVED");
  const rankingRow = toMarketRow({
    ...collectionRow,
    id: "ranking-test",
    source: "TEST_RANKING",
    externalProductId: "ranking-test",
    createdAt: new Date("2026-08-28T00:00:00.000Z"),
    rankingSnapshots: [
      { periodDate: new Date("2026-09-08T00:00:00.000Z"), rankingScope: "CATEGORY", rankingCategory: "SHORT_SLEEVE_TSHIRT", observedCategory: "SHORT_SLEEVE_TSHIRT", audienceSegment: "ALL", metricType: "RANKING", rankingVerified: true, sourcePosition: 67, rank: 67, price: null, salePrice: 42000, discountRate: null, reviewCount: null, likeCount: null },
      { periodDate: new Date("2026-09-10T00:00:00.000Z"), rankingScope: "CATEGORY", rankingCategory: "SHORT_SLEEVE_TSHIRT", observedCategory: "SHORT_SLEEVE_TSHIRT", audienceSegment: "ALL", metricType: "RANKING", rankingVerified: true, sourcePosition: 21, rank: 21, price: null, salePrice: 42000, discountRate: null, reviewCount: null, likeCount: null },
      { periodDate: new Date("2026-09-11T00:00:00.000Z"), rankingScope: "CATEGORY", rankingCategory: "SHORT_SLEEVE_TSHIRT", observedCategory: "SHORT_SLEEVE_TSHIRT", audienceSegment: "ALL", metricType: "RANKING", rankingVerified: true, sourcePosition: 7, rank: 7, price: null, salePrice: 42000, discountRate: null, reviewCount: null, likeCount: null }
    ]
  });
  assert.equal(rankingRow.signal, "FAST_RISING");
  assert.equal(rankingRow.change1d, 14, "1D movement must compare the exact previous calendar date.");
  assert.equal(rankingRow.change3d, 60, "3D movement must compare the exact three-day-back calendar date.");
  assert.equal(rankingRow.change7d, null, "7D movement must stay null when the exact date is unavailable.");
  assert.equal(rankingRow.bestRank, 7);
  assert.equal(rankChangeByDays({ periodDate: new Date("2026-09-03T00:00:00.000Z"), rank: 25 }, [{ periodDate: new Date("2026-09-01T00:00:00.000Z"), rank: 40 }], 1), null, "Missing 1D date must not fall back to older snapshots.");
  assert.equal(signalConfidence(1), "BASELINE");
  assert.equal(signalConfidence(2), "EARLY_DATA");
  assert.equal(signalConfidence(4), "ACTIVE_SIGNAL");
}

function assertAdapterResult(result: CollectionResult) {
  assert.equal(typeof result.source, "string");
  assert.ok(result.mode === "mock" || result.mode === "real");
  assert.ok(Array.isArray(result.items));
  assert.ok(Array.isArray(result.failures));
  assert.equal(typeof result.fetchedCount, "number");
}

async function verifyRankingPersistenceBehavior() {
  const externalId = "test-upsert-product";
  await prisma.rankingSnapshot.deleteMany({ where: { product: { externalId } } });
  await prisma.product.deleteMany({ where: { externalId } });
  await persistCollectionResult(
    {
      source: "test",
      mode: "mock",
      fetchedCount: 1,
      failures: [],
      items: [{ externalId, source: "test", brand: "TEST", name: "Test Product", url: "https://example.com/products/test", imageUrl: null, category: "Top", rank: 37, collectedAt: new Date("2026-08-27T09:00:00.000Z") }]
    },
    new Date("2026-08-27T00:00:00.000Z")
  );
  await persistCollectionResult(
    {
      source: "test",
      mode: "mock",
      fetchedCount: 1,
      failures: [],
      items: [{ externalId, source: "test", brand: "TEST UPDATED", name: "Test Product", url: "https://example.com/products/test", imageUrl: null, category: "Top", rank: 11, collectedAt: new Date("2026-08-28T09:00:00.000Z") }]
    },
    new Date("2026-08-28T00:00:00.000Z")
  );
  const products = await prisma.product.findMany({ where: { externalId }, include: { rankingSnapshots: true } });
  assert.equal(products.length, 1, "Same externalId must upsert into one Product row.");
  assert.equal(products[0]?.rankingSnapshots.length, 2, "RankingSnapshot must accumulate across collection times.");
  await prisma.rankingSnapshot.deleteMany({ where: { product: { externalId } } });
  await prisma.product.deleteMany({ where: { externalId } });
  await prisma.collectionRun.deleteMany({ where: { source: "test" } });
}

function restoreEnv(key: string, value: string | undefined) {
  if (value == null) delete process.env[key];
  else process.env[key] = value;
}

function endFixtureHtml() {
  const data = {
    props: {
      initialProps: {
        pageProps: {
          initialAlgoliaState: {
            query: {
              facetFilters: {
                categories: ["Clothing / Clothing Bestsellers"]
              }
            },
            results: {
              hits: [
                {
                  actual_colour: "Black",
                  brand: "MKI",
                  final_price_1: 49,
                  full_price_1: 49,
                  name: "MKI Presented by END. Swallow T-Shirt",
                  objectID: "END-FIXTURE-1",
                  sku: "MKI-SWALTSHRT-BLK",
                  small_image: "/1/4/example.jpg",
                  url_key: "mki-presented-by-end-swallow-t-shirt-mki-swaltshrt-blk",
                  department_hierarchy: ["Tops", "Tops > T-Shirts"]
                },
                {
                  actual_colour: "Sea Salt",
                  brand: "Arc'teryx",
                  final_price_1: 160,
                  full_price_1: 160,
                  name: "Arc'teryx Squamish Hooded Jacket",
                  objectID: "END-FIXTURE-2",
                  sku: "ARC-SQUAMISH",
                  small_image: "/a/r/example.jpg",
                  url_key: "arcteryx-squamish-hooded-jacket",
                  department_hierarchy: ["Outerwear", "Outerwear > Jackets"]
                },
                {
                  actual_colour: "Indigo",
                  brand: "Levis",
                  final_price_1: 98,
                  full_price_1: 98,
                  name: "Levis 501 Selvedge Jeans",
                  objectID: "END-FIXTURE-3",
                  sku: "LEVIS-501",
                  small_image: "/l/e/example.jpg",
                  url_key: "levis-501-selvedge-jeans",
                  department_hierarchy: ["Bottoms", "Bottoms > Jeans"]
                }
              ]
            }
          }
        }
      }
    }
  };
  return `<!doctype html><html><head><title>Men's Clothing Bestsellers | END. (US)</title></head><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script></body></html>`;
}

function rakutenRankingFixtureHtml() {
  return `<!doctype html><html><head><title>ファッションアイテムの人気ランキング | Rakuten Fashion</title></head><body>
    <h1>ファッションアイテムの人気ランキング</h1>
    <ul>
      <li class="container--24Ng3"><div><a href="https://brandavenue.rakuten.co.jp/item/SS3089/?s-id=brn_ranking_list" class="link--2nZ3c"><span class="container--XVE19 bicolor-circle-badge-common--E3Y-E">1</span><img src="https://tshop.r10s.jp/stylife/cabinet/item/089/ss3089-07_1.jpg?fitin=165:198&amp;composite-to=center,center|165:198"/></a></div><p><span class="brand-text-inline--2rQzD">FREAK’S STORE</span><span><span class="price-text--2Dw-5">11,990円</span></span></p></li>
      <li class="container--24Ng3"><div><a href="https://brandavenue.rakuten.co.jp/item/TT0001/?s-id=brn_ranking_list" class="link--2nZ3c"><span class="container--XVE19 bicolor-circle-badge-common--E3Y-E">2</span><img src="https://tshop.r10s.jp/stylife/cabinet/item/001/tt0001.jpg"/></a></div><p><span class="brand-text-inline--2rQzD">SHIPS</span><span><span class="price-text--2Dw-5">4,840円</span></span></p></li>
      <li class="container--24Ng3"><div><a href="https://brandavenue.rakuten.co.jp/item/BB0001/?s-id=brn_ranking_list" class="link--2nZ3c"><span class="container--XVE19 bicolor-circle-badge-common--E3Y-E">3</span><img src="https://tshop.r10s.jp/stylife/cabinet/item/001/bb0001.jpg"/></a></div><p><span class="brand-text-inline--2rQzD">FREAK’S STORE</span><span><span class="price-text--2Dw-5">8,998円</span></span></p></li>
    </ul>
  </body></html>`;
}

function rakutenItemFixtureHtml() {
  const breadcrumb = {
    "@context": "http://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, item: { name: "Rakuten Fashion" } },
      { "@type": "ListItem", position: 2, item: { name: "FREAK’S STORE (フリークスストア)" } },
      { "@type": "ListItem", position: 3, item: { name: "ジャケット・アウター" } },
      { "@type": "ListItem", position: 4, item: { name: "ブルゾン・ジャンパー" } },
      { "@type": "ListItem", position: 5, item: { name: "<ユニセックス>別注 配色 パイピング ボア ブルゾン 限定展開" } }
    ]
  };
  const product = {
    "@context": "http://schema.org/",
    "@type": "Product",
    name: "<ユニセックス>別注 配色 パイピング ボア ブルゾン 限定展開",
    image: "https://tshop.r10s.jp/stylife/cabinet/item/089/ss3089-07_1.jpg",
    brand: { "@type": "Brand", name: "FREAK’S STORE" },
    offers: { "@type": "Offer", price: "11990", priceCurrency: "JPY" }
  };
  return `<!doctype html><html><head><title>FREAK’S STORE | &lt;ユニセックス&gt;別注 配色 パイピング ボア ブルゾン 限定展開 | Rakuten Fashion</title><meta property="og:image" content="https://tshop.r10s.jp/stylife/cabinet/item/089/ss3089-07_1.jpg"/></head><body><script type="application/ld+json">${JSON.stringify(breadcrumb)}</script><script type="application/ld+json">${JSON.stringify(product)}</script></body></html>`;
}

main()
  .catch((error) => {
    console.error("Smoke test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
