(() => {
  const state = { rows: [], special: {}, filtered: [], sort: "sku", dir: 1 };
  const $ = (id) => document.getElementById(id);

  const lifecycleLabel = {
    PRE_SALE: "판매 미관측 · 출시 여부 미판정",
    WTD_ONLY: "당주 판매만 관측 · 첫 완료주 대기",
    W1: "첫 완료 판매주 · 관찰 전용",
    "W2-W8": "판매 2~8주 · Early Pace 참고 가능",
    "W9+": "판매 9주 이상 · 성숙 단계 맥락",
  };
  const lifecycleShort = {
    PRE_SALE: "판매 미관측",
    WTD_ONLY: "당주만 관측",
    W1: "첫 완료주",
    "W2-W8": "2~8주",
    "W9+": "9주 이상",
  };
  const availabilityLabel = {
    AVAILABLE: "사용 가능",
    DISPLAY_ONLY: "참고값",
    UNAVAILABLE: "계산 불가",
    NOT_APPLICABLE: "현재 단계 미적용",
    MISSING: "계산 불가",
  };
  const trendLabel = {
    RISING: "상승",
    ACCELERATING: "가속 상승",
    DECLINING: "하락",
    FLAT: "보합",
    STABLE: "보합",
  };
  const marketScopeLabel = {
    SPECIAL_MARKET: "특수마켓(해외전용)",
    NOT_SPECIAL_MARKET_BY_CURRENT_METADATA: "일반(국내) 마켓",
    UNKNOWN: "마켓 범위 미확인",
  };
  const domesticApplicabilityLabel = {
    NOT_APPLICABLE_CONFIRMED_DIRECT_SHIP: "해외 직배송 확정 · 국내 재고/입고 리스크 해석 미적용",
    NO_SPECIAL_MARKET_EXCEPTION_EVIDENCE: "특수마켓 예외 근거 없음",
    UNKNOWN_MARKET_SCOPE: "마켓 범위 메타데이터 미확인",
    REVIEW_REQUIRED_DIRECT_SHIP_UNKNOWN: "특수마켓이나 직배송 여부 확인 필요",
  };
  const conflictLabel = {
    LEGACY_VS_SELLING_AGE_VELOCITY_DIFFERENT: "기존 기준과 판매연령 기준 속도가 다름",
    LEGACY_VS_SELLING_AGE_COVER_DIFFERENT: "기존 기준과 판매연령 기준 커버가 다름",
    ANALOG_PACE_PRESENT_OUTSIDE_W2_W8: "원천 Pace 값 존재 · 현재 판매주차에서는 미적용",
    STYLE_FORECAST_RAW_JOIN_OUTSIDE_W9_PLUS: "STYLE Forecast 원천 연결됨 · W9+ 전이라 SKU 판단에는 미적용",
  };
  const qualityLabel = {
    NEGATIVE_REMAINING_ORDER: "입고누계가 발주수량을 초과해 잔여오더 원천값이 음수",
    NEGATIVE_ERP_STOCK: "ERP 재고 원천값이 음수",
    NEGATIVE_STOCK_COVER: "음수 ERP 재고를 그대로 사용해 커버도 음수",
    MISSING_ORDER_QTY: "발주수량 원천값 없음",
    NON_POSITIVE_ORDER_QTY: "발주수량이 0 이하",
    MISSING_INBOUND_QTY: "입고수량 원천값 없음",
    ANALOG_PACE_MISSING_IN_W2_W8: "판매 2~8주 구간이지만 Pace 원천값 없음",
  };

  const nf = (v, digits = 0) => (v == null || Number.isNaN(Number(v)) ? "-" : Number(v).toLocaleString("ko-KR", { maximumFractionDigits: digits }));
  const pct = (v) => (v == null ? "-" : `${nf(Number(v) * 100, 1)}%`);
  const weeks = (v) => (v == null ? "미확인" : `${nf(v, 1)}주`);
  const label = (map, v) => (v == null ? "-" : map[v] || v);

  function coverText(cover) {
    if (!cover) return "계산 불가";
    if (!cover.available) return `계산 불가${cover.unavailableReason ? ` (${qualityLabel[cover.unavailableReason] || cover.unavailableReason})` : ""}`;
    return `${weeks(cover.value)} · 속도 기준 ${nf(cover.velocityDenominatorQtyPerWeek, 1)}/주`;
  }

  function value(row, key) {
    if (key === "legacyVelocity") return row.demandFacts.legacyVelocityQtyPerWeek;
    if (key === "sellingAgeVelocity") return row.demandFacts.sellingAgeVelocityQtyPerWeek;
    if (key === "stock") return row.inventoryFacts.erpStockQty;
    if (key === "remaining") return row.supplyFacts.remainingOrderQty;
    if (key === "pace") return row.analogPaceContext.context ? row.analogPaceContext.context.percentile : null;
    return row[key];
  }

  function renderMetrics(summary) {
    const lc = summary.lifecycleCounts || {};
    const cards = [
      ["SKU 전체", summary.skuCount, "26FW APP · SKU 기준"],
      ["판매 미관측", lc.PRE_SALE || 0, "완료 판매 데이터 없음"],
      ["첫 완료주(W1)", lc.W1 || 0, "관찰 전용"],
      ["2~8주(Early Pace)", lc["W2-W8"] || 0, "Pace 참고 가능"],
      ["근거 차이 표시", Object.values(summary.conflictCounts || {}).reduce((a, b) => a + b, 0), "SKU 중복 포함"],
      ["확인 필요 표시", Object.values(summary.dataQualityCounts || {}).reduce((a, b) => a + b, 0), "SKU 중복 포함"],
    ];
    $("metrics").innerHTML = cards.map(([a, b, c]) => `<div class="metric"><small>${a}</small><strong>${nf(b)}</strong><span>${c}</span></div>`).join("");
  }

  function options(id, values, map = (x) => x) {
    const el = $(id);
    [...new Set(values.filter((v) => v != null))].sort().forEach((v) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = map(v);
      el.append(o);
    });
  }

  function render() {
    const q = $("search").value.trim().toUpperCase();
    const filters = { lifecycle: $("lifecycle").value, market: $("market").value, conflict: $("conflict").value, quality: $("quality").value };
    state.filtered = state.rows.filter((r) => {
      const hay = `${r.sku} ${r.styleCode} ${r.colorCode}`.toUpperCase();
      const sm = state.special[r.sku];
      return (!q || hay.includes(q))
        && (filters.lifecycle === "all" || r.lifecycle === filters.lifecycle)
        && (filters.market === "all" || (sm ? sm.marketScope : "UNKNOWN") === filters.market)
        && (filters.conflict === "all" || (filters.conflict === "hasConflict" ? r.conflicts.length > 0 : r.conflicts.length === 0))
        && (filters.quality === "all" || (filters.quality === "hasQuality" ? r.dataQuality.length > 0 : r.dataQuality.length === 0));
    });
    const sorted = [...state.filtered].sort((a, b) => {
      const av = value(a, state.sort), bv = value(b, state.sort);
      if (typeof av === "string" || typeof bv === "string") return String(av || "").localeCompare(String(bv || "")) * state.dir;
      return ((Number(av) ?? -Infinity) - (Number(bv) ?? -Infinity)) * state.dir;
    });
    $("status").textContent = `${nf(sorted.length)}개 표시 / ${nf(state.rows.length)}개 전체 · 행을 누르면 독립 근거를 확인합니다`;
    $("rows").innerHTML = sorted.length ? sorted.map(rowHtml).join("") : `<tr><td colspan="10" class="empty">조건에 맞는 SKU가 없습니다.</td></tr>`;
    document.querySelectorAll("#rows tr[data-sku]").forEach((tr) => tr.addEventListener("click", () => openDrawer(state.rows.find((r) => r.sku === tr.dataset.sku))));
  }

  function rowHtml(r) {
    const d = r.demandFacts, inv = r.inventoryFacts, s = r.supplyFacts, pace = r.analogPaceContext;
    const sm = state.special[r.sku];
    const marketTag = sm && sm.marketScope === "SPECIAL_MARKET"
      ? `<span class="tag purple">특수마켓</span>`
      : sm && sm.marketScope === "UNKNOWN"
        ? `<span class="tag muted">미확인</span>`
        : `<span class="tag">국내</span>`;
    const markerCount = r.conflicts.length + r.dataQuality.length;
    const markerTag = markerCount
      ? `<span class="tag orange">표시 ${markerCount}건</span>`
      : `<span class="tag">추가 표시 없음</span>`;
    return `<tr data-sku="${r.sku}">
      <td><b>${r.sku}</b><br><span class="muted">${r.styleCode || "-"} · ${r.colorCode || "-"}</span></td>
      <td>${lifecycleShort[r.lifecycle] || r.lifecycle}</td>
      <td class="num">${nf(d.legacyVelocityQtyPerWeek, 1)} <span class="muted">/주</span></td>
      <td class="num">${nf(d.sellingAgeVelocityQtyPerWeek, 1)} <span class="muted">/주</span></td>
      <td class="num">${nf(inv.erpStockQty)}</td>
      <td class="num">${nf(s.remainingOrderQty)}</td>
      <td>${trendLabel[r.trendContext.value] || (r.trendContext.value || "미확인")}</td>
      <td class="num">${pace.context ? `${nf(pace.context.percentile, 0)}%ile` : "미적용"}</td>
      <td>${marketTag}</td>
      <td>${markerTag}</td>
    </tr>`;
  }

  function factCard(title, val, wide = false) {
    return `<div class="fact${wide ? " wide" : ""}"><small>${title}</small><b>${val}</b></div>`;
  }

  function openDrawer(r) {
    if (!r) return;
    const d = r.demandFacts, inv = r.inventoryFacts, s = r.supplyFacts, pace = r.analogPaceContext, tr = r.trendContext, fc = r.styleForecastContext;
    const sm = state.special[r.sku];

    $("drawerTitle").textContent = r.sku;
    $("drawerSub").textContent = `${r.styleCode || "-"} · ${r.colorCode || "-"}`;
    $("drawerLifecycle").innerHTML = `<div class="marker ok">${lifecycleLabel[r.lifecycle] || r.lifecycle}</div>`;

    $("drawerDemand").innerHTML = [
      factCard("누적 판매", nf(d.cumulativeSalesQty)),
      factCard("완료 판매 (당주 제외)", nf(d.completedSalesQty)),
      factCard("당주 판매(WTD)", `${nf(d.currentWtdQty)}${d.wtdExcludedFromVelocity ? " · 속도 계산 제외" : ""}`),
      factCard("완료 판매 주차 / 판매연령", `${nf(d.completedHistoryWeeks)}주 이력 / ${d.sellingAgeCompletedWeeks == null ? "미확인" : `${nf(d.sellingAgeCompletedWeeks)}주`}`),
      factCard("Legacy 속도", d.legacyVelocityAvailable ? `${nf(d.legacyVelocityQtyPerWeek, 1)} /주` : "참고값 아님"),
      factCard("Selling-age 속도", d.sellingAgeVelocityAvailable ? `${nf(d.sellingAgeVelocityQtyPerWeek, 1)} /주` : "계산 불가"),
      factCard("최근 완료주 / 직전 완료주", `${nf(d.lastCompletedWeekQty)} / ${nf(d.previousCompletedWeekQty)}`),
      factCard("첫 완료 판매주", d.firstPositiveCompletedSalesPeriod || "미확인"),
    ].join("");

    $("drawerInventory").innerHTML = [
      factCard("ERP 재고", nf(inv.erpStockQty)),
      factCard("Legacy Stock Cover", coverText(inv.legacyStockCoverWeeks)),
      factCard("Selling-age Cover", coverText(inv.sellingAgeStockCoverWeeks)),
    ].join("");

    $("drawerSupply").innerHTML = [
      factCard("발주 / 입고", `${nf(s.orderQty)} / ${nf(s.inboundQty)}`),
      factCard("입고 완료율", s.inboundCompletionAvailable ? pct(s.inboundCompletionRate) : `계산 불가${s.inboundCompletionUnavailableReason ? ` (${qualityLabel[s.inboundCompletionUnavailableReason] || s.inboundCompletionUnavailableReason})` : ""}`),
      factCard("잔여 발주(원천값)", s.remainingOrderAvailable ? nf(s.remainingOrderQty) : `계산 불가${s.remainingOrderUnavailableReason ? ` (${qualityLabel[s.remainingOrderUnavailableReason] || s.remainingOrderUnavailableReason})` : ""}`, true),
    ].join("");

    const paceText = pace.context
      ? `${nf(pace.context.sellingWeek)}주차 · ${nf(pace.context.percentile, 0)}%ile · 방법 ${pace.context.method || "-"} · 분석군 ${nf(pace.context.analogStyleCount)}개`
      : `${availabilityLabel[pace.availability] || pace.availability}${pace.missingnessReason ? ` (${pace.missingnessReason})` : ""}`;
    $("drawerContext").innerHTML = [
      factCard("Early Pace (W2-W8 전용 맥락)", paceText, true),
      factCard("판매 트렌드", `${trendLabel[tr.value] || (tr.value || "미확인")} · ${availabilityLabel[tr.availability] || tr.availability}`),
      factCard("STYLE Forecast (W9+ 전용 맥락)", fc.applicable ? (fc.context ? "표시 가능 원천 연결" : `${availabilityLabel[fc.availability] || fc.availability}`) : "현재 단계 미적용", true),
    ].join("");

    $("drawerConflicts").innerHTML = r.conflicts.length
      ? r.conflicts.map((c) => `<div class="marker">${conflictLabel[c] || c}</div>`).join("")
      : `<div class="marker ok">추가 표시 없음</div>`;

    $("drawerQuality").innerHTML = r.dataQuality.length
      ? r.dataQuality.map((c) => `<div class="marker quality">${qualityLabel[c] || c}</div>`).join("")
      : `<div class="marker ok">추가 표시 없음</div>`;

    if (sm) {
      const scopeText = marketScopeLabel[sm.marketScope] || sm.marketScope;
      const applicabilityText = domesticApplicabilityLabel[sm.domesticCurrentRiskApplicability] || sm.domesticCurrentRiskApplicability;
      $("drawerSpecial").innerHTML = `
        <div class="section-title">Special Market / 직배송 맥락 (별도 진단 연결)</div>
        <div class="special">
          마켓 범위: <b>${scopeText}</b><br>
          국내 재고/입고 리스크 해석: <b>${applicabilityText}</b><br>
          ${sm.applicabilityReason ? sm.applicabilityReason : ""}
        </div>`;
    } else {
      $("drawerSpecial").innerHTML = "";
    }

    document.body.classList.add("open");
  }

  ["search", "lifecycle", "market", "conflict", "quality"].forEach((id) => $(id).addEventListener("input", render));
  document.querySelectorAll("th button").forEach((b) => b.addEventListener("click", () => {
    const key = b.dataset.sort;
    state.dir = state.sort === key ? state.dir * -1 : 1;
    state.sort = key;
    render();
  }));
  $("close").addEventListener("click", () => document.body.classList.remove("open"));
  $("drawerBg").addEventListener("click", () => document.body.classList.remove("open"));

  Promise.all([
    fetch("data/sku-signal-v1-state-machine.json", { cache: "no-store" }).then((r) => r.json()),
    fetch("data/sku-special-market-applicability-diagnostic.json", { cache: "no-store" }).then((r) => r.json()),
  ])
    .then(([stateMachine, specialMarket]) => {
      state.rows = stateMachine.rows || [];
      state.special = Object.fromEntries((specialMarket.rows || []).map((r) => [r.sku, r]));
      renderMetrics(stateMachine.summary || {});
      options("lifecycle", state.rows.map((r) => r.lifecycle), (v) => lifecycleShort[v] || v);
      options("market", state.rows.map((r) => (state.special[r.sku] ? state.special[r.sku].marketScope : "UNKNOWN")), (v) => marketScopeLabel[v] || v);
      $("source").textContent = `${(stateMachine.source && stateMachine.source.skuSnapshot && stateMachine.source.skuSnapshot.sourceAsOf) || "-"} 기준 · SKU Signal v1 상태머신 + Special Market 진단 연결`;
      render();
    })
    .catch((e) => {
      $("status").textContent = "근거 데이터를 불러오지 못했습니다";
      console.error(e);
    });
})();
