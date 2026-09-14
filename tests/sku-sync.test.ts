import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import ExcelJS from "exceljs";
import { buildSkuPayload, selectLatestSource, syncSkuData } from "../scripts/sku-sync.ts";

type FixtureRow = [string, string, number, number, number, number, number[]];

const HEADERS = ["품번", "색상", "최초판매가", "현판매가", "최초입고일", "최초출고일", "발주", "입고", "출고", "판매", "판매율", "재고", "기간판매"];

async function fixture(path: string, dates: string[], duplicate = false, fixtureRows?: FixtureRow[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("SKU");
  sheet.getCell(1, 1).value = "기본사항";
  HEADERS.forEach((value, index) => { sheet.getCell(2, index + 1).value = value; });
  dates.forEach((date, index) => {
    const column = 14 + index * 3;
    sheet.mergeCells(1, column, 1, column + 2);
    sheet.getCell(1, column).value = date;
    ["기간수량", "누계수량", "수량판매율"].forEach((value, offset) => { sheet.getCell(2, column + offset).value = value; });
  });
  const rows: FixtureRow[] = fixtureRows || [
    ["WA2603CD51", "BK", 100, 80, 10, 70, [1, 2, 3, 4, 5]],
    [duplicate ? "WA2603CD51" : "WA2603ZZ99", duplicate ? "BK" : "RD", 50, 0, 0, 0, [0, 0, 0, 0, 0]],
  ];
  rows.forEach(([style, color, order, inbound, sales, stock, quantities], rowIndex) => {
    const row = rowIndex + 3;
    const values = [style, color, 99000, 99000, null, null, order, inbound, 0, sales, inbound ? Number(sales) / Number(inbound) * 100 : 0, stock, sales];
    values.forEach((value, index) => { sheet.getCell(row, index + 1).value = value as never; });
    let cumulative = 0;
    (quantities as number[]).forEach((qty, index) => {
      cumulative += qty;
      const column = 14 + index * 3;
      sheet.getCell(row, column).value = qty;
      sheet.getCell(row, column + 1).value = cumulative;
      sheet.getCell(row, column + 2).value = inbound ? cumulative / Number(inbound) : 0;
    });
  });
  await workbook.xlsx.writeFile(path);
}

function latest(path: string) {
  writeFileSync(path, JSON.stringify({ styles: [{ sku: "WA2603CD51", name: "가디건", season: "26FW", category: "CD", productGroup: "APP", genderGroup: "WOMENS", isSpecialMarket: false, inQty: 80, cumQty: 10, stock: 70 }] }), "utf8");
}

test("selects newest workbook snapshot instead of mtime or filename alone", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sku-select-"));
  try {
    await fixture(join(dir, "sku 260909.xlsx"), ["2026-08-16", "2026-08-23", "2026-08-30", "2026-09-06", "2026-09-09"]);
    await fixture(join(dir, "sku 260916.xlsx"), ["2026-08-02", "2026-08-09", "2026-08-16", "2026-08-23", "2026-09-01"]);
    const selected = await selectLatestSource(dir);
    assert.match(selected.path, /260909\.xlsx$/);
    assert.equal(selected.sourceAsOf, "2026-09-09");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("builds SKU contract, separates WTD, joins metadata, and calculates completed metrics", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sku-build-"));
  try {
    const source = join(dir, "sku 260909.xlsx");
    const latestPath = join(dir, "latest.json");
    await fixture(source, ["2026-08-16", "2026-08-23", "2026-08-30", "2026-09-06", "2026-09-09"]);
    latest(latestPath);
    const payload = await buildSkuPayload(source, latestPath, "2026-09-09T00:00:00.000Z");
    const row = payload.styles.WA2603CD51.skus[0] as any;
    assert.equal(row.sku, "WA2603CD51BK");
    assert.equal(payload.meta.skuCount, 2);
    assert.equal(payload.meta.matchedStyleCount, 1);
    assert.equal(payload.meta.exactMetadataMatchCount, 1);
    assert.equal(payload.meta.normalizedMetadataMatchCount, 0);
    assert.equal(payload.meta.trueUnmatchedStyleCount, 1);
    assert.equal(payload.meta.rawSkuCandidateCount, 2);
    assert.equal(payload.meta.excludedSkuCount, 0);
    assert.deepEqual(payload.diagnostics.unmatchedStyles, ["WA2603ZZ99"]);
    assert.equal(payload.styles.WA2603ZZ99.productGroup, "UNMAPPED");
    assert.equal(payload.styles.WA2603ZZ99.productGroupSource, "UNMAPPED");
    assert.equal(payload.styles.WA2603ZZ99.season, "26FW");
    assert.equal(payload.styles.WA2603ZZ99.seasonSource, "STYLE_CODE_VERIFIED");
    assert.equal(payload.styles.WA2603ZZ99.genderGroup, "UNMAPPED");
    assert.equal(row.productName, "가디건");
    assert.equal(row.completedWeeklyHistory.length, 4);
    assert.equal(row.currentWtdPeriod, "2026-09-07~2026-09-13");
    assert.equal(row.currentWtdQty, 5);
    assert.equal(row.weighted4CompletedWeekQty, 3);
    assert.equal(row.stockCoverWeeks, 23.3333);
    assert.equal(row.sellingAgeVelocityQtyPerWeek, 3);
    assert.equal(row.sellingAgeStockCoverWeeks, 23.3333);
    assert.equal(row.sourceSellThrough, row.inboundSellThrough);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("adds selling-age velocity and cover without changing legacy completed metrics", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sku-selling-age-"));
  try {
    const source = join(dir, "sku 260909.xlsx");
    const latestPath = join(dir, "latest.json");
    const dates = ["2026-08-16", "2026-08-23", "2026-08-30", "2026-09-06", "2026-09-09"];
    await fixture(source, dates, false, [
      ["WA2603W100", "BK", 100, 100, 10, 50, [0, 0, 0, 10, 99]],
      ["WA2603W200", "BK", 100, 100, 30, 90, [0, 0, 10, 20, 99]],
      ["WA2603W300", "BK", 100, 100, 60, 120, [0, 10, 20, 30, 99]],
      ["WA2603W400", "BK", 100, 100, 100, 70, [10, 20, 30, 40, 99]],
      ["WA2603LZ00", "BK", 100, 100, 12, 30, [0, 0, 0, 12, 99]],
      ["WA2603PZ00", "BK", 100, 100, 10, 60, [5, 0, 0, 5, 99]],
      ["WA2603RT00", "BK", 100, 100, 6, 60, [10, -4, 0, 0, 99]],
      ["WA2603WT00", "BK", 100, 100, 99, 20, [0, 0, 0, 0, 99]],
      ["WA2603ZS00", "BK", 100, 100, 5, 0, [0, 0, 0, 5, 99]],
      ["WA2603NS00", "BK", 100, 100, 5, -10, [0, 0, 0, 5, 99]],
    ]);
    latest(latestPath);
    const payload = await buildSkuPayload(source, latestPath, "2026-09-09T00:00:00.000Z");
    const byStyle = (styleCode: string) => payload.styles[styleCode].skus[0] as any;

    assert.equal(byStyle("WA2603W100").weighted4CompletedWeekQty, 4);
    assert.equal(byStyle("WA2603W100").stockCoverWeeks, 12.5);
    assert.equal(byStyle("WA2603W100").sellingAgeVelocityQtyPerWeek, 10);
    assert.equal(byStyle("WA2603W100").sellingAgeStockCoverWeeks, 5);

    assert.equal(byStyle("WA2603W200").weighted4CompletedWeekQty, 11);
    assert.equal(byStyle("WA2603W200").stockCoverWeeks, 8.1818);
    assert.equal(byStyle("WA2603W200").sellingAgeVelocityQtyPerWeek, 15.7143);
    assert.equal(byStyle("WA2603W200").sellingAgeStockCoverWeeks, 5.7273);

    assert.equal(byStyle("WA2603W300").weighted4CompletedWeekQty, 20);
    assert.equal(byStyle("WA2603W300").stockCoverWeeks, 6);
    assert.equal(byStyle("WA2603W300").sellingAgeVelocityQtyPerWeek, 22.2222);
    assert.equal(byStyle("WA2603W300").sellingAgeStockCoverWeeks, 5.4);

    assert.equal(byStyle("WA2603W400").weighted4CompletedWeekQty, 30);
    assert.equal(byStyle("WA2603W400").stockCoverWeeks, 2.3333);
    assert.equal(byStyle("WA2603W400").sellingAgeVelocityQtyPerWeek, 30);
    assert.equal(byStyle("WA2603W400").sellingAgeStockCoverWeeks, 2.3333);

    assert.equal(byStyle("WA2603LZ00").weighted4CompletedWeekQty, 4.8);
    assert.equal(byStyle("WA2603LZ00").stockCoverWeeks, 6.25);
    assert.equal(byStyle("WA2603LZ00").sellingAgeVelocityQtyPerWeek, 12);
    assert.equal(byStyle("WA2603LZ00").sellingAgeStockCoverWeeks, 2.5);

    assert.equal(byStyle("WA2603PZ00").weighted4CompletedWeekQty, 2.5);
    assert.equal(byStyle("WA2603PZ00").stockCoverWeeks, 24);
    assert.equal(byStyle("WA2603PZ00").sellingAgeVelocityQtyPerWeek, 2.5);
    assert.equal(byStyle("WA2603PZ00").sellingAgeStockCoverWeeks, 24);

    assert.equal(byStyle("WA2603RT00").weighted4CompletedWeekQty, 0.2);
    assert.equal(byStyle("WA2603RT00").stockCoverWeeks, 300);
    assert.equal(byStyle("WA2603RT00").sellingAgeVelocityQtyPerWeek, 0.2);
    assert.equal(byStyle("WA2603RT00").sellingAgeStockCoverWeeks, 300);

    assert.equal(byStyle("WA2603WT00").weighted4CompletedWeekQty, 0);
    assert.equal(byStyle("WA2603WT00").stockCoverWeeks, null);
    assert.equal(byStyle("WA2603WT00").sellingAgeVelocityQtyPerWeek, null);
    assert.equal(byStyle("WA2603WT00").sellingAgeStockCoverWeeks, null);
    assert.equal(byStyle("WA2603WT00").currentWtdQty, 99);

    assert.equal(byStyle("WA2603ZS00").sellingAgeVelocityQtyPerWeek, 5);
    assert.equal(byStyle("WA2603ZS00").sellingAgeStockCoverWeeks, 0);
    assert.equal(byStyle("WA2603NS00").sellingAgeVelocityQtyPerWeek, 5);
    assert.equal(byStyle("WA2603NS00").sellingAgeStockCoverWeeks, -2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("joins domesticOrderQty from overseas PO evidence without changing orderQty, and degrades gracefully", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sku-domestic-order-"));
  try {
    const source = join(dir, "sku 260909.xlsx");
    const latestPath = join(dir, "latest.json");
    const evidencePath = join(dir, "overseas-po.json");
    const dates = ["2026-08-16", "2026-08-23", "2026-08-30", "2026-09-06", "2026-09-09"];
    await fixture(source, dates, false, [
      ["WA2603CD91", "BK", 600, 500, 100, 200, [0, 0, 0, 10, 5]],
      ["WA2603CD92", "BK", 300, 300, 50, 150, [0, 0, 0, 10, 5]],
      ["WA2603CD93", "BK", 400, 400, 40, 100, [0, 0, 0, 10, 5]],
      ["WA2603BG91", "BK", 200, 200, 20, 50, [0, 0, 0, 10, 5]],
    ]);
    writeFileSync(latestPath, JSON.stringify({ styles: [] }), "utf8");
    writeFileSync(evidencePath, JSON.stringify({
      source: { sourceFile: "발주조회 26FW 260911.xlsx" },
      currentOrderReconciliation: [
        { sku: "WA2603CD91BK", excelTotalOrderQty: 600, domesticOrderQty: 500, overseasOrderQty: 100, currentOrderQty: 600, currentIncludesOverseasOrder: true },
        { sku: "WA2603CD92BK", excelTotalOrderQty: 300, domesticOrderQty: 300, overseasOrderQty: 0, currentOrderQty: 300, currentIncludesOverseasOrder: true },
      ],
    }), "utf8");
    const payload = await buildSkuPayload(source, latestPath, "2026-09-09T00:00:00.000Z", evidencePath);
    const byStyle = (styleCode: string) => payload.styles[styleCode].skus[0] as any;

    const excluded = byStyle("WA2603CD91");
    assert.equal(excluded.orderQty, 600);
    assert.equal(excluded.overseasOrderQty, 100);
    assert.equal(excluded.domesticOrderQty, 500);
    assert.equal(excluded.domesticOrderQtyAvailable, true);
    assert.equal(excluded.domesticOrderQtySource, "OVERSEAS_PO_WORKBOOK_EXCLUDED");

    const noOverseas = byStyle("WA2603CD92");
    assert.equal(noOverseas.orderQty, 300);
    assert.equal(noOverseas.overseasOrderQty, 0);
    assert.equal(noOverseas.domesticOrderQty, 300);
    assert.equal(noOverseas.domesticOrderQtySource, "NO_OVERSEAS_PO_ROWS_IN_WORKBOOK");

    const missingSku = byStyle("WA2603CD93");
    assert.equal(missingSku.orderQty, 400);
    assert.equal(missingSku.domesticOrderQty, null);
    assert.equal(missingSku.domesticOrderQtyAvailable, false);
    assert.equal(missingSku.domesticOrderQtySource, "OVERSEAS_PO_SOURCE_MISSING_FOR_SKU");

    const outOfScope = byStyle("WA2603BG91");
    assert.equal(outOfScope.productGroup, "ACC");
    assert.equal(outOfScope.orderQty, 200);
    assert.equal(outOfScope.domesticOrderQty, null);
    assert.equal(outOfScope.domesticOrderQtySource, "OUT_OF_EVIDENCE_SCOPE_26FW_APP_ONLY");

    assert.equal(payload.meta.domesticOrderQtyEvidence.available, true);
    assert.equal(payload.meta.domesticOrderQtyEvidence.asOf, "2026-09-11");
    assert.deepEqual(payload.diagnostics.domesticOrderQty.sourceCounts, {
      OVERSEAS_PO_WORKBOOK_EXCLUDED: 1,
      NO_OVERSEAS_PO_ROWS_IN_WORKBOOK: 1,
      OVERSEAS_PO_SOURCE_MISSING_FOR_SKU: 1,
      OUT_OF_EVIDENCE_SCOPE_26FW_APP_ONLY: 1,
    });

    const payloadNoEvidence = await buildSkuPayload(source, latestPath, "2026-09-09T00:00:00.000Z", join(dir, "does-not-exist.json"));
    const rowNoEvidence = payloadNoEvidence.styles.WA2603CD91.skus[0] as any;
    assert.equal(rowNoEvidence.orderQty, 600);
    assert.equal(rowNoEvidence.domesticOrderQty, null);
    assert.equal(rowNoEvidence.domesticOrderQtySource, "OVERSEAS_PO_EVIDENCE_FILE_MISSING");
    assert.equal(payloadNoEvidence.meta.domesticOrderQtyEvidence.available, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("rejects duplicate SKU and leaves existing outputs intact on parse failure", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sku-atomic-"));
  try {
    const sourceDir = join(dir, "source");
    const { mkdirSync } = await import("node:fs");
    mkdirSync(sourceDir);
    const source = join(sourceDir, "sku 260909.xlsx");
    const latestPath = join(dir, "latest.json");
    const output = join(dir, "sku-latest.json");
    await fixture(source, ["2026-08-16", "2026-08-23", "2026-08-30", "2026-09-06", "2026-09-09"], true);
    latest(latestPath);
    writeFileSync(output, "KEEP", "utf8");
    await assert.rejects(syncSkuData({ sourceDir, latestPath, outputs: [output] }), /중복 SKU/);
    assert.equal(readFileSync(output, "utf8"), "KEEP");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
