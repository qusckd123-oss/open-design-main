(() => {
  const state = { rows: [], filtered: [], sort: "sku", dir: 1 };
  const $ = (id) => document.getElementById(id);
  const labels = {
    UNDER_2_WEEKS: "2주 미만",
    "2_TO_4_WEEKS": "2~4주",
    OVER_4_WEEKS: "4주 초과",
    ZERO: "0주",
    UNKNOWN: "미확인",
    NO_INBOUND: "입고 없음",
    PARTIAL: "부분 입고",
    COMPLETE_OR_OVER: "완료/초과",
  };
  const nf = (v, digits = 0) => v == null || Number.isNaN(Number(v)) ? "-" : Number(v).toLocaleString("ko-KR", { maximumFractionDigits: digits });
  const pct = (v) => v == null ? "-" : `${nf(v, 1)}%`;
  const ageCover = (cover) => cover == null ? "미확인" : `${nf(cover, 1)}주`;

  function value(row, key) {
    const f = row.facts;
    if (key === "velocity") return f.completedVelocityQtyPerWeek;
    if (key === "sellingAgeVelocity") return f.sellingAgeVelocityQtyPerWeek;
    if (key === "stock") return f.erpStockQty;
    if (key === "inbound") return f.inboundCompletionPct;
    if (key === "remaining") return f.remainingOrderQty;
    if (key === "coverWeeks") return f.stockCoverWeeks;
    return row[key];
  }

  function renderMetrics(summary) {
    const cards = [
      ["SKU rows", summary.skuCount, "SKU-first universe"],
      ["Legacy velocity missing", summary.noCompletedVelocityCount, "WTD excluded"],
      ["Selling-age velocity", summary.sellingAgeVelocityCount || 0, "separate field only"],
      ["Selling-age cover", summary.sellingAgeStockCoverCount || 0, "display comparison"],
    ];
    $("metrics").innerHTML = cards.map(([a, b, c]) => `<div class="metric"><small>${a}</small><strong>${nf(b)}</strong><span>${c}</span></div>`).join("");
  }

  function options(id, values, map = (x) => x) {
    const el = $(id);
    [...new Set(values.filter(Boolean))].sort().forEach((v) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = map(v);
      el.append(o);
    });
  }

  function render() {
    const q = $("search").value.trim().toUpperCase();
    const filters = { group: $("group").value, category: $("category").value, trend: $("trend").value, cover: $("cover").value, inbound: $("inbound").value };
    state.filtered = state.rows.filter((r) => {
      const hay = `${r.sku} ${r.styleCode} ${r.colorCode}`.toUpperCase();
      return (!q || hay.includes(q))
        && (filters.group === "all" || r.productGroup === filters.group)
        && (filters.category === "all" || r.category === filters.category)
        && (filters.trend === "all" || r.observations.trend === filters.trend)
        && (filters.cover === "all" || r.observations.stockCoverBand === filters.cover)
        && (filters.inbound === "all" || r.observations.inboundCompletionBand === filters.inbound);
    });
    const sorted = [...state.filtered].sort((a, b) => {
      const av = value(a, state.sort), bv = value(b, state.sort);
      if (typeof av === "string" || typeof bv === "string") return String(av || "").localeCompare(String(bv || "")) * state.dir;
      return ((Number(av) || -Infinity) - (Number(bv) || -Infinity)) * state.dir;
    });
    $("status").textContent = `${nf(sorted.length)}개 표시 / ${nf(state.rows.length)}개 전체 · 행을 누르면 원천 관찰값을 확인합니다`;
    $("rows").innerHTML = sorted.length ? sorted.map(rowHtml).join("") : `<tr><td colspan="11" class="empty">조건에 맞는 SKU가 없습니다.</td></tr>`;
    document.querySelectorAll("#rows tr[data-sku]").forEach((tr) => tr.addEventListener("click", () => openDrawer(state.rows.find((r) => r.sku === tr.dataset.sku))));
  }

  function rowHtml(r) {
    const f = r.facts;
    const q = r.dataQuality.length ? `<span class="tag orange">${r.dataQuality.includes("NO_COMPLETED_VELOCITY") ? "완료 속도 없음" : "확인 필요"}</span>` : `<span class="tag">정상 수집</span>`;
    return `<tr data-sku="${r.sku}">
      <td><b>${r.sku}</b><br><span class="muted">${r.styleCode || "-"} · ${r.colorCode || "-"}</span></td>
      <td>${r.productGroup || "-"}</td>
      <td>${r.category || "-"}</td>
      <td class="num">${nf(f.completedVelocityQtyPerWeek, 1)} <span class="muted">/주</span></td>
      <td class="num">${nf(f.sellingAgeVelocityQtyPerWeek, 1)} <span class="muted">/주</span></td>
      <td class="num">${nf(f.erpStockQty)}</td>
      <td class="num">${pct(f.inboundCompletionPct)}</td>
      <td class="num">${nf(f.remainingOrderQty)}</td>
      <td><span class="tag blue">${r.observations.trend}</span></td>
      <td>${labels[r.observations.stockCoverBand] || r.observations.stockCoverBand}<br><span class="muted">legacy ${nf(f.stockCoverWeeks, 1)}주 · age ${ageCover(f.sellingAgeStockCoverWeeks)}</span></td>
      <td>${q}</td>
    </tr>`;
  }

  function openDrawer(r) {
    if (!r) return;
    const f = r.facts;
    $("drawerTitle").textContent = r.sku;
    $("drawerSub").textContent = `${r.styleCode || "-"} · ${r.colorCode || "-"} · ${r.productGroup || "-"} / ${r.category || "-"}`;
    const facts = [
      ["완료 판매 주차", `${nf(f.completedWeeks)}주`],
      ["완료 판매 수량", nf(f.completedSalesQty)],
      ["Legacy 완료 속도", `${nf(f.completedVelocityQtyPerWeek, 1)} /주`],
      ["Selling-age 속도", `${nf(f.sellingAgeVelocityQtyPerWeek, 1)} /주`],
      ["최근 / 직전 주", `${nf(f.lastCompleteWeekQty)} / ${nf(f.previousCompleteWeekQty)}`],
      ["ERP 재고", nf(f.erpStockQty)],
      ["발주 / 입고", `${nf(f.orderQty)} / ${nf(f.inboundQty)}`],
      ["입고 완료", pct(f.inboundCompletionPct)],
      ["잔여 발주", nf(f.remainingOrderQty)],
      ["판매 추이", f.salesTrend || "미확인"],
      ["Legacy Stock Cover", f.stockCoverWeeks == null ? "미확인" : `${nf(f.stockCoverWeeks, 1)}주`],
      ["Selling-age Cover", f.sellingAgeStockCoverWeeks == null ? "미확인" : `${nf(f.sellingAgeStockCoverWeeks, 1)}주`],
    ];
    $("drawerFacts").innerHTML = facts.map(([a, b]) => `<div class="fact"><small>${a}</small><b>${b}</b></div>`).join("");
    $("drawerQuality").innerHTML = r.dataQuality.length
      ? `<div class="quality">데이터 상태: ${r.dataQuality.join(" · ")}<br><span style="font-weight:600">완료되지 않은 주차나 WTD를 추정하여 보정하지 않았습니다.</span></div>`
      : `<div class="quality" style="background:#eef7f1;color:#41635a">데이터 상태: 추가 플래그 없음</div>`;
    document.body.classList.add("open");
  }

  ["search", "group", "category", "trend", "cover", "inbound"].forEach((id) => $(id).addEventListener("input", render));
  document.querySelectorAll("th button").forEach((b) => b.addEventListener("click", () => {
    const key = b.dataset.sort;
    state.dir = state.sort === key ? state.dir * -1 : 1;
    state.sort = key;
    render();
  }));
  $("close").addEventListener("click", () => document.body.classList.remove("open"));
  $("drawerBg").addEventListener("click", () => document.body.classList.remove("open"));

  fetch("data/sku-current-risk-diagnostic.json", { cache: "no-store" })
    .then((r) => r.json())
    .then((data) => {
      state.rows = data.rows || [];
      renderMetrics(data.summary || {});
      options("category", state.rows.map((r) => r.category));
      options("trend", state.rows.map((r) => r.observations.trend));
      options("cover", state.rows.map((r) => r.observations.stockCoverBand), (v) => labels[v] || v);
      options("inbound", state.rows.map((r) => r.observations.inboundCompletionBand), (v) => labels[v] || v);
      $("source").textContent = `${data.source?.sourceAsOf || "-"} 기준 · 완료 ${data.source?.completedThrough || "-"}`;
      render();
    })
    .catch((e) => {
      $("status").textContent = "진단 데이터를 불러오지 못했습니다";
      console.error(e);
    });
})();
