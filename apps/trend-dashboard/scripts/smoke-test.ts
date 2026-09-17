import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as XLSX from "xlsx";
import { assortmentCollectorSources, createMarketCollector, verifiedRankingCollectorSources } from "../src/collectors/market/index";
import { handleCollectionResult, runOneCollection } from "../scripts/collect-market";
import { classifyMarketAttributes, validateSubItemForCategory } from "../src/collectors/market/classification";
import { inferEditorialGender } from "../src/collectors/editorial/gender";
import { editorialRules, extractEditorialMentions } from "../src/collectors/editorial/mentions";
import { extractDirectAttributeRelations } from "../src/collectors/editorial/attribute-relations";
import { bundleEvidenceStrength, countIndependentEvidenceClusters, getAttributeBundles, getPrimaryBundleForItem, getSpecificItemDirectAttributes, selectBundleHeroImage, selectPrimaryPlanningBundle } from "../src/services/attribute-bundle-service";
import { contentBlocksFromStoredText, resolveEvidenceImage, type ContentBlock } from "../src/collectors/editorial/image-relation";
import { attributeBarWidthPercent } from "../src/lib/attribute-visual";
import { selectEditorialVisualContext } from "../src/lib/editorial-visual-context";
import { editorialCoverageLabel, editorialRecentDirection } from "../src/lib/editorial-momentum";
import { composeBundleName } from "../src/lib/korean-labels";
import { buildSignalInterpretation } from "../src/lib/signal-interpretation";
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
import { dedupeListingEntries, extractRednapeCanonicalUrl, extractRednapeListingEntries, extractRednapeProductJsonLd, isConfirmedBagProduct, normalizeRednapeOffers, normalizeRednapeProduct, type RawRednapeProduct, type RednapeListingEntry, type RednapeProductJsonLd } from "../src/collectors/market/cafe24-rednape";
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
import { businessDayKey, businessDayStart } from "../src/lib/business-time";
import { countBy, countNdjsonLines, sha256Hex, stableStringify, timestampSlug, validateNdjson } from "../scripts/export-sqlite-snapshot";
import {
  checkMigrationUrlPolicy,
  convertRowDateTimeFields,
  CREATE_MANY_BATCH_SIZE,
  DATE_TIME_FIELDS_BY_MODEL,
  evaluateTargetSafetyGuard,
  IMPORT_ORDER,
  importModel,
  normalizedTargetIdentity,
  PARENT_OF_MODEL,
  prepareRowForWrite,
  sanitizeErrorMessage,
  validateManifestShape,
  validateSnapshotIntegrity,
  verifyNdjsonFileIntegrity,
  type ExportRow,
  type ManifestModelEntry,
  type SnapshotManifest
} from "../scripts/import-postgres-snapshot";
import { buildChildEnvForMigrationDeploy, buildMigrateDeployArgs } from "../scripts/migrate-postgres-target";
import {
  canonicalFieldValue,
  checkMarketRankingSnapshotDataModeCounts,
  checkRednapeAnchors,
  checkRelationIntegrity,
  compareAggregate,
  compareIdSets,
  compareRowFields,
  computeModelFingerprint,
  computeReconciliationVerdict,
  RELATION_FK_FIELD,
  resolveReconciliationProfile
} from "../scripts/reconcile-postgres-snapshot";
import { combinedTrendSignal, percentChange, targetAgeSignal } from "../src/lib/search-trend-signals";
import { classifyTrend, rankChange } from "../src/lib/trend-signals";
import { applyMarketPresenceStatuses, classifyAssortmentItemSignal, classifyItemSignal, classifyMarketSignal, classifySalesSignal, getBusinessDashboardData, getItemTrendRows, getMarketRows, getSourceFreshness, rankChangeByDays, signalConfidence, toMarketRow } from "../src/services/business-analytics-service";
import { persistCollectionResult } from "../src/services/collection-service";
import { parseImportFile, parsePastedTable } from "../src/services/import-file-service";
import { canonicalizeUrl, importRows } from "../src/services/import-service";
import { persistMarketCollectionResult } from "../src/services/market-collection-service";
import { getSearchTrendRows } from "../src/services/search-trend-service";

/**
 * A "corpus-floor" regression guard checks that the REAL historical
 * evidence corpus (EditorialPost/MarketRankingSnapshot etc.) has not
 * shrunk below a known historical high-water mark - meaningful only
 * against a database that actually holds that real corpus (the original
 * SQLite dev.db, or eventually production). Against a smaller/fresh dev
 * database (e.g. a Neon dev/scratch Postgres seeded only via `pnpm
 * db:seed`), the floor is structurally inapplicable - no minimal test
 * fixture can honestly satisfy "at least 148 real rows" without
 * fabricating hundreds of fake rows, which would defeat the point of the
 * check.
 *
 * Applicability is driven EXPLICITLY by `SMOKE_TEST_CORPUS_MODE`, never
 * inferred from the count being checked (see `resolveSmokeTestCorpusMode`
 * below). Inferring "is this a full-corpus environment" from the same
 * metric being asserted created a real regression blind spot: a full-corpus
 * database that legitimately holds >=148 rows today but drops to a nonzero
 * value below the floor after some future bug (e.g. 734 -> 100, still
 * "development-shaped" by a count-only test) would have been silently
 * treated as "N/A, fresh dev DB" instead of hard-failing - exactly the
 * regression this guard exists to catch. An explicit, count-independent
 * mode closes that gap.
 */
export type SmokeTestCorpusMode = "full" | "development";

/**
 * Resolves `SMOKE_TEST_CORPUS_MODE` exactly once. Unset (or empty) defaults
 * safely to "development" - the correct default for a fresh/small dev
 * database, which is what every environment without this variable
 * explicitly set should be assumed to be. Any value other than the two
 * allowed literals fails loudly - silently guessing a mode for an
 * unrecognized value would be exactly the kind of silent misclassification
 * this whole redesign exists to avoid.
 */
export function resolveSmokeTestCorpusMode(rawValue: string | undefined): SmokeTestCorpusMode {
  if (rawValue === undefined || rawValue === "") return "development";
  if (rawValue === "full" || rawValue === "development") return rawValue;
  throw new Error(`Invalid SMOKE_TEST_CORPUS_MODE "${rawValue}" - must be exactly "full" or "development" (unset defaults to "development"). Refusing to silently guess a mode.`);
}

/**
 * mode="full": REQUIRED - hard-fails below the floor regardless of the
 * actual count, exactly like the original unconditional assertion.
 * mode="development": the check is explicitly N/A regardless of the actual
 * count (even one that happens to already meet the floor) - applicability
 * is environment-driven, not count-driven, so this branch never asserts
 * and never fabricates rows. Logs a bounded, clearly-labeled "N/A" line
 * (metric name, current count, required floor, and why) so the run's
 * output visibly distinguishes "checked and passed" from "not applicable
 * here" - this must never be reported or counted as a passing assertion.
 */
function assertCorpusFloorOrSkip(metricName: string, actualCount: number, historicalFloor: number, mode: SmokeTestCorpusMode) {
  if (mode === "full") {
    assert.ok(actualCount >= historicalFloor, `${metricName}: SMOKE_TEST_CORPUS_MODE=full requires this to stay at or above the historical floor of ${historicalFloor}, got ${actualCount}.`);
    return;
  }
  console.log(
    `  [corpus-floor N/A] ${metricName}: current=${actualCount} historicalFloor=${historicalFloor} reason="SMOKE_TEST_CORPUS_MODE=development - this regression guard is only REQUIRED when SMOKE_TEST_CORPUS_MODE=full (a database expected to already hold the real historical corpus); not asserted, not fabricated, not a pass."`
  );
}

/** Resolved once, at module load - see resolveSmokeTestCorpusMode's own doc comment. Logged once at smoke-test startup inside main(). */
const SMOKE_TEST_CORPUS_MODE = resolveSmokeTestCorpusMode(process.env.SMOKE_TEST_CORPUS_MODE);

