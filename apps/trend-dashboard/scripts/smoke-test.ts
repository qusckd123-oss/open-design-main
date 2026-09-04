import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { assortmentCollectorSources, createMarketCollector, verifiedRankingCollectorSources } from "../src/collectors/market/index";
import { classifyMarketAttributes, validateSubItemForCategory } from "../src/collectors/market/classification";
import { inferEditorialGender } from "../src/collectors/editorial/gender";
import { extractEditorialMentions } from "../src/collectors/editorial/mentions";
import { extractDirectAttributeRelations } from "../src/collectors/editorial/attribute-relations";
import { bundleEvidenceStrength, getAttributeBundles, getPrimaryBundleForItem, getSpecificItemDirectAttributes, selectBundleHeroImage, selectPrimaryPlanningBundle } from "../src/services/attribute-bundle-service";
import { contentBlocksFromStoredText, resolveEvidenceImage, type ContentBlock } from "../src/collectors/editorial/image-relation";
import { attributeBarWidthPercent } from "../src/lib/attribute-visual";
import { composeBundleName } from "../src/lib/korean-labels";
import { classifyFashionRelevance, parseArticlePage, parseEyesmagRichBody, parseGenericSitemap, parseHypebeastRichBody, parseNewsSitemap, parseRssItems, parseSitemapIndex, parseVislaRichBody } from "../src/collectors/editorial/rss";
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
  await verifySpecificItemEditorialCoOccurrence();
  verifyLegacyMarketBlockVisibility();
  verifyDirectAttributeRelations();
  verifyEvidenceImageResolution();
  verifyAttributeBarWidth();
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

  // HYPEBEAST_KR encodes Korean titles as hex numeric entities; without numeric
  // entity decoding the stored title would be unreadable AND unmatchable by the
  // phrase rules.
  const entityArticle = parseArticlePage(
    `<html><head><meta property="og:title" content="&#xBC84;&#xD37C;, &#x2018;&#xB9AC;&#xC9C0;&#xBAAC;&#xD2B8;&#x2019;"><meta property="og:url" content="https://hypebeast.kr/2026/9/x"><meta name="description" content="&#48260;&#54140; &#53468;&#49472;"></head></html>`,
    "https://hypebeast.kr/2026/9/x"
  );
  assert.equal(entityArticle.title, "버퍼, ‘리지몬트’", "Hex numeric entities in a title must decode to real Korean text.");
  assert.ok(entityArticle.text.includes("버퍼"), "Decimal numeric entities must decode too.");
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
}

async function verifyAttributeBundles() {
  // Evidence strength stays conservative: article count alone never implies
  // breadth, and only 3+ outlets WITH recent movement may be a candidate.
  assert.equal(bundleEvidenceStrength({ articlePresence: 1, sourceSpread: 1 }), "단일 관측");
  assert.equal(bundleEvidenceStrength({ articlePresence: 4, sourceSpread: 1 }), "반복 관측 · 특정 매체 집중", "Many articles from ONE outlet must never read as multi-source.");
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

  // Against REAL data: TRACK_JACKET is the worked example of the direct vs
  // co-occurrence split. After the 2026-09-04 missed-vocabulary audit it has
  // exactly ONE direct attribute, from the real phrase "셔링 디테일의 트랙
  // 재킷" - and its many co-occurring values (SPORTY/RED/NYLON/DENIM/...) must
  // still never be promoted. Asserting the exact set is strictly stronger than
  // the previous "must be empty" assertion.
  const trackDirect = await getSpecificItemDirectAttributes("TRACK_JACKET", "real");
  assert.deepEqual(
    trackDirect.map((attribute) => `${attribute.type}:${attribute.value}`),
    ["DETAIL:SHIRRING"],
    "TRACK_JACKET must expose exactly its one real direct phrase (셔링), never a promoted co-occurrence value."
  );
  const trackCoOccurrence = await getSpecificItemEditorialDetail("TRACK_JACKET", "real");
  assert.ok(
    (trackCoOccurrence.cooccurrence.styles.length + trackCoOccurrence.cooccurrence.colors.length) > 0,
    "TRACK_JACKET must still keep its article co-occurrence evidence after the direct/indirect split."
  );
  const trackDirectValues = new Set(trackDirect.map((attribute) => attribute.value));
  for (const coOccurring of [...trackCoOccurrence.cooccurrence.styles, ...trackCoOccurrence.cooccurrence.colors]) {
    assert.equal(trackDirectValues.has(coOccurring.value), false, `TRACK_JACKET co-occurrence ${coOccurring.value} must never appear as a direct attribute.`);
  }

  // An item with article presence but no direct modifier phrase must still
  // resolve zero direct attributes - the honest empty state the UI relies on.
  const beanieDirect = await getSpecificItemDirectAttributes("KNIT_BEANIE", "real");
  assert.equal(beanieDirect.length, 0, "KNIT_BEANIE is mentioned but never directly modified in the REAL corpus, so it must have no direct attributes.");

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

  // Primary bundle highlight: TOTE_BAG's strongest evidence (2 articles / 1
  // source) must win over its two 1-article bundles; TRACK_JACKET has zero
  // direct attributes, so it must have no primary bundle to highlight - the
  // item detail page's empty state, not a fabricated bundle, must show.
  const totePrimary = await getPrimaryBundleForItem("TOTE_BAG", "real");
  assert.ok(totePrimary, "TOTE_BAG must resolve a primary bundle from real direct-attribute evidence.");
  assert.equal(totePrimary?.displayName, "재활용 원단 토트백", "TOTE_BAG's strongest bundle (2 articles/1 source) must be the recycled-fabric one.");
  const trackPrimary = await getPrimaryBundleForItem("TRACK_JACKET", "real");
  assert.equal(trackPrimary?.displayName, "셔링 트랙 재킷", "TRACK_JACKET's primary bundle must be its one real direct phrase.");
  assert.equal(trackPrimary?.bundleArticlePresence, 1, "셔링 트랙 재킷 is a single observation and must stay one article.");
  // An item with zero direct attributes must still have NO primary bundle -
  // the item detail page's honest empty state.
  assert.equal(await getPrimaryBundleForItem("KNIT_BEANIE", "real"), null, "KNIT_BEANIE has no direct attribute, so it must have no primary bundle to highlight.");

  // Dashboard insight priority (§8): a repeated bundle beats a single-
  // observation bundle, which beats an empty list (caller falls back to the
  // specific-item insight only then - never fabricated here).
  const repeated = { key: "r", specificItem: "X", displayName: "반복", directAttributes: [], bundleArticlePresence: 3, bundleSourceSpread: 1, latestObservedAt: null, evidenceArticles: [] };
  const single = { key: "s", specificItem: "Y", displayName: "단일", directAttributes: [], bundleArticlePresence: 1, bundleSourceSpread: 1, latestObservedAt: null, evidenceArticles: [] };
  assert.equal(selectPrimaryPlanningBundle([single, repeated])?.displayName, "반복", "A repeated bundle (>=2 articles) must be preferred over a single-observation bundle regardless of list order.");
  assert.equal(selectPrimaryPlanningBundle([single])?.displayName, "단일", "With no repeated bundle, the single-observation bundle must still be preferred over the specific-item fallback.");
  assert.equal(selectPrimaryPlanningBundle([]), null, "With zero bundles, the caller must fall back to the specific-item insight rather than fabricating one.");
  const realPrimary = selectPrimaryPlanningBundle(bundles);
  assert.equal(realPrimary?.displayName, "재활용 원단 토트백", "Against REAL data, 재활용 원단 토트백 (the only repeated bundle) must be the dashboard's primary planning bundle.");
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
