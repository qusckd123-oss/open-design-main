// KPI / aggregate calculations, extracted out of the render functions so the same numbers are never
// computed twice and so future indicators can be added without touching the DOM-rendering code.
window.WackyMetrics = (function () {
  function computeCategories(styleRows) {
    const grouped = new Map();
    for (const row of styleRows) {
      const key = row.category || "ETC";
      const item = grouped.get(key) || {
        category: key,
        categoryName: row.categoryName || key,
        season: row.season,
        sales: 0,
        target: 0,
        stock: 0,
        quantity: 0
      };
      item.sales += Number(row.sales || 0);
      item.target += Number(row.priorSales || 0);
      item.stock += Number(row.stock || 0);
      item.quantity += Number(row.cumQty || row.quantity || 0);
      grouped.set(key, item);
    }

    return Array.from(grouped.values())
      .map((row) => {
        const denominator = row.stock + row.quantity;
        const sellThrough = denominator ? (row.quantity / denominator) * 100 : 0;
        const stockRate = denominator ? (row.stock / denominator) * 100 : Math.max(0, 100 - sellThrough);
        const wow = row.target ? ((row.sales - row.target) / row.target) * 100 : 0;
        return {
          ...row,
          sales: Number(row.sales.toFixed(1)),
          target: Number(row.target.toFixed(1)),
          sellThrough: Number(sellThrough.toFixed(1)),
          stockRate: Number(stockRate.toFixed(1)),
          wow: Number(wow.toFixed(1))
        };
      })
      .sort((a, b) => Number(b.sales || 0) - Number(a.sales || 0));
  }

  function resolveStockRate(row) {
    return Number(row.stockRate ?? 100 - Number(row.sellThrough || 0));
  }

  function computeKpis(categoryRows, styleRows) {
    const totalSales = categoryRows.reduce((sum, row) => sum + Number(row.sales || 0), 0);
    const priorSales = categoryRows.reduce((sum, row) => sum + Number(row.target || 0), 0);
    const avgSellThrough = categoryRows.length
      ? categoryRows.reduce((sum, row) => sum + Number(row.sellThrough || 0), 0) / categoryRows.length
      : 0;
    const avgStockRate = categoryRows.length
      ? categoryRows.reduce((sum, row) => sum + resolveStockRate(row), 0) / categoryRows.length
      : 0;
    const stock = categoryRows.reduce((sum, row) => sum + Number(row.stock || 0), 0);
    const reorderCount = styleRows.filter((row) => row.action === "리오더 검토").length;
    const near30Count = styleRows.filter((row) => Number(row.sellThrough || 0) >= 25 && Number(row.sellThrough || 0) < 30).length;
    const p1Count = styleRows.filter((row) => row.priority === "P1").length;
    const wow = priorSales ? ((totalSales - priorSales) / priorSales) * 100 : 0;

    return { totalSales, priorSales, avgSellThrough, avgStockRate, stock, reorderCount, near30Count, p1Count, wow };
  }

  // Extra counts requested for future KPI/board expansion. Computed from real rows only - never
  // hardcoded - so they stay correct as the underlying data source changes.
  function computeExtendedCounts(styleRows) {
    return {
      sellThroughAbove70: styleRows.filter((row) => Number(row.sellThrough || 0) >= 70).length,
      sellThroughAbove80: styleRows.filter((row) => Number(row.sellThrough || 0) >= 80).length,
      wowUpCount: styleRows.filter((row) => row.wow != null && Number(row.wow) > 0).length,
      wowDownCount: styleRows.filter((row) => row.wow != null && Number(row.wow) < 0).length,
      highStockCount: styleRows.filter((row) => resolveStockRate(row) >= 65).length,
      lowStockHighVelocityCount: styleRows.filter((row) => resolveStockRate(row) < 35 && Number(row.sellThrough || 0) >= 60).length,
      newLaunchCount: styleRows.filter((row) => row.isNewLaunch === true).length
    };
  }

  // A short, metric-based explanation for why a style surfaced as a priority pick.
  function buildReasonLine(row) {
    const parts = [`판매율 ${Number(row.sellThrough || 0).toFixed(1)}%`, `재고 ${Number(row.stock || 0).toLocaleString("ko-KR")}`];
    if (row.wow != null) {
      const wow = Number(row.wow);
      parts.push(wow >= 0 ? "최근 판매강도 높음" : "최근 판매강도 둔화");
    }
    return parts.join(" · ");
  }

  return { computeCategories, computeKpis, computeExtendedCounts, buildReasonLine, resolveStockRate };
})();
