import { normalizeItemType, normalizeSubItemType } from "@/config/item-types";
import { normalizeMarketSource } from "@/config/market-sources";
import { prisma } from "@/db/client";
import type { ImportType } from "@/config/import-mapping";

export type ImportRowsInput = {
  type: ImportType;
  source?: string;
  fileName?: string;
  dataMode?: "sample" | "import" | "real";
  rows: Record<string, string>[];
  mapping: Record<string, string>;
  defaultSource?: string;
  defaultPeriodDate?: string;
  defaultRankingCategory?: string;
  defaultAudienceSegment?: string;
};

export type ImportRowsResult = {
  importRunId: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  skippedRows: number;
  errors: Array<{ rowNumber: number; field?: string; reason: string }>;
};

export async function importRows(input: ImportRowsInput): Promise<ImportRowsResult> {
  const dataMode = input.dataMode ?? "import";
  const source = input.source ?? input.defaultSource ?? (input.type === "SALES" ? "INTERNAL" : "MANUAL_IMPORT");
  const run = await prisma.importRun.create({
    data: {
      type: input.type,
      source,
      fileName: input.fileName,
      rankingCategory: input.defaultRankingCategory,
      audienceSegment: input.defaultAudienceSegment,
      dataMode,
      startedAt: new Date(),
      status: "RUNNING",
      totalRows: input.rows.length
    }
  });

  const errors: ImportRowsResult["errors"] = [];
  let successRows = 0;
  let skippedRows = 0;

  for (const [index, row] of input.rows.entries()) {
    const rowNumber = index + 2;
    try {
      const imported =
        input.type === "SALES"
          ? await importSalesRow(row, input.mapping, run.id, dataMode, input.defaultPeriodDate)
          : await importMarketRow(row, input.mapping, run.id, source, dataMode, input.defaultPeriodDate, input.defaultRankingCategory, input.defaultAudienceSegment);
      imported ? (successRows += 1) : (skippedRows += 1);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "알 수 없는 오류";
      errors.push({ rowNumber, reason });
      await prisma.importError.create({
        data: {
          importRunId: run.id,
          rowNumber,
          reason,
          rawRow: JSON.stringify(row)
        }
      });
    }
  }

  const status = errors.length > 0 && successRows === 0 ? "FAILED" : errors.length > 0 ? "PARTIAL_SUCCESS" : "SUCCESS";
  await prisma.importRun.update({
    where: { id: run.id },
    data: {
      completedAt: new Date(),
      status,
      successRows,
      failedRows: errors.length,
      skippedRows,
      errorMessage: errors.length > 0 ? `${errors.length}개 row import 실패` : null
    }
  });

  return { importRunId: run.id, totalRows: input.rows.length, successRows, failedRows: errors.length, skippedRows, errors };
}

async function importSalesRow(row: Record<string, string>, mapping: Record<string, string>, importRunId: string, dataMode: string, defaultPeriodDate?: string) {
  const productCode = value(row, mapping.productCode);
  const productName = value(row, mapping.productName);
  const periodDate = parseDate(value(row, mapping.periodDate) || defaultPeriodDate || "");
  if (!productCode && !productName) return false;
  if (!productCode) throw new Error("productCode가 없습니다.");
  if (!productName) throw new Error("productName이 없습니다.");
  if (!periodDate) throw new Error("periodDate를 날짜로 해석할 수 없습니다.");

  const itemType = normalizeItemType(value(row, mapping.itemType), `${productName} ${value(row, mapping.category)}`);
  const subItemType = normalizeSubItemType(value(row, mapping.subItemType), `${productName} ${value(row, mapping.category)}`);
  const product = await prisma.internalProduct.upsert({
    where: { productCode },
    update: productData(row, mapping, productName, itemType, subItemType, dataMode),
    create: {
      productCode,
      ...productData(row, mapping, productName, itemType, subItemType, dataMode)
    }
  });

  await prisma.salesSnapshot.upsert({
    where: { productId_periodDate: { productId: product.id, periodDate } },
    update: salesSnapshotData(row, mapping, importRunId, dataMode),
    create: { productId: product.id, periodDate, ...salesSnapshotData(row, mapping, importRunId, dataMode) }
  });
  return true;
}

async function importMarketRow(row: Record<string, string>, mapping: Record<string, string>, importRunId: string, fallbackSource: string, dataMode: string, defaultPeriodDate?: string, defaultRankingCategory = "ALL", defaultAudienceSegment = "ALL") {
  const source = normalizeMarketSource(value(row, mapping.source) || fallbackSource);
  const url = canonicalizeUrl(value(row, mapping.url));
  const externalProductId = value(row, mapping.externalProductId) || stableIdFromUrl(url);
  const productName = value(row, mapping.productName);
  const brand = value(row, mapping.brand);
  const rank = parseInteger(value(row, mapping.rank));
  const periodDate = parseDate(value(row, mapping.periodDate) || defaultPeriodDate || "");
  const rankingCategory = value(row, mapping.rankingCategory) || defaultRankingCategory;
  const audienceSegment = value(row, mapping.audienceSegment) || defaultAudienceSegment;
  if (!externalProductId) throw new Error("externalProductId 또는 url이 필요합니다.");
  if (!productName) throw new Error("productName이 없습니다.");
  if (!brand) throw new Error("brand가 없습니다.");
  if (!rank) throw new Error("rank가 없습니다.");
  if (!periodDate) throw new Error("periodDate를 날짜로 해석할 수 없습니다.");

  const itemType = normalizeItemType(value(row, mapping.itemType), `${productName} ${value(row, mapping.category)}`);
  const subItemType = normalizeSubItemType(value(row, mapping.subItemType), `${productName} ${value(row, mapping.category)}`);
  const product = await prisma.marketProduct.upsert({
    where: { source_externalProductId: { source, externalProductId } },
    update: marketProductData(row, mapping, productName, brand, url, itemType, subItemType, dataMode),
    create: {
      source,
      externalProductId,
      ...marketProductData(row, mapping, productName, brand, url, itemType, subItemType, dataMode)
    }
  });

  await prisma.marketRankingSnapshot.upsert({
    where: { marketProductId_source_periodDate_rankingScope_rankingCategory_observedCategory_audienceSegment: { marketProductId: product.id, source, periodDate, rankingScope: "UNKNOWN", rankingCategory, observedCategory: rankingCategory, audienceSegment } },
    update: marketSnapshotData(row, mapping, importRunId, dataMode, rank, rankingCategory, audienceSegment),
    create: { marketProductId: product.id, source, periodDate, ...marketSnapshotData(row, mapping, importRunId, dataMode, rank, rankingCategory, audienceSegment) }
  });
  return true;
}

