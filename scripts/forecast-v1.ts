const CONFIDENCE = ["LOW", "LOW_MID", "MID", "MID_HIGH"];

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function periodTimingIndex(period) {
  const match = /^\d{2}-(\d{2})W(\d+)$/i.exec(String(period || ""));
  return match ? Number(match[1]) * 5 + Number(match[2]) : null;
}

function keywordsFor(name, dictionary) {
  const normalized = String(name || "").replace(/\s+/g, "").toUpperCase();
  return dictionary.filter((keyword) => normalized.includes(String(keyword).replace(/\s+/g, "").toUpperCase()));
}

function confidenceForWeek(week) {
  if (week <= 3) return "LOW";
  if (week <= 5) return "LOW_MID";
  if (week <= 7) return "MID";
  return "MID_HIGH";
}

function downgradeConfidence(value) {
  const index = CONFIDENCE.indexOf(value);
  return CONFIDENCE[Math.max(0, index - 1)] || "LOW";
}

export function trendAlphaForWeek(week, config) {
  if (week <= 4) return config.W1_W4;
  if (week <= 6) return config.W5_W6;
  if (week === 7) return config.W7;
  return config.W8_PLUS;
}

function similarity(target, analog, config, keywords) {
  const targetKeywords = new Set(keywordsFor(target.name, keywords));
  const analogKeywords = keywordsFor(analog.name, keywords);
  const keywordScore = Math.min(config.maxKeywordContribution, analogKeywords.filter((item) => targetKeywords.has(item)).length * config.nameStructuralKeywordWeight);
  const genderScore = target.genderGroup === analog.genderGroup ? config.sameGenderBonus : 0;
  const targetTiming = periodTimingIndex(target.firstPositiveSalesPeriod);
  const analogTiming = Number(analog.launchTimingIndex);
  const timingDistance = targetTiming == null ? config.launchTimingWindowWeeks : Math.abs(targetTiming - analogTiming);
  const launchScore = Math.max(0, 1 - timingDistance / config.launchTimingWindowWeeks) * config.launchTimingBonusMax;
  const targetPrice = Number(target.srp || 0);
  const analogPrice = Number(analog.price || 0);
  const priceScore = targetPrice > 0 && analogPrice > 0
    ? Math.max(0, 1 - Math.abs(targetPrice - analogPrice) / Math.max(targetPrice, analogPrice)) * config.priceSimilarityBonusMax
    : 0;
  return round(keywordScore + genderScore + launchScore + priceScore);
}

function insufficient(reason, base = {}) {
  return {
    eligible: true,
    reason,
    sellingWeekNumber: base.sellingWeekNumber ?? null,
    firstPositiveSalesPeriod: base.firstPositiveSalesPeriod || null,
    analogStyleCount: base.analogStyleCount || 0,
    analogStyles: base.analogStyles || [],
    analogCumulativeShare: null,
    currentCumulativeSales: round(base.currentCumulativeSales || 0, 0),
    baseForecastQty: null,
    trendFactor: null,
    trendAlpha: base.trendAlpha ?? null,
    adjustedForecastQty: null,
    forecastSellThrough: null,
    forecastConfidence: "INSUFFICIENT",
    forecastSignal: "INSUFFICIENT",
    referenceVersion: base.referenceVersion,
  };
}

