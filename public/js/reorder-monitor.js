(function (DataService) {
  const PREVIEW_CONFIG = {
    urgentScore: 80,
    checkScore: 60,
    watchScore: 45,
    shortCoverWeeks: 2,
    highSellThrough: 70,
    velocityWatchQty: 20
  };
  const ELIGIBILITY_VALUES = ["ACTIVE", "CARRYOVER", "HOLD", "CLOSED", "SPECIAL", "UNSET"];
  const ELIGIBILITY_LABELS = {
    ACTIVE: "ACTIVE",
    CARRYOVER: "CARRYOVER",
    HOLD: "HOLD",
    CLOSED: "CLOSED",
    SPECIAL: "SPECIAL",
    UNSET: "UNSET"
  };
  const LOCAL_OVERRIDE_KEY = "wacky.reorderOverrides.v1";
  const CONFIG = window.__WACKY_DASHBOARD_CONFIG__ || {};
  const READ_ONLY = CONFIG.REORDER_READ_ONLY === true;

  const state = {
    rows: [],
    filtered: [],
    skuByStyle: {},
    skuMeta: {},
    fileOverrides: {},
    localOverrides: {},
    activeSku: "",
    sortKey: "previewScore",
    sortDir: "desc",
    skuSortKey: "inboundSellThrough",
    chart: null,
    quick: {},
    salesView: "all"
  };

  // 판매 기준 토글 (owner-requested 2026-09-14): "국내만" swaps these specific fields to their
  // domesticXxx mirror (computed in scripts/sales-dashboard.mjs with the "해외 사입" channel
  // excluded). 가용재고(stock)는 채널 분리가 불가능한 원본 그대로 항상 사용합니다.
  const DOMESTIC_FIELD_MAP = {
    sellThrough: "domesticSellThrough",
    lastCompleteWeekQty: "domesticLastCompleteWeekQty",
    previousCompleteWeekQty: "domesticPreviousCompleteWeekQty",
    completedWeekWow: "domesticCompletedWeekWow",
    weighted4CompletedWeekQty: "domesticWeighted4CompletedWeekQty",
    currentWtdQty: "domesticCurrentWtdQty",
    stockCoverWeeks: "domesticStockCoverWeeks",
    salesTrend: "domesticSalesTrend",
    stockRisk: "domesticStockRisk",
    previewScore: "domesticPreviewScore",
    completedWeeklyHistory: "domesticCompletedWeeklyHistory",
    fullWeeklyHistory: "domesticFullWeeklyHistory"
  };

  function viewField(row, field) {
    const domesticField = DOMESTIC_FIELD_MAP[field];
    if (state.salesView === "domestic" && domesticField && row && row[domesticField] !== undefined) {
      return row[domesticField];
    }
    return row ? row[field] : undefined;
  }

  const riskClass = {
    CRITICAL: "risk-critical",
    HIGH: "risk-high",
    MEDIUM: "risk-medium",
    LOW: "risk-low",
    UNKNOWN: "risk-unknown"
  };

  const trendClass = {
    ACCELERATING: "bg-[rgba(46,107,90,.14)] text-green",
    RISING: "bg-[rgba(57,91,115,.14)] text-blue",
    STABLE: "bg-paper text-slate",
    DECLINING: "bg-[rgba(199,145,50,.18)] text-[#7B5516]",
    NEW: "bg-white text-slate border border-line"
  };

  const forecastClass = {
    HIGH: "risk-critical",
    WATCH: "risk-medium",
    NORMAL: "risk-low",
    INSUFFICIENT: "risk-unknown"
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function num(value, digits = 0) {
    if (value == null || Number.isNaN(Number(value))) return "-";
    return Number(value).toLocaleString("ko-KR", { maximumFractionDigits: digits });
  }

  function pct(value) {
    if (value == null || Number.isNaN(Number(value))) return "-";
    const number = Number(value);
    return `${number > 0 ? "+" : ""}${number.toFixed(1)}%`;
  }

  function forecastPct(value) {
    if (value == null || Number.isNaN(Number(value))) return "-";
    return `${(Number(value) * 100).toFixed(1)}%`;
  }

  function fmtDate(value) {
    if (!value) return "-";
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ko-KR", { hour12: false });
  }

  function classifyPreview(row) {
    const score = Number(viewField(row, "previewScore") || 0);
    const risk = viewField(row, "stockRisk") || "UNKNOWN";
    const coverRaw = viewField(row, "stockCoverWeeks");
    const cover = coverRaw == null ? null : Number(coverRaw);
    const trend = viewField(row, "salesTrend") || "NEW";
    const velocity = Number(viewField(row, "weighted4CompletedWeekQty") || 0);
    const sellThrough = Number(viewField(row, "sellThrough") || 0);

    if (score >= PREVIEW_CONFIG.urgentScore || risk === "CRITICAL") return "URGENT";
    if (score >= PREVIEW_CONFIG.checkScore || risk === "HIGH" || risk === "MEDIUM") return "CHECK";
    if (
      score >= PREVIEW_CONFIG.watchScore ||
      ((trend === "ACCELERATING" || trend === "RISING") &&
        velocity >= PREVIEW_CONFIG.velocityWatchQty &&
        sellThrough >= PREVIEW_CONFIG.highSellThrough &&
        (cover == null || cover > PREVIEW_CONFIG.shortCoverWeeks))
    ) {
      return "WATCH";
    }
    return "NORMAL";
  }

  function normalizeEligibility(value) {
    const normalized = String(value || "").toUpperCase();
    return ELIGIBILITY_VALUES.includes(normalized) ? normalized : "UNSET";
  }

  function defaultEligibility(row) {
    return row.isSpecialMarket ? "SPECIAL" : "UNSET";
  }

  async function loadFileOverrides() {
    try {
      const response = await fetch("data/reorder-overrides.json", { cache: "no-store" });
      if (!response.ok) return {};
      const payload = await response.json();
      return payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
    } catch {
      return {};
    }
  }

  async function loadSkuData() {
    try {
      const response = await fetch("data/sku-latest.json", { cache: "no-store" });
      if (!response.ok) return { meta: {}, styles: {} };
      const payload = await response.json();
      return payload && typeof payload === "object" ? payload : { meta: {}, styles: {} };
    } catch {
      return { meta: {}, styles: {} };
    }
  }

  function loadLocalOverrides() {
    if (READ_ONLY) return {};
    try {
      const payload = JSON.parse(localStorage.getItem(LOCAL_OVERRIDE_KEY) || "{}");
      return payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
    } catch {
      return {};
    }
  }

  function saveLocalOverrides() {
    if (READ_ONLY) return;
    localStorage.setItem(LOCAL_OVERRIDE_KEY, JSON.stringify(state.localOverrides));
  }

  function refreshRowsFromOverrides() {
    state.rows = state.rows.map((row) => applyOverrides(row));
  }

  function cleanOverrideEntry(entry) {
    const reorderEligibility = normalizeEligibility(entry?.reorderEligibility);
    const memo = String(entry?.memo || "").trim();
    const out = { reorderEligibility };
    if (memo) out.memo = memo;
    return out;
  }

  function collectExportOverrides() {
    const merged = { ...state.fileOverrides, ...state.localOverrides };
    const out = {};
    for (const row of state.rows) {
      const entry = merged[row.sku];
      if (!entry) continue;
      const clean = cleanOverrideEntry(entry);
      if (!clean.memo && clean.reorderEligibility === defaultEligibility(row)) continue;
      out[row.sku] = clean;
    }
    return out;
  }

  function exportOverrides() {
    if (READ_ONLY) return;
    const overrides = collectExportOverrides();
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const filename = `wacky-reorder-overrides-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.json`;
    const payload = {
      meta: {
        exportedAt: now.toISOString(),
        styleCount: state.rows.length,
        overrideCount: Object.keys(overrides).length
      },
      overrides
    };
    const blob = new Blob([JSON.stringify(payload, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function parseImportPayload(payload) {
    const source = payload?.overrides && typeof payload.overrides === "object" ? payload.overrides : payload;
    if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("overrides object is required");
    const validSkus = new Set(state.rows.map((row) => row.sku));
    const imported = {};
    for (const [sku, entry] of Object.entries(source)) {
      if (!validSkus.has(sku)) throw new Error(`unknown SKU: ${sku}`);
      const reorderEligibility = normalizeEligibility(entry?.reorderEligibility);
      if (reorderEligibility === "UNSET" && String(entry?.reorderEligibility || "").toUpperCase() !== "UNSET") {
        throw new Error(`invalid eligibility for ${sku}`);
      }
      imported[sku] = cleanOverrideEntry(entry);
    }
    return imported;
  }

  async function importOverrides(file) {
    if (READ_ONLY) return;
    if (!file) return;
    let imported;
    try {
      imported = parseImportPayload(JSON.parse(await file.text()));
    } catch (error) {
      alert(`불러오기 실패: ${error.message}`);
      return;
    }
    const current = collectExportOverrides();
    let added = 0;
    let changed = 0;
    for (const [sku, entry] of Object.entries(imported)) {
      if (!current[sku]) added += 1;
      else if (JSON.stringify(current[sku]) !== JSON.stringify(entry)) changed += 1;
    }
    if (!confirm(`판단 데이터를 불러옵니다.\n추가 ${added}개, 변경 ${changed}개\n기존 local 판단값은 삭제하지 않고 병합합니다.`)) return;
    state.localOverrides = { ...state.localOverrides, ...imported };
    saveLocalOverrides();
    refreshRowsFromOverrides();
    renderAll();
  }

  function clearLocalOverrides() {
    if (READ_ONLY) return;
    if (!confirm("이 브라우저에 저장된 로컬 판단 데이터를 초기화합니다. 기준 override 파일은 유지됩니다.")) return;
    state.localOverrides = {};
    saveLocalOverrides();
    refreshRowsFromOverrides();
    renderAll();
  }

  function applyOverrides(row) {
    const fileOverride = state.fileOverrides[row.sku] || {};
    const localOverride = READ_ONLY ? {} : state.localOverrides[row.sku] || {};
    const merged = { ...fileOverride, ...localOverride };
    const reorderEligibility = normalizeEligibility(merged.reorderEligibility || defaultEligibility(row));
    return {
      ...row,
      reorderEligibility,
      eligibilityMemo: String(merged.memo || ""),
      eligiblePreview: reorderEligibility === "ACTIVE" || reorderEligibility === "CARRYOVER"
    };
  }

  function updateOverride(sku, patch) {
    if (READ_ONLY) return;
    const previous = state.localOverrides[sku] || {};
    state.localOverrides[sku] = { ...previous, ...patch };
    if (!state.localOverrides[sku].memo && state.localOverrides[sku].reorderEligibility === defaultEligibility(state.rows.find((row) => row.sku === sku) || {})) {
      delete state.localOverrides[sku];
    }
    saveLocalOverrides();
    state.rows = state.rows.map((row) => row.sku === sku ? applyOverrides({ ...row, ...patch }) : row);
  }

  function getComparableValue(row, key) {
    if (key === "previewScore") return Number(viewField(row, "previewScore") ?? row.reorderSignalScore ?? 0);
    if (DOMESTIC_FIELD_MAP[key]) {
      const value = viewField(row, key);
      return value == null ? (key === "stockCoverWeeks" ? 999999 : 0) : Number(value);
    }
    if (key === "stockCoverWeeks") return row.stockCoverWeeks == null ? 999999 : Number(row.stockCoverWeeks);
    if (key === "forecastSellThrough") return row.forecastSellThrough == null ? -1 : Number(row.forecastSellThrough);
    return Number(row[key] ?? 0);
  }

  function sortRows(rows) {
    const direction = state.sortDir === "asc" ? 1 : -1;
    return rows.slice().sort((a, b) => {
      const diff = getComparableValue(a, state.sortKey) - getComparableValue(b, state.sortKey);
      if (diff) return diff * direction;
      const coverDiff = getComparableValue(a, "stockCoverWeeks") - getComparableValue(b, "stockCoverWeeks");
      if (coverDiff) return coverDiff;
      return String(a.sku || "").localeCompare(String(b.sku || ""));
    });
  }

  function filterRows() {
    const search = $("searchFilter").value.trim().toLowerCase();
    const productGroup = $("productGroupFilter").value;
    const genderGroup = $("genderGroupFilter").value;
    const season = $("seasonFilter").value;
    const category = $("categoryFilter").value;
    const trend = $("trendFilter").value;
    const risk = $("riskFilter").value;
    const preview = $("previewFilter").value;
    const forecast = $("forecastFilter").value;
    const eligibility = $("eligibilityFilter").value;
    const special = $("specialMarketFilter").value;
    const overseasSales = $("overseasSalesFilter").value;
    const quick = state.quick;

    state.filtered = sortRows(
      state.rows.filter((row) => {
        const previewClass = classifyPreview(row);
        const coverRaw = viewField(row, "stockCoverWeeks");
        const cover = coverRaw == null ? null : Number(coverRaw);
        return (
          (!search || String(row.sku || "").toLowerCase().includes(search) || String(row.name || "").toLowerCase().includes(search)) &&
          (productGroup === "all" || row.productGroup === productGroup) &&
          (genderGroup === "all" || row.genderGroup === genderGroup) &&
          (season === "all" || row.season === season) &&
          (category === "all" || row.category === category) &&
          (trend === "all" || viewField(row, "salesTrend") === trend) &&
          (risk === "all" || (viewField(row, "stockRisk") || "UNKNOWN") === risk) &&
          (preview === "all" || previewClass === preview) &&
          (forecast === "all" || (row.forecastSignal || "INSUFFICIENT") === forecast) &&
          (eligibility === "all" || (eligibility === "eligible" ? row.eligiblePreview : row.reorderEligibility === eligibility)) &&
          (special === "all" || (special === "special" ? row.isSpecialMarket : !row.isSpecialMarket)) &&
          (overseasSales === "all" || (overseasSales === "hasOverseas" ? row.hasOverseasSales === true : !row.hasOverseasSales)) &&
          (quick.minSellThrough == null || Number(viewField(row, "sellThrough") || 0) >= quick.minSellThrough) &&
          (quick.maxCoverWeeks == null || (cover != null && cover <= quick.maxCoverWeeks))
          && (!quick.currentLowFutureHigh || ((viewField(row, "stockRisk") || "UNKNOWN") === "LOW" && row.forecastSignal === "HIGH"))
        );
      })
    );
  }

  function optionList(values, allLabel = "전체") {
    return [`<option value="all">${allLabel}</option>`, ...values.map((value) => `<option value="${value}">${value}</option>`)].join("");
  }

  function initFilters() {
    const seasons = Array.from(new Set(state.rows.map((row) => row.season).filter(Boolean))).sort();
    const categories = Array.from(new Set(state.rows.map((row) => row.category).filter(Boolean))).sort();
    $("seasonFilter").innerHTML = optionList(seasons);
    $("categoryFilter").innerHTML = optionList(categories);
    $("trendFilter").innerHTML = optionList(["ACCELERATING", "RISING", "STABLE", "DECLINING", "NEW"]);
    $("riskFilter").innerHTML = optionList(["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]);
    $("previewFilter").innerHTML = optionList(["URGENT", "CHECK", "WATCH", "NORMAL"]);
    $("forecastFilter").innerHTML = optionList(["HIGH", "WATCH", "NORMAL", "INSUFFICIENT"]);
  }

  function renderMeta(raw, source) {
    const meta = raw.meta || {};
    $("sourceUpdatedAt").textContent = fmtDate(meta.sourceUpdatedAt);
    $("syncedAt").textContent = fmtDate(meta.syncedAt);
    $("sourceName").textContent = String(meta.source || "SALES_DASHBOARD").replaceAll("_", " ");
    $("loadStatus").textContent = source === "local" ? "latest.json 연결" : source;
  }

  function renderKpis() {
    const rows = state.filtered;
    const urgent = rows.filter((row) => classifyPreview(row) === "URGENT").length;
    const stockRisk = rows.filter((row) => ["CRITICAL", "HIGH"].includes(viewField(row, "stockRisk"))).length;
    const accelerating = rows.filter((row) => viewField(row, "salesTrend") === "ACCELERATING").length;
    const newStyles = rows.filter((row) => viewField(row, "salesTrend") === "NEW").length;
    const kpis = [
      ["전체 STYLE", `${rows.length.toLocaleString("ko-KR")} style`, "WA 전체 상품"],
      ["즉시 점검 후보", `${urgent.toLocaleString("ko-KR")} style`, "Preview URGENT"],
      ["재고 위험 STYLE", `${stockRisk.toLocaleString("ko-KR")} style`, "CRITICAL / HIGH"],
      ["ACCELERATING STYLE", `${accelerating.toLocaleString("ko-KR")} style`, "완료주 기준 상승"],
      ["NEW STYLE", `${newStyles.toLocaleString("ko-KR")} style`, "4주 이력 부족"]
    ];
    $("kpiGrid").innerHTML = kpis
      .map(([label, value, sub]) => `<article class="metric p-5"><p class="text-xs font-black uppercase text-slate">${label}</p><p class="mt-4 text-3xl font-black text-ink">${value}</p><p class="mt-3 text-sm font-bold text-slate">${sub}</p></article>`)
      .join("");
  }

  function renderReviewProgress() {
    const completedValues = new Set(["ACTIVE", "CARRYOVER", "HOLD", "CLOSED"]);
    const reviewRows = state.rows.filter((row) => row.reorderEligibility !== "SPECIAL");
    const completed = reviewRows.filter((row) => completedValues.has(row.reorderEligibility)).length;
    const total = reviewRows.length;
    const percent = total ? (completed / total) * 100 : 0;
    const unsetQueue = state.rows.filter((row) => row.reorderEligibility === "UNSET").length;
    $("reviewProgress").textContent = `${completed.toLocaleString("ko-KR")} / ${total.toLocaleString("ko-KR")} STYLE · ${percent.toFixed(1)}%`;
    $("reviewQueueSummary").textContent = `미검토 후보 ${unsetQueue.toLocaleString("ko-KR")} STYLE`;
  }

  function renderRows() {
    $("tableSummary").textContent = `${state.filtered.length.toLocaleString("ko-KR")} STYLE 표시`;
    $("styleRows").innerHTML = state.filtered
      .map((row) => {
        const previewClass = classifyPreview(row);
        const forecastSignal = row.forecastSignal || row.forecastV1?.forecastSignal || "INSUFFICIENT";
        const eligibilityCell = READ_ONLY
          ? `<span class="rounded-md border border-line bg-paper px-2 py-1 text-xs font-black text-ink">${ELIGIBILITY_LABELS[row.reorderEligibility] || row.reorderEligibility || "UNSET"}</span>`
          : `<select class="eligibility-select rounded-md border border-line bg-paper px-2 py-1 text-xs font-black text-ink" data-sku="${row.sku}">
              ${ELIGIBILITY_VALUES.map((value) => `<option value="${value}" ${row.reorderEligibility === value ? "selected" : ""}>${ELIGIBILITY_LABELS[value]}</option>`).join("")}
            </select>`;
        return `<tr class="cursor-pointer hover:bg-paper" data-sku="${row.sku}">
          <td class="whitespace-nowrap px-3 py-3"><span class="rounded px-2 py-1 text-xs font-black ${previewClass === "URGENT" ? "risk-critical" : previewClass === "CHECK" ? "risk-high" : previewClass === "WATCH" ? "risk-medium" : "risk-unknown"}">${previewClass}</span></td>
          <td class="whitespace-nowrap px-3 py-3 font-mono text-xs font-black text-ink">${row.sku}</td>
          <td class="min-w-[280px] px-3 py-3 font-semibold text-ink">${row.name || "-"}${state.skuByStyle[row.sku]?.skus?.length ? `<span class="ml-2 inline-block rounded border border-line bg-paper px-1.5 py-0.5 text-[10px] font-black text-slate">SKU ${state.skuByStyle[row.sku].skus.length} COLORS</span>` : ""}${row.hasOverseasSales ? `<span class="ml-2 inline-block rounded border border-line bg-[rgba(57,91,115,.14)] px-1.5 py-0.5 text-[10px] font-black text-blue" title="해외 사입 채널 누계 ${num(row.overseasCumQty)}개 (${num(row.overseasCumSalesSharePct, 1)}%) 포함">해외판매 ${num(row.overseasCumSalesSharePct, 1)}%</span>` : ""}</td>
          <td class="whitespace-nowrap px-3 py-3 font-bold">${row.season || "-"}</td>
          <td class="whitespace-nowrap px-3 py-3 font-bold">${row.category || "-"}</td>
          <td class="whitespace-nowrap px-3 py-3 text-right font-bold">${num(viewField(row, "sellThrough"), 1)}%</td>
          <td class="whitespace-nowrap px-3 py-3 text-right font-bold">${num(viewField(row, "lastCompleteWeekQty"))}</td>
          <td class="whitespace-nowrap px-3 py-3 text-right">${num(viewField(row, "previousCompleteWeekQty"))}</td>
          <td class="whitespace-nowrap px-3 py-3 text-right font-bold ${Number(viewField(row, "completedWeekWow") || 0) >= 0 ? "text-green" : "text-red"}">${pct(viewField(row, "completedWeekWow"))}</td>
          <td class="whitespace-nowrap px-3 py-3 text-right font-bold">${num(viewField(row, "weighted4CompletedWeekQty"), 1)}</td>
          <td class="whitespace-nowrap px-3 py-3 text-right">${num(viewField(row, "currentWtdQty"))}</td>
          <td class="whitespace-nowrap px-3 py-3 text-right">${num(row.stock)}</td>
          <td class="whitespace-nowrap px-3 py-3 text-right font-bold">${num(viewField(row, "stockCoverWeeks"), 1)}</td>
          <td class="whitespace-nowrap px-3 py-3"><span class="rounded px-2 py-1 text-xs font-black ${trendClass[viewField(row, "salesTrend")] || trendClass.NEW}">${viewField(row, "salesTrend") || "NEW"}</span></td>
          <td class="whitespace-nowrap px-3 py-3"><span class="rounded px-2 py-1 text-xs font-black ${riskClass[viewField(row, "stockRisk")] || riskClass.UNKNOWN}">${viewField(row, "stockRisk") || "UNKNOWN"}</span></td>
          <td class="whitespace-nowrap px-3 py-3 text-right font-black text-ink">${forecastPct(row.forecastSellThrough)}</td>
          <td class="whitespace-nowrap px-3 py-3"><span class="rounded px-2 py-1 text-xs font-black ${forecastClass[forecastSignal] || forecastClass.INSUFFICIENT}">${forecastSignal}</span></td>
          <td class="whitespace-nowrap px-3 py-3">${eligibilityCell}</td>
          <td class="whitespace-nowrap px-3 py-3 text-right text-base font-black text-ink">${num(viewField(row, "previewScore"))}</td>
        </tr>`;
      })
      .join("");
    if (window.lucide) window.lucide.createIcons();
  }

  function syncGroupToggle() {
    const value = $("productGroupFilter").value;
    document.querySelectorAll(".group-toggle").forEach((item) => {
      const active = item.dataset.group === value;
      item.classList.toggle("bg-ink", active);
      item.classList.toggle("text-white", active);
      item.classList.toggle("text-ink", !active);
    });
  }

  function syncSegmentToggle() {
    const product = $("productGroupFilter").value;
    const gender = $("genderGroupFilter").value;
    document.querySelectorAll(".segment-toggle").forEach((item) => {
      const active = item.dataset.product === product && item.dataset.gender === gender;
      item.classList.toggle("bg-ink", active);
      item.classList.toggle("text-white", active);
      item.classList.toggle("text-ink", !active);
    });
  }

  function syncSalesViewToggle() {
    document.querySelectorAll(".sales-view-toggle").forEach((item) => {
      const active = item.dataset.view === state.salesView;
      item.classList.toggle("bg-ink", active);
      item.classList.toggle("text-white", active);
      item.classList.toggle("text-ink", !active);
    });
  }

  function renderAll() {
    filterRows();
    syncGroupToggle();
    syncSegmentToggle();
    syncSalesViewToggle();
    renderKpis();
    renderReviewProgress();
    renderRows();
  }

  function applyReadOnlyMode() {
    if (!READ_ONLY) return;
    $("readOnlyBadge")?.classList.remove("hidden");
    document.querySelectorAll(".edit-only").forEach((item) => {
      item.classList.add("hidden");
      item.style.display = "none";
    });
    document.querySelectorAll(".edit-control").forEach((item) => {
      item.disabled = true;
      item.classList.add("hidden");
      item.style.display = "none";
    });
    $("drawerReadOnlyDecision")?.classList.remove("hidden");
  }

  function detailMetric(label, value, sub = "") {
    return `<div class="rounded-md border border-line bg-paper p-3"><p class="text-xs font-black text-slate">${label}</p><p class="mt-2 text-xl font-black text-ink">${value}</p>${sub ? `<p class="mt-1 text-xs font-bold text-slate">${sub}</p>` : ""}</div>`;
  }

  function renderForecastDetails(row) {
    const forecast = row.forecastV1 || {};
    const signal = forecast.forecastSignal || "INSUFFICIENT";
    if (!forecast.eligible || signal === "INSUFFICIENT") {
      return `<div class="rounded-md border border-line bg-paper p-3"><div class="flex items-center justify-between gap-3"><span class="text-xs font-black text-slate">Forecast Signal</span><span class="rounded px-2 py-1 text-xs font-black ${forecastClass.INSUFFICIENT}">INSUFFICIENT</span></div><p class="mt-2 text-sm font-bold text-slate">${escapeHtml(forecast.reason || "계산 근거 부족")}</p></div>`;
    }
    const analogs = (forecast.analogStyles || []).slice(0, 5)
      .map((analog) => `<li class="flex items-start justify-between gap-3"><span><b class="font-mono text-xs text-ink">${escapeHtml(analog.styleCode || analog.sku)}</b><span class="ml-2 text-slate">${escapeHtml(analog.name || "-")}</span></span><b class="whitespace-nowrap text-xs text-ink">${num(analog.similarityScore, 2)}</b></li>`)
      .join("");
    return `
      <div class="flex items-center justify-between gap-3 rounded-md border border-line bg-paper px-3 py-3">
        <div><p class="text-xs font-black text-slate">현재 위험</p><p class="mt-1 text-sm font-black text-ink">Stock Risk: ${escapeHtml(row.stockRisk || "UNKNOWN")}</p></div>
        <div class="text-right"><p class="text-xs font-black text-slate">미래 위험</p><span class="mt-1 inline-block rounded px-2 py-1 text-xs font-black ${forecastClass[signal] || forecastClass.INSUFFICIENT}">Forecast: ${signal}</span></div>
      </div>
      <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
        ${detailMetric("Selling Week", `W${num(forecast.sellingWeekNumber)}`, forecast.firstPositiveSalesPeriod || "-")}
        ${detailMetric("Analog 대비 속도", `${num(forecast.analogPaceRatio, 2)}x`, `누적비중 ${forecastPct(forecast.analogCumulativeShare)}`)}
        ${detailMetric("Base FCST", `${num(forecast.baseForecastQty)} pcs`)}
        ${detailMetric("Trend Factor", forecast.trendFactor == null ? "미적용" : `${num(forecast.trendFactor, 2)}x`, `α ${num(forecast.trendAlpha, 2)}`)}
        ${detailMetric("Adjusted FCST", `${num(forecast.adjustedForecastQty)} pcs`)}
        ${detailMetric("FCST 판매율", forecastPct(forecast.forecastSellThrough), forecast.forecastConfidence || "INSUFFICIENT")}
      </div>
      <div class="mt-3 rounded-md border border-line px-3 py-3">
        <div class="flex items-center justify-between"><p class="text-xs font-black text-slate">Analog STYLE</p><p class="text-xs font-black text-ink">${num(forecast.analogStyleCount)}개</p></div>
        <ul class="mt-2 space-y-2 text-xs font-semibold">${analogs || "<li class=\"text-slate\">-</li>"}</ul>
      </div>
      <details class="mt-3 rounded-md border border-line bg-paper px-3 py-3 text-xs font-bold text-slate">
        <summary class="cursor-pointer text-xs font-black text-ink">계산식 보기 (이 숫자가 어떻게 나왔는지)</summary>
        <ol class="mt-2 list-decimal space-y-2 pl-4">
          <li><b class="text-ink">Base FCST</b> = 현재 누적판매(${num(forecast.currentCumulativeSales)}개) ÷ Analog 평균 누적비중(${forecastPct(forecast.analogCumulativeShare)}) = <b class="text-ink">${num(forecast.baseForecastQty)}개</b><br>같은 카테고리·비슷한 성별/출시시기/가격의 상위 ${num(forecast.analogStyleCount)}개 유사 STYLE이, 같은 판매 W${num(forecast.sellingWeekNumber)}주차 시점에 최종 누적판매의 평균 몇 %를 차지했는지로 역산합니다.</li>
          <li><b class="text-ink">Trend Factor</b> = 최근 2주 평균 ÷ 최근 4주 평균 = ${forecast.trendFactor == null ? "미적용 (완료 판매 4주 미만)" : `${num(forecast.trendFactor, 2)}x`}<br>최근 판매가 가속(1보다 큼)/둔화(1보다 작음) 중인지를 반영하는 배수이며, 과도한 왜곡을 막기 위해 상한이 걸려 있습니다.</li>
          <li><b class="text-ink">Adjusted FCST</b> = 현재 누적판매 + (Base FCST − 현재 누적판매) × Trend Factor<sup>α</sup> = <b class="text-ink">${num(forecast.adjustedForecastQty)}개</b><br>α(alpha=${num(forecast.trendAlpha, 2)})는 판매 주차가 쌓일수록(W${num(forecast.sellingWeekNumber)}주차 기준) Trend Factor를 더 강하게 반영하도록 커지는 가중치입니다.</li>
          <li><b class="text-ink">FCST 판매율</b> = Adjusted FCST ÷ 입고수량 = <b class="text-ink">${forecastPct(forecast.forecastSellThrough)}</b>, 신뢰도 <b class="text-ink">${forecast.forecastConfidence || "INSUFFICIENT"}</b> (분석 대상 STYLE 수·카테고리 표본 크기에 따라 자동으로 낮아질 수 있음)</li>
        </ol>
        <p class="mt-3 border-t border-line pt-2 text-[11px] text-slate">※ FCST는 ERP 누적판매/입고수량 기준(전체 채널, 해외 사입 포함)으로 계산되며, 위쪽 "판매 기준: 전체/국내만" 토글의 영향을 받지 않습니다.</p>
      </details>`;
  }

  function renderSkuDetails(styleCode) {
    const style = state.skuByStyle[styleCode];
    const rows = Array.isArray(style?.skus) ? [...style.skus] : [];
    const status = $("drawerSkuStatus");
    const wrap = $("drawerSkuTableWrap");
    $("drawerSkuSource").textContent = state.skuMeta.sourceAsOf
      ? `ERP ${state.skuMeta.sourceAsOf} · ${rows.length} COLORS`
      : "ERP SKU source 미연결";
    if (!rows.length) {
      status.classList.remove("hidden");
      wrap.classList.add("hidden");
      $("drawerSkuRows").innerHTML = "";
      return;
    }
    status.classList.add("hidden");
    wrap.classList.remove("hidden");
    const sortKey = state.skuSortKey;
    rows.sort((a, b) => {
      const av = a[sortKey] == null ? Number.NEGATIVE_INFINITY : Number(a[sortKey]);
      const bv = b[sortKey] == null ? Number.NEGATIVE_INFINITY : Number(b[sortKey]);
      return bv - av || String(a.colorCode).localeCompare(String(b.colorCode));
    });
    $("drawerSkuRows").innerHTML = rows.map((sku) => `
      <tr>
        <td class="whitespace-nowrap px-2 py-2 font-mono font-black text-ink">${escapeHtml(sku.colorCode)}</td>
        <td class="whitespace-nowrap px-2 py-2 text-right">${num(sku.orderQty)}</td>
        <td class="whitespace-nowrap px-2 py-2 text-right">${num(sku.inboundQty)}</td>
        <td class="whitespace-nowrap px-2 py-2 text-right font-black">${num(sku.cumulativeSalesQty)}</td>
        <td class="whitespace-nowrap px-2 py-2 text-right font-black">${sku.inboundSellThrough == null ? "-" : `${num(sku.inboundSellThrough, 1)}%`}</td>
        <td class="whitespace-nowrap px-2 py-2 text-right">${num(sku.erpStockQty)}</td>
        <td class="whitespace-nowrap px-2 py-2 text-right">${num(sku.lastCompleteWeekQty)}</td>
        <td class="whitespace-nowrap px-2 py-2 text-right">${num(sku.previousCompleteWeekQty)}</td>
        <td class="whitespace-nowrap px-2 py-2 text-right ${Number(sku.completedWeekWow || 0) >= 0 ? "text-green" : "text-red"}">${pct(sku.completedWeekWow)}</td>
        <td class="whitespace-nowrap px-2 py-2 text-right">${num(sku.weighted4CompletedWeekQty, 1)}</td>
        <td class="whitespace-nowrap px-2 py-2 text-right">${sku.stockCoverWeeks == null ? "-" : num(sku.stockCoverWeeks, 1)}</td>
        <td class="whitespace-nowrap px-2 py-2"><span class="rounded px-1.5 py-1 font-black ${trendClass[sku.salesTrend] || trendClass.NEW}">${escapeHtml(sku.salesTrend || "NEW")}</span></td>
        <td class="whitespace-nowrap px-2 py-2 text-right">${num(sku.currentWtdQty)}</td>
      </tr>`).join("");
  }

  function openDrawer(row) {
    $("drawerSku").textContent = row.sku || "-";
    $("drawerName").textContent = row.name || "-";
    $("drawerMeta").textContent = `${row.season || "-"} · ${row.category || "-"} · ${row.productGroup || "UNMAPPED"} · ${row.genderGroup || "UNMAPPED"} · ${classifyPreview(row)}`;
    state.activeSku = row.sku || "";
    $("drawerEligibility").value = row.reorderEligibility || "UNSET";
    $("drawerMemo").value = row.eligibilityMemo || "";
    if (READ_ONLY) {
      $("drawerReadOnlyDecision").innerHTML = [
        `<div><span class="text-xs font-black text-slate">Eligibility</span><p class="mt-1">${escapeHtml(ELIGIBILITY_LABELS[row.reorderEligibility] || row.reorderEligibility || "UNSET")}</p></div>`,
        row.eligibilityMemo ? `<div class="mt-3"><span class="text-xs font-black text-slate">Memo</span><p class="mt-1 whitespace-pre-wrap">${escapeHtml(row.eligibilityMemo)}</p></div>` : ""
      ].join("");
    }
    $("drawerWtd").textContent = `${row.currentWtdPeriod || "WTD"} ${num(viewField(row, "currentWtdQty"))} pcs${state.salesView === "domestic" ? " (국내만)" : ""}`;
    renderSkuDetails(row.sku);
    $("drawerForecast").innerHTML = renderForecastDetails(row);
    $("drawerKpis").innerHTML = [
      detailMetric("판매율", `${num(viewField(row, "sellThrough"), 1)}%`),
      detailMetric("Preview Score", num(viewField(row, "previewScore")), viewField(row, "stockRisk") || "UNKNOWN"),
      detailMetric("4주 가중 판매속도", num(viewField(row, "weighted4CompletedWeekQty"), 1)),
      detailMetric("가용재고", num(row.stock)),
      detailMetric("재고커버", `${num(viewField(row, "stockCoverWeeks"), 1)}주`),
      detailMetric("완료주 WoW", pct(viewField(row, "completedWeekWow")), `${num(viewField(row, "previousCompleteWeekQty"))} → ${num(viewField(row, "lastCompleteWeekQty"))}`)
    ].join("");
    $("drawerSignals").innerHTML = [
      `판매 기준: ${state.salesView === "domestic" ? "국내만 (해외 사입 제외)" : "전체 (해외 포함)"}`,
      `판매추이: ${viewField(row, "salesTrend") || "NEW"}`,
      `Stock Risk: ${viewField(row, "stockRisk") || "UNKNOWN"}`,
      `Forecast Signal: ${row.forecastSignal || "INSUFFICIENT"}`,
      `현재 WTD 판매수량: ${num(viewField(row, "currentWtdQty"))} pcs`,
      (() => {
        const fullHistory = Array.isArray(viewField(row, "fullWeeklyHistory")) ? viewField(row, "fullWeeklyHistory") : [];
        return fullHistory.length
          ? `전체 판매추이: ${fullHistory[0].period} ~ ${fullHistory.at(-1).period} (${fullHistory.length}주, 판매 시작 시점부터)`
          : "전체 판매추이: 판매 이력 없음";
      })(),
      row.isSpecialMarket ? "특수시장 상품" : "국내 상품",
      row.hasOverseasSales
        ? `해외 판매 포함(전체 누계 기준): 누계 ${num(row.overseasCumQty)}개 (${num(row.overseasCumSalesSharePct, 1)}%)${state.salesView === "all" ? " · 위 판매율/재고커버/Preview Score는 해외 판매 포함 수치입니다 (상단 '판매 기준' 토글로 국내만 볼 수 있어요)" : ""}`
        : (row.overseasCumQtyAvailable ? "해외 판매 없음 (영업기획 채널 기준)" : "해외 판매 데이터 없음")
    ].map((text) => `<li>${text}</li>`).join("");

    // 전체 판매추이 (owner-requested 2026-09-14): 4주 창이 아니라 판매 시작 시점부터 전체 완료주
    // 이력을 보여줍니다. fullWeeklyHistory가 없는(재동기화 전) 데이터는 completedWeeklyHistory(4주)로
    // 자동 대체됩니다. 어느 쪽이든 "판매 기준"(전체/국내만) 토글이 반영된 값을 그대로 씁니다.
    const rawHistory = viewField(row, "fullWeeklyHistory");
    const history = Array.isArray(rawHistory) && rawHistory.length
      ? rawHistory
      : (Array.isArray(viewField(row, "completedWeeklyHistory")) ? viewField(row, "completedWeeklyHistory") : []);
    const isFullHistory = Array.isArray(rawHistory) && rawHistory.length > 0;
    const basisLabel = state.salesView === "domestic" ? "국내만(해외 제외)" : "전체(해외 포함)";
    $("drawerHistoryTitle").textContent = history.length
      ? `판매추이 · ${basisLabel} · ${history[0].period}~${history.at(-1).period}${isFullHistory ? " (판매 시작부터)" : " (최근 4주만 · 재동기화 필요)"}`
      : `판매추이 · ${basisLabel} · 이력 없음`;
    const canvas = $("historyChart");
    if (state.chart) state.chart.destroy();
    state.chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: history.map((item) => item.period),
        datasets: [{ label: state.salesView === "domestic" ? "판매수량(국내만)" : "판매수량(전체)", data: history.map((item) => Number(item.quantity || 0)), backgroundColor: "#2E6B5A", borderRadius: 5 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: "top", labels: { boxWidth: 12, font: { weight: "bold" } } } },
        scales: { y: { beginAtZero: true }, x: { grid: { display: false }, ticks: { maxRotation: 90, minRotation: 0 } } }
      }
    });
    document.body.classList.add("drawer-open");
  }

  function closeDrawer() {
    document.body.classList.remove("drawer-open");
  }

  function setQuickFilter(name) {
    state.quick = {};
    if (name === "urgent") $("previewFilter").value = "URGENT";
    if (name === "cover2") {
      state.quick.maxCoverWeeks = PREVIEW_CONFIG.shortCoverWeeks;
      state.sortKey = "stockCoverWeeks";
      state.sortDir = "asc";
    }
    if (name === "rising") $("trendFilter").value = "ACCELERATING";
    if (name === "sell70") {
      state.quick.minSellThrough = PREVIEW_CONFIG.highSellThrough;
      state.sortKey = "sellThrough";
      state.sortDir = "desc";
    }
    if (name === "new") $("trendFilter").value = "NEW";
    if (name === "unset") {
      $("eligibilityFilter").value = "UNSET";
      state.sortKey = "previewScore";
      state.sortDir = "desc";
    }
    if (name === "domestic") $("specialMarketFilter").value = "domestic";
    if (name === "excludeOverseasSales") $("overseasSalesFilter").value = "domesticOnly";
    if (name === "forecastHigh") {
      $("forecastFilter").value = "HIGH";
      state.sortKey = "forecastSellThrough";
      state.sortDir = "desc";
    }
    if (name === "currentLowFutureHigh") {
      $("forecastFilter").value = "HIGH";
      state.quick.currentLowFutureHigh = true;
      state.sortKey = "forecastSellThrough";
      state.sortDir = "desc";
    }
    renderAll();
  }

  function bindEvents() {
    ["searchFilter", "productGroupFilter", "genderGroupFilter", "seasonFilter", "categoryFilter", "trendFilter", "riskFilter", "previewFilter", "forecastFilter", "eligibilityFilter", "specialMarketFilter", "overseasSalesFilter"].forEach((id) => {
      $(id).addEventListener(id === "searchFilter" ? "input" : "change", renderAll);
    });
    document.querySelectorAll(".group-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        $("productGroupFilter").value = button.dataset.group;
        document.querySelectorAll(".group-toggle").forEach((item) => {
          const active = item.dataset.group === button.dataset.group;
          item.classList.toggle("bg-ink", active);
          item.classList.toggle("text-white", active);
          item.classList.toggle("text-ink", !active);
        });
        renderAll();
      });
    });
    document.querySelectorAll(".sales-view-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        state.salesView = button.dataset.view === "domestic" ? "domestic" : "all";
        renderAll();
        if (state.activeSku) {
          const activeRow = state.rows.find((row) => row.sku === state.activeSku);
          if (activeRow) openDrawer(activeRow);
        }
      });
    });
    document.querySelectorAll(".segment-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        $("productGroupFilter").value = button.dataset.product;
        $("genderGroupFilter").value = button.dataset.gender;
        renderAll();
      });
    });
    document.querySelectorAll("[data-sort]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextKey = button.dataset.sort;
        if (state.sortKey === nextKey) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = nextKey;
          state.sortDir = nextKey === "stockCoverWeeks" ? "asc" : "desc";
        }
        renderAll();
      });
    });
    document.querySelectorAll(".quick").forEach((button) => button.addEventListener("click", () => setQuickFilter(button.dataset.quick)));
    if (!READ_ONLY) {
      $("exportOverrides").addEventListener("click", exportOverrides);
      $("importOverrides").addEventListener("change", (event) => {
        importOverrides(event.target.files?.[0]);
        event.target.value = "";
      });
      $("clearOverrides").addEventListener("click", clearLocalOverrides);
    }
    $("resetFilters").addEventListener("click", () => {
      ["searchFilter", "productGroupFilter", "genderGroupFilter", "seasonFilter", "categoryFilter", "trendFilter", "riskFilter", "previewFilter", "forecastFilter", "eligibilityFilter", "specialMarketFilter", "overseasSalesFilter"].forEach((id) => {
        $(id).value = id === "searchFilter" ? "" : "all";
      });
      document.querySelectorAll(".group-toggle").forEach((item) => {
        const active = item.dataset.group === "all";
        item.classList.toggle("bg-ink", active);
        item.classList.toggle("text-white", active);
        item.classList.toggle("text-ink", !active);
      });
      state.salesView = "all";
      document.querySelectorAll(".sales-view-toggle").forEach((item) => {
        const active = item.dataset.view === "all";
        item.classList.toggle("bg-ink", active);
        item.classList.toggle("text-white", active);
        item.classList.toggle("text-ink", !active);
      });
      state.sortKey = "previewScore";
      state.sortDir = "desc";
      state.quick = {};
      renderAll();
    });
    $("styleRows").addEventListener("click", (event) => {
      if (event.target.closest(".eligibility-select")) return;
      const rowEl = event.target.closest("tr[data-sku]");
      if (!rowEl) return;
      const row = state.rows.find((item) => item.sku === rowEl.dataset.sku);
      if (row) openDrawer(row);
    });
    if (!READ_ONLY) {
      $("styleRows").addEventListener("change", (event) => {
        if (!event.target.classList.contains("eligibility-select")) return;
        event.stopPropagation();
        updateOverride(event.target.dataset.sku, { reorderEligibility: event.target.value });
        renderAll();
      });
      $("drawerEligibility").addEventListener("change", () => {
        if (!state.activeSku) return;
        updateOverride(state.activeSku, { reorderEligibility: $("drawerEligibility").value });
        renderAll();
      });
      $("drawerMemo").addEventListener("change", () => {
        if (!state.activeSku) return;
        updateOverride(state.activeSku, { memo: $("drawerMemo").value.trim() });
        renderAll();
      });
    }
    $("drawerClose").addEventListener("click", closeDrawer);
    $("drawerBackdrop").addEventListener("click", closeDrawer);
    $("drawerSkuSort").addEventListener("change", () => {
      state.skuSortKey = $("drawerSkuSort").value;
      if (state.activeSku) renderSkuDetails(state.activeSku);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDrawer();
    });
  }

  async function init() {
    try {
      const [result, fileOverrides, skuData] = await Promise.all([DataService.load(), loadFileOverrides(), loadSkuData()]);
      state.fileOverrides = fileOverrides;
      state.skuByStyle = skuData.styles || {};
      state.skuMeta = skuData.meta || {};
      state.localOverrides = loadLocalOverrides();
      state.rows = (result.raw.styles || []).map((row) => applyOverrides({ ...row, previewClass: classifyPreview(row) }));
      renderMeta(result.raw, result.source);
      initFilters();
      bindEvents();
      applyReadOnlyMode();
      renderAll();
    } catch (error) {
      console.error("[reorder-monitor] failed to load latest.json", error);
      $("loadStatus").textContent = "데이터 로딩 실패";
      $("tableSummary").textContent = "public/data/latest.json을 확인하세요.";
    }
  }

  init();
})(window.WackyDataService);
