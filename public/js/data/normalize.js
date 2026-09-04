// Normalizer: maps whatever shape a data source returns into the canonical style/category records
// the dashboard UI already renders. If a source (today: local latest.json) already carries
// action/priority/note/reorderTiming - as produced offline by scripts/update_latest_from_sales.py -
// those values are trusted as-is and never recomputed, so today's P1/P2/P3 results do not change.
// Only when a source omits them (a future raw sales feed) does the Action Engine compute them.
window.WackyNormalize = (function (ActionEngine) {
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

    const hasPrecomputedAction = Boolean(row.action && row.priority);
    const decision = hasPrecomputedAction
      ? null
      : ActionEngine.decide({ wow, sellThrough, stock });

    return {
      ...row,
      sku,
      name,
      category: row.category || styleCategory(sku),
      categoryName: row.categoryName || row.category || styleCategory(sku),
      season: row.season || styleSeason(sku),
      gender: row.gender || styleGender(name),
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

  return { normalizeStyle, normalizeDataset, styleCategory, styleSeason, styleGender };
})(window.WackyActionEngine);
