// Normalizer: maps whatever shape a data source returns into the canonical style/category records
// the dashboard UI already renders. If a source (today: local latest.json) already carries
// action/priority/note/reorderTiming - as produced offline by scripts/update_latest_from_sales.py -
// those values are trusted as-is and never recomputed, so today's P1/P2/P3 results do not change.
// Only when a source omits them (a future raw sales feed) does the Action Engine compute them.
window.WackyNormalize = (function (ActionEngine) {
  const PRODUCT_GROUP_BY_CATEGORY = {
    CD: "APP",
    CR: "APP",
    DP: "APP",
    HD: "APP",
    HZ: "APP",
    JK: "APP",
    KT: "APP",
    LT: "APP",
    OP: "APP",
    PT: "APP",
    SH: "APP",
    SO: "APP",
    SR: "APP",
    SS: "APP",
    ST: "APP",
    BG: "ACC",
    BP: "ACC",
    CA: "ACC",
    CB: "ACC",
    EC: "ACC",
    JW: "ACC",
    MU: "ACC",
    SE: "ACC",
    SK: "ACC",
    SN: "ACC",
    TC: "ACC"
  };

  function styleCategory(sku) {
    const match = /^WA\d{4}([A-Z]{2})/.exec(sku || "");
    return match ? match[1] : "ETC";
  }

  function styleSeason(sku) {
    const match = /^WA(\d{2})(\d{2})/.exec(sku || "");
    if (!match) return "미분류";
    const [, year, drop] = match;
    return `${year}${Number(drop) >= 3 ? "FW" : "SS"}`;
  }

  function styleGender(name) {
    return name && (name.includes("우먼") || name.includes("우먼스")) ? "WOMEN" : "UNISEX";
  }

  function productGroupForCategory(category) {
    return PRODUCT_GROUP_BY_CATEGORY[String(category || "").toUpperCase()] || "UNMAPPED";
  }

  function genderGroupFor({ gender, name }) {
    const normalized = String(gender || "").toUpperCase();
    if (normalized === "UNISEX") return "UNISEX";
    if (normalized === "WOMEN" || normalized === "WOMENS" || normalized === "WOMAN") return "WOMENS";
    const productName = String(name || "").toUpperCase();
    if (productName.includes("우먼스") || productName.includes("우먼") || productName.includes("WOMENS") || productName.includes("WOMEN")) return "WOMENS";
    return "UNMAPPED";
  }

  function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  // Accepts either today's field names (sku/sales/priorSales/stock/...) or the wider
  // ProductRecord-style field names described in the product-planning data contract
  // (styleCode/productName/salesAmount/previousWeekSalesAmount/inventoryQty/...).
  function normalizeStyle(row) {
    if (!row || typeof row !== "object") return row;

    const sku = row.sku || row.styleCode || row.productCode || "";
    const name = row.name || row.productName || sku;
    const sales = toNumber(row.sales ?? row.salesAmount ?? row.weeklySalesAmount, 0);
    const priorSales = toNumber(row.priorSales ?? row.previousWeekSalesAmount, 0);
    const stock = Math.round(toNumber(row.stock ?? row.inventoryQty, 0));
    const sellThrough = toNumber(row.sellThrough ?? row.sellThroughRate, 0);
    const stockRate = row.stockRate != null ? toNumber(row.stockRate) : Math.max(0, 100 - sellThrough);
    const wow = row.wow != null
      ? toNumber(row.wow)
      : (priorSales ? Number((((sales - priorSales) / priorSales) * 100).toFixed(1)) : null);
    const category = row.category || styleCategory(sku);
    const gender = row.gender || styleGender(name);

    const hasPrecomputedAction = Boolean(row.action && row.priority);
    const decision = hasPrecomputedAction
      ? null
      : ActionEngine.decide({ wow, sellThrough, stock });

    return {
      ...row,
      sku,
      name,
      category,
      categoryName: row.categoryName || category,
      productGroup: row.productGroup || productGroupForCategory(category),
      season: row.season || styleSeason(sku),
      gender,
      genderGroup: row.genderGroup || genderGroupFor({ gender, name }),
      sales,
      priorSales,
      stock,
      sellThrough,
      stockRate,
      wow,
      action: row.action || decision.action,
      priority: row.priority || decision.priority,
      note: row.note || decision.note,
      reorderTiming: row.reorderTiming || decision.reorderTiming
    };
  }

  function normalizeDataset(raw) {
    if (!raw || typeof raw !== "object") return raw;
    const styles = Array.isArray(raw.styles) ? raw.styles.map(normalizeStyle) : [];
    return { ...raw, styles };
  }

  return { normalizeStyle, normalizeDataset, styleCategory, styleSeason, styleGender, productGroupForCategory, genderGroupFor };
})(window.WackyActionEngine);