function productData(row: Record<string, string>, mapping: Record<string, string>, productName: string, itemType: string, subItemType: string, dataMode: string) {
  return {
    externalProductId: nullable(value(row, mapping.externalProductId)),
    productName,
    brand: nullable(value(row, mapping.brand)),
    category: nullable(value(row, mapping.category)),
    season: nullable(value(row, mapping.season)),
    gender: nullable(value(row, mapping.gender)),
    imageUrl: nullable(value(row, mapping.imageUrl)),
    itemType,
    subItemType,
    fit: nullable(value(row, mapping.fit)),
    mainColor: nullable(value(row, mapping.mainColor)),
    subColor: nullable(value(row, mapping.subColor)),
    material: nullable(value(row, mapping.material)),
    graphicType: nullable(value(row, mapping.graphicType)),
    detail: nullable(value(row, mapping.detail)),
    style: nullable(value(row, mapping.style)),
    dataMode
  };
}

function marketProductData(row: Record<string, string>, mapping: Record<string, string>, name: string, brand: string, url: string, itemType: string, subItemType: string, dataMode: string) {
  return {
    brand,
    name,
    category: nullable(value(row, mapping.category)),
    url: nullable(url),
    imageUrl: nullable(value(row, mapping.imageUrl)),
    itemType,
    subItemType,
    fit: nullable(value(row, mapping.fit)),
    mainColor: nullable(value(row, mapping.mainColor)),
    subColor: nullable(value(row, mapping.subColor)),
    material: nullable(value(row, mapping.material)),
    graphicType: nullable(value(row, mapping.graphicType)),
    detail: nullable(value(row, mapping.detail)),
    style: nullable(value(row, mapping.style)),
    gender: nullable(value(row, mapping.gender)),
    dataMode
  };
}

function salesSnapshotData(row: Record<string, string>, mapping: Record<string, string>, importRunId: string, dataMode: string) {
  return {
    salesQty: parseInteger(value(row, mapping.salesQty)),
    salesAmount: parseInteger(value(row, mapping.salesAmount)),
    stockQty: parseInteger(value(row, mapping.stockQty)),
    orderQty: parseInteger(value(row, mapping.orderQty)),
    sellThroughRate: parseFloatNumber(value(row, mapping.sellThroughRate)),
    discountRate: parseFloatNumber(value(row, mapping.discountRate)),
    normalSalesRate: parseFloatNumber(value(row, mapping.normalSalesRate)),
    onlineSalesQty: parseInteger(value(row, mapping.onlineSalesQty)),
    storeSalesQty: parseInteger(value(row, mapping.storeSalesQty)),
    importRunId,
    dataMode
  };
}

function marketSnapshotData(row: Record<string, string>, mapping: Record<string, string>, importRunId: string, dataMode: string, rank: number, rankingCategory: string, audienceSegment: string) {
  return {
    metricType: "RANKING",
    rankingVerified: true,
    rankingScope: "UNKNOWN",
    sourcePosition: rank,
    rank,
    rankingCategory,
    observedCategory: rankingCategory,
    audienceSegment,
    price: parseInteger(value(row, mapping.price)),
    salePrice: parseInteger(value(row, mapping.salePrice)),
    discountRate: parseInteger(value(row, mapping.discountRate)),
    reviewCount: parseInteger(value(row, mapping.reviewCount)),
    likeCount: parseInteger(value(row, mapping.likeCount)),
    importRunId,
    dataMode
  };
}

function value(row: Record<string, string>, column: string | undefined) {
  return column ? row[column]?.trim() ?? "" : "";
}

function nullable(input: string) {
  return input.length > 0 ? input : null;
}

function parseInteger(input: string) {
  if (!input) return null;
  const normalized = input.replace(/[,원개%]/g, "").trim();
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseFloatNumber(input: string) {
  if (!input) return null;
  const normalized = input.replace(/[,원개%]/g, "").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(input: string) {
  if (!input) return null;
  const normalized = input.trim().replace(/[./]/g, "-");
  const excelNumber = Number(normalized);
  if (Number.isFinite(excelNumber) && excelNumber > 20000) {
    const date = new Date(Math.round((excelNumber - 25569) * 86400 * 1000));
    date.setHours(0, 0, 0, 0);
    return date;
  }
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

export function canonicalizeUrl(url: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/g, "");
    return parsed.toString();
  } catch {
    return url.trim().replace(/[?#].*$/g, "").replace(/\/+$/g, "");
  }
}

function stableIdFromUrl(url: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const idCandidate = parsed.pathname.split("/").filter(Boolean).at(-1);
    return `${parsed.hostname}:${idCandidate ?? parsed.pathname}`;
  } catch {
    return url;
  }
}
