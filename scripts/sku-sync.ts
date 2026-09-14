import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ExcelJS from "exceljs";
import { genderGroupFor, productGroupForCategory, styleCategory, styleSeason } from "./product-metadata.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SOURCE_DIR = resolve(ROOT, ".local-sku-source");
const DEFAULT_LATEST_PATH = resolve(ROOT, "public/data/latest.json");
const DEFAULT_OUTPUTS = [resolve(ROOT, "data/sku-latest.json"), resolve(ROOT, "public/data/sku-latest.json")];
const DEFAULT_OVERSEAS_PO_EVIDENCE_PATH = resolve(ROOT, "data/sku-overseas-po-applicability.json");

// domesticOrderQty consumer/applicability rule (owner-approved 2026-09-11, see docs/NEXT_PRIORITIES.md P0):
// this is a diagnostic-grade field derived from a one-time manual overseas-PO workbook audit
// (docs/SKU_OVERSEAS_PO_APPLICABILITY.md). It is scoped to 26FW APP only and must NOT be consumed by
// Analog Pace, Forecast, Action Engine, priority, reorderTiming, or any other protected production
// logic without a separate, explicit approval. `orderQty` itself remains the unchanged, protected fact.
const DOMESTIC_ORDER_QTY_CONSUMER_RULE =
  "Diagnostic-grade field derived from a one-time manual overseas PO workbook audit, scoped to 26FW APP only. " +
  "Must not be consumed by Analog Pace, Forecast, Action Engine, priority, reorderTiming, or any other " +
  "protected production logic without separate explicit approval. orderQty remains unchanged and protected.";

const TREND_CONFIG = {
  minHistoryWeeks: 4,
  stablePercentThreshold: 10,
  risingPercentThreshold: 15,
  stableSlopePctThreshold: 5,
  risingSlopePctThreshold: 8,
  decliningSlopePctThreshold: 8,
  recentVsAveragePctThreshold: 12,
};

type WeeklyColumn = { date: string; qtyColumn: number; cumulativeColumn: number; sellThroughColumn: number };

function cellText(value: unknown) {
  if (value == null) return "";
  if (typeof value === "object" && "text" in value) return String((value as { text: string }).text).trim();
  return String(value).trim();
}

