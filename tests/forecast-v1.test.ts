import assert from "node:assert/strict";
import test from "node:test";
import { applyForecastV1, forecastStyle, trendAlphaForWeek } from "../scripts/forecast-v1.ts";

const config = {
  keywords: ["후드", "팬츠"],
  similarity: { nameStructuralKeywordWeight: 1.5, maxKeywordContribution: 4, sameGenderBonus: 1, launchTimingBonusMax: 1, launchTimingWindowWeeks: 12, priceSimilarityBonusMax: 1, topN: 5 },
  forecast: { highSellThroughThreshold: 0.6, minimumAnalogCount: 1, confidenceAnalogFloor: 3, confidenceCategorySampleFloor: 10, maximumTrendFactor: 1.5, trendAlpha: { W1_W4: 0, W5_W6: 0.25, W7: 0.5, W8_PLUS: 0.75 } },
};
const analog = (styleCode, category = "HD") => ({ styleCode, name: "후드", category, genderGroup: "UNISEX", price: 100, launchTimingIndex: 36, cumulativeShareBySellingWeek: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] });
const reference = { meta: { referenceVersion: "25FW_APP_V1" }, categorySampleSizes: { HD: 20 }, styles: [analog("TARGET"), analog("A1"), analog("A2"), analog("A3")] };
const history = Array.from({ length: 8 }, (_, index) => ({ period: `26-0${index < 4 ? 8 : 9}W${(index % 4) + 1}`, quantity: 10 }));
const row = { sku: "TARGET", name: "후드", category: "HD", genderGroup: "UNISEX", productGroup: "APP", srp: 100, cumQty: 80, inQty: 100, forecastCompletedHistory: history, stockRisk: "LOW", previewScore: 77 };

test("trend alpha boundaries", () => {
  assert.equal(trendAlphaForWeek(4, config.forecast.trendAlpha), 0);
  assert.equal(trendAlphaForWeek(6, config.forecast.trendAlpha), 0.25);
  assert.equal(trendAlphaForWeek(7, config.forecast.trendAlpha), 0.5);
  assert.equal(trendAlphaForWeek(8, config.forecast.trendAlpha), 0.75);
});

test("APP forecast excludes target leakage and uses net receipt denominator", () => {
  const result = forecastStyle(row, reference, config);
  assert.equal(result.analogStyles.some((item) => item.styleCode === row.sku), false);
  assert.equal(result.forecastSellThrough, result.adjustedForecastQty / row.inQty);
  assert.ok(result.adjustedForecastQty >= row.cumQty);
});

test("ACC is disabled", () => {
  const result = forecastStyle({ ...row, productGroup: "ACC" }, reference, config);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "ACC_NOT_SUPPORTED_V1");
});

test("confidence downgrades for low analog and category samples", () => {
  const smallReference = { ...reference, categorySampleSizes: { HD: 3 }, styles: [analog("A1")] };
  const result = forecastStyle(row, smallReference, config);
  assert.equal(result.forecastConfidence, "LOW_MID");
});

test("forecast enrichment does not alter existing preview and risk fields", () => {
  const [result] = applyForecastV1([row], reference, config);
  assert.equal(result.previewScore, row.previewScore);
  assert.equal(result.stockRisk, row.stockRisk);
  assert.equal(result.forecastCompletedHistory, undefined);
  assert.equal(result.srp, undefined);
});

test("current WTD is not part of completed trend history", () => {
  const completedOnly = history.slice(0, 4);
  const withLargeWtdOutsideInput = { ...row, forecastCompletedHistory: completedOnly, currentWtdQty: 99999 };
  const result = forecastStyle(withLargeWtdOutsideInput, reference, config);
  assert.equal(result.trendFactor, 1);
  assert.equal(result.sellingWeekNumber, 4);
});