async function main() {
  console.log(`SMOKE_TEST_CORPUS_MODE=${SMOKE_TEST_CORPUS_MODE} (unset defaults to "development"; set to "full" only against a database expected to already hold the real historical corpus).`);

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
  verifyEditorialMomentumPresentation();
  verifySignalInterpretation();
  verifyIndependentEvidenceClusterCount();
  await verifyAttributeBundles();
  verifyPlanningDashboardHelpers();
  verifyDomesticFirstTaxonomy();
  verifyEvidenceStrengthLabels();
  await verifyDomesticFirstFiltering();
  await verifyDemandSignalHelpers();
  await verifyRealMarketCollectorHelpers();
  await verifyMarketDryRunNeverPersists();
  verifyRednapeCollectorHelpers();
  await verifyMarketCollectionPartialPersistence();
  await verifyBusinessTimeHardening();
  verifyExportSnapshotHelpers();
  await verifyImportPostgresSnapshotHelpers();
  verifyReconcilePostgresSnapshotHelpers();
  verifySmokeTestCorpusMode();
  verifyMigratePostgresTargetHelpers();
  verifyBusinessSignals();

  // Fixture setup for the real-data dashboard/assortment/verified-ranking
  // assertions below (2026-09-17 test-isolation fix): they require at least
  // one REAL MarketProduct+MarketRankingSnapshot row per source (END,
  // RAKUTEN_FASHION verified; REDNAPE, SLAM_JAM, STUSSY assortment) to
  // exist, which `pnpm db:seed` never creates and a fresh/small dev
  // database therefore never has. Minimal TEST-prefixed fixture rows
  // reproduce each source's real shape exactly (rankingVerified/scope/
  // category/rank per source, matching what each assertion below checks),
  // never depending on the historical 26,464-row dataset. Cleaned up in
  // `finally`; must never survive a test run.
  const marketFixtureExternalIdPrefix = "TEST-DASHBOARD-";
  // getMarketRows() drops any row where rank, sourcePosition, AND change1w
  // are all null (business-analytics-service.ts's final .filter()) - real
  // assortment/collection-order rows (rankingVerified:false) carry their
  // listing position via sourcePosition, never rank (rank is reserved for
  // verified ranking sources), so every assortment fixture row below sets
  // sourcePosition explicitly to survive that filter, exactly like real
  // REDNAPE/SLAM_JAM/STUSSY rows do.
  const marketFixtureSpecs: Record<string, { rankingVerified: boolean; metricType: string; rankingScope: string; rankingCategory: string; observedCategory: string; rank: number | null; sourcePosition: number | null }> = {
    END: { rankingVerified: true, metricType: "RANKING", rankingScope: "DEPARTMENT", rankingCategory: "CLOTHING", observedCategory: "TOPS", rank: 1, sourcePosition: null },
    RAKUTEN_FASHION: { rankingVerified: true, metricType: "RANKING", rankingScope: "SITEWIDE", rankingCategory: "ALL_FASHION", observedCategory: "ALL", rank: 1, sourcePosition: null },
    STUSSY: { rankingVerified: false, metricType: "COLLECTION_ORDER", rankingScope: "UNKNOWN", rankingCategory: "ALL", observedCategory: "ALL", rank: null, sourcePosition: 1 },
    REDNAPE: { rankingVerified: false, metricType: "CATALOG", rankingScope: "CATEGORY", rankingCategory: "ALL", observedCategory: "ALL", rank: null, sourcePosition: 1 },
    SLAM_JAM: { rankingVerified: false, metricType: "COLLECTION_ORDER", rankingScope: "UNKNOWN", rankingCategory: "ALL", observedCategory: "ALL", rank: null, sourcePosition: 1 }
  };
  await prisma.marketRankingSnapshot.deleteMany({ where: { marketProduct: { externalProductId: { startsWith: marketFixtureExternalIdPrefix } } } });
  await prisma.marketProduct.deleteMany({ where: { externalProductId: { startsWith: marketFixtureExternalIdPrefix } } });
  try {
    for (const [source, spec] of Object.entries(marketFixtureSpecs)) {
      const product = await prisma.marketProduct.create({
        data: { source, externalProductId: `${marketFixtureExternalIdPrefix}${source}`, brand: "TEST", name: `Test ${source} product`, dataMode: "real" }
      });
      await prisma.marketRankingSnapshot.create({
        data: {
          marketProductId: product.id,
          source,
          periodDate: new Date(),
          rankingVerified: spec.rankingVerified,
          metricType: spec.metricType,
          rankingScope: spec.rankingScope,
          rankingCategory: spec.rankingCategory,
          observedCategory: spec.observedCategory,
          rank: spec.rank,
          sourcePosition: spec.sourcePosition,
          dataMode: "real"
        }
      });
    }

    const dashboard = await getBusinessDashboardData();
    const sampleMarket = await getMarketRows({ dataMode: "sample" });
    const defaultMarket = await getMarketRows();
    const items = await getItemTrendRows();
    assert.ok(sampleMarket.rows.length >= 200, "Expected expanded sample market products.");
    assert.equal(defaultMarket.dataMode, dashboard.summary.dataMode, "Dashboard must use the preferred market dataset.");
    assert.ok(items.length > 0, "Expected item trend rows.");
    assertCorpusFloorOrSkip("MarketRankingSnapshot(real) - ranking scope migration preservation", await prisma.marketRankingSnapshot.count({ where: { dataMode: "real" } }), 472, SMOKE_TEST_CORPUS_MODE);
    assert.ok(dashboard.summary.verifiedRankingSources >= 2, "Expected END and Rakuten Fashion verified ranking sources.");
    // dashboard.summary.assortmentSources counts DISTINCT sources that actually
    // have real, non-rankingVerified MarketRankingSnapshot rows PERSISTED in
    // the DB - a data-level count, not the same thing as
    // assortmentCollectorSources() below (a config-level list of which sources
    // ARE CONFIGURED to run as assortment collectors, whether or not they have
    // ever been collected). Before the first persisted REDNAPE collection
    // (2026-09-15, see CURRENT_STATE.md), only SLAM_JAM and STUSSY had real
    // assortment rows, so this was 2; REDNAPE now legitimately joins that set
    // as a third real assortment source. COVERCHORD remains configured (see
    // assortmentCollectorSources() below) but still has zero persisted real
    // rows, so it must not appear here yet. Deriving the expected set from the
    // actual persisted rows - rather than hardcoding a count - keeps this
    // assertion meaningful as sources move from "configured" to "actually
    // collected" over time, instead of needing a magic-number bump each time.
    const realAssortmentSources = new Set(defaultMarket.rows.filter((row) => !row.rankingVerified).map((row) => row.source));
    assert.deepEqual(
      [...realAssortmentSources].sort(),
      ["REDNAPE", "SLAM_JAM", "STUSSY"].sort(),
      "Real (persisted) assortment sources must be exactly the sources actually collected with rankingVerified:false - never a verified-ranking source (END/RAKUTEN_FASHION), and never a merely-configured-but-uncollected source (COVERCHORD)."
    );
    assert.equal(dashboard.summary.assortmentSources, realAssortmentSources.size, "dashboard.summary.assortmentSources must equal the actual distinct real assortment source count derived from persisted rows.");
    assert.ok(defaultMarket.rows.some((row) => row.source === "END" && row.rankingVerified && row.rankingScope === "DEPARTMENT" && row.rankingCategory === "CLOTHING" && row.observedCategory != null), "END rows must preserve DEPARTMENT/CLOTHING scope and observed category.");
    assert.ok(defaultMarket.rows.some((row) => row.source === "RAKUTEN_FASHION" && row.rankingVerified && row.metricType === "RANKING" && row.rankingScope === "SITEWIDE" && row.rankingCategory === "ALL_FASHION" && row.rank != null), "Rakuten verified ranking rows must retain SITEWIDE rank.");
    assert.ok(defaultMarket.rows.some((row) => row.source === "STUSSY" && !row.rankingVerified && row.metricType === "COLLECTION_ORDER" && row.rank == null), "Collection-order rows must not become ranking rows.");
    assert.ok(items.some((row) => row.top10Presence >= 0 && row.top20Presence >= row.top10Presence && row.top50Presence >= row.top20Presence), "Item rows must expose TOP10/TOP20/TOP50 verified ranking presence.");
    assert.ok(dashboard.summary.signalConfidence === "BASELINE" || dashboard.summary.signalConfidence === "EARLY_DATA" || dashboard.summary.signalConfidence === "ACTIVE_SIGNAL", "Verified ranking signal confidence must be derived from collected snapshot dates.");
    assert.deepEqual(verifiedRankingCollectorSources().sort(), ["END", "RAKUTEN_FASHION"].sort(), "Verified-only collection must include only END and Rakuten Fashion.");
    // COVERCHORD added 2026-09-11 (see CURRENT_STATE.md "Market Coverchord
    // Source Addition") as a third unverified Shopify assortment source,
    // mirroring SLAM_JAM/STUSSY exactly (rankingVerified: false, method:
    // SHOPIFY_PRODUCTS_JSON in sourceCategoryConfigs). REDNAPE added
    // 2026-09-15 (see CURRENT_STATE.md "Market Rednape ..." sections) as a
    // fourth unverified assortment source, but NOT a Shopify one - it uses
    // method: CAFE24_CATEGORY_HTML, so the wording below no longer says
    // "Shopify assortment sources" specifically. No live REDNAPE collection
    // has happened yet (config + collector code only, 0 rows) - this is
    // purely a config-list assertion, not a claim about collected data.
    assert.deepEqual(assortmentCollectorSources().sort(), ["COVERCHORD", "REDNAPE", "SLAM_JAM", "STUSSY"].sort(), "Assortment collection must include only unverified assortment sources (Shopify or Cafe24 category HTML).");
    const verifiedFreshness = await getSourceFreshness("real", true);
    assert.ok(verifiedFreshness.some((row) => row.source === "END"));
    assert.ok(verifiedFreshness.some((row) => row.source === "RAKUTEN_FASHION"));
    assert.ok(!verifiedFreshness.some((row) => row.source === "SLAM_JAM" || row.source === "STUSSY"), "Verified freshness must exclude assortment sources.");
    assert.equal(featureFlags.enableNaverTrends, false, "NAVER trends should be disabled by default.");

    console.log(
      `Smoke test passed: marketAnalysisRows=${dashboard.summary.marketProducts}, mode=${dashboard.summary.dataMode}, sources=${dashboard.summary.sources}, items=${items.length}, naver=${featureFlags.enableNaverTrends ? "enabled" : "disabled"}.`
    );
  } finally {
    await prisma.marketRankingSnapshot.deleteMany({ where: { marketProduct: { externalProductId: { startsWith: marketFixtureExternalIdPrefix } } } });
    await prisma.marketProduct.deleteMany({ where: { externalProductId: { startsWith: marketFixtureExternalIdPrefix } } });
  }
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

function verifySignalInterpretation() {
  const stripe = buildSignalInterpretation({
    specificItem: "SHIRT",
    directAttributes: [{ type: "DETAIL", value: "STRIPE" }],
    bundleArticlePresence: 6,
    bundleSourceSpread: 5,
    independentEvidenceClusterCount: 6
  });

  assert.equal(stripe.signalName, "스트라이프 셔츠", "Lead-signal interpretation must use the Korean specific-item label, never raw SHIRT.");
  assert.equal(
    stripe.observedFact,
    "“스트라이프 셔츠”의 아이템·속성 직접 관계가 6개 기사에서 확인됐습니다. 서로 다른 사례 기준 6건이 5개 매체에서 관측됐습니다.",
    "Observed fact must contain only existing bundle-level article, independent-case, and outlet fields; freshness is displayed separately."
  );
  assert.deepEqual(
    stripe.unknowns,
    ["스트라이프의 굵기·간격·방향", "실루엣과 핏", "소재·컬러 구성", "스타일링 무드", "판매·수요 반응"],
    "A stripe-detail signal must expose stripe execution and absent product dimensions without repeating a generic all-signal list."
  );
  assert.equal(stripe.planningQuestion, "“스트라이프 셔츠” 조합을 다음 단계 상품 조사 대상으로 볼 것인가?");

  const materialAndColor = buildSignalInterpretation({
    specificItem: "SHORTS",
    directAttributes: [
      { type: "MATERIAL", value: "DENIM" },
      { type: "COLOR", value: "BLACK" }
    ],
    bundleArticlePresence: 2,
    bundleSourceSpread: 1,
    independentEvidenceClusterCount: 1
  });
  assert.ok(materialAndColor.unknowns.includes("데님의 중량·조직·가공"), "A verified material must yield only its unverified execution variables, not claim that material itself is unknown.");
  assert.ok(materialAndColor.unknowns.includes("블랙의 톤·배색·적용 면적"), "A verified color must yield only its unverified expression variables, not claim that color itself is unknown.");
  assert.ok(!materialAndColor.unknowns.includes("소재·컬러 구성"), "Known material and color dimensions must not be listed as wholly unknown.");
}

function verifyEditorialMomentumPresentation() {
  const increasing = editorialRecentDirection({ current7dArticlePresence: 56, previous7dArticlePresence: 48, change7dArticlePresence: 8 });
  assert.deepEqual(increasing, { state: "INCREASING", label: "증가", symbol: "↑", deltaLabel: "+8", comparisonLabel: "최근 7일 56건 · 직전 7일 48건" });

  const decreasing = editorialRecentDirection({ current7dArticlePresence: 34, previous7dArticlePresence: 44, change7dArticlePresence: -10 });
  assert.equal(decreasing.state, "DECREASING");
  assert.equal(decreasing.label, "감소");
  assert.ok(!`${decreasing.label} ${decreasing.deltaLabel}`.includes("뜨는"), "A declining item must never be described as 뜨는.");

  const stable = editorialRecentDirection({ current7dArticlePresence: 11, previous7dArticlePresence: 11, change7dArticlePresence: 0 });
  assert.deepEqual(stable, { state: "STABLE", label: "유지", symbol: "→", deltaLabel: "0", comparisonLabel: "최근 7일 11건 · 직전 7일 11건" });

  const unavailable = editorialRecentDirection({ current7dArticlePresence: null, previous7dArticlePresence: 4, change7dArticlePresence: null });
  assert.equal(unavailable.label, "판단 불가");
  assert.equal(unavailable.deltaLabel, null);

  const inconsistent = editorialRecentDirection({ current7dArticlePresence: 5, previous7dArticlePresence: 4, change7dArticlePresence: 9 });
  assert.equal(inconsistent.label, "판단 불가", "An internally inconsistent comparable-window delta must never receive a direction label.");

  const coverageInput = { articlePresence: 141, sourceSpread: 7 };
  const decliningCoverageInput = { ...coverageInput, change7dArticlePresence: -10 };
  assert.equal(editorialCoverageLabel(coverageInput), "다수 매체 공통");
  assert.equal(editorialCoverageLabel(decliningCoverageInput), "다수 매체 공통", "Coverage wording must not change with momentum.");
  assert.ok(!editorialCoverageLabel(coverageInput).includes("상승"), "Cumulative coverage wording must never claim recent momentum.");
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
  // Derived from the canonical seed list, never a separate hardcoded number -
  // fashionKeywordSeeds is the single source of truth for how many keywords
  // `pnpm db:seed` persists, and it grows over time as new keywords are
  // added. A literal magic number here would silently go stale exactly as
  // the previous "25" did.
  const expectedKeywordCount = fashionKeywordSeeds.length;
  assert.ok(expectedKeywordCount > 0, "fashionKeywordSeeds must not be empty - the entire Naver seed/collection pipeline is meaningless against zero configured keywords.");
  assert.equal(
    new Set(fashionKeywordSeeds.map((keyword) => keyword.name)).size,
    expectedKeywordCount,
    "fashionKeywordSeeds must not contain duplicate keyword names - seedTrendKeywords() upserts keyed by `name` (see src/services/keyword-seed-service.ts), so a duplicate name would silently collapse into fewer persisted TrendKeyword rows than configured seeds."
  );

  const keywordCount = await prisma.trendKeyword.count();
  const keywordSnapshotCount = await prisma.keywordTrendSnapshot.count();
  const shoppingSnapshotCount = await prisma.keywordShoppingAgeSnapshot.count();
  assert.equal(keywordCount, expectedKeywordCount, `Expected ${expectedKeywordCount} seeded fashion keywords (one TrendKeyword row per entry in fashionKeywordSeeds).`);
  assert.ok(keywordSnapshotCount >= expectedKeywordCount * 12 * 3, "Expected search trend snapshots.");
  assert.ok(shoppingSnapshotCount >= expectedKeywordCount * 12 * 2, "Expected shopping age snapshots.");
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

/**
 * Proves the `--dry-run` persistence boundary added to
 * scripts/collect-market.ts: `handleCollectionResult(..., dryRun: true)`
 * must NEVER create an ImportRun row, while `dryRun: false` against the
 * exact same kind of result must still persist exactly as before this
 * change (non-dry-run behavior unchanged). Uses MUSINSA (an already-
 * UNSUPPORTED, non-network source) so this proof needs no live HTTP call
 * and no real collected data - the point being tested is the persistence
 * decision boundary itself, not any particular source's collector.
 */
async function verifyMarketDryRunNeverPersists() {
  const category = "SHORT_SLEEVE_TSHIRT" as const;
  const beforeCount = await prisma.importRun.count({ where: { source: "MUSINSA" } });

  const dryResult = await runOneCollection("MUSINSA", category, 1);
  const drySummary = await handleCollectionResult("MUSINSA", category, dryResult, true);
  assert.equal(drySummary.saved, 0, "Dry-run summary must report zero saved.");
  assert.equal(drySummary.importRunId, undefined, "Dry-run summary must carry no importRunId - nothing was ever persisted to have one.");
  const afterDryRunCount = await prisma.importRun.count({ where: { source: "MUSINSA" } });
  assert.equal(afterDryRunCount, beforeCount, "dryRun: true must never create an ImportRun row - persistMarketCollectionResult must be structurally unreachable on this path.");

  // Prove non-dry-run behavior is unchanged: the same kind of result, persisted, still creates exactly one row.
  const liveResult = await runOneCollection("MUSINSA", category, 1);
  const liveSummary = await handleCollectionResult("MUSINSA", category, liveResult, false);
  assert.equal(liveSummary.status, "UNSUPPORTED");
  assert.ok(liveSummary.importRunId, "Non-dry-run path must still persist and return a real importRunId, exactly as before this change.");
  const afterLiveRunCount = await prisma.importRun.count({ where: { source: "MUSINSA" } });
  assert.equal(afterLiveRunCount, beforeCount + 1, "dryRun: false must persist exactly one ImportRun row, same as pre-existing behavior.");

  // Clean up the one real row this proof intentionally created - by exact id, never a broad delete.
  await prisma.importRun.delete({ where: { id: liveSummary.importRunId! } });
  const afterCleanupCount = await prisma.importRun.count({ where: { source: "MUSINSA" } });
  assert.equal(afterCleanupCount, beforeCount, "Cleanup must restore the exact pre-test MUSINSA ImportRun count.");
}

/**
 * Fixtures captured directly from the 2026-09-15 read-only Rednape audit
 * (docs/MARKET_SOURCE_AUDIT.md "Rednape" section) - no live network call
 * happens in this function or in cafe24-rednape.ts itself.
 */
function verifyRednapeCollectorHelpers() {
  // #593 - 3 confirmed colors, one price shared across all three.
  const ecoBag: RawRednapeProduct = {
    externalProductId: "593",
    name: "아카이브 나일론 에코백 (3C)",
    canonicalUrl: "https://rednape.kr/product/아카이브-나일론-에코백-3c/593/",
    images: [
      "https://ecimg.cafe24img.com/pg3204b60863782020/rednape/web/product/big/20260815/8618289e341fd4df0e6f13b7b3f3d2ca.jpg",
      "https://ecimg.cafe24img.com/pg3204b60863782020/rednape/web/product/extra/big/20260804/8605bac467b2e4507116685a7bcfbe90.jpg"
    ],
    offers: [
      { name: "아카이브 나일론 에코백 (3C) 아쿠아블루", price: 38800 },
      { name: "아카이브 나일론 에코백 (3C) 브릭", price: 38800 },
      { name: "아카이브 나일론 에코백 (3C) 카키", price: 38800 }
    ]
  };
  assert.equal(isConfirmedBagProduct(ecoBag.name), true, "에코백 suffix must pass the confirmed-bag gate.");
  const ecoBagRow = normalizeRednapeProduct({ raw: ecoBag, sourcePosition: 3, audienceSegment: "ALL", periodDate: new Date("2026-09-15T00:00:00.000Z"), metricType: "CATALOG" });
  assert.equal(ecoBagRow.source, "REDNAPE");
  assert.equal(ecoBagRow.externalProductId, "593", "externalProductId must be the base numeric product ID, never a per-color item_code.");
  assert.equal(ecoBagRow.brand, "레드네이프");
  assert.equal(ecoBagRow.url, ecoBag.canonicalUrl);
  assert.equal(ecoBagRow.imageUrl, ecoBag.images[0]);
  assert.equal(ecoBagRow.price, 38800);
  assert.equal(ecoBagRow.rankingCategory, "BAG");
  assert.equal(ecoBagRow.observedCategory, "BAG");
  assert.equal(ecoBagRow.rankingVerified, false);
  assert.equal(ecoBagRow.rankingScope, "CATEGORY");
  assert.equal(ecoBagRow.rank, null, "Unverified assortment source must never carry a rank.");
  assert.equal(ecoBagRow.mainColor, null, "3 distinct colors must never collapse into one mainColor value.");
  assert.equal(ecoBagRow.material, null, "Material lives only in free-form SmartEditor text - not parsed in v1.");
  assert.equal(ecoBagRow.fit, null);
  assert.equal(ecoBagRow.salePrice, null, "No confirmed live discount example exists yet.");

  // #440 - "토고 쉘 경량 그리드 백팩", verified LIVE on 2026-09-15: unlike #593's
  // array-of-named-offers shape, this single-variant product's JSON-LD
  // `offers` is a bare object with NO `name` field at all (just
  // `@type`/`url`/`priceCurrency`/`price`). An earlier pass of this fixture
  // guessed an array shape with a fabricated "Black" name - that guess was
  // never actually observed live and has been replaced with the real
  // captured shape below (see normalizeRednapeOffers for the fix this
  // proves: object offers -> normalized to [offer]; a missing offer name
  // -> "" -> filtered out of distinctColors -> mainColor null, never a
  // thrown error or a dropped price).
  const liveSingleOfferShape = { price: 57800 } as RednapeProductJsonLd["offers"]; // real payload also carries @type/url/priceCurrency, irrelevant to normalizeRednapeOffers
  assert.deepEqual(normalizeRednapeOffers(liveSingleOfferShape), [{ name: "", price: 57800 }]);
  const backpack: RawRednapeProduct = {
    externalProductId: "440",
    name: "토고 쉘 경량 그리드 백팩",
    canonicalUrl: "https://rednape.kr/product/토고-쉘-경량-그리드-백팩/440/",
    images: ["https://ecimg.cafe24img.com/pg3204b60863782020/rednape/web/product/big/20260804/19e95ceed4f06c25ab90bce45c367d1c.jpg"],
    offers: normalizeRednapeOffers(liveSingleOfferShape)
  };
  assert.equal(isConfirmedBagProduct(backpack.name), true, "백팩 suffix must pass the confirmed-bag gate.");
  const backpackRow = normalizeRednapeProduct({ raw: backpack, sourcePosition: 11, audienceSegment: "ALL", periodDate: new Date("2026-09-15T00:00:00.000Z"), metricType: "CATALOG" });
  assert.equal(backpackRow.externalProductId, "440");
  assert.equal(backpackRow.mainColor, null, "The real live #440 offer carries no name at all, so there is no color text to confirm - null is honest, not a guess.");
  assert.equal(backpackRow.price, 57800, "A single-variant product's one offer price must still populate price even though its offers field is a bare object, not an array.");

  // Synthetic - single-variant JSON-LD offers object that DOES carry a name (a plausible
  // Rednape shape not yet observed live), proving "exactly one color -> literal mainColor"
  // still holds when the raw shape is an object rather than an array.
  const namedSingleOfferOffers = normalizeRednapeOffers({ name: "토고 쉘 경량 그리드 백팩 네이비", price: 57800 } as RednapeProductJsonLd["offers"]);
  assert.deepEqual(namedSingleOfferOffers, [{ name: "토고 쉘 경량 그리드 백팩 네이비", price: 57800 }]);
  const namedSingleOfferRow = normalizeRednapeProduct({
    raw: { externalProductId: "440", name: "토고 쉘 경량 그리드 백팩", canonicalUrl: backpack.canonicalUrl, images: [], offers: namedSingleOfferOffers },
    sourcePosition: 11,
    audienceSegment: "ALL",
    periodDate: new Date("2026-09-15T00:00:00.000Z"),
    metricType: "CATALOG"
  });
  assert.equal(namedSingleOfferRow.mainColor, "네이비", "A single-variant object offer that DOES carry a name must still yield a literal mainColor, not null.");

  // normalizeRednapeOffers direct coverage - array shape, object shape, and missing/invalid input.
  assert.deepEqual(
    normalizeRednapeOffers([
      { name: "아카이브 나일론 에코백 (3C) 아쿠아블루", price: 38800 },
      { name: "아카이브 나일론 에코백 (3C) 브릭", price: 38800 }
    ]),
    [
      { name: "아카이브 나일론 에코백 (3C) 아쿠아블루", price: 38800 },
      { name: "아카이브 나일론 에코백 (3C) 브릭", price: 38800 }
    ],
    "An array of offers must be preserved as-is (minus the same invalid-entry filtering already applied to any shape)."
  );
  assert.deepEqual(normalizeRednapeOffers(undefined), [], "A completely absent offers field must normalize to an empty array, never throw.");
  assert.deepEqual(
    normalizeRednapeOffers([{ name: "무가격 옵션" }, { name: "유효 옵션", price: 1000 }] as RednapeProductJsonLd["offers"]),
    [{ name: "유효 옵션", price: 1000 }],
    "An offer entry with no numeric price must be dropped, never coerced into a fake price."
  );

  // Synthetic fixture (not a live-captured product) - 2 color offers with genuinely different prices.
  // This edge case was not observed on any real sampled Rednape product; it exists only to prove
  // normalizeRednapeProduct never silently picks offers[0]'s price when offers actually disagree.
  const divergentPriceProduct: RawRednapeProduct = {
    externalProductId: "999999",
    name: "테스트 합성 크로스백 (2C)",
    canonicalUrl: "https://rednape.kr/product/테스트-합성-크로스백-2c/999999/",
    images: [],
    offers: [
      { name: "테스트 합성 크로스백 (2C) 블랙", price: 10000 },
      { name: "테스트 합성 크로스백 (2C) 화이트", price: 12000 }
    ]
  };
  assert.equal(isConfirmedBagProduct(divergentPriceProduct.name), true, "크로스백 suffix must pass the confirmed-bag gate.");
  const divergentPriceRow = normalizeRednapeProduct({ raw: divergentPriceProduct, sourcePosition: 1, audienceSegment: "ALL", periodDate: new Date("2026-09-15T00:00:00.000Z"), metricType: "CATALOG" });
  assert.equal(divergentPriceRow.price, null, "Divergent per-color prices must never silently collapse to offers[0]'s price.");
  const rawData = JSON.parse(divergentPriceRow.rawData ?? "{}");
  assert.deepEqual(rawData.offerPrices?.sort(), [10000, 12000], "Full distinct offer price list must be preserved in rawData for auditability.");

  // #707 - a loafer (shoe) from the same category page; must never pass the gate or be normalized as BAG.
  const loafer = "모카 스티치 스웨이드 로퍼 (2C)";
  assert.equal(isConfirmedBagProduct(loafer), false, "A loafer must never pass the confirmed-bag gate.");
  assert.throws(
    () =>
      normalizeRednapeProduct({
        raw: { externalProductId: "707", name: loafer, canonicalUrl: "https://rednape.kr/product/모카-스티치-스웨이드-로퍼-2c/707/", images: [], offers: [{ name: `${loafer} Brown`, price: 62800 }] },
        sourcePosition: 1,
        audienceSegment: "ALL",
        periodDate: new Date("2026-09-15T00:00:00.000Z"),
        metricType: "CATALOG"
      }),
    /did not pass the confirmed-bag-name gate/,
    "normalizeRednapeProduct must refuse to emit a non-bag product as BAG even if a caller forgets to gate first."
  );

  // Full 17-non-bag-name regression, from the same live enumeration - none may ever pass the gate.
  const confirmedNonBagNames = [
    "코린 멀티 스트라이프 비니 (3C)",
    "썬키스트 더블자수 캡 (2C)",
    "피그먼트 타코 워싱 캡 (2C)",
    "보니 스퀘어 토 블로퍼",
    "빈티지 더블 스터드 벨트 (2C)",
    "카우 포니 더블 롱 벨트",
    "블렌디드 스트라이프 울 머플러 (5C)",
    "제린 스트라이프 울 머플러 (5C)",
    "웨그 스냅 로프 캡 (4C)",
    "폴란드 니트 터치 장갑 (4C)",
    "킬러 버거 캡 (2C)",
    "강추! 캔디 소프트 스트라이프 머플러 (5C)",
    "플러피 모던 울 머플러 (5C)",
    "빈티지 더블 아일렛 벨트",
    "버클 아일렛 펑크 벨트",
    "빈티지 웨스턴 스퀘어 벨트",
    loafer
  ];
  for (const name of confirmedNonBagNames) {
    assert.equal(isConfirmedBagProduct(name), false, `"${name}" must not pass the confirmed-bag gate.`);
  }
  assert.equal(confirmedNonBagNames.length, 17, "Regression fixture must cover all 17 confirmed non-bag names from the audit.");

  // --- Category listing extraction: a synthetic 2-product page mirroring the
  // real nested-<li> structure captured in the audit (class="left"/"right"
  // <li>s nested inside each anchorBoxId_ block) - proves the position-slice
  // approach doesn't truncate at a nested </li>, and that the gate can be
  // applied to listing names alone, before any detail fetch.
  const listingFixtureHtml = `
    <ul class="prdList grid4">
    <li id="anchorBoxId_501" class="xans-record-">
    <div class="box"><div class="thumbnail"><ul class="thumbnail_inner">
    <a href="/product/테스트-크로스백/501/category/45/display/1/"><img src="//img/1.jpg" class="thumbs"></a>
    </ul></div>
    <div class="description"><ul class="name">
    <li class="left"><a href="/product/테스트-크로스백/501/category/45/display/1/" class=""><span class="" style="font-size:13px;">테스트 크로스백 (2C)</span></a></li>
    <li class="right"><button onclick="x">c</button></li>
    </ul><ul class="info"><li class="price">10,000원</li></ul></div></div></li>
    <li id="anchorBoxId_502" class="xans-record-">
    <div class="box"><div class="thumbnail"><ul class="thumbnail_inner">
    <a href="/product/테스트-벨트/502/category/45/display/1/"><img src="//img/2.jpg" class="thumbs"></a>
    </ul></div>
    <div class="description"><ul class="name">
    <li class="left"><a href="/product/테스트-벨트/502/category/45/display/1/" class=""><span class="" style="font-size:13px;">테스트 벨트</span></a></li>
    <li class="right"><button onclick="x">c</button></li>
    </ul><ul class="info"><li class="price">20,000원</li></ul></div></div></li>
    </ul>`;
  const listingEntries = extractRednapeListingEntries(listingFixtureHtml, "https://rednape.kr");
  assert.equal(listingEntries.length, 2, "Both products must be extracted despite nested <li> elements inside each block.");
  assert.equal(listingEntries[0]?.externalProductId, "501");
  assert.equal(listingEntries[0]?.name, "테스트 크로스백 (2C)");
  assert.equal(listingEntries[0]?.listingPosition, 1, "First card in the listing must carry listingPosition 1.");
  // new URL(href, baseUrl).toString() correctly percent-encodes the Korean path segment (standard URL behavior,
  // identical over the wire to the raw form) - decode back for a readable comparison against the source href.
  assert.equal(decodeURIComponent(listingEntries[0]?.detailUrl ?? ""), "https://rednape.kr/product/테스트-크로스백/501/category/45/display/1/");
  assert.equal(listingEntries[1]?.externalProductId, "502");
  assert.equal(listingEntries[1]?.name, "테스트 벨트");
  assert.equal(listingEntries[1]?.listingPosition, 2, "Second card in the listing must carry listingPosition 2.");
  // Applying the gate to listing-only data, before any detail request would happen:
  assert.equal(isConfirmedBagProduct(listingEntries[0]!.name), true, "Listing name alone must be enough to gate the bag product in.");
  assert.equal(isConfirmedBagProduct(listingEntries[1]!.name), false, "Listing name alone must be enough to gate the belt out before any detail fetch.");

  // --- sourcePosition must preserve ORIGINAL listing position, never a
  // post-filter/gated-only counter. Fixture matches the exact 5-item
  // example from the approved correction: [loafer, beanie, eco bag, cap,
  // shopper bag] - only the eco bag (position 3) and shopper bag (position
  // 5) are confirmed bags, and they must keep exactly those positions,
  // NOT be renumbered to 1/2 just because the other 3 were skipped.
  function rednapeCard(id: string, name: string): string {
    return `<li id="anchorBoxId_${id}" class="xans-record-"><div class="box"><div class="thumbnail"><ul class="thumbnail_inner"><a href="/product/x/${id}/"><img src="//img/${id}.jpg" class="thumbs"></a></ul></div><div class="description"><ul class="name"><li class="left"><a href="/product/x/${id}/" class=""><span class="">${name}</span></a></li><li class="right"><button onclick="x">c</button></li></ul></div></div></li>`;
  }
  const positionFixtureHtml = `<ul class="prdList grid4">${[
    rednapeCard("601", "모카 스티치 스웨이드 로퍼 (2C)"), // 1: loafer - fails gate
    rednapeCard("602", "코린 멀티 스트라이프 비니 (3C)"), // 2: beanie - fails gate
    rednapeCard("603", "아카이브 나일론 에코백 (3C)"), // 3: eco bag - PASSES gate
    rednapeCard("604", "썬키스트 더블자수 캡 (2C)"), // 4: cap - fails gate
    rednapeCard("605", "더로 레디 빅 쇼퍼백 (3C)") // 5: shopper bag - PASSES gate
  ].join("")}</ul>`;
  const positionEntries = extractRednapeListingEntries(positionFixtureHtml, "https://rednape.kr");
  assert.equal(positionEntries.length, 5, "All 5 cards must be extracted regardless of which pass the BAG gate.");
  assert.deepEqual(
    positionEntries.map((entry) => entry.listingPosition),
    [1, 2, 3, 4, 5],
    "Every card must carry its true listing position, independent of BAG status."
  );
  const gatedPositionEntries = positionEntries.filter((entry) => isConfirmedBagProduct(entry.name));
  assert.equal(gatedPositionEntries.length, 2, "Only the eco bag and shopper bag must pass the gate.");
  assert.equal(gatedPositionEntries[0]?.externalProductId, "603");
  assert.equal(gatedPositionEntries[0]?.listingPosition, 3, "Eco bag must keep its true listing position 3, not be renumbered to 1.");
  assert.equal(gatedPositionEntries[1]?.externalProductId, "605");
  assert.equal(gatedPositionEntries[1]?.listingPosition, 5, "Shopper bag must keep its true listing position 5, not be renumbered to 2.");
  const gatedRow1 = normalizeRednapeProduct({
    raw: { externalProductId: gatedPositionEntries[0]!.externalProductId, name: gatedPositionEntries[0]!.name, canonicalUrl: "https://rednape.kr/product/x/603/", images: [], offers: [{ name: `${gatedPositionEntries[0]!.name} 카키`, price: 38800 }] },
    sourcePosition: gatedPositionEntries[0]!.listingPosition,
    audienceSegment: "ALL",
    periodDate: new Date("2026-09-15T00:00:00.000Z"),
    metricType: "CATALOG"
  });
  const gatedRow2 = normalizeRednapeProduct({
    raw: { externalProductId: gatedPositionEntries[1]!.externalProductId, name: gatedPositionEntries[1]!.name, canonicalUrl: "https://rednape.kr/product/x/605/", images: [], offers: [{ name: `${gatedPositionEntries[1]!.name} Black`, price: 52800 }] },
    sourcePosition: gatedPositionEntries[1]!.listingPosition,
    audienceSegment: "ALL",
    periodDate: new Date("2026-09-15T00:00:00.000Z"),
    metricType: "CATALOG"
  });
  assert.equal(gatedRow1.sourcePosition, 3, "Emitted eco bag row must carry sourcePosition 3, matching its true listing position.");
  assert.equal(gatedRow2.sourcePosition, 5, "Emitted shopper bag row must carry sourcePosition 5, matching its true listing position.");
  assert.equal(gatedRow1.rank, null, "sourcePosition must never imply a verified rank.");
  assert.equal(gatedRow1.rankingVerified, false);

  // --- Cross-page running position: extractRednapeListingEntries accepts a
  // startPosition so a page-2 call continues the same global ordinal
  // instead of restarting at 1.
  const page2Entries = extractRednapeListingEntries(rednapeCard("606", "토고 쉘 경량 그리드 백팩"), "https://rednape.kr", positionEntries.length + 1);
  assert.equal(page2Entries[0]?.listingPosition, 6, "A second page's first card must continue the running ordinal from the previous page, not restart at 1.");

  // --- Zero-product page: this is the exact parser-level signal the live
  // collector's pagination stop rule keys off (`entries.length === 0`) -
  // matches the audited real /category/accessories/45/?page=2, which
  // returned zero products.
  const emptyPageHtml = `<div class="prdList grid4"><p class="no-product">등록된 상품이 없습니다.</p></div>`;
  assert.deepEqual(extractRednapeListingEntries(emptyPageHtml, "https://rednape.kr"), [], "A page with no anchorBoxId_ blocks must parse to an empty list, driving the pagination stop rule.");

  // --- Duplicate product ID handling: dedupeListingEntries is the exact
  // function the live collector's pagination loop calls per page, sharing
  // one `seen` Set across calls so an id repeated within a page (or, in a
  // future multi-page run, an id repeated across pages) is only kept once.
  const dupA: RednapeListingEntry = { externalProductId: "501", name: "테스트 크로스백 (2C)", detailUrl: "https://rednape.kr/product/a/501/", listingPosition: 1 };
  const dupA2: RednapeListingEntry = { externalProductId: "501", name: "테스트 크로스백 (2C)", detailUrl: "https://rednape.kr/product/a/501/category/45/display/2/", listingPosition: 1 };
  const dupB: RednapeListingEntry = { externalProductId: "502", name: "테스트 벨트", detailUrl: "https://rednape.kr/product/b/502/", listingPosition: 2 };
  const deduped = dedupeListingEntries([dupA, dupA2, dupB]);
  assert.equal(deduped.length, 2, "A repeated externalProductId within one call must be kept only once.");
  assert.deepEqual(deduped.map((entry) => entry.externalProductId), ["501", "502"]);
  const sharedSeen = new Set<string>();
  const firstPageResult = dedupeListingEntries([dupA, dupB], sharedSeen);
  const secondPageResult = dedupeListingEntries([dupA2], sharedSeen);
  assert.equal(firstPageResult.length, 2, "First call populates the shared seen set.");
  assert.equal(secondPageResult.length, 0, "An id already seen on an earlier call (simulating an earlier page) must be dropped, never re-fetched.");

  // --- Product detail parsing: canonical URL + Product JSON-LD, using the
  // real captured #593 evidence (docs/MARKET_SOURCE_AUDIT.md "Rednape").
  const detailFixtureHtml = `
    <html><head>
    <link rel="canonical" href="https://rednape.kr/product/아카이브-나일론-에코백-3c/593/" />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"레드네이프"}</script>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"아카이브 나일론 에코백 (3C)","image":["https://ecimg.cafe24img.com/pg3204b60863782020/rednape/web/product/big/20260815/8618289e341fd4df0e6f13b7b3f3d2ca.jpg"],"brand":{"@type":"Brand","name":"레드네이프"},"offers":[{"name":"아카이브 나일론 에코백 (3C) 아쿠아블루","price":38800,"priceCurrency":"KRW","availability":"InStock"},{"name":"아카이브 나일론 에코백 (3C) 브릭","price":38800,"priceCurrency":"KRW","availability":"InStock"}]}</script>
    </head><body></body></html>`;
  assert.equal(extractRednapeCanonicalUrl(detailFixtureHtml), "https://rednape.kr/product/아카이브-나일론-에코백-3c/593/");
  const jsonLd = extractRednapeProductJsonLd(detailFixtureHtml);
  assert.equal(jsonLd?.name, "아카이브 나일론 에코백 (3C)", "Must find the Product block, not the earlier Organization block.");
  assert.equal(jsonLd?.image?.[0], "https://ecimg.cafe24img.com/pg3204b60863782020/rednape/web/product/big/20260815/8618289e341fd4df0e6f13b7b3f3d2ca.jpg");
  assert.equal(Array.isArray(jsonLd?.offers), true, "#593 is a multi-variant product - its real offers shape is an array.");
  const jsonLdOffers = normalizeRednapeOffers(jsonLd?.offers);
  assert.equal(jsonLdOffers.length, 2);
  assert.equal(jsonLdOffers[0]?.price, 38800);

  // --- Product detail parsing: the #440 single-variant shape, real captured
  // live evidence (2026-09-15). Unlike #593 above, this product's `offers`
  // is a bare JSON-LD object, not an array - this end-to-end fixture (raw
  // HTML -> extractRednapeProductJsonLd -> normalizeRednapeOffers) proves
  // the real parsing pipeline handles the exact shape observed live, not
  // just a hand-built object passed directly to normalizeRednapeOffers.
  const singleOfferDetailHtml = `
    <html><head>
    <link rel="canonical" href="https://rednape.kr/product/토고-쉘-경량-그리드-백팩/440/" />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"토고 쉘 경량 그리드 백팩","image":["https://ecimg.cafe24img.com/pg3204b60863782020/rednape/web/product/big/20260804/19e95ceed4f06c25ab90bce45c367d1c.jpg"],"brand":{"@type":"Brand","name":"레드네이프"},"offers":{"@type":"Offer","url":"https://rednape.kr/product/토고-쉘-경량-그리드-백팩/440/","priceCurrency":"KRW","price":57800}}</script>
    </head><body></body></html>`;
  assert.equal(extractRednapeCanonicalUrl(singleOfferDetailHtml), "https://rednape.kr/product/토고-쉘-경량-그리드-백팩/440/");
  const singleOfferJsonLd = extractRednapeProductJsonLd(singleOfferDetailHtml);
  assert.equal(singleOfferJsonLd?.name, "토고 쉘 경량 그리드 백팩");
  assert.equal(Array.isArray(singleOfferJsonLd?.offers), false, "This is the real live #440 shape: a bare object, not an array.");
  assert.deepEqual(normalizeRednapeOffers(singleOfferJsonLd?.offers), [{ name: "", price: 57800 }]);

  // --- Malformed/missing Product JSON-LD: must return null, never throw -
  // this is exactly what lets the live collector's per-product try/catch
  // record a clean per-product error instead of an unhandled exception.
  const malformedJsonLdHtml = `<html><head><script type="application/ld+json">{not valid json,,,</script></head></html>`;
  assert.equal(extractRednapeProductJsonLd(malformedJsonLdHtml), null, "Malformed JSON-LD must resolve to null, not throw.");
  const noJsonLdHtml = `<html><head><title>No structured data here</title></head></html>`;
  assert.equal(extractRednapeProductJsonLd(noJsonLdHtml), null, "A page with no application/ld+json script at all must resolve to null.");
  assert.equal(extractRednapeCanonicalUrl(noJsonLdHtml), null, "A page with no canonical link must resolve to null, not throw.");
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
  const cumulativeOrdering = aggregateEditorialMentions([
    { type: "SUB_ITEM", value: "HIGH_COVERAGE_DECLINING", audienceGender: "UNKNOWN", confidence: 1, post: { source: "EYESMAG", url: "https://example.com/high-current", publishedAt: new Date("2026-09-14T00:00:00.000Z") } },
    { type: "SUB_ITEM", value: "HIGH_COVERAGE_DECLINING", audienceGender: "UNKNOWN", confidence: 1, post: { source: "NONLABEL", url: "https://example.com/high-previous-1", publishedAt: new Date("2026-09-06T00:00:00.000Z") } },
    { type: "SUB_ITEM", value: "HIGH_COVERAGE_DECLINING", audienceGender: "UNKNOWN", confidence: 1, post: { source: "VISLA", url: "https://example.com/high-previous-2", publishedAt: new Date("2026-09-05T00:00:00.000Z") } },
    { type: "SUB_ITEM", value: "LOWER_COVERAGE_INCREASING", audienceGender: "UNKNOWN", confidence: 1, post: { source: "EYESMAG", url: "https://example.com/low-current-1", publishedAt: new Date("2026-09-14T00:00:00.000Z") } },
    { type: "SUB_ITEM", value: "LOWER_COVERAGE_INCREASING", audienceGender: "UNKNOWN", confidence: 1, post: { source: "NONLABEL", url: "https://example.com/low-current-2", publishedAt: new Date("2026-09-13T00:00:00.000Z") } }
  ]);
  assert.equal(cumulativeOrdering[0]?.value, "HIGH_COVERAGE_DECLINING", "Editorial ordering must remain cumulative article-presence-first, not be re-ranked by recent direction.");
  assert.equal(cumulativeOrdering[0]?.change7dArticlePresence, -1, "The unchanged top cumulative-coverage row may honestly be declining.");
  assert.equal(cumulativeOrdering[1]?.change7dArticlePresence, 2, "A lower cumulative-coverage row may separately be increasing without moving ahead in the existing order.");
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

  // Against a REAL-shaped corpus: TRACK_JACKET is a worked example of the
  // direct vs co-occurrence split. This block used to read whatever REAL
  // editorial corpus happened to be collected into whichever database
  // `pnpm test` was pointed at - correct against the original SQLite
  // dev.db, but not reproducible against any other target (e.g. a fresh
  // Neon dev/scratch Postgres with zero EditorialPost/EditorialMention
  // rows - see the 2026-09-17 Postgres migration effort). It now creates
  // its own minimal, TEST-prefixed EditorialPost/EditorialMention fixture
  // rows reproducing the exact real phrases this test has always
  // documented ("셔링 디테일의 트랙 재킷", the real ESQUIRE_KR sentence
  // "스포티한 트랙 재킷" already proven elsewhere in this file to yield
  // TRACK_JACKET + STYLE:SPORTY, and the real RECYCLED_FABRIC tote-bag
  // sentence proven via extractDirectAttributeRelations's own fixture), so
  // the test is deterministic and repeatable on an otherwise-empty
  // database - never dependent on the historical 26,464-row dataset being
  // present. Cleaned up in `finally` regardless of outcome: fixture rows
  // must never survive a test run or affect real application data.
  const attrBundleShirringSource = "TEST_ATTR_BUNDLE_SHIRRING";
  const attrBundleSportySource = "TEST_ATTR_BUNDLE_SPORTY";
  const attrBundleToteSource = "TEST_ATTR_BUNDLE_TOTE";
  const attrBundleTestSources = [attrBundleShirringSource, attrBundleSportySource, attrBundleToteSource];
  await prisma.editorialPost.deleteMany({ where: { source: { in: attrBundleTestSources } } });
  try {
    await prisma.editorialPost.create({
      data: {
        source: attrBundleShirringSource,
        externalPostId: "attr-bundle-shirring",
        url: "https://example.com/attr-bundle-shirring",
        canonicalUrl: "https://example.com/attr-bundle-shirring",
        title: "Test shirring track jacket",
        text: "셔링 디테일의 트랙 재킷을 공개했다.",
        publishedAt: new Date(),
        fashionRelevance: "FASHION_RELEVANT",
        dataMode: "real"
      }
    });
    const sportyPost = await prisma.editorialPost.create({
      data: {
        source: attrBundleSportySource,
        externalPostId: "attr-bundle-sporty",
        url: "https://example.com/attr-bundle-sporty",
        canonicalUrl: "https://example.com/attr-bundle-sporty",
        title: "Test sporty track jacket",
        text: "@ald1.official 스포티한 트랙 재킷과 레드 볼캡을 매치했다.",
        publishedAt: new Date(),
        fashionRelevance: "FASHION_RELEVANT",
        dataMode: "real"
      }
    });
    // Co-occurrence (getSpecificItemEditorialDetail) is a SEPARATE mechanism
    // from direct-attribute extraction (see that function's own doc
    // comment) - it reads persisted EditorialMention rows, never
    // EditorialPost.text. This SUB_ITEM+STYLE pair gives it real evidence
    // to report, exercising the exact direct-vs-co-occurrence split this
    // test exists to prove.
    await prisma.editorialMention.createMany({
      data: [
        { postId: sportyPost.id, type: "SUB_ITEM", value: "TRACK_JACKET", audienceGender: "UNKNOWN" },
        { postId: sportyPost.id, type: "STYLE", value: "SPORTY", audienceGender: "UNKNOWN" }
      ]
    });
    await prisma.editorialPost.create({
      data: {
        source: attrBundleToteSource,
        externalPostId: "attr-bundle-tote",
        url: "https://example.com/attr-bundle-tote",
        canonicalUrl: "https://example.com/attr-bundle-tote",
        title: "Test recycled tote bag",
        text: "재활용 패브릭을 활용한 토트백을 선보인다.",
        publishedAt: new Date(),
        fashionRelevance: "FASHION_RELEVANT",
        dataMode: "real"
      }
    });

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
  } finally {
    await prisma.editorialPost.deleteMany({ where: { source: { in: attrBundleTestSources } } });
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
  assertCorpusFloorOrSkip("EditorialPost(real) - editorial mention reparse/taxonomy data preservation", realEditorialPosts, 148, SMOKE_TEST_CORPUS_MODE);
  assertCorpusFloorOrSkip("MarketRankingSnapshot(real) - editorial mention reparse/taxonomy data preservation", realMarketSnapshots, 667, SMOKE_TEST_CORPUS_MODE);

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

/**
 * Proves businessDayKey/businessDayStart (src/lib/business-time.ts) match
 * the exact examples worked through in the periodDate timezone hardening
 * task, that they agree with the already-persisted REDNAPE row from the
 * first live collection (read-only - no historical data is touched here),
 * and that both functions are genuinely independent of the host/process
 * default timezone, not merely correct on this Asia/Seoul dev machine by
 * coincidence.
 */
async function verifyBusinessTimeHardening() {
  // 1. Korea afternoon
  assert.equal(businessDayKey(new Date("2026-09-15T05:49:18.610Z")), "2026-09-15");
  assert.equal(businessDayStart(new Date("2026-09-15T05:49:18.610Z")).toISOString(), "2026-09-14T15:00:00.000Z");

  // 2. Korea shortly after midnight
  assert.equal(businessDayKey(new Date("2026-09-14T15:30:00.000Z")), "2026-09-15");
  assert.equal(businessDayStart(new Date("2026-09-14T15:30:00.000Z")).toISOString(), "2026-09-14T15:00:00.000Z");

  // 3. Korea just before midnight
  assert.equal(businessDayKey(new Date("2026-09-14T14:59:59.999Z")), "2026-09-14");
  assert.equal(businessDayStart(new Date("2026-09-14T14:59:59.999Z")).toISOString(), "2026-09-13T15:00:00.000Z");

  // 4. REDNAPE row compatibility - tests actual DB behavior (businessDayStart
  // recomputation against a stored periodDate), not historical corpus size,
  // so per the 2026-09-17 test-isolation fix this uses a minimal
  // TEST-prefixed fixture rather than requiring an already-collected real
  // REDNAPE row to exist (not reproducible against a fresh/small dev
  // database - see the Postgres migration effort). The fixture is built
  // SELF-CONSISTENTLY (periodDate computed via the same businessDayStart()
  // under test, not a separately hardcoded instant), so this still fails
  // loudly on any future regression in businessDayStart's own determinism -
  // it just no longer depends on a specific prior live collection run's
  // stored output. Cleaned up in `finally`; must never survive a test run.
  const rednapeTestMarketProductExternalId = "TEST-BIZTIME-REDNAPE";
  const rednapeTestImportRunFileName = "TEST-BIZTIME-REDNAPE-collector";
  await prisma.marketRankingSnapshot.deleteMany({ where: { marketProduct: { externalProductId: rednapeTestMarketProductExternalId, source: "REDNAPE" } } });
  await prisma.marketProduct.deleteMany({ where: { externalProductId: rednapeTestMarketProductExternalId, source: "REDNAPE" } });
  await prisma.importRun.deleteMany({ where: { source: "REDNAPE", type: "MARKET", fileName: rednapeTestImportRunFileName } });
  try {
    const testStartedAt = new Date("2026-09-15T05:49:18.610Z");
    const testPeriodDate = businessDayStart(testStartedAt);
    await prisma.importRun.create({
      data: { type: "MARKET", source: "REDNAPE", fileName: rednapeTestImportRunFileName, status: "SUCCESS", startedAt: testStartedAt }
    });
    const testMarketProduct = await prisma.marketProduct.create({
      data: { source: "REDNAPE", externalProductId: rednapeTestMarketProductExternalId, brand: "TEST", name: "Test REDNAPE product" }
    });
    await prisma.marketRankingSnapshot.create({
      data: { marketProductId: testMarketProduct.id, source: "REDNAPE", periodDate: testPeriodDate }
    });

    const rednapeRun = await prisma.importRun.findFirst({ where: { source: "REDNAPE", type: "MARKET" }, orderBy: { startedAt: "asc" } });
    assert.ok(rednapeRun, "Expected the fixture REDNAPE ImportRun to be findable by the same query the real check uses.");
    const rednapeSnapshot = await prisma.marketRankingSnapshot.findFirst({ where: { source: "REDNAPE" } });
    assert.ok(rednapeSnapshot, "Expected the fixture REDNAPE MarketRankingSnapshot to be findable by the same query the real check uses.");
    const recomputedPeriodDate = businessDayStart(rednapeRun!.startedAt);
    assert.equal(
      recomputedPeriodDate.getTime(),
      rednapeSnapshot!.periodDate.getTime(),
      `businessDayStart(REDNAPE ImportRun.startedAt=${rednapeRun!.startedAt.toISOString()}) must equal the stored REDNAPE periodDate - got ${recomputedPeriodDate.toISOString()} vs stored ${rednapeSnapshot!.periodDate.toISOString()}.`
    );
  } finally {
    await prisma.marketRankingSnapshot.deleteMany({ where: { marketProduct: { externalProductId: rednapeTestMarketProductExternalId, source: "REDNAPE" } } });
    await prisma.marketProduct.deleteMany({ where: { externalProductId: rednapeTestMarketProductExternalId, source: "REDNAPE" } });
    await prisma.importRun.deleteMany({ where: { source: "REDNAPE", type: "MARKET", fileName: rednapeTestImportRunFileName } });
  }

  // 5. Host-timezone independence - force the process default timezone to
  // UTC (verified below to actually take effect on this Node/ICU build,
  // rather than trusting it silently), then prove both functions return
  // byte-identical results to the Asia/Seoul-host run above.
  const beforeKey = businessDayKey(new Date("2026-09-15T05:49:18.610Z"));
  const beforeStart = businessDayStart(new Date("2026-09-15T05:49:18.610Z")).toISOString();
  const originalTz = process.env.TZ;
  process.env.TZ = "UTC";
  try {
    assert.equal(Intl.DateTimeFormat().resolvedOptions().timeZone, "UTC", "TZ override must actually take effect for this to be a real host-independence proof, not a no-op.");
    assert.equal(businessDayKey(new Date("2026-09-15T05:49:18.610Z")), beforeKey, "businessDayKey must be identical regardless of host default timezone.");
    assert.equal(businessDayStart(new Date("2026-09-15T05:49:18.610Z")).toISOString(), beforeStart, "businessDayStart must be identical regardless of host default timezone.");
  } finally {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  }
}

/** Pure-helper coverage for scripts/export-sqlite-snapshot.ts - no DB access, no file I/O, no live export run (see AGENT_OPERATING_RULES.md-style preference for unit tests over live runs wherever a change is unit-testable). */
function verifyExportSnapshotHelpers() {
  // stableStringify: key order must never affect output, and Date fields
  // must serialize as full ISO-8601 UTC instants (never businessDayKey()'d,
  // never local-time reformatted - this is the exact mechanism the exporter
  // relies on for DateTime preservation).
  const a = stableStringify({ b: 2, a: 1, periodDate: new Date("2026-09-14T15:00:00.000Z") });
  const b = stableStringify({ periodDate: new Date("2026-09-14T15:00:00.000Z"), a: 1, b: 2 });
  assert.equal(a, b, "Key insertion order must never affect stableStringify output - required for byte-identical re-exports of an unchanged DB.");
  assert.equal(a, '{"a":1,"b":2,"periodDate":"2026-09-14T15:00:00.000Z"}', "Date fields must serialize as full ISO-8601 UTC instants, keys sorted alphabetically.");
  assert.equal(stableStringify({ x: null, y: undefined }), '{"x":null}', "null must be preserved; undefined must drop exactly as plain JSON.stringify already does - no special-casing added.");
  assert.equal(stableStringify([{ b: 1, a: 2 }, { d: 1, c: 2 }]), '[{"a":2,"b":1},{"c":2,"d":1}]', "Arrays of objects must have each element's keys sorted independently.");

  // sha256Hex: verified against the standard NIST test vector for "abc",
  // not merely self-consistency against Node's own crypto module.
  assert.equal(sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "SHA-256 of \"abc\" must match the standard published test vector.");
  assert.equal(sha256Hex(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "SHA-256 of the empty string must match the well-known constant.");

  // countNdjsonLines / validateNdjson: trailing newline and empty content
  // must never be miscounted as an extra/phantom line.
  assert.equal(countNdjsonLines(""), 0);
  assert.equal(countNdjsonLines('{"a":1}\n'), 1);
  assert.equal(countNdjsonLines('{"a":1}\n{"b":2}\n{"c":3}\n'), 3);
  assert.equal(countNdjsonLines('{"a":1}\n{"b":2}'), 2, "A file without a trailing newline must still count its last line.");

  const validEmpty = validateNdjson("");
  assert.deepEqual(validEmpty, { lineCount: 0, allValid: true });
  const validThree = validateNdjson('{"a":1}\n{"b":2}\n{"c":3}\n');
  assert.equal(validThree.lineCount, 3);
  assert.equal(validThree.allValid, true);
  const invalidLine = validateNdjson('{"a":1}\nnot valid json\n{"c":3}\n');
  assert.equal(invalidLine.allValid, false, "A malformed JSON line must be detected, not silently accepted.");
  assert.ok(invalidLine.firstError?.startsWith("line 2:"), "The reported error must identify the exact 1-based line number that failed to parse.");

  // countBy: bounded per-key aggregation used for the manifest's
  // reconciliation-anchor summaries.
  assert.deepEqual(
    countBy([{ source: "A" }, { source: "B" }, { source: "A" }, { source: "A" }], (row) => row.source),
    { A: 3, B: 1 }
  );

  // timestampSlug: filesystem-safe (no ":" - forbidden in Windows paths),
  // and derived from the UTC instant, never a business-day/local-time key.
  const slug = timestampSlug(new Date("2026-09-15T05:49:18.610Z"));
  assert.equal(slug, "2026-09-15T05-49-18-610Z");
  assert.equal(slug.includes(":"), false, "Export directory names must never contain ':' - not a valid Windows path character.");
}

/**
 * Builds a minimal, internally-consistent fixture snapshot directory (all 16
 * expected models present; Product has one real row exercising DateTime
 * round-trip, every other model is a correctly-hashed empty file) - the
 * baseline every "detect one specific corruption" test below mutates by
 * exactly one dimension, so each test isolates exactly the failure mode it
 * claims to test.
 */
function buildValidFixtureManifestAndFiles(dir: string): { manifest: SnapshotManifest } {
  const rowsByModel: Record<string, ExportRow[]> = Object.fromEntries(IMPORT_ORDER.map((name) => [name, [] as ExportRow[]]));
  rowsByModel.Product = [
    {
      id: "fixture-product-1",
      externalId: "fixture-ext-1",
      source: "musinsa",
      brand: "FIXTURE",
      name: "Fixture Product",
      url: "https://example.com/fixture-1",
      imageUrl: null,
      category: "상의",
      gender: null,
      color: null,
      isNew: false,
      createdAt: "2026-09-14T15:00:00.000Z",
      updatedAt: "2026-09-14T15:00:00.000Z"
    }
  ];

  const modelEntries: ManifestModelEntry[] = [];
  let totalRows = 0;
  for (const name of IMPORT_ORDER) {
    const rows = rowsByModel[name] ?? [];
    const lines = rows.map((row) => stableStringify(row));
    const content = lines.length > 0 ? `${lines.join("\n")}\n` : "";
    const fileName = `${name}.ndjson`;
    writeFileSync(join(dir, fileName), content, "utf8");
    modelEntries.push({ name, rowCount: rows.length, fileName, sha256: sha256Hex(content), bytes: Buffer.byteLength(content, "utf8") });
    totalRows += rows.length;
  }

  const manifest: SnapshotManifest = {
    formatVersion: 1,
    modelCount: IMPORT_ORDER.length,
    expectedModelCount: IMPORT_ORDER.length,
    models: modelEntries,
    totalRows
  };
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest), "utf8");
  return { manifest };
}

/**
 * Pure/fixture coverage for scripts/import-postgres-snapshot.ts - no Neon
 * connection, no SQLite access, no live importer run anywhere in this
 * function (matching this project's standing preference for unit/fixture
 * tests over live runs). Filesystem fixtures live under a fresh os.tmpdir()
 * subdirectory per test and are removed immediately after use - never
 * touching backups/ or any committed path.
 */
async function verifyImportPostgresSnapshotHelpers() {
  // ---- IMPORT_ORDER / PARENT_OF_MODEL: dependency-order proof (Section D) ----
  assert.equal(IMPORT_ORDER.length, 16, "IMPORT_ORDER must cover exactly all 16 models.");
  assert.deepEqual([...IMPORT_ORDER].sort(), [...new Set(IMPORT_ORDER)].sort(), "IMPORT_ORDER must not contain duplicate model names.");
  const positionOf = new Map(IMPORT_ORDER.map((name, index) => [name, index]));
  for (const [child, parent] of Object.entries(PARENT_OF_MODEL)) {
    if (parent === null) continue;
    assert.ok(
      positionOf.get(parent)! < positionOf.get(child)!,
      `${parent} (parent) must be imported strictly before ${child} (its @relation() dependent) - got positions ${positionOf.get(parent)} vs ${positionOf.get(child)}.`
    );
  }
  assert.deepEqual([...IMPORT_ORDER].sort(), Object.keys(DATE_TIME_FIELDS_BY_MODEL).sort(), "Every model in IMPORT_ORDER must have a registered DateTime field list, even if empty - no model may import with unmapped DateTime fields.");
  assert.ok(CREATE_MANY_BATCH_SIZE > 0 && CREATE_MANY_BATCH_SIZE * 20 < 65535, "CREATE_MANY_BATCH_SIZE must stay comfortably under Postgres's 65535-parameter limit even for this schema's widest model (~20 columns).");

  // ---- convertRowDateTimeFields / prepareRowForWrite (Section C/H, pure) ----
  const converted = convertRowDateTimeFields("Product", {
    id: "abc123",
    createdAt: "2026-09-14T15:00:00.000Z",
    updatedAt: "2026-09-14T15:00:00.000Z",
    brand: "X",
    isNew: true,
    imageUrl: null
  });
  assert.ok(converted.createdAt instanceof Date, "A declared DateTime field must become a real Date instance.");
  assert.equal((converted.createdAt as Date).toISOString(), "2026-09-14T15:00:00.000Z", "The converted Date must preserve the exact millisecond instant via toISOString().");
  assert.equal((converted.createdAt as Date).getTime(), Date.parse("2026-09-14T15:00:00.000Z"), "The converted Date's getTime() must match the source instant exactly.");
  assert.equal(converted.id, "abc123", "Explicit id must be preserved byte-for-byte.");
  assert.equal(converted.brand, "X", "Non-DateTime string fields must pass through completely untouched.");
  assert.equal(converted.isNew, true, "Boolean fields must pass through completely untouched.");
  assert.equal(converted.imageUrl, null, "An explicit null on a non-DateTime field must be preserved exactly.");
  const rawRowForPrepareCheck: ExportRow = { id: "z", createdAt: "2026-09-14T15:00:00.000Z", updatedAt: "2026-09-14T15:00:00.000Z" };
  assert.deepEqual(
    prepareRowForWrite("Product", rawRowForPrepareCheck),
    convertRowDateTimeFields("Product", rawRowForPrepareCheck),
    "prepareRowForWrite must apply exactly the same (and only the same) transformation as convertRowDateTimeFields."
  );

  // Nullable DateTime field: null must remain null, never become new Date(null) (the epoch instant).
  const nullablePublishedAt = convertRowDateTimeFields("EditorialPost", {
    id: "p1",
    publishedAt: null,
    collectedAt: "2026-09-14T15:00:00.000Z",
    createdAt: "2026-09-14T15:00:00.000Z",
    updatedAt: "2026-09-14T15:00:00.000Z"
  });
  assert.equal(nullablePublishedAt.publishedAt, null, "A nullable DateTime field with a null source value must remain null, never become an epoch Date.");

  // Required (non-nullable) DateTime field must reject an unexpected null.
  assert.throws(
    () => convertRowDateTimeFields("Product", { id: "p2", createdAt: null, updatedAt: "2026-09-14T15:00:00.000Z" }),
    /is null but is not a nullable DateTime field/,
    "A null value in a REQUIRED DateTime field must be rejected, not silently imported."
  );

  // A timestamp that does not round-trip exactly through Date must be rejected.
  assert.throws(
    () => convertRowDateTimeFields("Product", { id: "p3", createdAt: "2026-09-14 15:00:00", updatedAt: "2026-09-14T15:00:00.000Z" }),
    /did not round-trip exactly/,
    "A malformed/non-canonical timestamp must be rejected rather than silently imported."
  );

  // An unregistered model name must refuse to run blind rather than skip DateTime conversion silently.
  assert.throws(() => convertRowDateTimeFields("NotARealModel", { id: "x" }), /No DateTime field mapping registered/);

  // Section I: a dangling importRunId (no @relation()/FK on this field at
  // all) must be preserved exactly - this function has zero relation
  // awareness, so it structurally cannot "fix" it.
  const marketSnapshotRow = convertRowDateTimeFields("MarketRankingSnapshot", {
    id: "mrs1",
    marketProductId: "mp1",
    source: "REDNAPE",
    periodDate: "2026-09-14T15:00:00.000Z",
    importRunId: "does-not-correspond-to-any-importrun-row",
    createdAt: "2026-09-14T15:00:00.000Z"
  });
  assert.equal(marketSnapshotRow.importRunId, "does-not-correspond-to-any-importrun-row", "A dangling importRunId string must be preserved exactly, never nulled, validated, or reconciled.");

  // ---- checkMigrationUrlPolicy (Section A guard 1, pure) - generalized 2026-09-17
  // from the old rehearsal-only checkVerificationUrlPolicy(POSTGRES_VERIFICATION_URL,
  // DATABASE_URL). The new policy gates on differing from SQLITE_EXPORT_DATABASE_URL
  // (never DATABASE_URL - DATABASE_URL is informational only, see sameAsDatabaseUrl). ----
  assert.deepEqual(checkMigrationUrlPolicy(undefined, "file:./dev.db", undefined), {
    set: false,
    protocolValid: false,
    differsFromSqliteExportUrl: true,
    sameAsDatabaseUrl: null,
    errors: ["POSTGRES_MIGRATION_URL is not set."]
  });
  assert.equal(checkMigrationUrlPolicy("mysql://user:pass@host/db", "file:./dev.db", undefined).protocolValid, false, "A non-postgres protocol must be rejected.");
  assert.equal(
    checkMigrationUrlPolicy("file:./dev.db", "file:./dev.db", undefined).differsFromSqliteExportUrl,
    false,
    "POSTGRES_MIGRATION_URL equal to SQLITE_EXPORT_DATABASE_URL must be rejected - this is the new differs-check, replacing the old DATABASE_URL-based one."
  );
  assert.deepEqual(
    checkMigrationUrlPolicy("postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require", "file:./dev.db", undefined),
    { set: true, protocolValid: true, differsFromSqliteExportUrl: true, sameAsDatabaseUrl: null, errors: [] },
    "A valid, distinct postgresql:// URL with no DATABASE_URL set must pass cleanly, with sameAsDatabaseUrl reported as null (not comparable), never as false."
  );
  assert.equal(checkMigrationUrlPolicy("postgres://user:pass@host/db", "file:./dev.db", undefined).protocolValid, true, "The postgres:// scheme (not only postgresql://) must also be accepted.");
  // DATABASE_URL must be purely informational - identical migration/app URLs must NOT fail the policy (never a gate).
  const sameAsAppTarget = checkMigrationUrlPolicy("postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require", "file:./dev.db", "postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require");
  assert.equal(sameAsAppTarget.errors.length, 0, "POSTGRES_MIGRATION_URL identifying the SAME target as DATABASE_URL must never be an error - it is reported, never gated.");
  assert.equal(sameAsAppTarget.sameAsDatabaseUrl, true, "Identical host+pathname (ignoring query params like sslmode) must be reported as sameAsDatabaseUrl=true.");
  const differentAppTarget = checkMigrationUrlPolicy("postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require", "file:./dev.db", "postgresql://user:pass@other-host.neon.tech/otherdb?sslmode=require");
  assert.equal(differentAppTarget.sameAsDatabaseUrl, false, "A genuinely different host must be reported as sameAsDatabaseUrl=false.");
  // Query-string-only differences (e.g. channel_binding) must not cause a false "different" report - identity is host+pathname only.
  const sameHostDifferentQuery = checkMigrationUrlPolicy("postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require", "file:./dev.db", "postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require&channel_binding=require");
  assert.equal(sameHostDifferentQuery.sameAsDatabaseUrl, true, "Identical host+pathname with only query-string differences must still be reported as the same target.");

  // ---- evaluateTargetSafetyGuard (Section A guards 3-6, pure) - generalized 2026-09-17
  // from the old rehearsal-only evaluateEmptyTargetGuard(existingTableNames, countsByModel).
  // Adds explicit reachability and _prisma_migrations/applied-migration requirements. ----
  const allEmptyCounts = Object.fromEntries(IMPORT_ORDER.map((m) => [m, 0]));
  assert.equal(evaluateTargetSafetyGuard(true, IMPORT_ORDER, true, 1, allEmptyCounts).ok, true, "Reachable, all 16 tables present, migrations applied, all empty must pass the guard.");
  const unreachableGuard = evaluateTargetSafetyGuard(false, [], false, 0, {});
  assert.equal(unreachableGuard.ok, false, "An unreachable target must fail the guard.");
  assert.deepEqual(unreachableGuard.errors, ["Target database is not reachable."], "An unreachable target must short-circuit with exactly one error, never proceed to check tables/migrations/emptiness.");
  const missingTableGuard = evaluateTargetSafetyGuard(true, IMPORT_ORDER.filter((m) => m !== "ImportError"), true, 1, {});
  assert.equal(missingTableGuard.ok, false, "A missing target table must fail the guard.");
  assert.deepEqual(missingTableGuard.missingTables, ["ImportError"]);
  const noMigrationsTableGuard = evaluateTargetSafetyGuard(true, IMPORT_ORDER, false, 0, allEmptyCounts);
  assert.equal(noMigrationsTableGuard.ok, false, "A target with no _prisma_migrations table must fail the guard - the initial migration has not been deployed.");
  assert.ok(noMigrationsTableGuard.errors.some((e) => e.includes("_prisma_migrations")), "The failure must specifically name the missing _prisma_migrations table.");
  const zeroAppliedMigrationsGuard = evaluateTargetSafetyGuard(true, IMPORT_ORDER, true, 0, allEmptyCounts);
  assert.equal(zeroAppliedMigrationsGuard.ok, false, "A _prisma_migrations table with zero applied migrations must fail the guard - migrate deploy has not actually completed.");
  const nonEmptyGuard = evaluateTargetSafetyGuard(true, IMPORT_ORDER, true, 1, { ...allEmptyCounts, Product: 5 });
  assert.equal(nonEmptyGuard.ok, false, "A single non-empty target table must fail the whole guard, never partially proceed.");
  assert.deepEqual(nonEmptyGuard.nonEmptyTables, ["Product"]);

  // ---- resolveReconciliationProfile (pure) ----
  assert.deepEqual(resolveReconciliationProfile([]), { profile: "default" }, "No --profile flag must default to \"default\" (core checks only).");
  assert.deepEqual(resolveReconciliationProfile(["backups/x", "--profile=rehearsal"]), { profile: "rehearsal" });
  assert.deepEqual(resolveReconciliationProfile(["backups/x", "--profile=default"]), { profile: "default" });
  const badProfile = resolveReconciliationProfile(["backups/x", "--profile=production"]);
  assert.equal(badProfile.profile, "default", "An unrecognized --profile value must never silently guess a profile - it falls back to default AND reports an error the caller must act on.");
  assert.ok(badProfile.error?.includes('Unknown --profile value "production"'), "The error must name the exact unrecognized value.");

  // ---- computeReconciliationVerdict (pure) - proves "default reconciliation does not
  // require REDNAPE anchors" and "--profile=rehearsal still checks them" directly. ----
  assert.deepEqual(
    computeReconciliationVerdict("default", true, false, false),
    { corePass: true, rehearsalPass: true, overallPass: true },
    "Under the default profile, a FAILING REDNAPE/dataMode report must NOT fail the overall verdict - a future snapshot with no REDNAPE data must never fail reconciliation merely for lacking a dataset-specific anchor."
  );
  assert.deepEqual(
    computeReconciliationVerdict("default", false, true, true),
    { corePass: false, rehearsalPass: true, overallPass: false },
    "Under the default profile, a core-check failure must still fail the overall verdict regardless of rehearsal-anchor status."
  );
  assert.deepEqual(
    computeReconciliationVerdict("rehearsal", true, true, true),
    { corePass: true, rehearsalPass: true, overallPass: true },
    "Under --profile=rehearsal, core pass + REDNAPE pass + dataMode pass must yield an overall pass."
  );
  assert.deepEqual(
    computeReconciliationVerdict("rehearsal", true, false, true),
    { corePass: true, rehearsalPass: false, overallPass: false },
    "Under --profile=rehearsal, a FAILING REDNAPE report must fail the overall verdict even when core checks pass - this is the exact case a rehearsal run must still catch."
  );
  assert.deepEqual(
    computeReconciliationVerdict("rehearsal", true, true, false),
    { corePass: true, rehearsalPass: false, overallPass: false },
    "Under --profile=rehearsal, a FAILING dataMode-counts report must likewise fail the overall verdict."
  );

  // ---- validateManifestShape (pure, no fs) ----
  const wellFormedModels: ManifestModelEntry[] = IMPORT_ORDER.map((name) => ({ name, rowCount: 0, fileName: `${name}.ndjson`, sha256: sha256Hex(""), bytes: 0 }));
  assert.equal(validateManifestShape({ formatVersion: 1, modelCount: 16, expectedModelCount: 16, totalRows: 0, models: wellFormedModels }).ok, true, "A well-formed manifest declaring all 16 expected models must validate.");
  const badVersionShape = validateManifestShape({ formatVersion: 999 });
  assert.equal(badVersionShape.ok, false);
  assert.ok(badVersionShape.errors[0]?.includes("Unsupported manifest formatVersion"), "An unsupported formatVersion must be reported and short-circuit further shape checks.");
  const missingModelShape = validateManifestShape({
    formatVersion: 1,
    modelCount: 15,
    totalRows: 0,
    models: wellFormedModels.filter((m) => m.name !== "ImportError")
  });
  assert.equal(missingModelShape.ok, false);
  assert.ok(missingModelShape.errors.some((e) => e.includes('missing an entry for expected model "ImportError"')), "A manifest missing one of the 16 expected models must be detected.");
  const unknownModelShape = validateManifestShape({
    formatVersion: 1,
    modelCount: 17,
    totalRows: 0,
    models: [...wellFormedModels, { name: "NotARealModel", rowCount: 0, fileName: "NotARealModel.ndjson", sha256: sha256Hex(""), bytes: 0 }]
  });
  assert.equal(unknownModelShape.ok, false);
  assert.ok(unknownModelShape.errors.some((e) => e.includes('unknown model "NotARealModel"')), "A manifest entry for an unrecognized model name must be detected as unsupported.");

  // ---- verifyNdjsonFileIntegrity (pure, no fs) ----
  assert.equal(verifyNdjsonFileIntegrity("Product", '{"a":1}\n', { sha256: sha256Hex('{"a":1}\n'), rowCount: 1 }).ok, true);
  const shaMismatch = verifyNdjsonFileIntegrity("Product", '{"a":1}\n', { sha256: "0".repeat(64), rowCount: 1 });
  assert.equal(shaMismatch.ok, false);
  assert.ok(shaMismatch.errors[0]?.includes("SHA-256 mismatch"), "A SHA-256 mismatch must be detected and named as such.");
  const lineCountMismatch = verifyNdjsonFileIntegrity("Product", '{"a":1}\n{"b":2}\n', { sha256: sha256Hex('{"a":1}\n{"b":2}\n'), rowCount: 5 });
  assert.equal(lineCountMismatch.ok, false);
  assert.ok(lineCountMismatch.errors[0]?.includes("line-count mismatch"), "A line-count mismatch must be detected and named as such.");

  // ---- validateSnapshotIntegrity: fixture-backed, real filesystem I/O against a fresh os.tmpdir() directory only ----
  const validDir = mkdtempSync(join(tmpdir(), "pg-import-fixture-valid-"));
  try {
    buildValidFixtureManifestAndFiles(validDir);
    const validResult = await validateSnapshotIntegrity(validDir);
    assert.equal(validResult.ok, true, `A correctly self-consistent fixture snapshot must validate cleanly. Errors: ${JSON.stringify(validResult.errors)}`);
    assert.equal(validResult.manifest?.totalRows, 1);
    assert.equal(validResult.rowsByModel.get("Product")?.length, 1);
    assert.equal(validResult.rowsByModel.get("Product")?.[0]?.id, "fixture-product-1", "Parsed rows must retain their explicit id exactly.");
  } finally {
    rmSync(validDir, { recursive: true, force: true });
  }

  const shaDir = mkdtempSync(join(tmpdir(), "pg-import-fixture-sha-"));
  try {
    buildValidFixtureManifestAndFiles(shaDir);
    writeFileSync(join(shaDir, "Product.ndjson"), '{"id":"tampered-after-manifest-was-written"}\n', "utf8");
    const shaResult = await validateSnapshotIntegrity(shaDir);
    assert.equal(shaResult.ok, false, "A file tampered with after its manifest hash was recorded must fail validation.");
    assert.ok(shaResult.errors.some((e) => e.includes("SHA-256 mismatch")), "The failure must specifically name a SHA-256 mismatch.");
  } finally {
    rmSync(shaDir, { recursive: true, force: true });
  }

  const lineDir = mkdtempSync(join(tmpdir(), "pg-import-fixture-linecount-"));
  try {
    buildValidFixtureManifestAndFiles(lineDir);
    writeFileSync(join(lineDir, "Product.ndjson"), '{"id":"a"}\n{"id":"b"}\n', "utf8");
    const lineResult = await validateSnapshotIntegrity(lineDir);
    assert.equal(lineResult.ok, false, "A file whose actual line count disagrees with the manifest must fail validation.");
    assert.ok(lineResult.errors.some((e) => e.includes("line-count mismatch")), "The failure must specifically name a line-count mismatch.");
  } finally {
    rmSync(lineDir, { recursive: true, force: true });
  }

  const missingFileDir = mkdtempSync(join(tmpdir(), "pg-import-fixture-missingfile-"));
  try {
    buildValidFixtureManifestAndFiles(missingFileDir);
    rmSync(join(missingFileDir, "ImportError.ndjson"));
    const missingFileResult = await validateSnapshotIntegrity(missingFileDir);
    assert.equal(missingFileResult.ok, false, "A manifest-referenced NDJSON file that does not actually exist on disk must fail validation.");
    assert.ok(missingFileResult.errors.some((e) => e.includes("does not exist")), "The failure must specifically name the missing file.");
  } finally {
    rmSync(missingFileDir, { recursive: true, force: true });
  }

  const versionDir = mkdtempSync(join(tmpdir(), "pg-import-fixture-version-"));
  try {
    const { manifest } = buildValidFixtureManifestAndFiles(versionDir);
    writeFileSync(join(versionDir, "manifest.json"), JSON.stringify({ ...manifest, formatVersion: 2 }), "utf8");
    const versionResult = await validateSnapshotIntegrity(versionDir);
    assert.equal(versionResult.ok, false, "An unsupported manifest formatVersion must fail validation immediately.");
    assert.ok(versionResult.errors.some((e) => e.includes("Unsupported manifest formatVersion")), "The failure must specifically name the unsupported formatVersion.");
  } finally {
    rmSync(versionDir, { recursive: true, force: true });
  }

  const malformedDir = mkdtempSync(join(tmpdir(), "pg-import-fixture-malformed-"));
  try {
    const { manifest: baseManifest } = buildValidFixtureManifestAndFiles(malformedDir);
    const malformedContent = "not valid json\n";
    writeFileSync(join(malformedDir, "Product.ndjson"), malformedContent, "utf8");
    // Recompute sha256/rowCount to MATCH the malformed content exactly, so
    // this test isolates ONLY JSON-parse-validity failure - not a sha/line-
    // count mismatch, which would otherwise mask what is actually being tested.
    const patchedManifest: SnapshotManifest = {
      ...baseManifest,
      models: baseManifest.models.map((m) => (m.name === "Product" ? { ...m, sha256: sha256Hex(malformedContent), rowCount: 1, bytes: Buffer.byteLength(malformedContent, "utf8") } : m))
    };
    writeFileSync(join(malformedDir, "manifest.json"), JSON.stringify(patchedManifest), "utf8");
    const malformedResult = await validateSnapshotIntegrity(malformedDir);
    assert.equal(malformedResult.ok, false, "A line that fails JSON.parse must fail validation even when sha256/line-count both match.");
    assert.ok(malformedResult.errors.some((e) => e.includes("NDJSON parse failure")), "The failure must specifically name the parse failure.");
  } finally {
    rmSync(malformedDir, { recursive: true, force: true });
  }

  // ---- sanitizeErrorMessage (pure) ----
  assert.equal(
    sanitizeErrorMessage("connection to postgresql://user:secret@ep-example.neon.tech/neondb?sslmode=require failed"),
    "connection to postgres[ql]://[REDACTED] failed",
    "Any embedded postgres(ql):// connection-string-shaped substring must be redacted before an error message is ever surfaced."
  );
  assert.equal(sanitizeErrorMessage("unique constraint violation on Product.externalId"), "unique constraint violation on Product.externalId", "A message with no embedded connection string must pass through unchanged.");

  // ---- importModel: a failed createMany() batch must trigger ZERO further
  // write calls of any kind - this is the exact regression the removal of
  // the automatic per-row create() diagnostic replay guards against. Uses a
  // fake client/delegate (no real DB, no Neon, no SQLite) that instruments
  // every call so any unexpected write attempt fails the test immediately. ----
  {
    let createManyCalls = 0;
    let createCalls = 0;
    let countCalls = 0;
    const fakeDelegate = {
      createMany: async () => {
        createManyCalls += 1;
        throw new Error("simulated unique constraint violation");
      },
      create: async () => {
        createCalls += 1;
        throw new Error("create() must never be called by importModel after a createMany failure - this fake exists specifically to fail the test if it is.");
      },
      count: async () => {
        countCalls += 1;
        return 0; // read-only; simulates an empty table after Postgres rolled back the failed multi-row INSERT
      }
    };
    const fakeClient = { product: fakeDelegate } as unknown as Parameters<typeof importModel>[0];
    const rows: ExportRow[] = [{ id: "row-1" }, { id: "row-2" }];
    const outcome = await importModel(fakeClient, "Product", rows);

    assert.equal(outcome.status, "FAIL", "A failed createMany must produce a FAIL outcome.");
    assert.equal(createManyCalls, 1, "createMany must be attempted exactly once for a single-batch import.");
    assert.equal(createCalls, 0, "create() (the removed per-row diagnostic replay) must NEVER be called after a createMany failure.");
    assert.equal(countCalls, 1, "Exactly one read-only count() call is expected for failure reporting - a read, never a write.");
    assert.equal(outcome.failureDetail?.batchNumber, 1);
    assert.equal(outcome.failureDetail?.sourceRowRangeStart, 1);
    assert.equal(outcome.failureDetail?.sourceRowRangeEnd, 2);
    assert.equal(outcome.failureDetail?.firstSourceId, "row-1", "The failure report must identify the first source id in the failed batch.");
    assert.equal(outcome.failureDetail?.lastSourceId, "row-2", "The failure report must identify the last source id in the failed batch.");
    assert.ok(outcome.failureDetail?.message.includes("simulated unique constraint violation"), "The original (sanitized) error message must be included in the report.");
  }

  // ---- importModel: a LATER batch's failure (after an earlier batch
  // already succeeded) must also trigger zero create() calls - proving the
  // guarantee holds regardless of which batch fails, not just the first. ----
  {
    let createManyCalls = 0;
    let createCalls = 0;
    const fakeDelegate = {
      createMany: async () => {
        createManyCalls += 1;
        if (createManyCalls === 2) throw new Error("simulated batch 2 failure");
      },
      create: async () => {
        createCalls += 1;
        throw new Error("create() must never be called - no per-row fallback exists anywhere in importModel.");
      },
      count: async () => CREATE_MANY_BATCH_SIZE // read-only; simulates the first batch's rows having landed
    };
    const fakeClient = { product: fakeDelegate } as unknown as Parameters<typeof importModel>[0];
    const manyRows: ExportRow[] = Array.from({ length: CREATE_MANY_BATCH_SIZE + 1 }, (_, i) => ({ id: `row-${i + 1}` }));
    const outcome = await importModel(fakeClient, "Product", manyRows);

    assert.equal(outcome.status, "FAIL");
    assert.equal(createManyCalls, 2, "The second batch's createMany must be attempted after the first batch succeeded.");
    assert.equal(createCalls, 0, "create() must never be called even after a LATER batch's failure.");
    assert.equal(outcome.failureDetail?.batchNumber, 2);
    assert.equal(outcome.failureDetail?.sourceRowRangeStart, CREATE_MANY_BATCH_SIZE + 1);
    assert.equal(outcome.failureDetail?.sourceRowRangeEnd, CREATE_MANY_BATCH_SIZE + 1);
  }

  // ---- importModel: success path (no failure) must still call createMany
  // exactly once per batch and never call create() at all. ----
  {
    let createManyCalls = 0;
    let createCalls = 0;
    const fakeDelegate = {
      createMany: async () => {
        createManyCalls += 1;
      },
      create: async () => {
        createCalls += 1;
        throw new Error("create() must never be called on the success path either.");
      },
      count: async () => 2
    };
    const fakeClient = { product: fakeDelegate } as unknown as Parameters<typeof importModel>[0];
    const outcome = await importModel(fakeClient, "Product", [{ id: "a" }, { id: "b" }]);

    assert.equal(outcome.status, "PASS");
    assert.equal(outcome.importedRowCount, 2);
    assert.equal(createManyCalls, 1);
    assert.equal(createCalls, 0, "create() must never be called on the success path.");
  }
}

/**
 * Pure/fixture coverage for scripts/reconcile-postgres-snapshot.ts - no Neon
 * connection, no SQLite access, no live reconciliation run. Every case below
 * uses hand-built ExportRow fixtures only.
 */
function verifyReconcilePostgresSnapshotHelpers() {
  // ---- deterministic normalization (canonicalFieldValue) ----
  assert.equal(canonicalFieldValue("Product", "createdAt", "2026-09-14T15:00:00.000Z"), "2026-09-14T15:00:00.000Z", "An already-canonical ISO string must normalize to itself.");
  assert.equal(canonicalFieldValue("Product", "createdAt", new Date("2026-09-14T15:00:00.000Z")), "2026-09-14T15:00:00.000Z", "A Date instance must normalize to the same canonical ISO string as the equivalent ISO source string.");
  assert.equal(canonicalFieldValue("Product", "brand", "FIXTURE"), "FIXTURE", "A non-DateTime field must pass through untouched.");
  assert.equal(canonicalFieldValue("Product", "brand", undefined), undefined, "A field entirely absent from a row must normalize to undefined, not crash or become null.");
  assert.throws(() => canonicalFieldValue("Product", "createdAt", "not-a-date"), /unparseable DateTime string/, "An unparseable DateTime string must be rejected, never silently normalized.");

  // ---- null preservation ----
  assert.equal(canonicalFieldValue("EditorialPost", "publishedAt", null), null, "A null DateTime field must normalize to null, never new Date(null)'s epoch instant.");
  assert.equal(canonicalFieldValue("Product", "imageUrl", null), null, "A null non-DateTime field must normalize to null unchanged.");

  // ---- DateTime equality via compareRowFields: Date instance (Neon) vs ISO string (snapshot) representing the SAME instant must NOT be reported as a mismatch ----
  const baseProductSource: ExportRow = { id: "p1", brand: "X", createdAt: "2026-09-14T15:00:00.000Z", updatedAt: "2026-09-14T15:00:00.000Z", isNew: true, imageUrl: null };
  const sameInstantTarget: ExportRow = { id: "p1", brand: "X", createdAt: new Date("2026-09-14T15:00:00.000Z"), updatedAt: new Date("2026-09-14T15:00:00.000Z"), isNew: true, imageUrl: null };
  assert.deepEqual(compareRowFields("Product", "p1", baseProductSource, sameInstantTarget), [], "A Date instance and an ISO string for the identical instant must compare as equal, never a false-positive DateTime mismatch.");

  // A DateTime field off by one millisecond MUST be reported as a mismatch (DateTime equality is exact-instant, not date-only).
  const offByOneMsTarget: ExportRow = { ...sameInstantTarget, createdAt: new Date("2026-09-14T15:00:00.001Z") };
  const offByOneMsMismatches = compareRowFields("Product", "p1", baseProductSource, offByOneMsTarget);
  assert.equal(offByOneMsMismatches.length, 1);
  assert.equal(offByOneMsMismatches[0]?.field, "createdAt");
  assert.equal(offByOneMsMismatches[0]?.isDateTimeField, true, "A DateTime-field mismatch must be flagged as such (drives the separate DateTime-equality PASS/FAIL line).");

  // ---- field mismatch detection (non-DateTime field) ----
  const wrongBrandTarget: ExportRow = { ...sameInstantTarget, brand: "DIFFERENT" };
  const brandMismatches = compareRowFields("Product", "p1", baseProductSource, wrongBrandTarget);
  assert.equal(brandMismatches.length, 1);
  assert.deepEqual(
    { field: brandMismatches[0]?.field, sourceValue: brandMismatches[0]?.sourceValue, targetValue: brandMismatches[0]?.targetValue, isDateTimeField: brandMismatches[0]?.isDateTimeField },
    { field: "brand", sourceValue: "X", targetValue: "DIFFERENT", isDateTimeField: false },
    "A plain scalar-field mismatch must report source/target values and isDateTimeField=false."
  );

  // A null vs a non-null value on either side must be reported as a mismatch (never treated as "close enough").
  const nullVsValueMismatches = compareRowFields("Product", "p1", baseProductSource, { ...sameInstantTarget, imageUrl: "https://example.com/x.jpg" });
  assert.equal(nullVsValueMismatches.length, 1);
  assert.equal(nullVsValueMismatches[0]?.field, "imageUrl");

  // A field present on only one side must be reported as a mismatch (against `undefined`), never silently ignored.
  const missingFieldMismatches = compareRowFields("Product", "p1", { ...baseProductSource, extraSourceOnlyField: "present" }, sameInstantTarget);
  assert.equal(missingFieldMismatches.length, 1);
  assert.equal(missingFieldMismatches[0]?.field, "extraSourceOnlyField");
  assert.equal(missingFieldMismatches[0]?.targetValue, undefined);

  // ---- ID-set mismatch detection ----
  const idSetMatch = compareIdSets(new Set(["a", "b", "c"]), new Set(["a", "b", "c"]));
  assert.deepEqual(idSetMatch, { ok: true, missingInTarget: [], extraInTarget: [] });
  const idSetMismatch = compareIdSets(new Set(["a", "b", "c"]), new Set(["a", "c", "d"]));
  assert.equal(idSetMismatch.ok, false);
  assert.deepEqual(idSetMismatch.missingInTarget, ["b"], "An id present in the snapshot but absent from Neon must be reported as missingInTarget.");
  assert.deepEqual(idSetMismatch.extraInTarget, ["d"], "An id present in Neon but absent from the snapshot must be reported as extraInTarget.");

  // ---- fingerprint equality: logically-identical rows must fingerprint identically even when DateTime representation differs (ISO string vs Date instance) ----
  const fingerprintSourceRows: ExportRow[] = [
    { id: "b", brand: "B", createdAt: "2026-09-14T15:00:00.000Z" },
    { id: "a", brand: "A", createdAt: "2026-09-14T14:00:00.000Z" }
  ];
  const fingerprintTargetRowsSameData: ExportRow[] = [
    { id: "a", brand: "A", createdAt: new Date("2026-09-14T14:00:00.000Z") },
    { id: "b", brand: "B", createdAt: new Date("2026-09-14T15:00:00.000Z") }
  ];
  const sourceFingerprint = computeModelFingerprint("Product", fingerprintSourceRows);
  const targetFingerprintSameData = computeModelFingerprint("Product", fingerprintTargetRowsSameData);
  assert.equal(sourceFingerprint, targetFingerprintSameData, "Fingerprints must match for logically identical data regardless of row order or DateTime representation (string vs Date), since both are sorted by id and DateTime-normalized before hashing.");
  assert.equal(sourceFingerprint.length, 64, "A SHA-256 hex digest must be 64 characters.");
  assert.equal(computeModelFingerprint("Product", []), computeModelFingerprint("Product", []), "Fingerprint of an empty row set must be deterministic.");

  // ---- fingerprint mismatch: a single differing field value must change the fingerprint ----
  const fingerprintTargetRowsDifferentData: ExportRow[] = [
    { id: "a", brand: "A", createdAt: new Date("2026-09-14T14:00:00.000Z") },
    { id: "b", brand: "DIFFERENT", createdAt: new Date("2026-09-14T15:00:00.000Z") }
  ];
  assert.notEqual(computeModelFingerprint("Product", fingerprintSourceRows), computeModelFingerprint("Product", fingerprintTargetRowsDifferentData), "A single differing field value anywhere in the table must change the whole-model fingerprint.");

  // ---- dangling importRunId preservation: MarketRankingSnapshot HAS a declared relation to MarketProduct (via marketProductId), but its SEPARATE
  // importRunId field has no @relation() at all and must never be treated as a relation to validate/repair. SalesSnapshot has no declared relation
  // dependents in RELATION_FK_FIELD at all in this fixture set (its own importRunId field is likewise unconstrained). ----
  assert.equal(RELATION_FK_FIELD.MarketRankingSnapshot, "marketProductId", "MarketRankingSnapshot's only declared relation is via marketProductId -> MarketProduct; its importRunId must never appear here.");
  assert.equal(RELATION_FK_FIELD.SalesSnapshot, "productId", "SalesSnapshot's only declared relation is via productId -> InternalProduct; its importRunId must never appear here.");
  const danglingSnapshotRow: ExportRow = { id: "mrs1", marketProductId: "mp1", source: "REDNAPE", importRunId: "does-not-correspond-to-any-importrun-row" };
  // checkRelationIntegrity for MarketRankingSnapshot validates ONLY marketProductId - a valid marketProductId must pass even though importRunId is dangling.
  const relationCheckIgnoresImportRunId = checkRelationIntegrity("MarketRankingSnapshot", [danglingSnapshotRow], new Set(["mp1"]));
  assert.deepEqual(relationCheckIgnoresImportRunId, { ok: true, danglingIds: [] }, "checkRelationIntegrity must validate only the declared marketProductId relation and never inspect importRunId as if it were an FK.");
  // A model genuinely absent from RELATION_FK_FIELD (no declared relation at all) must be a structural no-op.
  assert.equal(RELATION_FK_FIELD.Product, undefined, "Product (a GROUP 1 independent parent) must have no entry in RELATION_FK_FIELD.");
  const relationCheckForNonRelationModel = checkRelationIntegrity("Product", [{ id: "prod1" }], new Set());
  assert.deepEqual(relationCheckForNonRelationModel, { ok: true, danglingIds: [] }, "checkRelationIntegrity must be a structural no-op (always ok) for a model with no declared relation at all.");
  // The dangling importRunId value itself must still be preserved and compared exactly as an ordinary field via compareRowFields.
  const danglingFieldMismatches = compareRowFields("MarketRankingSnapshot", "mrs1", danglingSnapshotRow, { ...danglingSnapshotRow, importRunId: "does-not-correspond-to-any-importrun-row" });
  assert.deepEqual(danglingFieldMismatches, [], "An identical dangling importRunId string on both sides must compare as equal - reconciliation never nulls, repairs, or flags it as an orphan.");
  const danglingFieldChanged = compareRowFields("MarketRankingSnapshot", "mrs1", danglingSnapshotRow, { ...danglingSnapshotRow, importRunId: "a-different-dangling-value" });
  assert.equal(danglingFieldChanged.length, 1, "A CHANGED dangling importRunId value must still be reported as an ordinary field mismatch - preservation means exact comparison, not exemption from comparison.");

  // ---- relation integrity for an actual declared relation: a real dangling FK must be detected ----
  assert.equal(RELATION_FK_FIELD.RankingSnapshot, "productId");
  const validParentIds = new Set(["prod-1", "prod-2"]);
  const relationOk = checkRelationIntegrity("RankingSnapshot", [{ id: "rs1", productId: "prod-1" }, { id: "rs2", productId: "prod-2" }], validParentIds);
  assert.deepEqual(relationOk, { ok: true, danglingIds: [] });
  const relationDangling = checkRelationIntegrity("RankingSnapshot", [{ id: "rs1", productId: "prod-1" }, { id: "rs2", productId: "prod-missing" }], validParentIds);
  assert.equal(relationDangling.ok, false);
  assert.deepEqual(relationDangling.danglingIds, ["rs2"], "A RankingSnapshot row whose productId does not resolve to any known Product id must be reported as dangling.");

  // ---- aggregate comparisons (bonus coverage: source/category-style dimension checks) ----
  const aggSource: ExportRow[] = [{ id: "1", source: "END" }, { id: "2", source: "END" }, { id: "3", source: "STUSSY" }];
  const aggTargetMatching: ExportRow[] = [{ id: "1", source: "END" }, { id: "2", source: "END" }, { id: "3", source: "STUSSY" }];
  assert.equal(compareAggregate("test", aggSource, aggTargetMatching, (r) => String(r.source)).ok, true);
  const aggTargetMismatch: ExportRow[] = [{ id: "1", source: "END" }, { id: "2", source: "STUSSY" }, { id: "3", source: "STUSSY" }];
  const aggMismatchResult = compareAggregate("test", aggSource, aggTargetMismatch, (r) => String(r.source));
  assert.equal(aggMismatchResult.ok, false);
  assert.deepEqual(aggMismatchResult.diffKeys, ["END", "STUSSY"], "Both dimension keys whose counts differ between source and target must be reported.");

  // ---- REDNAPE anchor fixture check ----
  const rednapeMarketProduct: ExportRow[] = ["593", "586", "509", "440", "45"].map((externalProductId, i) => ({ id: `mp${i}`, source: "REDNAPE", externalProductId }));
  const rednapeSnapshot: ExportRow[] = rednapeMarketProduct.map((mp, i) => ({
    id: `mrs${i}`,
    marketProductId: mp.id,
    source: "REDNAPE",
    periodDate: "2026-09-14T15:00:00.000Z",
    rank: null,
    rankingVerified: false,
    rankingScope: "CATEGORY"
  }));
  const rednapeImportRun: ExportRow[] = [{ id: "run1", source: "REDNAPE" }];
  const rednapeFixtureSides = { marketProduct: rednapeMarketProduct, marketRankingSnapshot: rednapeSnapshot, importRun: rednapeImportRun, importError: [] as ExportRow[] };
  const rednapeMatchingReport = checkRednapeAnchors(rednapeFixtureSides, rednapeFixtureSides);
  assert.equal(rednapeMatchingReport.ok, true, "A REDNAPE fixture matching every known baseline (5/5/1/0, exact external id set, exact periodDate/rank/flags) must pass in full.");

  const rednapeBrokenTarget = { ...rednapeFixtureSides, marketRankingSnapshot: rednapeSnapshot.map((r, i) => (i === 0 ? { ...r, rank: 3 } : r)) };
  const rednapeBrokenReport = checkRednapeAnchors(rednapeFixtureSides, rednapeBrokenTarget);
  assert.equal(rednapeBrokenReport.ok, false, "A REDNAPE snapshot row with a non-null rank (violating the known rank=null baseline) must fail the anchor check.");
  assert.equal(rednapeBrokenReport.periodDateAndFlags.ok, false);

  // ---- MarketRankingSnapshot dataMode aggregate check ----
  const dataModeRows: ExportRow[] = [...Array.from({ length: 672 }, () => ({ dataMode: "real" })), ...Array.from({ length: 2592 }, () => ({ dataMode: "sample" }))];
  const dataModeReport = checkMarketRankingSnapshotDataModeCounts(dataModeRows, dataModeRows);
  assert.deepEqual(dataModeReport.source, { real: 672, sample: 2592, total: 3264 });
  assert.equal(dataModeReport.ok, true);
  const dataModeReportBroken = checkMarketRankingSnapshotDataModeCounts(dataModeRows, [...dataModeRows, { dataMode: "sample" }]);
  assert.equal(dataModeReportBroken.ok, false, "A target row count that no longer matches the known 672/2592/3264 baseline must fail this check.");
}

/**
 * Pure/fixture coverage for SMOKE_TEST_CORPUS_MODE and
 * assertCorpusFloorOrSkip - no DB, no live env var mutation left behind
 * (process.env.SMOKE_TEST_CORPUS_MODE is never touched; resolveSmokeTestCorpusMode
 * is called directly with explicit string arguments instead).
 */
function verifySmokeTestCorpusMode() {
  // resolveSmokeTestCorpusMode: unset/empty defaults safely to "development".
  assert.equal(resolveSmokeTestCorpusMode(undefined), "development", "Unset SMOKE_TEST_CORPUS_MODE must default to development - the safe default for a fresh/small dev database.");
  assert.equal(resolveSmokeTestCorpusMode(""), "development", "An empty SMOKE_TEST_CORPUS_MODE must default to development, same as unset.");
  assert.equal(resolveSmokeTestCorpusMode("full"), "full");
  assert.equal(resolveSmokeTestCorpusMode("development"), "development");
  // 5. invalid SMOKE_TEST_CORPUS_MODE => fail clearly rather than silently guessing.
  assert.throws(() => resolveSmokeTestCorpusMode("production"), /Invalid SMOKE_TEST_CORPUS_MODE "production"/, "An unrecognized mode value must fail loudly, never be silently coerced into development or full.");

  const captureLogs = () => {
    const lines: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map((a) => String(a)).join(" "));
    };
    return {
      lines,
      restore: () => {
        console.log = original;
      }
    };
  };

  // 1. full + above floor => PASS (no throw, no N/A log - this is a real, active check).
  {
    const capture = captureLogs();
    try {
      assert.doesNotThrow(() => assertCorpusFloorOrSkip("test-metric", 500, 472, "full"), "full mode with a count above the floor must pass cleanly.");
    } finally {
      capture.restore();
    }
    assert.equal(capture.lines.some((line) => line.includes("[corpus-floor N/A]")), false, "A passing full-mode check must never also print an N/A line - it is a real assertion, not a skip.");
  }

  // 2. full + below floor => HARD FAIL. This is the exact regression blind
  // spot the environment-driven redesign closes: a full-corpus environment
  // whose count has genuinely dropped below its historical floor (e.g.
  // 734 -> 100, still nonzero) must fail loudly, never be reclassified as
  // "N/A, fresh dev DB" the way a count-only heuristic would.
  {
    const capture = captureLogs();
    try {
      assert.throws(
        () => assertCorpusFloorOrSkip("test-metric", 100, 472, "full"),
        /SMOKE_TEST_CORPUS_MODE=full requires this to stay at or above the historical floor of 472, got 100/,
        "full mode with a count below the floor must hard-fail with a clear message, regardless of how small or large the shortfall is."
      );
    } finally {
      capture.restore();
    }
    assert.equal(capture.lines.length, 0, "A hard-failing full-mode check must never also print an N/A line - the thrown assertion is the only signal.");
  }

  // 3. development + below floor => N/A (never a throw, never fabricated data).
  {
    const capture = captureLogs();
    try {
      assert.doesNotThrow(() => assertCorpusFloorOrSkip("test-metric", 100, 472, "development"));
    } finally {
      capture.restore();
    }
    assert.ok(capture.lines.some((line) => line.includes("[corpus-floor N/A]") && line.includes("current=100") && line.includes("historicalFloor=472")), "development mode below the floor must print a bounded N/A line naming the metric, current count, and floor.");
  }

  // 4. development + above floor => STILL N/A, because applicability is
  // environment-driven (the mode), never count-driven. This is the key
  // proof that a development-mode database with a coincidentally
  // floor-meeting count is not silently upgraded into a passing "full"
  // assertion - only the explicit mode decides.
  {
    const capture = captureLogs();
    try {
      assert.doesNotThrow(() => assertCorpusFloorOrSkip("test-metric", 500, 472, "development"));
    } finally {
      capture.restore();
    }
    assert.ok(
      capture.lines.some((line) => line.includes("[corpus-floor N/A]") && line.includes("current=500") && line.includes("historicalFloor=472")),
      "development mode must print the N/A line even when the count already meets or exceeds the floor - a count meeting the floor must never be treated as proof this is a full-corpus environment."
    );
  }
}

/**
 * Pure/fixture coverage for scripts/migrate-postgres-target.ts - no child
 * process is ever spawned, no live `prisma migrate deploy` is ever run. See
 * that file's own top comment for why it exists (a bare
 * `POSTGRES_MIGRATION_URL=... prisma migrate deploy` does NOT make Prisma
 * use POSTGRES_MIGRATION_URL, since the schema's datasource reads
 * `env("DATABASE_URL")` unconditionally).
 */
function verifyMigratePostgresTargetHelpers() {
  // ---- missing migration URL => fail, with NO fallback to DATABASE_URL ----
  const missingUrlPolicy = checkMigrationUrlPolicy(undefined, "file:./dev.db", "postgresql://actual-app-db.neon.tech/appdb");
  assert.equal(missingUrlPolicy.set, false, "A missing POSTGRES_MIGRATION_URL must be reported as unset.");
  assert.ok(missingUrlPolicy.errors.some((e) => e.includes("POSTGRES_MIGRATION_URL is not set")), "The error must specifically name POSTGRES_MIGRATION_URL, never silently substitute DATABASE_URL.");
  // The presence of a perfectly valid DATABASE_URL must never rescue a missing POSTGRES_MIGRATION_URL - this IS the "no fallback to parent DATABASE_URL" proof.
  assert.equal(missingUrlPolicy.sameAsDatabaseUrl, null, "With POSTGRES_MIGRATION_URL unset, sameAsDatabaseUrl must be null (not comparable) - never silently treated as if DATABASE_URL were the migration target.");

  // ---- invalid protocol => fail ----
  const invalidProtocolPolicy = checkMigrationUrlPolicy("mysql://user:pass@host/db", "file:./dev.db", undefined);
  assert.equal(invalidProtocolPolicy.protocolValid, false, "A non-postgres protocol must be rejected.");

  // ---- valid URL => accepted ----
  const validPolicy = checkMigrationUrlPolicy("postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require", "file:./dev.db", undefined);
  assert.equal(validPolicy.errors.length, 0, "A valid, distinct postgresql:// URL must be accepted with zero errors.");

  // ---- secret/raw URL is never included in sanitized reporting ----
  const credentialedUrl = "postgresql://realuser:supersecretpassword@ep-real-host.neon.tech/realdb?sslmode=require";
  const identity = normalizedTargetIdentity(credentialedUrl);
  assert.ok(identity !== null, "A well-formed URL must produce a non-null sanitized identity.");
  assert.equal(identity!.includes("realuser"), false, "The sanitized identity must never include the username.");
  assert.equal(identity!.includes("supersecretpassword"), false, "The sanitized identity must never include the password.");
  assert.equal(identity!.includes("sslmode"), false, "The sanitized identity must never include query-string parameters.");
  assert.equal(identity, "ep-real-host.neon.tech/realdb", "The sanitized identity must be exactly host + pathname, nothing else.");

  // ---- child env receives DATABASE_URL equal to POSTGRES_MIGRATION_URL ----
  const baseEnv: NodeJS.ProcessEnv = { NODE_ENV: "test", DATABASE_URL: "postgresql://dev-host.neon.tech/devdb", PATH: "/usr/bin", SOME_OTHER_VAR: "unchanged" };
  const childEnv = buildChildEnvForMigrationDeploy(baseEnv, "postgresql://prod-host.neon.tech/proddb");
  assert.equal(childEnv.DATABASE_URL, "postgresql://prod-host.neon.tech/proddb", "The spawned Prisma process's DATABASE_URL must be exactly POSTGRES_MIGRATION_URL.");
  assert.equal(childEnv.SOME_OTHER_VAR, "unchanged", "Every other env var must pass through to the child process untouched.");
  assert.equal(childEnv.PATH, "/usr/bin", "PATH (required for the child process to find its own dependencies) must be preserved.");

  // ---- existing parent DATABASE_URL is overridden ONLY for the spawned process - never mutated in place ----
  assert.equal(baseEnv.DATABASE_URL, "postgresql://dev-host.neon.tech/devdb", "The ORIGINAL baseEnv object (e.g. process.env in the real script) must be completely unmodified after building the child env - this is the exact 'never mutate process.env.DATABASE_URL globally' guarantee.");
  assert.notEqual(childEnv, baseEnv, "buildChildEnvForMigrationDeploy must return a NEW object, never the same reference as baseEnv (which would risk accidental in-place mutation elsewhere).");

  // ---- only `migrate deploy` is ever invoked - never db push, never migrate dev, never a reset/truncate operation ----
  assert.deepEqual(buildMigrateDeployArgs("/path/to/prisma/build/index.js"), ["/path/to/prisma/build/index.js", "migrate", "deploy"], "The spawned Prisma CLI must be invoked with exactly [entryPath, \"migrate\", \"deploy\"] - no other subcommand or flag.");
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