function numberOrZero(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function round(value: number, digits = 4) {
  const scale = 10 ** digits;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function ratioPercent(numerator: number, denominator: number) {
  return denominator > 0 ? round((numerator / denominator) * 100) : null;
}

function weightedRecentVelocity(quantities: number[]) {
  if (!quantities.length) return null;
  const recent = quantities.slice(-4);
  const baseWeights = [0.1, 0.2, 0.3, 0.4].slice(-recent.length);
  const weightTotal = baseWeights.reduce((sum, value) => sum + value, 0);
  return weightTotal ? round(recent.reduce((sum, value, index) => sum + value * (baseWeights[index] / weightTotal), 0)) : null;
}

function sellingAgeVelocity(completedWeeklyHistory: { qty: number }[]) {
  const firstPositiveIndex = completedWeeklyHistory.findIndex((item) => item.qty > 0);
  if (firstPositiveIndex < 0) return null;
  return weightedRecentVelocity(completedWeeklyHistory.slice(firstPositiveIndex).map((item) => item.qty));
}

function isoDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  const text = cellText(value);
  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(text);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : "";
}

function filenameDate(name: string) {
  const matches = [...name.matchAll(/(?<!\d)(\d{6}|\d{8})(?!\d)/g)];
  const raw = matches.at(-1)?.[1] || "";
  if (raw.length === 6) return `20${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4, 6)}`;
  if (raw.length === 8) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return "";
}

type OverseasPoEvidence = {
  available: boolean;
  asOf: string | null;
  bySku: Map<string, { overseasOrderQty: number; excelTotalOrderQty: number }>;
};

/**
 * Reads the read-only, manually generated overseas-PO diagnostic
 * (docs/SKU_OVERSEAS_PO_APPLICABILITY.md, scripts/overseas_po_applicability.py) and returns a
 * SKU -> overseasOrderQty lookup for the domesticOrderQty join. This never mutates orderQty and
 * degrades gracefully (available: false) if the evidence file is absent, so a missing diagnostic
 * artifact can never break the core ERP sync.
 */
function loadOverseasPoEvidence(path = DEFAULT_OVERSEAS_PO_EVIDENCE_PATH): OverseasPoEvidence {
  if (!existsSync(path)) return { available: false, asOf: null, bySku: new Map() };
  let payload: any;
  try {
    payload = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return { available: false, asOf: null, bySku: new Map() };
  }
  const bySku = new Map(
    (payload?.currentOrderReconciliation || []).map((row: any) => [
      String(row.sku),
      { overseasOrderQty: numberOrZero(row.overseasOrderQty), excelTotalOrderQty: numberOrZero(row.excelTotalOrderQty) },
    ]),
  );
  const asOf = filenameDate(String(payload?.source?.sourceFile || "")) || null;
  return { available: true, asOf, bySku };
}

export function canonicalStyleCode(value: unknown) {
  return cellText(value).toUpperCase().replace(/[\s-]+/g, "");
}

function previousSunday(asOf: string) {
  const date = new Date(`${asOf}T12:00:00`);
  const daysSinceSunday = date.getDay();
  date.setDate(date.getDate() - daysSinceSunday);
  return isoDate(date);
}

function currentWeekPeriod(asOf: string) {
  const date = new Date(`${asOf}T12:00:00`);
  const mondayOffset = date.getDay() === 0 ? -6 : 1 - date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${isoDate(monday)}~${isoDate(sunday)}`;
}

function linearSlope(values: number[]) {
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const xMean = (values.length - 1) / 2;
  const denominator = values.reduce((sum, _value, index) => sum + (index - xMean) ** 2, 0);
  const slope = denominator ? values.reduce((sum, value, index) => sum + (index - xMean) * (value - average), 0) / denominator : 0;
  return { slopePct: average ? (slope / average) * 100 : 0, average };
}

export function classifySkuTrend(values: number[]) {
  if (values.length < TREND_CONFIG.minHistoryWeeks) return "NEW";
  const first = values[0];
  const last = values.at(-1) || 0;
  const deltas = values.slice(1).map((value, index) => value - values[index]);
  const increaseCount = deltas.filter((delta) => delta > 0).length;
  const { slopePct, average } = linearSlope(values);
  const changePercent = ((last - first) / Math.max(1, first)) * 100;
  const recentVsAveragePct = average ? ((last - average) / average) * 100 : 0;
  if (increaseCount >= 2 && slopePct >= TREND_CONFIG.risingSlopePctThreshold && recentVsAveragePct >= TREND_CONFIG.recentVsAveragePctThreshold) return "ACCELERATING";
  if (slopePct <= -TREND_CONFIG.decliningSlopePctThreshold && recentVsAveragePct <= -TREND_CONFIG.recentVsAveragePctThreshold) return "DECLINING";
  if (Math.abs(slopePct) <= TREND_CONFIG.stableSlopePctThreshold && Math.abs(changePercent) <= TREND_CONFIG.stablePercentThreshold) return "STABLE";
  if (slopePct >= TREND_CONFIG.risingSlopePctThreshold || changePercent >= TREND_CONFIG.risingPercentThreshold) return "RISING";
  if (slopePct <= -TREND_CONFIG.decliningSlopePctThreshold || changePercent <= -TREND_CONFIG.risingPercentThreshold) return "DECLINING";
  return "STABLE";
}

function findHeaderRow(worksheet: ExcelJS.Worksheet) {
  for (let rowNumber = 1; rowNumber <= Math.min(20, worksheet.rowCount); rowNumber += 1) {
    const values = Array.from({ length: worksheet.columnCount }, (_, index) => cellText(worksheet.getCell(rowNumber, index + 1).value));
    if (values.includes("품번") && values.includes("색상")) return rowNumber;
  }
  throw new Error("필수 헤더 '품번'/'색상'을 찾지 못했습니다.");
}

function findColumn(worksheet: ExcelJS.Worksheet, headerRow: number, label: string) {
  for (let column = 1; column <= worksheet.columnCount; column += 1) {
    if (cellText(worksheet.getCell(headerRow, column).value) === label) return column;
  }
  throw new Error(`필수 헤더 '${label}'을 찾지 못했습니다.`);
}

function weeklyColumns(worksheet: ExcelJS.Worksheet, headerRow: number) {
  const dateRow = headerRow - 1;
  const groups: WeeklyColumn[] = [];
  for (let column = 1; column <= worksheet.columnCount - 2; column += 1) {
    const date = isoDate(worksheet.getCell(dateRow, column).value);
    if (!date) continue;
    const labels = [0, 1, 2].map((offset) => cellText(worksheet.getCell(headerRow, column + offset).value));
    if (labels.join("|") === "기간수량|누계수량|수량판매율") {
      groups.push({ date, qtyColumn: column, cumulativeColumn: column + 1, sellThroughColumn: column + 2 });
      column += 2;
    }
  }
  if (!groups.length) throw new Error("주차별 기간수량/누계수량/수량판매율 그룹을 찾지 못했습니다.");
  return groups.sort((a, b) => a.date.localeCompare(b.date));
}

async function inspectWorkbook(path: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error(`${basename(path)}에 worksheet가 없습니다.`);
  const headerRow = findHeaderRow(worksheet);
  const weeks = weeklyColumns(worksheet, headerRow);
  const fileAsOf = filenameDate(basename(path));
  const latestWeekDate = weeks.at(-1)?.date || "";
  const sourceAsOf = latestWeekDate || fileAsOf;
  return { workbook, worksheet, headerRow, weeks, fileAsOf, latestWeekDate, sourceAsOf };
}

export async function selectLatestSource(sourceDir = DEFAULT_SOURCE_DIR) {
  if (!existsSync(sourceDir)) throw new Error(`SKU source directory가 없습니다: ${sourceDir}`);
  const candidates = readdirSync(sourceDir)
    .filter((name) => !name.startsWith("~$") && [".xlsx", ".xlsm"].includes(extname(name).toLowerCase()))
    .map((name) => resolve(sourceDir, name));
  if (!candidates.length) throw new Error(".local-sku-source에 ERP xlsx 파일이 없습니다.");
  const inspected = [];
  for (const path of candidates) {
    const info = await inspectWorkbook(path);
    inspected.push({ path, sourceAsOf: info.sourceAsOf, fileAsOf: info.fileAsOf, latestWeekDate: info.latestWeekDate, mtimeMs: statSync(path).mtimeMs });
  }
  inspected.sort((a, b) => b.sourceAsOf.localeCompare(a.sourceAsOf) || b.fileAsOf.localeCompare(a.fileAsOf) || b.mtimeMs - a.mtimeMs);
  return inspected[0];
}

function latestStyleMap(path: string) {
  const payload = JSON.parse(readFileSync(path, "utf8"));
  const exact = new Map((payload.styles || []).map((row: Record<string, unknown>) => [String(row.sku || row.styleCode || ""), row]));
  const canonical = new Map([...exact.entries()].map(([key, row]) => [canonicalStyleCode(key), row]));
  return { payload, exact, canonical };
}

function reconciliationBand(actual: number, expected: number) {
  const difference = Math.abs(actual - expected);
  if (difference < 1e-9) return "exactMatch";
  const relative = difference / Math.max(1, Math.abs(expected));
  if (relative <= 0.01) return "within1Percent";
  if (relative <= 0.05) return "within5Percent";
  return "over5Percent";
}

function resolveStyleMetadata(styleCode: string, styleMeta: Record<string, unknown> | undefined) {
  const category = String(styleMeta?.category || styleCategory(styleCode) || "").toUpperCase();
  const categorySource = styleMeta?.category ? "LATEST" : category ? "STYLE_CODE" : "UNMAPPED";
  const mappedProductGroup = productGroupForCategory(category);
  const productGroup = styleMeta?.productGroup || mappedProductGroup;
  const productGroupSource = styleMeta?.productGroup ? "LATEST" : mappedProductGroup === "UNMAPPED" ? "UNMAPPED" : "CATEGORY_MAPPING";
  const season = String(styleMeta?.season || styleSeason(styleCode) || "UNKNOWN");
  const seasonSource = styleMeta?.season ? "LATEST" : season === "UNKNOWN" ? "UNRESOLVED" : "STYLE_CODE_VERIFIED";
  const styleProductName = styleMeta?.name ? String(styleMeta.name) : null;
  const erpProductName = null;
  const productName = styleProductName || erpProductName || null;
  const genderGroup = styleMeta?.genderGroup || genderGroupFor({ name: erpProductName });
  const genderGroupSource = styleMeta?.genderGroup ? "LATEST" : genderGroup === "UNMAPPED" ? "UNMAPPED" : "ERP_PRODUCT_NAME";
  const isSpecialMarket = styleMeta ? styleMeta.isSpecialMarket === true : null;
  return {
    category,
    categorySource,
    productGroup,
    productGroupSource,
    season,
    seasonSource,
    styleProductName,
    erpProductName,
    productName,
    productNameSource: styleProductName ? "LATEST" : erpProductName ? "ERP" : "UNAVAILABLE",
    genderGroup,
    genderGroupSource,
    isSpecialMarket,
    isSpecialMarketSource: styleMeta ? "LATEST" : "UNKNOWN",
  };
}

function createMetadataDiagnostics(styles: Record<string, any>, styleMaps: ReturnType<typeof latestStyleMap>) {
  const styleValues = Object.values(styles);
  const countGroup = (field: string, value: string) => ({
    style: styleValues.filter((style) => style[field] === value).length,
    sku: styleValues.reduce((sum, style) => sum + style.skus.filter((sku: any) => sku[field] === value).length, 0),
  });
  const sourceCounts = (field: string) => Object.fromEntries(["LATEST", "CATEGORY_MAPPING", "STYLE_CODE_VERIFIED", "ERP_PRODUCT_NAME", "UNAVAILABLE", "UNMAPPED", "UNKNOWN", "UNRESOLVED"].map((source) => [source, {
    style: styleValues.filter((style) => style[field] === source).length,
    sku: styleValues.reduce((sum, style) => sum + style.skus.filter((sku: any) => sku[field] === source).length, 0),
  }]));
  const categoryDistribution = Object.fromEntries([...new Set(styleValues.map((style) => style.category))].sort().map((category) => [category || "UNMAPPED", {
    style: styleValues.filter((style) => style.category === category).length,
    sku: styleValues.reduce((sum, style) => sum + style.skus.filter((sku: any) => sku.category === category).length, 0),
  }]));
  const prefixStyleCodes = Object.fromEntries(["WA2603", "WA2604"].map((prefix) => [prefix, styleValues.filter((style) => style.styleCode.startsWith(prefix))]));
  const seasonVerification = Object.fromEntries(Object.entries(prefixStyleCodes).map(([prefix, rows]: [string, any[]]) => [prefix, {
    totalStyles: rows.length,
    exactMatchedStyles: rows.filter((style) => style.metadataSource === "LATEST").length,
    exactMatchedSeasonCounts: Object.fromEntries([...new Set(rows.filter((style) => style.metadataSource === "LATEST").map((style) => style.season))].map((season) => [season, rows.filter((style) => style.metadataSource === "LATEST" && style.season === season).length])),
    exceptions: rows.filter((style) => style.metadataSource === "LATEST" && style.season !== "26FW").map((style) => ({ styleCode: style.styleCode, season: style.season })),
  }]));
  const styleMapConsistency = { compared: 0, mismatched: 0, mismatches: [] as any[] };
  for (const style of styleValues) {
    const latest = styleMaps.canonical.get(style.styleCode) as Record<string, unknown> | undefined;
    if (!latest?.productGroup) continue;
    styleMapConsistency.compared += 1;
    const mapped = productGroupForCategory(style.category);
    if (String(latest.productGroup) !== mapped) {
      styleMapConsistency.mismatched += 1;
      styleMapConsistency.mismatches.push({ styleCode: style.styleCode, latest: latest.productGroup, mapping: mapped, category: style.category });
    }
  }

  const app26 = styleValues.filter((style) => style.season === "26FW" && style.productGroup === "APP");
  const sellThroughBins = { "<10%": 0, "10~19.9%": 0, "20~29.9%": 0, "30~39.9%": 0, "40~49.9%": 0, "50~59.9%": 0, "60~69.9%": 0, "70%+": 0 };
  const coverBins = { "<=2주": 0, ">2~4주": 0, ">4~6주": 0, ">6~10주": 0, ">10주": 0, NULL: 0 };
  for (const style of app26) for (const sku of style.skus) {
    const sellThrough = Number(sku.inboundSellThrough);
    if (sellThrough < 10) sellThroughBins["<10%"] += 1;
    else if (sellThrough < 20) sellThroughBins["10~19.9%"] += 1;
    else if (sellThrough < 30) sellThroughBins["20~29.9%"] += 1;
    else if (sellThrough < 40) sellThroughBins["30~39.9%"] += 1;
    else if (sellThrough < 50) sellThroughBins["40~49.9%"] += 1;
    else if (sellThrough < 60) sellThroughBins["50~59.9%"] += 1;
    else if (sellThrough < 70) sellThroughBins["60~69.9%"] += 1;
    else sellThroughBins["70%+"] += 1;
    const cover = sku.stockCoverWeeks;
    if (cover == null) coverBins.NULL += 1;
    else if (cover <= 2) coverBins["<=2주"] += 1;
    else if (cover <= 4) coverBins[">2~4주"] += 1;
    else if (cover <= 6) coverBins[">4~6주"] += 1;
    else if (cover <= 10) coverBins[">6~10주"] += 1;
    else coverBins[">10주"] += 1;
  }

  const spreadRows = styleValues.map((style) => {
    const inbound = style.skus.reduce((sum: number, sku: any) => sum + Number(sku.inboundQty || 0), 0);
    const sales = style.skus.reduce((sum: number, sku: any) => sum + Number(sku.cumulativeSalesQty || 0), 0);
    const sellThrough = ratioPercent(sales, inbound);
    const values = style.skus.map((sku: any) => Number(sku.inboundSellThrough)).filter(Number.isFinite);
    return {
      styleCode: style.styleCode,
      productName: style.productName,
      category: style.category,
      genderGroup: style.genderGroup,
      productGroup: style.productGroup,
      styleAggregateInboundSellThrough: sellThrough,
      colorCount: style.skus.length,
      colorSellThroughSpread: values.length ? round(Math.max(...values) - Math.min(...values)) : null,
      skus: style.skus.map((sku: any) => ({ color: sku.colorCode, inbound: sku.inboundQty, sales: sku.cumulativeSalesQty, inboundSellThrough: sku.inboundSellThrough, stock: sku.erpStockQty, lastCompleteWeekQty: sku.lastCompleteWeekQty, stockCoverWeeks: sku.stockCoverWeeks })),
    };
  }).filter((style) => style.colorCount >= 2);
  const spreadBins = { "<10%p": 0, "10~20%p": 0, "20~30%p": 0, "30~40%p": 0, "40%p+": 0 };
  for (const row of spreadRows) {
    const spread = Number(row.colorSellThroughSpread || 0);
    if (spread < 10) spreadBins["<10%p"] += 1;
    else if (spread < 20) spreadBins["10~20%p"] += 1;
    else if (spread < 30) spreadBins["20~30%p"] += 1;
    else if (spread < 40) spreadBins["30~40%p"] += 1;
    else spreadBins["40%p+"] += 1;
  }
  const topDivergence = [...spreadRows].sort((a, b) => Number(b.colorSellThroughSpread || 0) - Number(a.colorSellThroughSpread || 0)).slice(0, 20);
  const highColorLowStyle = (skuMinimum: number, styleMaximum: number) => {
    const rows: any[] = [];
    for (const style of styleValues) {
      const aggregate = ratioPercent(style.skus.reduce((sum: number, sku: any) => sum + Number(sku.cumulativeSalesQty || 0), 0), style.skus.reduce((sum: number, sku: any) => sum + Number(sku.inboundQty || 0), 0));
      for (const sku of style.skus) if (Number(sku.inboundSellThrough) >= skuMinimum && Number(aggregate || 0) < styleMaximum) rows.push({ styleCode: style.styleCode, productName: style.productName, category: style.category, color: sku.colorCode, inboundSellThrough: sku.inboundSellThrough, styleAggregateInboundSellThrough: aggregate, inbound: sku.inboundQty, sales: sku.cumulativeSalesQty, stock: sku.erpStockQty, lastCompleteWeekQty: sku.lastCompleteWeekQty, stockCoverWeeks: sku.stockCoverWeeks });
    }
    return { styleCount: new Set(rows.map((row) => row.styleCode)).size, skuCount: rows.length, top: rows.sort((a, b) => b.inboundSellThrough - a.inboundSellThrough).slice(0, 20) };
  };
  return {
    categoryDistribution,
    productGroupSource: sourceCounts("productGroupSource"),
    genderGroupSource: sourceCounts("genderGroupSource"),
    seasonSource: sourceCounts("seasonSource"),
    productGroup: Object.fromEntries(["APP", "ACC", "UNMAPPED"].map((value) => [value, countGroup("productGroup", value)])),
    genderGroup: Object.fromEntries(["UNISEX", "WOMENS", "UNMAPPED"].map((value) => [value, countGroup("genderGroup", value)])),
    season: { "26FW": countGroup("season", "26FW"), other: { style: styleValues.filter((style) => style.season !== "26FW" && style.season !== "UNKNOWN").length, sku: styleValues.reduce((sum, style) => sum + style.skus.filter((sku: any) => sku.season !== "26FW" && sku.season !== "UNKNOWN").length, 0) }, UNKNOWN: countGroup("season", "UNKNOWN") },
    seasonVerification,
    styleMapConsistency,
    app26: {
      styleCount: app26.length,
      skuCount: app26.reduce((sum, style) => sum + style.skus.length, 0),
      category: Object.fromEntries([...new Set(app26.map((style) => style.category))].sort().map((category) => [category, { style: app26.filter((style) => style.category === category).length, sku: app26.reduce((sum, style) => sum + style.skus.filter((sku: any) => sku.category === category).length, 0) }])),
      gender: Object.fromEntries(["UNISEX", "WOMENS", "UNMAPPED"].map((value) => [value, { style: app26.filter((style) => style.genderGroup === value).length, sku: app26.reduce((sum, style) => sum + style.skus.filter((sku: any) => sku.genderGroup === value).length, 0) }])),
      specialMarket: { confirmedDomestic: app26.filter((style) => style.isSpecialMarket === false).reduce((sum, style) => sum + style.skus.length, 0), special: app26.filter((style) => style.isSpecialMarket === true).reduce((sum, style) => sum + style.skus.length, 0), unknown: app26.filter((style) => style.isSpecialMarket == null).reduce((sum, style) => sum + style.skus.length, 0) },
      colorCountDistribution: Object.fromEntries(["1 COLOR", "2 COLOR", "3 COLOR", "4 COLOR", "5 COLOR+"].map((label, index) => [label, app26.filter((style) => index < 4 ? style.skus.length === index + 1 : style.skus.length >= 5).length])),
    },
    sellThroughBins,
    coverBins,
    colorSellThroughSpread: spreadBins,
    topDivergence,
    highColorLowStyle: { atLeast50StyleUnder30: highColorLowStyle(50, 30), atLeast60StyleUnder40: highColorLowStyle(60, 40) },
  };
}

export async function buildSkuPayload(sourcePath: string, latestPath = DEFAULT_LATEST_PATH, generatedAt = new Date().toISOString(), overseasPoEvidencePath = DEFAULT_OVERSEAS_PO_EVIDENCE_PATH) {
  const { worksheet, headerRow, weeks, fileAsOf, latestWeekDate, sourceAsOf } = await inspectWorkbook(sourcePath);
  if (!sourceAsOf) throw new Error("workbook 또는 파일명에서 sourceAsOf를 확인할 수 없습니다.");
  const warnings: string[] = [];
  if (!fileAsOf) warnings.push("파일명에서 YYMMDD/YYYMMDD 기준일을 찾지 못했습니다.");
  if (fileAsOf && latestWeekDate && fileAsOf !== latestWeekDate) warnings.push(`파일명 기준일(${fileAsOf})과 마지막 workbook 주차(${latestWeekDate})가 다릅니다.`);

  const columns = {
    style: findColumn(worksheet, headerRow, "품번"),
    color: findColumn(worksheet, headerRow, "색상"),
    order: findColumn(worksheet, headerRow, "발주"),
    inbound: findColumn(worksheet, headerRow, "입고"),
    sales: findColumn(worksheet, headerRow, "판매"),
    sourceSellThrough: findColumn(worksheet, headerRow, "판매율"),
    stock: findColumn(worksheet, headerRow, "재고"),
  };
  const styleMaps = latestStyleMap(latestPath);
  const overseasPoEvidence = loadOverseasPoEvidence(overseasPoEvidencePath);
  const completedThrough = previousSunday(sourceAsOf);
  const completedWeeks = weeks.filter((week) => week.date <= completedThrough);
  const currentWeek = weeks.find((week) => week.date > completedThrough && week.date <= sourceAsOf) || null;
  const styles: Record<string, { styleCode: string; productName: string | null; season: unknown; category: unknown; productGroup: unknown; genderGroup: unknown; isSpecialMarket: boolean; skus: Record<string, unknown>[] }> = {};
  const seen = new Set<string>();
  const excludedRows: { row: number; styleCode: string; colorCode: string; reason: string }[] = [];
  let rawSkuCandidateCount = 0;
  let blankRowCount = 0;
  let validSkuCount = 0;
  const sourceRateChecks = { compared: 0, exact: 0, withinPointOnePercentagePoint: 0, overPointOnePercentagePoint: 0 };
  const inventoryBalance = { nearZero: 0, positive: 0, negative: 0, largeGap: 0 };

  for (let rowNumber = headerRow + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const styleCode = cellText(worksheet.getCell(rowNumber, columns.style).value).toUpperCase().replace(/\s+/g, "");
    const colorCode = cellText(worksheet.getCell(rowNumber, columns.color).value).toUpperCase().replace(/\s+/g, "");
    if (!styleCode && !colorCode) { blankRowCount += 1; continue; }
    rawSkuCandidateCount += 1;
    if (!/^WA[A-Z0-9]+$/.test(styleCode)) {
      excludedRows.push({ row: rowNumber, styleCode, colorCode, reason: "NON_WA_STYLE_PREFIX" });
      continue;
    }
    if (!/^[A-Z0-9]+$/.test(colorCode)) {
      excludedRows.push({ row: rowNumber, styleCode, colorCode, reason: "INVALID_COLOR_CODE" });
      continue;
    }
    validSkuCount += 1;
    const sku = `${styleCode}${colorCode}`;
    if (seen.has(sku)) throw new Error(`중복 SKU: ${sku}`);
    seen.add(sku);

    const orderQty = numberOrZero(worksheet.getCell(rowNumber, columns.order).value);
    const inboundQty = numberOrZero(worksheet.getCell(rowNumber, columns.inbound).value);
    const cumulativeSalesQty = numberOrZero(worksheet.getCell(rowNumber, columns.sales).value);
    const erpStockQty = numberOrZero(worksheet.getCell(rowNumber, columns.stock).value);
    const sourceSellThrough = numberOrZero(worksheet.getCell(rowNumber, columns.sourceSellThrough).value);
    const orderSellThrough = ratioPercent(cumulativeSalesQty, orderQty);
    const inboundSellThrough = ratioPercent(cumulativeSalesQty, inboundQty);
    if (inboundSellThrough != null) {
      sourceRateChecks.compared += 1;
      const gap = Math.abs(sourceSellThrough - inboundSellThrough);
      if (gap < 0.0001) sourceRateChecks.exact += 1;
      else if (gap <= 0.1) sourceRateChecks.withinPointOnePercentagePoint += 1;
      else sourceRateChecks.overPointOnePercentagePoint += 1;
    }

    const allHistory = weeks.map((week) => ({
      period: week.date,
      qty: numberOrZero(worksheet.getCell(rowNumber, week.qtyColumn).value),
      cumulativeQty: numberOrZero(worksheet.getCell(rowNumber, week.cumulativeColumn).value),
    }));
    const completedWeeklyHistory = allHistory.filter((item) => completedWeeks.some((week) => week.date === item.period));
    const recentFour = completedWeeklyHistory.slice(-4);
    const quantities = recentFour.map((item) => item.qty);
    const baseWeights = [0.1, 0.2, 0.3, 0.4].slice(-quantities.length);
    const weightTotal = baseWeights.reduce((sum, value) => sum + value, 0);
    const avg4CompletedWeekQty = quantities.length ? round(quantities.reduce((sum, value) => sum + value, 0) / quantities.length) : 0;
    const weighted4CompletedWeekQty = weightTotal ? round(quantities.reduce((sum, value, index) => sum + value * (baseWeights[index] / weightTotal), 0)) : 0;
    const sellingAgeVelocityQtyPerWeek = sellingAgeVelocity(completedWeeklyHistory);
    const lastCompleteWeekQty = recentFour.at(-1)?.qty ?? 0;
    const previousCompleteWeekQty = recentFour.length >= 2 ? recentFour.at(-2)?.qty ?? 0 : null;
    const completedWeekWow = previousCompleteWeekQty ? round(((lastCompleteWeekQty - previousCompleteWeekQty) / previousCompleteWeekQty) * 100) : null;
    const currentRow = currentWeek ? allHistory.find((item) => item.period === currentWeek.date) : null;
    const inventoryBalanceGap = round(inboundQty - cumulativeSalesQty - erpStockQty);
    if (Math.abs(inventoryBalanceGap) <= 1) inventoryBalance.nearZero += 1;
    else if (inventoryBalanceGap > 1) inventoryBalance.positive += 1;
    else inventoryBalance.negative += 1;
    if (Math.abs(inventoryBalanceGap) > Math.max(10, inboundQty * 0.05)) inventoryBalance.largeGap += 1;

    const styleMeta = styleMaps.canonical.get(canonicalStyleCode(styleCode)) as Record<string, unknown> | undefined;
    const metadata = resolveStyleMetadata(styleCode, styleMeta);

    // domesticOrderQty: owner-approved 2026-09-11 (see docs/NEXT_PRIORITIES.md P0). orderQty itself is
    // preserved unchanged; this is a separately named, diagnostic-grade fact joined from the read-only
    // overseas-PO workbook audit, scoped to 26FW APP only. See DOMESTIC_ORDER_QTY_CONSUMER_RULE above.
    const inOverseasEvidenceScope = metadata.season === "26FW" && metadata.productGroup === "APP";
    let domesticOrderQty: number | null = null;
    let overseasOrderQty: number | null = null;
    let domesticOrderQtySource: string;
    if (!overseasPoEvidence.available) {
      domesticOrderQtySource = "OVERSEAS_PO_EVIDENCE_FILE_MISSING";
    } else if (!inOverseasEvidenceScope) {
      domesticOrderQtySource = "OUT_OF_EVIDENCE_SCOPE_26FW_APP_ONLY";
    } else {
      const evidence = overseasPoEvidence.bySku.get(sku);
      if (!evidence) {
        domesticOrderQtySource = "OVERSEAS_PO_SOURCE_MISSING_FOR_SKU";
      } else {
        overseasOrderQty = evidence.overseasOrderQty;
        domesticOrderQty = round(orderQty - evidence.overseasOrderQty);
        domesticOrderQtySource = evidence.overseasOrderQty > 0 ? "OVERSEAS_PO_WORKBOOK_EXCLUDED" : "NO_OVERSEAS_PO_ROWS_IN_WORKBOOK";
      }
    }
    const skuRow = {
      sku,
      styleCode,
      colorCode,
      ...metadata,
      orderQty,
      inboundQty,
      cumulativeSalesQty,
      erpStockQty,
      sourceSellThrough: round(sourceSellThrough),
      orderSellThrough,
      inboundSellThrough,
      inventoryBalanceGap,
      firstPositiveSalesPeriod: allHistory.find((item) => item.qty > 0)?.period || null,
      completedWeeklyHistory,
      currentWtdPeriod: currentWeek ? currentWeekPeriod(sourceAsOf) : null,
      currentWtdQty: currentRow?.qty ?? 0,
      lastCompleteWeekQty,
      previousCompleteWeekQty,
      completedWeekWow,
      avg4CompletedWeekQty,
      weighted4CompletedWeekQty,
      stockCoverWeeks: weighted4CompletedWeekQty > 0 ? round(erpStockQty / weighted4CompletedWeekQty) : null,
      sellingAgeVelocityQtyPerWeek,
      sellingAgeStockCoverWeeks: sellingAgeVelocityQtyPerWeek != null && sellingAgeVelocityQtyPerWeek > 0 ? round(erpStockQty / sellingAgeVelocityQtyPerWeek) : null,
      salesTrend: classifySkuTrend(quantities),
      domesticOrderQty,
      overseasOrderQty,
      domesticOrderQtyAvailable: domesticOrderQty != null,
      domesticOrderQtySource,
    };
    if (!styles[styleCode]) {
      styles[styleCode] = {
        styleCode,
        ...metadata,
        metadataSource: styleMeta ? "LATEST" : "FALLBACK",
        skus: [],
      };
    }
    styles[styleCode].skus.push(skuRow);
  }

  const erpStyleCodes = Object.keys(styles);
  const exactMatchStyles = erpStyleCodes.filter((styleCode) => styleMaps.exact.has(styleCode));
  const normalizedMatchStyles = erpStyleCodes.filter((styleCode) => !styleMaps.exact.has(styleCode) && styleMaps.canonical.has(canonicalStyleCode(styleCode)));
  const matchedStyles = [...exactMatchStyles, ...normalizedMatchStyles];
  const unmatchedStyles = erpStyleCodes.filter((styleCode) => !styleMaps.canonical.has(canonicalStyleCode(styleCode))).sort();
  const reconciliation = Object.fromEntries(["inbound", "sales", "stock"].map((metric) => [metric, { exactMatch: 0, within1Percent: 0, within5Percent: 0, over5Percent: 0, unavailable: 0 }]));
  for (const [styleCode, style] of Object.entries(styles)) {
    style.skus.sort((a, b) => String(a.colorCode).localeCompare(String(b.colorCode)));
    const latest = styleMaps.canonical.get(canonicalStyleCode(styleCode)) as Record<string, unknown> | undefined;
    const comparisons = [
      ["inbound", "inboundQty", "inQty"],
      ["sales", "cumulativeSalesQty", "cumQty"],
      ["stock", "erpStockQty", "stock"],
    ];
    for (const [metric, skuField, styleField] of comparisons) {
      const bucket = reconciliation[metric] as Record<string, number>;
      if (!latest || latest[styleField] == null) { bucket.unavailable += 1; continue; }
      const actual = style.skus.reduce((sum, row) => sum + Number(row[skuField] || 0), 0);
      bucket[reconciliationBand(actual, Number(latest[styleField]))] += 1;
    }
  }

  const styleValues = Object.values(styles);
  const domesticOrderQtySourceCounts: Record<string, number> = {};
  for (const style of styleValues) for (const row of style.skus as any[]) {
    domesticOrderQtySourceCounts[row.domesticOrderQtySource] = (domesticOrderQtySourceCounts[row.domesticOrderQtySource] || 0) + 1;
  }
  const payload = {
    meta: {
      source: "ERP_WEEKLY_SKU",
      sourceFile: basename(sourcePath),
      sourceAsOf,
      generatedAt,
      styleCount: styleValues.length,
      skuCount: seen.size,
      appSkuCount: styleValues.filter((style) => style.productGroup === "APP").reduce((sum, style) => sum + style.skus.length, 0),
      accSkuCount: styleValues.filter((style) => style.productGroup === "ACC").reduce((sum, style) => sum + style.skus.length, 0),
      matchedStyleCount: matchedStyles.length,
      unmatchedStyleCount: unmatchedStyles.length,
      exactMetadataMatchCount: exactMatchStyles.length,
      normalizedMetadataMatchCount: normalizedMatchStyles.length,
      trueUnmatchedStyleCount: unmatchedStyles.length,
      rawSkuCandidateCount,
      validSkuCount,
      excludedSkuCount: excludedRows.length,
      blankRowCount,
      latestStyleCount: (styleMaps.payload.styles || []).length,
      latestWaStyleCount: (styleMaps.payload.styles || []).filter((row: Record<string, unknown>) => String(row.sku || row.styleCode || "").startsWith("WA")).length,
      latestSeasonCounts: (styleMaps.payload.styles || []).reduce((out: Record<string, number>, row: Record<string, unknown>) => { const season = String(row.season || "UNKNOWN"); out[season] = (out[season] || 0) + 1; return out; }, {}),
      currentWtdPeriod: currentWeek ? currentWeekPeriod(sourceAsOf) : null,
      completedThrough,
      warnings,
      domesticOrderQtyEvidence: {
        available: overseasPoEvidence.available,
        asOf: overseasPoEvidence.asOf,
        sourceArtifact: "data/sku-overseas-po-applicability.json",
        scope: "26FW APP only",
        consumerRule: DOMESTIC_ORDER_QTY_CONSUMER_RULE,
      },
    },
    diagnostics: {
      domesticOrderQty: { definition: "orderQty - overseasOrderQty (evidence-joined, 26FW APP only)", sourceCounts: domesticOrderQtySourceCounts },
      sourceSellThrough: { definition: "ERP 판매 / ERP 입고 * 100", ...sourceRateChecks },
      inventoryBalance: { definition: "입고 - 누계판매 - ERP재고", ...inventoryBalance },
      productNameComparison: { erpProductNameAvailable: false, compared: 0, mismatched: 0 },
      metadataJoin: {
        exactMatchStyles: exactMatchStyles.length,
        normalizedMatchStyles: normalizedMatchStyles.length,
        normalizedMatchSamples: normalizedMatchStyles.slice(0, 20),
        trueUnmatchedStyles: unmatchedStyles.length,
        trueUnmatchedSamples: unmatchedStyles.slice(0, 20),
        normalization: "uppercase + whitespace/hyphen removal only; no prefix deletion",
      },
      sourceBrand: {
        brandFieldAvailable: false,
        codePrefixCounts: { WA: erpStyleCodes.filter((styleCode) => styleCode.startsWith("WA")).length, WWA_EXCLUDED: excludedRows.filter((row) => row.reason === "NON_WA_STYLE_PREFIX").length },
        note: "Workbook has no explicit brand column. WWA rows are preserved in exclusion diagnostics and are not force-mapped to WA.",
      },
      metadata: createMetadataDiagnostics(styles, styleMaps),
      rawRows: { rawSkuCandidateCount, validSkuCount, excludedSkuCount: excludedRows.length, blankRowCount, excludedRows },
      reconciliation,
      unmatchedStyles,
    },
    styles,
  };
  validateSkuPayload(payload);
  return payload;
}

export function validateSkuPayload(payload: any) {
  if (payload?.meta?.source !== "ERP_WEEKLY_SKU") throw new Error("잘못된 SKU source type");
  const seen = new Set<string>();
  for (const [styleCode, style] of Object.entries(payload.styles || {}) as [string, any][]) {
    if (style.styleCode !== styleCode) throw new Error(`STYLE key mismatch: ${styleCode}`);
    for (const row of style.skus || []) {
      if (row.sku !== `${row.styleCode}${row.colorCode}`) throw new Error(`SKU 조합 오류: ${row.sku}`);
      if (seen.has(row.sku)) throw new Error(`중복 SKU: ${row.sku}`);
      seen.add(row.sku);
      if ((row.completedWeeklyHistory || []).some((item: any) => item.period > payload.meta.completedThrough)) throw new Error(`${row.sku}: WTD가 completed history에 포함됨`);
    }
  }
  if (seen.size !== payload.meta.skuCount) throw new Error("meta.skuCount 불일치");
}

function replaceOutputsAtomically(paths: string[], contents: string) {
  const suffix = `.sku-sync-${process.pid}-${Date.now()}`;
  const staged = paths.map((path) => ({ path, temp: `${path}${suffix}.tmp`, backup: `${path}${suffix}.bak`, hadOriginal: existsSync(path) }));
  const renameWithRetry = (from: string, to: string) => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try { renameSync(from, to); return; } catch (error: any) {
        lastError = error;
        if (!(["EPERM", "EACCES", "EBUSY"].includes(error?.code))) throw error;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
      }
    }
    throw lastError;
  };
  try {
    for (const item of staged) { mkdirSync(dirname(item.path), { recursive: true }); writeFileSync(item.temp, contents, "utf8"); }
    for (const item of staged) if (item.hadOriginal) renameWithRetry(item.path, item.backup);
    for (const item of staged) renameWithRetry(item.temp, item.path);
    for (const item of staged) if (existsSync(item.backup)) rmSync(item.backup, { force: true });
  } catch (error) {
    for (const item of staged) {
      if (existsSync(item.temp)) rmSync(item.temp, { force: true });
      if (existsSync(item.backup)) {
        if (existsSync(item.path)) rmSync(item.path, { force: true });
        renameWithRetry(item.backup, item.path);
      }
    }
    throw error;
  }
}

export async function syncSkuData(options: { sourceDir?: string; latestPath?: string; outputs?: string[]; overseasPoEvidencePath?: string } = {}) {
  const selected = await selectLatestSource(options.sourceDir || DEFAULT_SOURCE_DIR);
  const payload = await buildSkuPayload(
    selected.path,
    options.latestPath || DEFAULT_LATEST_PATH,
    new Date().toISOString(),
    options.overseasPoEvidencePath || DEFAULT_OVERSEAS_PO_EVIDENCE_PATH,
  );
  const contents = `${JSON.stringify(payload, null, 2)}\n`;
  JSON.parse(contents);
  replaceOutputsAtomically(options.outputs || DEFAULT_OUTPUTS, contents);
  return payload;
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  syncSkuData().then((payload) => {
    console.log(`[sku:sync] ${payload.meta.sourceFile} (${payload.meta.sourceAsOf})`);
    console.log(`[sku:sync] ${payload.meta.styleCount} STYLE / ${payload.meta.skuCount} SKU / matched ${payload.meta.matchedStyleCount}`);
  }).catch((error) => {
    console.error(`[sku:sync] failed: ${error.message}`);
    process.exitCode = 1;
  });
}
