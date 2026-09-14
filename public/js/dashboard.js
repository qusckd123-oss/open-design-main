// View layer: DOM rendering + filter/sort/search state. Data acquisition and KPI/action
// calculations live in js/data/* so this file only turns already-computed rows into markup.
(function (DataService, Metrics) {
  const state = { raw: DataService.FALLBACK_DATA, charts: {}, activeTab: "reorder", source: "empty" };
  const colors = ["#1E2A2E", "#2E6B5A", "#C79132", "#B94735", "#395B73", "#7E8E92", "#8B6F47", "#587B70"];
  const actionLabels = ["리오더 검토", "배분/RT 검토", "프로모션 검토"];
  const genderLabels = { UNISEX: "유니", WOMEN: "우먼" };

  const STATUS_LABELS = {
    remote: "REMOTE 연결",
    local: "LOCAL 데이터 연결",
    "local-fallback": "REMOTE 연결 실패 · LOCAL 데이터 표시 중",
    empty: "데이터 연결 실패 · 표시할 데이터 없음"
  };

  async function loadDashboardData() {
    const result = await DataService.load();
    state.raw = result.raw;
    state.source = result.source;
    if (result.error) {
      console.warn("[wacky-dashboard] remote data source failed, using fallback", result.error);
    }
    const statusEl = document.getElementById("dataStatus");
    statusEl.textContent = STATUS_LABELS[result.source] || "데이터 로딩 중";
    statusEl.classList.toggle("badge-red", result.source === "empty" || result.source === "local-fallback");

    initializeFilters();
    renderAll();
    if (window.lucide) window.lucide.createIcons();
  }

  function initializeFilters() {
    const allStyles = state.raw.styles || [];
    const seasons = Array.from(new Set(allStyles.map((row) => row.season).filter(Boolean))).sort();
    const categories = Array.from(new Set(allStyles.map((row) => row.category).filter(Boolean))).sort();
    const genders = Array.from(new Set(allStyles.map((row) => row.gender).filter(Boolean))).sort();

    document.getElementById("seasonFilter").innerHTML = ["all", ...seasons]
      .map((season) => `<option value="${season}">${season === "all" ? "전체" : season}</option>`)
      .join("");
    document.getElementById("categoryFilter").innerHTML = ["all", ...categories]
      .map((category) => {
        const sample = allStyles.find((row) => row.category === category);
        const label = category === "all" ? "전체" : `${category} ${sample?.categoryName || ""}`.trim();
        return `<option value="${category}">${label}</option>`;
      })
      .join("");
    document.getElementById("genderFilter").innerHTML = ["all", ...genders]
      .map((gender) => `<option value="${gender}">${gender === "all" ? "전체" : genderLabels[gender] || gender}</option>`)
      .join("");
  }

  function getFilters() {
    return {
      season: document.getElementById("seasonFilter").value,
      action: document.getElementById("actionFilter").value,
      category: document.getElementById("categoryFilter").value,
      gender: document.getElementById("genderFilter").value,
      specialMarket: document.getElementById("specialMarketFilter")?.value || "all",
      sort: document.getElementById("sortFilter").value,
      search: (document.getElementById("searchFilter")?.value || "").trim().toLowerCase()
    };
  }

  function categories() {
    return Metrics.computeCategories(styles(false));
  }

  function styles(includeAction = true) {
    const f = getFilters();
    const rows = (state.raw.styles || []).filter(
      (row) =>
        (f.season === "all" || !row.season || row.season === f.season) &&
        (!includeAction || f.action === "all" || row.action === f.action) &&
        (f.category === "all" || row.category === f.category) &&
        (f.gender === "all" || row.gender === f.gender) &&
        (f.specialMarket === "all" || (f.specialMarket === "special" ? row.isSpecialMarket : !row.isSpecialMarket)) &&
        (!f.search || row.sku.toLowerCase().includes(f.search) || (row.name || "").toLowerCase().includes(f.search))
    );
    const priorityRank = { P1: 1, P2: 2, P3: 3 };
    return rows.slice().sort((a, b) => {
      if (f.sort === "sales") return Number(b.sales || 0) - Number(a.sales || 0);
      if (f.sort === "sellThrough") return Number(b.sellThrough || 0) - Number(a.sellThrough || 0);
      if (f.sort === "stockRate") return Metrics.resolveStockRate(b) - Metrics.resolveStockRate(a);
      if (f.sort === "signalScore") return Number(b.previewScore ?? b.reorderSignalScore ?? 0) - Number(a.previewScore ?? a.reorderSignalScore ?? 0) || Number(a.stockCoverWeeks || 9999) - Number(b.stockCoverWeeks || 9999);
      if (f.sort === "qtyWow") return Number(b.completedWeekWow ?? b.qtyWow ?? 0) - Number(a.completedWeekWow ?? a.qtyWow ?? 0);
      if (f.sort === "stockCoverWeeks") return Number(a.stockCoverWeeks || 9999) - Number(b.stockCoverWeeks || 9999);
      if (f.sort === "wow") return Number(b.wow || 0) - Number(a.wow || 0);
      if (f.sort === "stock") return Number(b.stock || 0) - Number(a.stock || 0);
      return (priorityRank[a.priority] || 9) - (priorityRank[b.priority] || 9) || Number(b.sales || 0) - Number(a.sales || 0);
    });
  }

  function formatMoney(value) {
    return `${Number(value || 0).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}백만`;
  }
  function pct(value) {
    if (value == null) return "-";
    const number = Number(value || 0);
    return `${number > 0 ? "+" : ""}${number.toFixed(1)}%`;
  }

  function num(value, digits = 0) {
    if (value == null || Number.isNaN(Number(value))) return "-";
    return Number(value).toLocaleString("ko-KR", { maximumFractionDigits: digits });
  }

  function renderMeta() {
    const meta = state.raw.meta || {};
    document.getElementById("metaPeriod").textContent = `${meta.weekLabel || ""} ${meta.period || ""}`.trim();
    document.getElementById("metaSeason").textContent = meta.season || "-";
    document.getElementById("metaUnit").textContent = meta.amountUnit || "VAT- / 백만원";
    document.getElementById("metaUpdated").textContent = meta.updatedAt || "-";
  }

  function renderKpis() {
    const cat = categories();
    const st = styles();
    const kpi = Metrics.computeKpis(cat, st);
    const kpis = [
      { label: "금주 매출", value: formatMoney(kpi.totalSales), sub: `전주 대비 ${pct(kpi.wow)}`, tone: kpi.wow >= 0 ? "green" : "red" },
      { label: "평균 판매율", value: `${kpi.avgSellThrough.toFixed(1)}%`, sub: kpi.avgSellThrough >= 60 ? "리오더 후보 확대" : "재고 운용 우선", tone: kpi.avgSellThrough >= 60 ? "green" : "amber" },
      { label: "잔여재고율", value: `${kpi.avgStockRate.toFixed(1)}%`, sub: `${kpi.stock.toLocaleString("ko-KR")} pcs`, tone: kpi.avgStockRate >= 65 ? "red" : "amber" },
      { label: "리오더 후보", value: `${kpi.reorderCount} style`, sub: `30% 임박 ${kpi.near30Count} style`, tone: "green" },
      { label: "P1 우선순위", value: `${kpi.p1Count} style`, sub: "회의 즉시 점검", tone: kpi.p1Count ? "red" : "amber" }
    ];
    const toneClass = {
      green: "border-l-green bg-[rgba(46,107,90,.08)]",
      amber: "border-l-amber bg-[rgba(199,145,50,.12)]",
      red: "border-l-red bg-[rgba(185,71,53,.08)]"
    };
    document.getElementById("kpiGrid").innerHTML = kpis
      .map(
        (item) =>
          `<article class="metric border-l-4 ${toneClass[item.tone]} p-5"><p class="text-xs font-black uppercase text-slate">${item.label}</p><p class="mt-4 text-3xl font-black tracking-normal text-ink">${item.value}</p><p class="mt-3 text-sm font-bold text-slate">${item.sub}</p></article>`
      )
      .join("");
  }

  function upsertChart(key, id, config) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    if (state.charts[key]) state.charts[key].destroy();
    state.charts[key] = new Chart(canvas, config);
  }

  function renderCharts() {
    const cat = categories();
    const visibleStyles = styles();
    const topStyles = visibleStyles.slice().sort((a, b) => Number(b.sellThrough || 0) - Number(a.sellThrough || 0)).slice(0, 7);
    const stockStyles = visibleStyles
      .slice()
      .sort((a, b) => Metrics.resolveStockRate(b) - Metrics.resolveStockRate(a) || Number(b.stock || 0) - Number(a.stock || 0))
      .slice(0, 7);
    const launchStyles = visibleStyles
      .slice()
      .sort((a, b) => (Number(b.wow || 0) + Number(b.sellThrough || 0) / 2) - (Number(a.wow || 0) + Number(a.sellThrough || 0) / 2))
      .slice(0, 7);
    const common = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 10, boxHeight: 10, font: { family: "Pretendard" } } } } };

    upsertChart("sales", "salesChart", {
      type: "bar",
      data: {
        labels: cat.map((row) => `${row.category} ${row.categoryName || ""}`.trim()),
        datasets: [
          { label: "금주 매출", data: cat.map((row) => row.sales), backgroundColor: "#1E2A2E", borderRadius: 5 },
          { label: state.raw.meta.targetLabel || "전주 매출", data: cat.map((row) => row.target), backgroundColor: "#DDE4E6", borderRadius: 5 }
        ]
      },
      options: { ...common, plugins: { ...common.plugins, legend: { position: "bottom" } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
    });

    upsertChart("action", "actionChart", {
      type: "doughnut",
      data: {
        labels: actionLabels,
        datasets: [{ data: actionLabels.map((action) => visibleStyles.filter((row) => row.action === action).length), backgroundColor: ["#2E6B5A", "#C79132", "#B94735"], borderWidth: 0 }]
      },
      options: {
        ...common,
        cutout: "62%",
        plugins: { ...common.plugins, legend: { position: "bottom" } },
        onClick: (_event, elements) => {
          if (!elements.length) return;
          const label = actionLabels[elements[0].index];
          const actionFilter = document.getElementById("actionFilter");
          actionFilter.value = actionFilter.value === label ? "all" : label;
          renderAll();
        }
      }
    });

    upsertChart("style", "styleChart", {
      type: "bar",
      data: { labels: topStyles.map((row) => row.sku), datasets: [{ label: "판매율", data: topStyles.map((row) => row.sellThrough), backgroundColor: colors, borderRadius: 5 }] },
      options: { ...common, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { max: 100, ticks: { callback: (value) => `${value}%` } }, y: { grid: { display: false } } } }
    });

    upsertChart("stock", "stockChart", {
      type: "bar",
      data: { labels: stockStyles.map((row) => row.sku), datasets: [{ label: "잔여재고율", data: stockStyles.map((row) => Metrics.resolveStockRate(row)), backgroundColor: "#C79132", borderRadius: 5 }] },
      options: {
        ...common,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { afterLabel: (ctx) => `재고수량 ${Number(stockStyles[ctx.dataIndex]?.stock || 0).toLocaleString("ko-KR")} pcs` } }
        },
        scales: { x: { beginAtZero: true, max: 100, ticks: { callback: (value) => `${value}%` } }, y: { grid: { display: false } } },
        onClick: (_event, elements) => {
          if (!elements.length) return;
          const sku = stockStyles[elements[0].index]?.sku;
          if (!sku) return;
          const searchInput = document.getElementById("searchFilter");
          if (searchInput) {
            searchInput.value = sku;
            renderAll();
          }
        }
      }
    });

    upsertChart("launch", "launchChart", {
      type: "bar",
      data: {
        labels: launchStyles.map((row) => row.sku),
        datasets: [
          { label: "금주 매출", data: launchStyles.map((row) => row.sales), backgroundColor: "#395B73", borderRadius: 5 },
          { label: "판매율", data: launchStyles.map((row) => row.sellThrough), backgroundColor: "#DDE4E6", borderRadius: 5, yAxisID: "y1" }
        ]
      },
      options: {
        ...common,
        plugins: { ...common.plugins, legend: { position: "bottom" } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "매출(백만원)" } },
          y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, ticks: { callback: (value) => `${value}%` }, title: { display: true, text: "판매율" } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function renderTable() {
    const priorityClass = { P1: "badge-red", P2: "badge-amber", P3: "badge-green" };
    document.getElementById("actionRows").innerHTML = styles()
      .map(
        (row) =>
          `<tr class="hover:bg-paper"><td class="px-4 py-3"><span class="rounded px-2 py-1 text-xs font-black ${priorityClass[row.priority] || "badge-green"}">${row.priority || "-"}</span></td><td class="whitespace-nowrap px-4 py-3 font-mono text-xs font-black text-ink">${row.sku}</td><td class="min-w-[260px] px-4 py-3 font-semibold">${row.name}</td><td class="whitespace-nowrap px-4 py-3"><span class="inline-flex min-w-24 justify-center rounded-full border border-line bg-white px-3 py-1 text-xs font-black text-ink">${row.action}</span></td><td class="whitespace-nowrap px-4 py-3 font-bold text-ink">${row.season || "-"}</td><td class="whitespace-nowrap px-4 py-3 font-bold text-ink">${row.category}</td><td class="whitespace-nowrap px-4 py-3 font-bold text-slate">${genderLabels[row.gender] || row.gender || "-"}</td><td class="whitespace-nowrap px-4 py-3 text-right font-bold">${formatMoney(row.sales)}</td><td class="whitespace-nowrap px-4 py-3 text-right font-bold">${Number(row.sellThrough || 0).toFixed(1)}%</td><td class="whitespace-nowrap px-4 py-3 text-right font-bold">${Metrics.resolveStockRate(row).toFixed(1)}%</td><td class="whitespace-nowrap px-4 py-3"><span class="rounded bg-paper px-2 py-1 text-xs font-black text-slate">${row.reorderTiming || "-"}</span></td><td class="whitespace-nowrap px-4 py-3 text-right font-bold ${Number(row.wow || 0) >= 0 ? "text-green" : "text-red"}">${pct(row.wow)}</td><td class="whitespace-nowrap px-4 py-3 text-right">${Number(row.stock || 0).toLocaleString("ko-KR")}</td><td class="min-w-[360px] px-4 py-3 leading-6 text-slate">${row.note || ""}</td></tr>`
      )
      .join("");
  }

  function renderSignalTable() {
    const trendClass = {
      ACCELERATING: "badge-green",
      RISING: "badge-green",
      STABLE: "bg-paper text-slate",
      DECLINING: "badge-red",
      NEW: "badge-amber"
    };
    const riskClass = {
      CRITICAL: "badge-red",
      HIGH: "badge-amber",
      MEDIUM: "bg-paper text-slate",
      LOW: "bg-white text-slate",
      UNKNOWN: "bg-paper text-slate"
    };
    const rows = styles(false)
      .slice()
      .sort((a, b) => Number(b.previewScore ?? b.reorderSignalScore ?? 0) - Number(a.previewScore ?? a.reorderSignalScore ?? 0) || Number(a.stockCoverWeeks || 9999) - Number(b.stockCoverWeeks || 9999))
      .slice(0, 80);
    const target = document.getElementById("signalRows");
    if (!target) return;
    const head = target.closest("table")?.querySelector("thead");
    if (head) {
      head.innerHTML = `<tr><th class="px-4 py-3">품번</th><th class="px-4 py-3">상품명</th><th class="px-4 py-3">시즌</th><th class="px-4 py-3">복종</th><th class="px-4 py-3 text-right">판매율</th><th class="px-4 py-3 text-right">최근 완료주 판매수량</th><th class="px-4 py-3 text-right">직전 완료주 판매수량</th><th class="px-4 py-3 text-right">완료주 WoW</th><th class="px-4 py-3 text-right">4주 가중 판매속도</th><th class="px-4 py-3 text-right">현재 WTD 판매수량</th><th class="px-4 py-3 text-right">가용재고</th><th class="px-4 py-3 text-right">재고커버(주)</th><th class="px-4 py-3">판매추이</th><th class="px-4 py-3">재고부족 가능성</th><th class="px-4 py-3 text-right">Preview Score</th></tr>`;
    }
    target.innerHTML = rows
      .map(
        (row) =>
          `<tr class="hover:bg-paper"><td class="whitespace-nowrap px-4 py-3 font-mono text-xs font-black text-ink">${row.sku}</td><td class="min-w-[260px] px-4 py-3 font-semibold">${row.name}</td><td class="whitespace-nowrap px-4 py-3 font-bold text-ink">${row.season || "-"}</td><td class="whitespace-nowrap px-4 py-3 font-bold text-ink">${row.category}</td><td class="whitespace-nowrap px-4 py-3 text-right font-bold">${num(row.sellThrough, 1)}%</td><td class="whitespace-nowrap px-4 py-3 text-right font-bold">${num(row.lastCompleteWeekQty ?? row.currentWeekQty)}</td><td class="whitespace-nowrap px-4 py-3 text-right">${num(row.previousCompleteWeekQty ?? row.previousWeekQty)}</td><td class="whitespace-nowrap px-4 py-3 text-right font-bold ${Number(row.completedWeekWow ?? row.qtyWow ?? 0) >= 0 ? "text-green" : "text-red"}">${pct(row.completedWeekWow ?? row.qtyWow)}</td><td class="whitespace-nowrap px-4 py-3 text-right font-bold">${num(row.weighted4CompletedWeekQty ?? row.weighted4WeekQty, 1)}</td><td class="whitespace-nowrap px-4 py-3 text-right">${num(row.currentWtdQty)}</td><td class="whitespace-nowrap px-4 py-3 text-right">${num(row.stock)}</td><td class="whitespace-nowrap px-4 py-3 text-right font-bold">${num(row.stockCoverWeeks, 1)}</td><td class="whitespace-nowrap px-4 py-3"><span class="rounded px-2 py-1 text-xs font-black ${trendClass[row.salesTrend] || "bg-paper text-slate"}">${row.salesTrend || "-"}</span></td><td class="whitespace-nowrap px-4 py-3"><span class="rounded px-2 py-1 text-xs font-black ${riskClass[row.stockRisk] || "bg-paper text-slate"}">${row.stockRisk || "UNKNOWN"}</span></td><td class="whitespace-nowrap px-4 py-3 text-right font-black text-ink">${num(row.previewScore ?? row.reorderSignalScore)}</td></tr>`
      )
      .join("");
  }

  function renderPriorityList() {
    const rows = styles().filter((row) => row.priority === "P1").slice(0, 6);
    document.getElementById("priorityList").innerHTML = (rows.length ? rows : styles().slice(0, 4))
      .map(
        (row) =>
          `<div class="rounded-md border border-line bg-paper p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-mono text-xs font-black text-ink">${row.sku}</p><p class="mt-1 text-sm font-black text-ink">${row.name}</p></div><span class="rounded-full bg-white px-2 py-1 text-xs font-black text-slate">${row.action}</span></div><div class="mt-3 grid grid-cols-4 gap-2 text-xs text-slate"><span><b class="block text-ink">${formatMoney(row.sales)}</b>매출</span><span><b class="block text-ink">${Number(row.sellThrough || 0).toFixed(1)}%</b>판매율</span><span><b class="block text-ink">${Metrics.resolveStockRate(row).toFixed(1)}%</b>재고율</span><span><b class="block text-ink">${row.reorderTiming || "-"}</b>시점</span></div><p class="mt-3 text-xs font-bold text-slate">선정 이유 · ${Metrics.buildReasonLine(row)}</p></div>`
      )
      .join("");
  }

  function renderSummary() {
    const cat = categories();
    const st = styles();
    const bestCategory = cat.slice().sort((a, b) => Number(b.sales || 0) - Number(a.sales || 0))[0];
    const fastestCategory = cat.slice().sort((a, b) => Number(b.sellThrough || 0) - Number(a.sellThrough || 0))[0];
    const p1 = st.find((row) => row.priority === "P1") || st[0];
    const items = [
      { title: "핵심 결론", body: state.raw.summary?.headline || "요약 데이터가 없습니다." },
      { title: "매출 견인", body: bestCategory ? `${bestCategory.category}(${bestCategory.categoryName})가 ${formatMoney(bestCategory.sales)}로 금주 매출 기여가 가장 큽니다.` : "조회 조건에 맞는 복종 데이터가 없습니다." },
      { title: "판매 속도", body: fastestCategory ? `${fastestCategory.category}(${fastestCategory.categoryName}) 판매율이 ${Number(fastestCategory.sellThrough || 0).toFixed(1)}%로 가장 높습니다.` : "조회 조건에 맞는 복종 데이터가 없습니다." },
      { title: "우선 액션", body: p1 ? `${p1.sku}는 ${p1.action} 후보입니다. 판매율 ${Number(p1.sellThrough || 0).toFixed(1)}%, 잔여재고율 ${Metrics.resolveStockRate(p1).toFixed(1)}%, ${p1.reorderTiming || "시점 확인"}입니다. ${p1.note}` : "조회 조건에 맞는 품번 데이터가 없습니다." }
    ];
    document.getElementById("summaryList").innerHTML = items
      .map(
        (item, index) =>
          `<div class="rounded-md border border-line bg-paper p-4"><div class="mb-2 flex items-center gap-2"><span class="grid h-6 w-6 place-items-center rounded bg-ink text-xs font-black text-white">${index + 1}</span><b class="text-sm text-ink">${item.title}</b></div><p class="text-sm leading-6 text-slate">${item.body}</p></div>`
      )
      .join("");
    document.getElementById("shareMessage").textContent = state.raw.summary?.message || "";
  }

  function renderLaunchList() {
    const rows = styles()
      .slice()
      .sort((a, b) => (Number(b.wow || 0) + Number(b.sellThrough || 0) / 2) - (Number(a.wow || 0) + Number(a.sellThrough || 0) / 2))
      .slice(0, 6);
    document.getElementById("launchList").innerHTML = rows
      .map(
        (row) =>
          `<div class="rounded-md border border-line bg-paper p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-mono text-xs font-black text-ink">${row.sku}</p><p class="mt-1 text-sm font-black leading-5 text-ink">${row.name}</p></div><span class="rounded-full bg-white px-2 py-1 text-xs font-black ${Number(row.wow || 0) >= 0 ? "text-green" : "text-red"}">${pct(row.wow)}</span></div><p class="mt-3 text-sm leading-6 text-slate">금주 ${formatMoney(row.sales)}, 판매율 ${Number(row.sellThrough || 0).toFixed(1)}%. 초기 반응 판단에는 실제 출시일 또는 입고일 컬럼 추가가 필요합니다.</p></div>`
      )
      .join("");
  }

  function renderProducts() {
    const products = styles().slice(0, 4);
    document.getElementById("productCards").innerHTML = products
      .map((row) => {
        const productHref = row.productUrl || row.imageUrl || "#";
        const imageMarkup = row.imageUrl
          ? `<a href="${productHref}" target="_blank" rel="noopener noreferrer" class="block h-full w-full"><img src="${row.imageUrl}" alt="${row.imageSourceName || row.name}" loading="lazy" referrerpolicy="no-referrer" /></a>`
          : `<div class="text-center"><p class="font-mono text-lg font-black text-ink">${row.sku}</p><p class="mt-1 text-xs font-bold text-slate">${row.categoryName || row.category}</p></div>`;
        const sourceLabel = row.imageSource === "musinsa" ? "무신사" : "공식몰";
        const sourceMarkup = row.imageSourceName
          ? `<a href="${productHref}" target="_blank" rel="noopener noreferrer" class="mt-3 block truncate text-xs font-bold text-blue">${sourceLabel} · ${row.imageSourceName}</a>`
          : `<p class="mt-3 text-xs font-bold text-red">이미지 확인 필요</p>`;

        return `<article class="panel overflow-hidden"><div class="product-tile">${imageMarkup}</div><div class="p-4"><p class="font-mono text-xs font-black text-ink">${row.sku}</p><p class="mt-1 text-xs font-bold text-slate">Wacky Willy · ${row.season || "-"} · ${row.category} · ${genderLabels[row.gender] || row.gender || "-"}</p><h3 class="mt-1 min-h-[42px] text-sm font-black leading-5 text-ink">${row.name}</h3>${sourceMarkup}<div class="mt-3 flex items-center justify-between text-sm"><span class="font-black text-slate">판매율 ${Number(row.sellThrough || 0).toFixed(1)}%</span><span class="rounded-full bg-paper px-2 py-1 text-xs font-black text-slate">${row.action}</span></div></div></article>`;
      })
      .join("");
  }

  function setActiveTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll(".tab-button").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.tab === tab)));
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.panel !== tab));
    setTimeout(renderCharts, 0);
    if (window.lucide) window.lucide.createIcons();
  }

  function renderAll() {
    renderMeta();
    renderKpis();
    renderTable();
    renderSignalTable();
    renderPriorityList();
    renderSummary();
    renderLaunchList();
    renderProducts();
    setActiveTab(state.activeTab);
  }

  ["seasonFilter", "actionFilter", "categoryFilter", "genderFilter", "specialMarketFilter", "sortFilter"].forEach((id) =>
    document.getElementById(id).addEventListener("change", renderAll)
  );
  const searchInput = document.getElementById("searchFilter");
  if (searchInput) searchInput.addEventListener("input", renderAll);

  document.querySelectorAll("[data-sort-key]").forEach((header) => {
    header.addEventListener("click", () => {
      document.getElementById("sortFilter").value = header.dataset.sortKey;
      renderAll();
    });
  });

  document.querySelectorAll(".tab-button").forEach((button) => button.addEventListener("click", () => setActiveTab(button.dataset.tab)));
  document.getElementById("printButton").addEventListener("click", () => window.print());

  loadDashboardData();
})(window.WackyDataService, window.WackyMetrics);