export function forecastStyle(row, reference, config) {
  const version = reference.meta.referenceVersion;
  if (row.productGroup !== "APP") {
    return { eligible: false, reason: "ACC_NOT_SUPPORTED_V1", forecastConfidence: "INSUFFICIENT", forecastSignal: "INSUFFICIENT", referenceVersion: version };
  }

  const history = Array.isArray(row.forecastCompletedHistory) ? row.forecastCompletedHistory : [];
  const firstIndex = history.findIndex((item) => Number(item.quantity || 0) > 0);
  if (firstIndex < 0) return insufficient("NO_POSITIVE_COMPLETED_SALES", { currentCumulativeSales: row.cumQty, referenceVersion: version });
  const sellingHistory = history.slice(firstIndex);
  const sellingWeekNumber = sellingHistory.length;
  const firstPositiveSalesPeriod = history[firstIndex].period;
  const trendAlpha = trendAlphaForWeek(sellingWeekNumber, config.forecast.trendAlpha);
  const target = { ...row, firstPositiveSalesPeriod };
  const candidates = reference.styles
    .filter((analog) => analog.category === row.category && analog.styleCode !== row.sku)
    .map((analog) => ({ ...analog, similarityScore: similarity(target, analog, config.similarity, config.keywords) }))
    .sort((a, b) => b.similarityScore - a.similarityScore || a.styleCode.localeCompare(b.styleCode))
    .slice(0, config.similarity.topN);
  const analogStyles = candidates.map((analog) => ({ sku: analog.styleCode, styleCode: analog.styleCode, name: analog.name, category: analog.category, similarityScore: analog.similarityScore }));
  const shares = candidates
    .map((analog) => analog.cumulativeShareBySellingWeek[Math.min(sellingWeekNumber, analog.cumulativeShareBySellingWeek.length) - 1])
    .filter((value) => Number(value) > 0);
  const base = { sellingWeekNumber, firstPositiveSalesPeriod, analogStyleCount: shares.length, analogStyles, currentCumulativeSales: row.cumQty, trendAlpha, referenceVersion: version };
  if (shares.length < config.forecast.minimumAnalogCount) return insufficient("ANALOG_NOT_AVAILABLE", base);
  const analogCumulativeShare = shares.reduce((sum, value) => sum + Number(value), 0) / shares.length;
  if (!(analogCumulativeShare > 0)) return insufficient("ANALOG_SHARE_NOT_AVAILABLE", base);

  let trendFactor = null;
  if (sellingHistory.length >= 4) {
    const last4 = sellingHistory.slice(-4).map((item) => Number(item.quantity || 0));
    const average4 = last4.reduce((sum, value) => sum + value, 0) / 4;
    const average2 = last4.slice(-2).reduce((sum, value) => sum + value, 0) / 2;
    if (average4 > 0) trendFactor = Math.min(config.forecast.maximumTrendFactor, Math.max(0, average2 / average4));
  }
  if (trendAlpha > 0 && trendFactor == null) return insufficient("TREND_HISTORY_NOT_AVAILABLE", base);

  const currentCumulativeSales = Number(row.cumQty || 0);
  const denominator = Number(row.inQty || 0);
  if (!(denominator > 0)) return insufficient("NET_RECEIPT_NOT_AVAILABLE", base);
  const baseForecastQty = currentCumulativeSales / analogCumulativeShare;
  const effectiveTrendFactor = trendFactor == null ? 1 : trendFactor;
  const adjustedForecastQty = Math.max(currentCumulativeSales, currentCumulativeSales + (baseForecastQty - currentCumulativeSales) * (effectiveTrendFactor ** trendAlpha));
  const roundedAdjustedForecastQty = round(adjustedForecastQty, 0);
  const forecastSellThrough = roundedAdjustedForecastQty / denominator;
  let forecastConfidence = confidenceForWeek(sellingWeekNumber);
  if (shares.length < config.forecast.confidenceAnalogFloor) forecastConfidence = downgradeConfidence(forecastConfidence);
  if (Number(reference.categorySampleSizes[row.category] || 0) < config.forecast.confidenceCategorySampleFloor) forecastConfidence = downgradeConfidence(forecastConfidence);
  const confidenceAtLeastMid = CONFIDENCE.indexOf(forecastConfidence) >= CONFIDENCE.indexOf("MID");
  const forecastSignal = forecastSellThrough >= config.forecast.highSellThroughThreshold
    ? (confidenceAtLeastMid ? "HIGH" : "WATCH")
    : "NORMAL";

  return {
    eligible: true,
    sellingWeekNumber,
    firstPositiveSalesPeriod,
    analogStyleCount: shares.length,
    analogStyles,
    analogCumulativeShare: round(analogCumulativeShare),
    analogPaceRatio: round((currentCumulativeSales / denominator) / analogCumulativeShare),
    currentCumulativeSales: round(currentCumulativeSales, 0),
    baseForecastQty: round(baseForecastQty, 0),
    trendFactor: trendFactor == null ? null : round(trendFactor),
    trendAlpha,
    adjustedForecastQty: roundedAdjustedForecastQty,
    forecastSellThrough: round(forecastSellThrough),
    forecastConfidence,
    forecastSignal,
    referenceVersion: version,
  };
}

export function applyForecastV1(styles, reference, config) {
  return styles.map((source) => {
    const { forecastCompletedHistory, srp, ...row } = source;
    const forecastV1 = forecastStyle({ ...source, forecastCompletedHistory, srp }, reference, config);
    return {
      ...row,
      forecastV1,
      forecastSellThrough: forecastV1.forecastSellThrough,
      forecastSignal: forecastV1.forecastSignal,
      forecastConfidence: forecastV1.forecastConfidence,
    };
  });
}
