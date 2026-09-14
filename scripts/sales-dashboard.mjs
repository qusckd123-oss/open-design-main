import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { applyForecastV1 } from "./forecast-v1.ts";
import { PRODUCT_GROUP_BY_CATEGORY } from "./product-metadata.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SALES_DASHBOARD_URL = process.env.SALES_DASHBOARD_URL || "https://sales-dashboard-13g.pages.dev/dashboard/";
const PROFILE_DIR = resolve(ROOT, process.env.SALES_DASHBOARD_PROFILE_DIR || ".local-sales-dashboard-profile");
const SNAPSHOT_DIR = resolve(ROOT, ".local-sales-snapshot");
const DOC_PATH = resolve(ROOT, "docs/sales-dashboard-schema.md");
const LATEST_PATHS = [resolve(ROOT, "data/latest.json"), resolve(ROOT, "public/data/latest.json")];
const KNOWN_SKU = "WA2602CD52";
const GLOBAL_NAMES = ["PMETA", "PDET", "PDPER", "ORD", "ATOM", "IMG"];
const FORECAST_CONFIG = JSON.parse(readFileSync(resolve(ROOT, "config/forecast-v1.json"), "utf8"));
const FORECAST_REFERENCE_PATH = resolve(ROOT, "data/forecast-reference-v1.json");
const REORDER_SIGNAL_CONFIG = {
  highSellThroughThreshold: 30,
  strongVelocityQtyThreshold: 20,
  shortStockCoverWeeksThreshold: 4,
  trendStablePercentThreshold: 10,
  trendRisingPercentThreshold: 15,
  trendMinHistoryWeeks: 4,
  trendStableSlopePctThreshold: 5,
  trendRisingSlopePctThreshold: 8,
  trendDecliningSlopePctThreshold: 8,
  trendRecentVsAveragePctThreshold: 12,
  possibleStockoutCoverWeeksThreshold: 2.5,
  possibleStockoutSellThroughThreshold: 60,
  possibleStockoutDropPercentThreshold: -35,
  stockRiskCriticalCoverWeeks: 1,
  stockRiskHighCoverWeeks: 2.5,
  stockRiskMediumCoverWeeks: 5,
  stockRiskHighSellThroughThreshold: 70,
  stockRiskMediumSellThroughThreshold: 50,
};

function usage() {
  console.log(`Usage:
  node scripts/sales-dashboard.mjs login
  node scripts/sales-dashboard.mjs inspect
  node scripts/sales-dashboard.mjs sync

Environment:
  SALES_DASHBOARD_URL=${SALES_DASHBOARD_URL}
  SALES_DASHBOARD_PROFILE_DIR=${PROFILE_DIR}`);
}

function formatNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function openContext({ headless }) {
  mkdirSync(PROFILE_DIR, { recursive: true });
  return chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: { width: 1440, height: 1000 },
  });
}

async function openDashboard(context) {
  const page = context.pages()[0] || await context.newPage();
  await page.goto(SALES_DASHBOARD_URL, { waitUntil: "domcontentloaded" });
  return page;
}

async function waitForRuntimeData(page, timeout = 45_000) {
  try {
    await page.waitForFunction(
      () => Boolean(window.PMETA && window.PDET),
      null,
      { timeout },
    );
  } catch {
    throw new Error("영업기획 대시보드 재로그인이 필요합니다.");
  }
}

async function login() {
  const context = await openContext({ headless: false });
  const page = await openDashboard(context);
  console.log("[sales:login] 브라우저에서 B.CAVE 이메일 OTP 로그인을 직접 완료하세요.");
  console.log("[sales:login] OTP, cookie, token은 코드나 .env에 저장하지 않습니다.");
  await waitForRuntimeData(page, 0);
  console.log("[sales:login] 로그인 세션 확인 완료. persistent profile에 저장되었습니다.");
  await context.close();
}

async function inspectGlobals(page) {
  return page.evaluate((names) => {
    function summarize(value, knownSku) {
      const type = Array.isArray(value) ? "array" : typeof value;
      const keys = value && typeof value === "object" ? Object.keys(value) : [];
      const waKeys = keys.filter((key) => key.startsWith("WA"));
      return {
        type,
        keyCount: keys.length,
        waKeyCount: waKeys.length,
        sampleKeys: keys.slice(0, 8),
        sampleWaKeys: waKeys.slice(0, 8),
        knownSkuExists: Boolean(value && typeof value === "object" && knownSku in value),
        knownSkuSample:
          value && typeof value === "object" && knownSku in value
            ? JSON.parse(JSON.stringify(value[knownSku])).slice?.(0, 16) ?? JSON.parse(JSON.stringify(value[knownSku]))
            : null,
      };
    }

    const out = {};
    for (const name of names) {
      out[name] = summarize(window[name], "WA2602CD52");
    }
    return out;
  }, GLOBAL_NAMES);
}

async function inspectSources(page) {
  return page.evaluate(async (terms) => {
    const urls = new Set();
    for (const script of Array.from(document.scripts)) {
      if (script.src && script.src.startsWith(location.origin)) urls.add(script.src);
    }
    for (const entry of performance.getEntriesByType("resource")) {
      if (entry.name.startsWith(location.origin) && /\.(js|html|txt)(\?|$)/.test(entry.name)) {
        urls.add(entry.name);
      }
    }

    const results = [];
    for (const url of Array.from(urls).slice(0, 80)) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) continue;
        const text = await response.text();
        const hits = [];
        for (const term of terms) {
          const idx = text.indexOf(term);
          if (idx >= 0) {
            hits.push({
              term,
              snippet: text.slice(Math.max(0, idx - 80), Math.min(text.length, idx + 160)).replace(/\s+/g, " "),
            });
          }
        }
        if (hits.length) results.push({ url, hits });
      } catch {
        // Ignore individual source read failures. The runtime globals are the authoritative sync surface.
      }
    }

    const visibleText = document.body?.innerText || "";
    const freshnessMatches = Array.from(
      visibleText.matchAll(/(?:Snowflake|동기화|갱신|업데이트|기준|version|Version)[^\n]{0,80}/gi),
    ).map((match) => match[0]).slice(0, 12);

    return { sourceCount: urls.size, matches: results, freshnessMatches };
  }, [
    "PMETA",
    "PDET",
    "PDPER",
    "ORD",
    "ATOM",
    "IMG",
    "[3]",
    "[5]",
    "[8]",
    "sell",
    "판매",
    "재고",
    "입고",
    "전주",
  ]);
}

async function inspectRuntimeObjects(page) {
  return page.evaluate((knownSku) => {
    const MAX_KEYS = 6;

    function valueType(value) {
      if (Array.isArray(value)) return "array";
      if (value === null) return "null";
      return typeof value;
    }

    function primitiveSample(value) {
      if (typeof value === "number" || typeof value === "boolean" || value == null) return value;
      if (typeof value === "string") {
        if (value.startsWith("data:image/")) return value.slice(0, 16);
        return value.length > 80 ? `${value.slice(0, 80)}...` : value;
      }
      return undefined;
    }

    function shape(value, depth = 0) {
      const type = valueType(value);
      const sample = primitiveSample(value);
      if (sample !== undefined || depth >= 3) return { type, sample };

      if (Array.isArray(value)) {
        return {
          type,
          length: value.length,
          itemTypes: value.slice(0, MAX_KEYS).map(valueType),
          sampleItems: depth <= 1 ? value.slice(0, 5).map((item) => shape(item, depth + 1)) : undefined,
        };
      }

      if (value && typeof value === "object") {
        const keys = Object.keys(value);
        const out = {
          type,
          keyCount: keys.length,
          sampleKeys: keys.slice(0, MAX_KEYS),
          childTypes: {},
          sampleChildren: depth <= 1 ? {} : undefined,
        };
        for (const key of keys.slice(0, MAX_KEYS)) {
          out.childTypes[key] = valueType(value[key]);
          if (depth <= 1) out.sampleChildren[key] = shape(value[key], depth + 1);
        }
        return out;
      }
      return { type };
    }

    function containsSku(value, depth = 0, seen = new Set()) {
      if (!value || typeof value !== "object" || depth > 6 || seen.has(value)) return false;
      seen.add(value);
      if (Object.prototype.hasOwnProperty.call(value, knownSku)) return true;
      const keys = Array.isArray(value) ? value.keys() : Object.keys(value);
      for (const key of keys) {
        const child = Array.isArray(value) ? value[key] : value[key];
        if (containsSku(child, depth + 1, seen)) return true;
      }
      return false;
    }

    function findSkuPaths(value, base = "", depth = 0, seen = new Set(), found = []) {
      if (!value || typeof value !== "object" || depth > 5 || seen.has(value) || found.length >= 20) return found;
      seen.add(value);
      if (Object.prototype.hasOwnProperty.call(value, knownSku)) {
        found.push(`${base}.${knownSku}`.replace(/^\./, ""));
      }
      const keys = Object.keys(value).slice(0, 200);
      for (const key of keys) {
        findSkuPaths(value[key], `${base}.${key}`.replace(/^\./, ""), depth + 1, seen, found);
      }
      return found;
    }

    function pdetSums(sku) {
      const row = window.PDET?.[sku];
      const ch = row?.ch && typeof row.ch === "object" ? Object.values(row.ch) : [];
      return ch.reduce(
        (acc, arr) => {
          if (Array.isArray(arr)) {
            acc.amount0 += Number(arr[0] || 0);
            acc.amount1 += Number(arr[1] || 0);
            acc.qty2 += Number(arr[2] || 0);
          }
          return acc;
        },
        { amount0: 0, amount1: 0, qty2: 0 },
      );
    }

    const pdperKeys = Object.keys(window.PDPER || {});
    const pdperYear26Keys = pdperKeys.filter((key) => key.startsWith("26-"));
    const pdperAugustKeys = pdperKeys.filter((key) => /^26-0?8W/i.test(key));
    const pdperFirstKeys = pdperKeys.slice(0, 3);
    const pdperLastKeys = pdperKeys.slice(-6);

    const ordWa = window.ORD?.WA;
    const atom26 = window.ATOM?.["26"];
    const pmeta = window.PMETA?.[knownSku];
    const pdet = window.PDET?.[knownSku];
    const pdetSumsForKnown = pdetSums(knownSku);

    return {
      pdper: {
        keys: pdperKeys,
        year26Keys: pdperYear26Keys,
        augustCandidateKeys: pdperAugustKeys,
        lastKeys: pdperLastKeys,
        valueTypesByFirstKeys: Object.fromEntries(pdperFirstKeys.map((key) => [key, valueType(window.PDPER[key])])),
        firstThreeShapes: Object.fromEntries(pdperFirstKeys.map((key) => [key, shape(window.PDPER[key])])),
        lastKeyShapes: Object.fromEntries(pdperLastKeys.map((key) => [key, shape(window.PDPER[key])])),
        knownSkuDirectByKey: Object.fromEntries(pdperKeys.map((key) => [key, Boolean(window.PDPER[key]?.[knownSku])])),
        knownSkuPathSamples: findSkuPaths(window.PDPER),
      },
      ord: {
        keys: Object.keys(window.ORD || {}),
        waShape: shape(ordWa),
        waContainsKnownSku: containsSku(ordWa),
        waKnownSkuPathSamples: findSkuPaths(ordWa),
      },
      atom: {
        keys: Object.keys(window.ATOM || {}),
        atom26Shape: shape(atom26),
        atom26TextSamples: JSON.stringify(atom26)
          .match(/26-\d{2}W\d|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}월\s*[0-9]{1,2}주차/g)
          ?.slice(0, 40) || [],
      },
      img: {
        knownSkuType: valueType(window.IMG?.[knownSku]),
        knownSkuSample: primitiveSample(window.IMG?.[knownSku]),
      },
      knownSkuChecks: {
        pmeta,
        pdetShape: shape(pdet),
        pdetSums: pdetSumsForKnown,
        pdetQty2EqualsPmeta8: pmeta ? pdetSumsForKnown.qty2 === Number(pmeta[8]) : false,
        pmeta3EqualsPmeta8Over5: pmeta ? Math.abs(Number(pmeta[3]) - Number(pmeta[8]) / Number(pmeta[5])) < 0.00001 : false,
        pmeta4EqualsPmeta5TimesSrpVatMinus:
          pmeta && pdet?.srp ? Math.abs(Number(pmeta[4]) - (Number(pmeta[5]) * Number(pdet.srp)) / 1.1) < 1 : false,
      },
    };
  }, KNOWN_SKU);
}

async function inspectDashboardCode(page) {
  return page.evaluate(async (terms) => {
    function snippets(text, term, radius = 420) {
      const hits = [];
      let start = 0;
      while (hits.length < 8) {
        const idx = text.indexOf(term, start);
        if (idx < 0) break;
        hits.push(text.slice(Math.max(0, idx - radius), Math.min(text.length, idx + term.length + radius)).replace(/\s+/g, " "));
        start = idx + term.length;
      }
      return hits;
    }

    const inlineScripts = Array.from(document.scripts)
      .map((script, index) => ({ index, src: script.src || "", text: script.src ? "" : script.textContent || "" }))
      .filter((script) => script.text.length);

    const inlineHits = [];
    for (const script of inlineScripts) {
      const hits = [];
      for (const term of terms) {
        const termHits = snippets(script.text, term);
        if (termHits.length) hits.push({ term, snippets: termHits });
      }
      if (hits.length) inlineHits.push({ index: script.index, length: script.text.length, hits });
    }

    const resourceUrls = new Set();
    for (const script of Array.from(document.scripts)) {
      if (script.src && script.src.startsWith(location.origin)) resourceUrls.add(script.src);
    }
    for (const entry of performance.getEntriesByType("resource")) {
      if (entry.name.startsWith(location.origin) && /\.(js|html)(\?|$)/.test(entry.name)) resourceUrls.add(entry.name);
    }

    const resourceHits = [];
    for (const url of Array.from(resourceUrls).slice(0, 80)) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) continue;
        const text = await response.text();
        const hits = [];
        for (const term of terms) {
          const termHits = snippets(text, term, 360);
          if (termHits.length) hits.push({ term, snippets: termHits.slice(0, 4) });
        }
        if (hits.length) resourceHits.push({ url, length: text.length, hits });
      } catch {
        // Keep inspect robust when a resource cannot be re-fetched.
      }
    }

    const controls = Array.from(document.querySelectorAll("select, button, input, [role='button'], [data-period], [data-key]"))
      .slice(0, 160)
      .map((el) => ({
        tag: el.tagName,
        id: el.id || "",
        name: el.getAttribute("name") || "",
        type: el.getAttribute("type") || "",
        value: "value" in el ? String(el.value || "").slice(0, 80) : "",
        text: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || "").trim().slice(0, 120),
        data: Object.fromEntries(Object.entries(el.dataset || {}).slice(0, 8)),
      }))
      .filter((row) => row.id || row.name || row.value || row.text || Object.keys(row.data).length);

    const visibleLines = (document.body?.innerText || "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => /Snowflake|동기|갱신|업데이트|기준|26-|월|주차|와키|Wacky|WA/.test(line))
      .slice(0, 80);

    return { inlineScripts: inlineScripts.map((s) => ({ index: s.index, length: s.text.length })), inlineHits, resourceHits, controls, visibleLines };
  }, ["PMETA", "PDET", "PDPER", "ORD", "ATOM", "PMETA[", "PDET[", "PDPER[", "ORD[", "ATOM[", "sell", "sales", "stock", "qty", "rate", "week", "period"]);
}

function inferSchema(globals) {
  const pmeta = globals.PMETA?.knownSkuSample;
  const rows = [];
  const add = (field, meaning, status, evidence) => rows.push({ field, meaning, status, evidence });

  add("PMETA[0]", "연도 또는 시즌 연도 코드", "INFERRED", "WA2602CD52 샘플 값 26. 실제 영업 대시보드 사용처 확인 전 production mapping 금지.");
  add("PMETA[1]", "시즌 코드", "INFERRED", "WA2602CD52 샘플 값 SS.");
  add("PMETA[2]", "복종/카테고리 코드", "INFERRED", "WA2602CD52 샘플 값 CD.");
  add("PMETA[3]", "판매율", "INFERRED", "3710 / 5200 = 0.7135로 샘플 값과 일치.");
  add("PMETA[4]", "정상가 기준 입고금액 VAT- 후보", "INFERRED", "5200 * 99000 / 1.1 = 468000000. 실제 코드 사용처 확인 필요.");
  add("PMETA[5]", "입고수량 후보", "INFERRED", "PMETA[8] / PMETA[5] = PMETA[3] 관계가 성립.");
  add("PMETA[6]", "브랜드 코드", "INFERRED", "WA2602CD52 샘플 값 WA이며 key prefix와 일치.");
  add("PMETA[7]", "UNKNOWN", "UNKNOWN", "샘플 숫자 관계만으로 의미 확정 불가.");
  add("PMETA[8]", "누적 판매수량 후보", "INFERRED", "PDET.ch[*][2] 합계와 일치한다고 확인된 값.");
  add("PMETA[9]", "UNKNOWN", "UNKNOWN", "샘플 숫자 관계만으로 의미 확정 불가.");
  add("PMETA[10]", "상품명", "INFERRED", "WA2602CD52 샘플 값이 실제 상품명.");
  add("PMETA[11]", "현재 재고 후보", "INFERRED", "재고로 보이는 수량 값이나 PMETA[5]-PMETA[8]과 정확히 일치하지 않아 코드 확인 필요.");
  add("PMETA[12]", "현재 기간 판매수량 후보", "INFERRED", "주차 수량일 가능성이 있으나 실제 코드 확인 필요.");

  add("PDET.srp", "정상 판매가", "INFERRED", "WA2602CD52 샘플 값 99000.");
  add("PDET.ch[channel][0]", "실판매금액 VAT- 후보", "INFERRED", "채널별 첫 번째 금액 값. 실제 할인/실판매 금액 여부는 코드 사용처 확인 필요.");
  add("PDET.ch[channel][1]", "정상가 기준금액 VAT- 후보", "INFERRED", "697 * 99000 / 1.1 = 62730000으로 면세점 샘플과 일치.");
  add("PDET.ch[channel][2]", "판매수량 후보", "INFERRED", "채널별 세 번째 값 합계가 PMETA[8]과 일치.");

  for (const name of ["PDPER", "ORD", "ATOM", "IMG"]) {
    const info = globals[name];
    const status = info?.type !== "undefined" && info?.keyCount > 0 ? "UNKNOWN" : "UNKNOWN";
    add(name, "용도 미확정", status, `${name} runtime summary를 inspect 결과로 확인해야 함.`);
  }

  if (pmeta) {
    add("Known sample", "WA2602CD52 runtime sample", "INFERRED", JSON.stringify(pmeta));
  }
  return rows;
}

function renderSchemaDoc({ globals, sources }) {
  const schema = inferSchema(globals);
  const sourceHits = sources.matches
    .map((entry) => {
      const hits = entry.hits.map((hit) => `  - ${hit.term}: \`${hit.snippet.replace(/`/g, "'")}\``).join("\n");
      return `- ${entry.url}\n${hits}`;
    })
    .join("\n");

  const globalLines = Object.entries(globals)
    .map(([name, info]) => `| ${name} | ${info.type} | ${info.keyCount} | ${info.waKeyCount} | ${info.knownSkuExists ? "yes" : "no"} | ${info.sampleWaKeys.join(", ")} |`)
    .join("\n");

  const schemaLines = schema
    .map((row) => `### ${row.field}\n의미: ${row.meaning}\n상태: ${row.status}\n근거: ${row.evidence}\n`)
    .join("\n");

  return `# Sales Dashboard Schema

Generated at: ${formatNow()}
Source URL: ${SALES_DASHBOARD_URL}

This document intentionally records CONFIRMED, INFERRED, and UNKNOWN separately. INFERRED and UNKNOWN fields must not be used for production mapping unless the dashboard source usage is later confirmed.

## Runtime Globals

| Global | typeof | 전체 key 수 | WA key 수 | WA2602CD52 | WA sample keys |
| --- | ---: | ---: | ---: | --- | --- |
${globalLines}

## Schema Notes

${schemaLines}
## Source Usage Search

Searched loaded same-origin scripts/resources for PMETA/PDET/PDPER/ORD/ATOM/IMG and related terms. Snippets are deliberately short and do not contain raw data dumps.

${sourceHits || "No same-origin source usage hits were readable from the authenticated browser runtime."}

## Freshness Candidates

${sources.freshnessMatches.length ? sources.freshnessMatches.map((line) => `- ${line}`).join("\n") : "- UNKNOWN: no visible Snowflake/version timestamp was detected."}

## latest.json Field Mapping

| latest.json field | 기존 Excel source | 새 영업 dashboard source | 계산 방식 | 확정 여부 |
| --- | --- | --- | --- | --- |
| sku | 판매집계현황 row[4] | PMETA object key | WA prefix + PMETA[6] cross-check 후보 | INFERRED |
| name | 판매집계현황 row[5] / 재고 workbook row[8] | PMETA[10] 후보 | 그대로 사용 | INFERRED |
| category | SKU regex / 재고 workbook row[5] | PMETA[2] 후보 / SKU regex | WA\\d{4}([A-Z]{2}) | INFERRED |
| season | SKU regex | PMETA[0], PMETA[1] 후보 / SKU regex | 기존 styleSeason 로직 유지 가능 | INFERRED |
| gender | 상품명 문자열 | PMETA[10] 후보 | 상품명에 우먼스/여성 포함 여부 | INFERRED |
| sales | 판매집계현황 row[11] | UNKNOWN | 현재 기간 매출 필드가 필요 | UNKNOWN |
| priorSales | 전주 판매집계현황 row[11] | UNKNOWN | 전주 매출 필드 또는 기간별 series 필요 | UNKNOWN |
| quantity | 판매집계현황 row[10] | PMETA[12] 또는 PDPER 후보 | 현재 기간 판매수량 필요 | UNKNOWN |
| inQty | 재고 workbook row[19] | PMETA[5] 후보 | 입고수량 | INFERRED |
| cumQty | 재고 workbook row[20] | PMETA[8] / PDET.ch[*][2] 합계 후보 | 누적 판매수량 | INFERRED |
| stock | inQty - cumQty 또는 재고 workbook 계산 | PMETA[11] 후보 또는 inQty-cumQty | 현재 재고 수량 필요 | UNKNOWN |
| sellThrough | 재고 workbook row[23] | PMETA[3] 후보 | * 100 | INFERRED |
| stockRate | 100 - sellThrough | 계산값 | 100 - sellThrough | INFERRED |
| wow | current/prior | UNKNOWN | (sales-priorSales)/priorSales*100 | UNKNOWN |
| action | make_action | Action Engine | 기존 threshold 유지 | CONFIRMED |
| priority | make_action | Action Engine | 기존 threshold 유지 | CONFIRMED |
| reorderTiming | reorder_timing | Action Engine | 기존 threshold 유지 | CONFIRMED |
| note | make_action | Action Engine | 기존 문구/기준 유지 | CONFIRMED |
| imageUrl | product_images.json | IMG 후보 또는 기존 product_images.json | 이번 작업에서는 기존 source 유지 | CONFIRMED |

## Production Gate

Current status: STOPPED at Phase 5 unless authenticated source inspection confirms current period sales, prior period sales, current/cumulative quantity, inQty, stock, sellThrough, and period/freshness fields.
`;
}

function fencedJson(value) {
  return `\`\`\`json\n${JSON.stringify(value, null, 2).replace(/```/g, "'''")}\n\`\`\``;
}

function renderDeepCodeHits(code) {
  const renderHits = (hits) =>
    hits
      .map((hit) => hit.snippets.map((snippet) => `- ${hit.term}: \`${snippet.replace(/`/g, "'")}\``).join("\n"))
      .join("\n");

  const inline = code.inlineHits
    .map((script) => `### Inline script ${script.index} (${script.length} chars)\n${renderHits(script.hits)}`)
    .join("\n\n");

  const resources = code.resourceHits
    .map((entry) => `### ${entry.url} (${entry.length} chars)\n${renderHits(entry.hits)}`)
    .join("\n\n");

  return `${inline || "No inline script hits."}\n\n${resources || "No resource script hits."}`;
}

function renderLatestGateTable() {
  return `| latest field | source | status |
| --- | --- | --- |
| sku | PMETA object key with PMETA[6] brand cross-check | INFERRED |
| name | PMETA[10] | INFERRED |
| category | PMETA[2] and SKU regex | INFERRED |
| season | PMETA[0]/PMETA[1] and SKU regex | INFERRED |
| gender | PMETA[10] name text heuristic | INFERRED |
| sales | UNKNOWN; PDET/PDPER candidate still requires dashboard code confirmation | UNKNOWN |
| priorSales | UNKNOWN; PDPER period comparison candidate still requires structure confirmation | UNKNOWN |
| quantity | PMETA[12] or PDPER candidate | UNKNOWN |
| inQty | PMETA[5] candidate | INFERRED |
| cumQty | PMETA[8] and PDET.ch[*][2] sum | INFERRED |
| stock | PMETA[11] candidate or inQty-cumQty candidate | UNKNOWN |
| sellThrough | PMETA[3] | INFERRED |
| stockRate | 100 - sellThrough | INFERRED |
| wow | computed only after sales/priorSales are confirmed | UNKNOWN |
| sourceUpdatedAt | visible dashboard text: Snowflake sync timestamp | INFERRED |`;
}

function renderDeepSchemaDoc({ globals, sources, runtimeDetails, dashboardCode }) {
  const schema = inferSchema(globals);
  const globalLines = Object.entries(globals)
    .map(([name, info]) => `| ${name} | ${info.type} | ${info.keyCount} | ${info.waKeyCount} | ${info.knownSkuExists ? "yes" : "no"} | ${info.sampleWaKeys.join(", ")} |`)
    .join("\n");
  const schemaLines = schema
    .map((row) => `### ${row.field}\nmeaning: ${row.meaning}\nstatus: ${row.status}\nevidence: ${row.evidence}\n`)
    .join("\n");
  const sourceHits = sources.matches
    .map((entry) => {
      const hits = entry.hits.map((hit) => `  - ${hit.term}: \`${hit.snippet.replace(/`/g, "'")}\``).join("\n");
      return `- ${entry.url}\n${hits}`;
    })
    .join("\n");

  return `# Sales Dashboard Schema

Generated at: ${formatNow()}
Source URL: ${SALES_DASHBOARD_URL}

This document intentionally records CONFIRMED, INFERRED, and UNKNOWN separately. INFERRED and UNKNOWN fields must not be used for production mapping unless the dashboard source usage is later confirmed.

## Runtime Globals

| Global | typeof | total key count | WA key count | WA2602CD52 | WA sample keys |
| --- | ---: | ---: | ---: | --- | --- |
${globalLines}

## Compact Runtime Object Inspect

### PDPER

${fencedJson(runtimeDetails.pdper)}

### ORD

${fencedJson(runtimeDetails.ord)}

### ATOM

${fencedJson(runtimeDetails.atom)}

### IMG

${fencedJson(runtimeDetails.img)}

### Known SKU Cross Checks

${fencedJson(runtimeDetails.knownSkuChecks)}

## Dashboard Inline/Runtime Code Usage

Inline scripts found:

${fencedJson(dashboardCode.inlineScripts)}

Relevant snippets:

${renderDeepCodeHits(dashboardCode)}

## Visible Period/Freshness Lines

${dashboardCode.visibleLines.length ? dashboardCode.visibleLines.map((line) => `- ${line}`).join("\n") : "- No period/freshness lines detected."}

## Candidate Controls

${fencedJson(dashboardCode.controls)}

## Schema Notes

${schemaLines}

## Source Usage Search

Searched loaded same-origin scripts/resources for PMETA/PDET/PDPER/ORD/ATOM/IMG and related terms. Snippets are deliberately short and do not contain raw data dumps.

${sourceHits || "No same-origin source usage hits were readable from the authenticated browser runtime."}

## Freshness Candidates

${sources.freshnessMatches.length ? sources.freshnessMatches.map((line) => `- ${line}`).join("\n") : "- UNKNOWN: no visible Snowflake/version timestamp was detected."}

## latest.json Field Mapping

${renderLatestGateTable()}

## Production Gate

Current status: STOPPED. Production sales:sync writer stays disabled until required fields are CONFIRMED.
`;
}

async function inspect() {
  const context = await openContext({ headless: true });
  try {
    const page = await openDashboard(context);
    await waitForRuntimeData(page);
    const globals = await inspectGlobals(page);
    const sources = await inspectSources(page);
    const runtimeDetails = await inspectRuntimeObjects(page);
    const dashboardCode = await inspectDashboardCode(page);
    mkdirSync(resolve(ROOT, "docs"), { recursive: true });
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
    writeFileSync(DOC_PATH, renderDeepSchemaDoc({ globals, sources, runtimeDetails, dashboardCode }), "utf8");
    writeFileSync(
      resolve(SNAPSHOT_DIR, "inspect-summary.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), globals, sources, runtimeDetails, dashboardCode }, null, 2) + "\n",
      "utf8",
    );
    console.log(JSON.stringify({
      ok: true,
      doc: DOC_PATH,
      globals,
      compact: {
        pdperKeys: runtimeDetails.pdper.keys.length,
        pdperAugustCandidateKeys: runtimeDetails.pdper.augustCandidateKeys,
        ordWaTopKeyCount: runtimeDetails.ord.keys.length,
        atomKeys: runtimeDetails.atom.keys,
        knownSkuChecks: runtimeDetails.knownSkuChecks,
      },
    }, null, 2));
  } finally {
    await context.close();
  }
}

function readProductImages() {
  try {
    return JSON.parse(readFileSync(resolve(ROOT, "data/product_images.json"), "utf8"));
  } catch {
    return {};
  }
}

function round(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Number(number.toFixed(digits));
}

function styleGender(name) {
  return name && (name.includes("우먼스") || name.toLowerCase().includes("women")) ? "WOMEN" : "UNISEX";
}

function sumChannels(channels, index) {
  if (!channels || typeof channels !== "object") return 0;
  return Object.values(channels).reduce((sum, arr) => sum + Number(Array.isArray(arr) ? arr[index] || 0 : 0), 0);
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

function calculateTrend(quantities) {
  const values = quantities.filter((value) => Number.isFinite(value));
  if (values.length < REORDER_SIGNAL_CONFIG.trendMinHistoryWeeks) return "NEW";
  const first = values[0];
  const last = values.at(-1);
  const deltas = values.slice(1).map((value, index) => value - values[index]);
  const increaseCount = deltas.filter((delta) => delta > 0).length;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const baseline = Math.max(1, first);
  const changePercent = ((last - first) / baseline) * 100;
  const xMean = (values.length - 1) / 2;
  const yMean = average;
  const denominator = values.reduce((sum, _value, index) => sum + (index - xMean) ** 2, 0);
  const slope = denominator ? values.reduce((sum, value, index) => sum + (index - xMean) * (value - yMean), 0) / denominator : 0;
  const slopePct = average ? (slope / average) * 100 : 0;
  const recentVsAveragePct = average ? ((last - average) / average) * 100 : 0;
  if (
    increaseCount >= 2
    && slopePct >= REORDER_SIGNAL_CONFIG.trendRisingSlopePctThreshold
    && recentVsAveragePct >= REORDER_SIGNAL_CONFIG.trendRecentVsAveragePctThreshold
  ) return "ACCELERATING";
  if (
    slopePct <= -REORDER_SIGNAL_CONFIG.trendDecliningSlopePctThreshold
    && recentVsAveragePct <= -REORDER_SIGNAL_CONFIG.trendRecentVsAveragePctThreshold
  ) return "DECLINING";
  if (
    Math.abs(slopePct) <= REORDER_SIGNAL_CONFIG.trendStableSlopePctThreshold
    && Math.abs(changePercent) <= REORDER_SIGNAL_CONFIG.trendStablePercentThreshold
  ) return "STABLE";
  if (slopePct >= REORDER_SIGNAL_CONFIG.trendRisingSlopePctThreshold || changePercent >= REORDER_SIGNAL_CONFIG.trendRisingPercentThreshold) return "RISING";
  if (slopePct <= -REORDER_SIGNAL_CONFIG.trendDecliningSlopePctThreshold || changePercent <= -REORDER_SIGNAL_CONFIG.trendRisingPercentThreshold) return "DECLINING";
  return "STABLE";
}

function decideAction({ wow, sellThrough, stock }) {
  const config = {
    reorderSellThroughThreshold: 30,
    reorderNearThreshold: 25,
    promotionWowThreshold: -35,
    promotionStockRateThreshold: 65,
    reallocationStockThreshold: 800,
    reallocationStockRateThreshold: 55,
  };
  const stockRate = Math.max(0, 100 - sellThrough);
  let timing = "30% 전 관찰";
  let gap = Math.round(config.reorderSellThroughThreshold - sellThrough);
  if (sellThrough >= config.reorderSellThroughThreshold) {
    timing = "30% 도달/초과";
    gap = 0;
  } else if (sellThrough >= config.reorderNearThreshold) {
    timing = "30% 임박";
  }

  if (sellThrough >= config.reorderSellThroughThreshold) {
    return {
      action: "리오더 검토",
      priority: "P1",
      note: "30% 도달/초과 구간입니다. 판매율 30% 시점 기준으로 리오더 투입 여부와 예상 입고 시점을 우선 확인",
      reorderTiming: timing,
    };
  }
  if (sellThrough >= config.reorderNearThreshold) {
    return {
      action: "리오더 검토",
      priority: "P2",
      note: `30% 임박 구간으로 30%까지 약 ${Math.max(0, gap)}%p 남았습니다. 판매율 30% 도달 전 선제 리오더 검토`,
      reorderTiming: timing,
    };
  }
  if (wow != null && wow <= config.promotionWowThreshold && stockRate >= config.promotionStockRateThreshold) {
    return {
      action: "프로모션 검토",
      priority: "P3",
      note: "전주 대비 둔화와 높은 잔여재고율이 동시에 발생해 가격 할인/행사 검토",
      reorderTiming: timing,
    };
  }
  if (stock >= config.reallocationStockThreshold && stockRate >= config.reallocationStockRateThreshold) {
    return {
      action: "배분/RT 검토",
      priority: "P2",
      note: "잔여재고율과 절대 재고가 높아 매장 이동(RT) 또는 채널 추가 배분 검토",
      reorderTiming: timing,
    };
  }
  return {
    action: "배분/RT 검토",
    priority: "P3",
    note: "금주 판매 흐름과 매장별 재고 편차 기준으로 배분 유지",
    reorderTiming: timing,
  };
}

async function buildLatestJsonFromConfirmedSchema(page, productImages) {
  return page.evaluate(({ knownSku, productImages, signalConfig, productGroupByCategory }) => {
    function sumChannels(channels, index) {
      if (!channels || typeof channels !== "object") return 0;
      return Object.values(channels).reduce((sum, arr) => sum + Number(Array.isArray(arr) ? arr[index] || 0 : 0), 0);
    }

    // Overseas channel filter (owner-confirmed 2026-09-11, see docs/NEXT_PRIORITIES.md):
    // Sales Dashboard PDET[sku].ch / PDPER[period].cur[sku] are keyed by real channel name.
    // "해외 사입" (overseas buying) is the confirmed overseas channel; every other key is domestic.
    // This ONLY adds filterable diagnostic fields (overseasCumQty/hasOverseasSales/...) - it does
    // NOT change sales/stock/stockRisk/previewScore/salesTrend or any existing production field.
    const OVERSEAS_CHANNEL_KEYS = ["해외 사입"];
    function channelValue(channels, keys, index) {
      if (!channels || typeof channels !== "object") return 0;
      return keys.reduce((sum, key) => sum + Number(Array.isArray(channels[key]) ? channels[key][index] || 0 : 0), 0);
    }

    function productGroupForCategory(category) {
      return productGroupByCategory[String(category || "").toUpperCase()] || "UNMAPPED";
    }

    function genderGroupFor({ gender, name }) {
      const normalized = String(gender || "").toUpperCase();
      if (normalized === "UNISEX") return "UNISEX";
      if (normalized === "WOMEN" || normalized === "WOMENS" || normalized === "WOMAN") return "WOMENS";
      const productName = String(name || "").toUpperCase();
      if (productName.includes("우먼스") || productName.includes("우먼") || productName.includes("WOMENS") || productName.includes("WOMEN")) return "WOMENS";
      return "UNMAPPED";
    }

    function styleGender(name) {
      return name && (name.includes("우먼스") || name.toLowerCase().includes("women")) ? "WOMEN" : "UNISEX";
    }

    function choosePeriod() {
      if (window.__PK && window.PDPER?.[window.__PK]) return window.__PK;
      const keys = Object.keys(window.PDPER || {}).filter((key) => key.startsWith("26-"));
      return keys.at(-1) || Object.keys(window.PDPER || {}).at(-1) || "";
    }

    function weeklySortValue(periodKey) {
      const match = /^(\d{2})-(\d{2})W(\d+)$/i.exec(periodKey);
      return match ? Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]) : 0;
    }

    function parseWeeklyPeriod(periodKey) {
      const match = /^(\d{2})-(\d{2})W(\d+)$/i.exec(periodKey);
      return match ? { year: match[1], month: match[2], week: Number(match[3]) } : null;
    }

    function previousWeekPeriod(periodKey) {
      const parsed = parseWeeklyPeriod(periodKey);
      if (!parsed || parsed.week <= 1) return "";
      return `${parsed.year}-${parsed.month}W${parsed.week - 1}`;
    }

    // domesticOnly=true subtracts OVERSEAS_CHANNEL_KEYS ("해외 사입") before taking the weekly delta,
    // so completed-week/WTD sales trend can be shown either "전체" (all channels, unchanged default
    // behavior) or "국내만" (domestic channels only). Does not touch the non-domestic return values.
    function periodSalesAndQty(channels, domesticOnly) {
      const sales = sumChannels(channels, 0);
      const quantity = sumChannels(channels, 2);
      if (!domesticOnly) return { sales, quantity };
      return {
        sales: Math.max(0, sales - channelValue(channels, OVERSEAS_CHANNEL_KEYS, 0)),
        quantity: Math.max(0, quantity - channelValue(channels, OVERSEAS_CHANNEL_KEYS, 2)),
      };
    }

    function weeklyDeltaForSku(periodKey, sku, domesticOnly = false) {
      const current = window.PDPER?.[periodKey]?.cur?.[sku];
      if (!current) return null;
      const previousKey = previousWeekPeriod(periodKey);
      const previous = previousKey ? window.PDPER?.[previousKey]?.cur?.[sku] : null;
      const rawCurrent = periodSalesAndQty(current, domesticOnly);
      if (!previous) {
        return { period: periodKey, sales: rawCurrent.sales, quantity: rawCurrent.quantity };
      }
      const rawPrevious = periodSalesAndQty(previous, domesticOnly);
      return {
        period: periodKey,
        sales: Math.max(0, rawCurrent.sales - rawPrevious.sales),
        quantity: Math.max(0, rawCurrent.quantity - rawPrevious.quantity),
      };
    }

    function weeklyDeltaForSkuFromSequence(periodKey, sku, periods, domesticOnly = false) {
      const current = window.PDPER?.[periodKey]?.cur?.[sku];
      if (!current) return null;
      const periodIndex = periods.indexOf(periodKey);
      const previousKey = periodIndex > 0 ? periods[periodIndex - 1] : "";
      const previous = previousKey ? window.PDPER?.[previousKey]?.cur?.[sku] : null;
      const rawCurrent = periodSalesAndQty(current, domesticOnly);
      const rawPrevious = previous ? periodSalesAndQty(previous, domesticOnly) : null;
      return {
        period: periodKey,
        sales: rawPrevious ? Math.max(0, rawCurrent.sales - rawPrevious.sales) : rawCurrent.sales,
        quantity: rawPrevious ? Math.max(0, rawCurrent.quantity - rawPrevious.quantity) : rawCurrent.quantity,
      };
    }

    function recentWeeklyPeriods(currentPeriod, includeCurrent = true) {
      const keys = Object.keys(window.PDPER || {})
        .filter((key) => /^26-\d{2}W\d+$/i.test(key))
        .sort((a, b) => weeklySortValue(a) - weeklySortValue(b));
      const currentIndex = keys.indexOf(currentPeriod);
      const end = currentIndex >= 0 ? currentIndex + (includeCurrent ? 1 : 0) : keys.length;
      return keys.slice(Math.max(0, end - 4), end);
    }

    function linearSlope(values) {
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      const xMean = (values.length - 1) / 2;
      const denominator = values.reduce((sum, _value, index) => sum + (index - xMean) ** 2, 0);
      const slope = denominator ? values.reduce((sum, value, index) => sum + (index - xMean) * (value - average), 0) / denominator : 0;
      return { slope, slopePct: average ? (slope / average) * 100 : 0, average };
    }

    function classifyTrend(values) {
      if (values.length < signalConfig.trendMinHistoryWeeks) return "NEW";
      const first = values[0];
      const last = values.at(-1);
      const deltas = values.slice(1).map((value, index) => value - values[index]);
      const increaseCount = deltas.filter((delta) => delta > 0).length;
      const { slopePct, average } = linearSlope(values);
      const changePercent = ((last - first) / Math.max(1, first)) * 100;
      const recentVsAveragePct = average ? ((last - average) / average) * 100 : 0;
      if (
        increaseCount >= 2
        && slopePct >= signalConfig.trendRisingSlopePctThreshold
        && recentVsAveragePct >= signalConfig.trendRecentVsAveragePctThreshold
      ) return "ACCELERATING";
      if (
        slopePct <= -signalConfig.trendDecliningSlopePctThreshold
        && recentVsAveragePct <= -signalConfig.trendRecentVsAveragePctThreshold
      ) return "DECLINING";
      if (
        Math.abs(slopePct) <= signalConfig.trendStableSlopePctThreshold
        && Math.abs(changePercent) <= signalConfig.trendStablePercentThreshold
      ) return "STABLE";
      if (slopePct >= signalConfig.trendRisingSlopePctThreshold || changePercent >= signalConfig.trendRisingPercentThreshold) return "RISING";
      if (slopePct <= -signalConfig.trendDecliningSlopePctThreshold || changePercent <= -signalConfig.trendRisingPercentThreshold) return "DECLINING";
      return "STABLE";
    }

    function classifyStockRisk({ stockCoverWeeks, sellThrough, weighted4CompletedWeekQty }) {
      if (!weighted4CompletedWeekQty || stockCoverWeeks == null) return "UNKNOWN";
      if (
        stockCoverWeeks <= signalConfig.stockRiskCriticalCoverWeeks
        || (sellThrough >= signalConfig.stockRiskHighSellThroughThreshold && stockCoverWeeks <= 2)
      ) return "CRITICAL";
      if (
        stockCoverWeeks <= signalConfig.stockRiskHighCoverWeeks
        || (sellThrough >= signalConfig.possibleStockoutSellThroughThreshold && stockCoverWeeks <= 3.5)
      ) return "HIGH";
      if (
        stockCoverWeeks <= signalConfig.stockRiskMediumCoverWeeks
        || (sellThrough >= signalConfig.stockRiskMediumSellThroughThreshold && stockCoverWeeks <= 6)
      ) return "MEDIUM";
      return "LOW";
    }

    const period = choosePeriod();
    const periodRow = window.PDPER?.[period] || {};
    const weeklyPeriods = recentWeeklyPeriods(period, false);
    const currentWtdPeriod = /^26-\d{2}W\d+$/i.test(period) ? period : "";
    const allWeeklyPeriods = Object.keys(window.PDPER || {})
      .filter((key) => /^26-\d{2}W\d+$/i.test(key))
      .sort((a, b) => weeklySortValue(a) - weeklySortValue(b));
    const currentPeriodIndex = allWeeklyPeriods.indexOf(period);
    const completedForecastPeriods = currentPeriodIndex >= 0 ? allWeeklyPeriods.slice(0, currentPeriodIndex) : allWeeklyPeriods;
    const visibleText = document.body?.innerText || "";
    const sourceUpdatedAt = visibleText.match(/Snowflake\s*동기화:\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/)?.[1] || "";
    const styles = [];

    for (const [sku, meta] of Object.entries(window.PMETA || {})) {
      if (!sku.startsWith("WA") || !Array.isArray(meta) || meta[6] !== "WA") continue;
      const cur = periodRow.cur?.[sku] || {};
      const prev = periodRow.prev?.[sku] || {};
      const sales = sumChannels(cur, 0);
      const priorSales = sumChannels(prev, 0);
      const quantity = sumChannels(cur, 2);
      const inQty = Number(meta[7] || 0);
      const cumQty = Number(meta[8] || 0);
      const stock = Number(meta[11] || 0) + Number(meta[12] || 0);
      const sellThrough = Number(meta[3] || 0) * 100;
      const image = productImages[sku] || {};
      const completedWeeklyHistory = weeklyPeriods
        .map((weeklyPeriod) => {
          return weeklyDeltaForSku(weeklyPeriod, sku);
        })
        .filter(Boolean);
      const forecastCompletedHistory = completedForecastPeriods
        .map((weeklyPeriod) => weeklyDeltaForSkuFromSequence(weeklyPeriod, sku, allWeeklyPeriods))
        .filter(Boolean);
      const currentWtdChannels = currentWtdPeriod ? window.PDPER?.[currentWtdPeriod]?.cur?.[sku] : null;
      const currentWtdDelta = currentWtdPeriod ? weeklyDeltaForSku(currentWtdPeriod, sku) : null;
      const currentWtdSales = currentWtdDelta?.sales ?? (currentWtdChannels ? sumChannels(currentWtdChannels, 0) : 0);
      const currentWtdQty = currentWtdDelta?.quantity ?? (currentWtdChannels ? sumChannels(currentWtdChannels, 2) : 0);
      const cumulativeChannels = window.PDET?.[sku]?.ch || null;
      const overseasCumQty = channelValue(cumulativeChannels, OVERSEAS_CHANNEL_KEYS, 2);
      const overseasCumQtyAvailable = Boolean(cumulativeChannels);
      const domesticCumQty = overseasCumQtyAvailable ? Math.max(0, sumChannels(cumulativeChannels, 2) - overseasCumQty) : null;
      const overseasCumSalesSharePct = overseasCumQtyAvailable && sumChannels(cumulativeChannels, 2)
        ? Number(((overseasCumQty / sumChannels(cumulativeChannels, 2)) * 100).toFixed(1))
        : 0;
      const overseasCurrentWtdQty = channelValue(currentWtdChannels, OVERSEAS_CHANNEL_KEYS, 2);
      const hasOverseasSales = overseasCumQty > 0;

      // Domestic-only ("국내만") mirror of the sales-trend metrics below, requested by owner
      // 2026-09-14 as a view toggle (not a replacement) for the reorder monitor. `stock` (가용재고)
      // is not channel-split at the source and is intentionally reused as-is in both views.
      const domesticWeeklyHistory = weeklyPeriods.map((weeklyPeriod) => weeklyDeltaForSku(weeklyPeriod, sku, true)).filter(Boolean);
      const domesticCurrentWtdDelta = currentWtdPeriod ? weeklyDeltaForSku(currentWtdPeriod, sku, true) : null;
      const domesticCurrentWtdQtyResolved = domesticCurrentWtdDelta?.quantity
        ?? (currentWtdChannels ? Math.max(0, sumChannels(currentWtdChannels, 2) - overseasCurrentWtdQty) : 0);
      const domesticLastCompleteWeekQty = domesticWeeklyHistory.at(-1)?.quantity ?? 0;
      const domesticPreviousCompleteWeekQty = domesticWeeklyHistory.length >= 2 ? domesticWeeklyHistory.at(-2).quantity : null;
      const domesticCompletedWeekWow = domesticPreviousCompleteWeekQty
        ? ((domesticLastCompleteWeekQty - domesticPreviousCompleteWeekQty) / domesticPreviousCompleteWeekQty) * 100
        : null;
      const domesticAvg4CompletedWeekQty = domesticWeeklyHistory.length
        ? domesticWeeklyHistory.reduce((sum, item) => sum + item.quantity, 0) / domesticWeeklyHistory.length
        : 0;
      const domesticBaseWeights = [0.1, 0.2, 0.3, 0.4].slice(-domesticWeeklyHistory.length);
      const domesticWeightTotal = domesticBaseWeights.reduce((sum, value) => sum + value, 0);
      const domesticWeighted4CompletedWeekQty = domesticWeightTotal
        ? domesticWeeklyHistory.reduce((sum, item, index) => sum + item.quantity * (domesticBaseWeights[index] / domesticWeightTotal), 0)
        : 0;
      const domesticStockCoverWeeks = domesticWeighted4CompletedWeekQty ? stock / domesticWeighted4CompletedWeekQty : null;
      const domesticSalesTrend = classifyTrend(domesticWeeklyHistory.map((item) => item.quantity));
      // sellThrough approximation: domestic cumulative sales / total inbound. inQty is not
      // channel-split at the source, so this divides a domestic numerator by a non-domestic-only
      // denominator - a diagnostic approximation, not an exact domestic sell-through.
      const domesticSellThrough = inQty ? (domesticCumQty / inQty) * 100 : null;
      const domesticStockRisk = classifyStockRisk({
        stockCoverWeeks: domesticStockCoverWeeks,
        sellThrough: domesticSellThrough || 0,
        weighted4CompletedWeekQty: domesticWeighted4CompletedWeekQty,
      });
      const lastCompleteWeekQty = completedWeeklyHistory.at(-1)?.quantity ?? 0;
      const previousCompleteWeekQty = completedWeeklyHistory.length >= 2 ? completedWeeklyHistory.at(-2).quantity : null;
      const completedWeekWow = previousCompleteWeekQty ? ((lastCompleteWeekQty - previousCompleteWeekQty) / previousCompleteWeekQty) * 100 : null;
      const avg4CompletedWeekQty = completedWeeklyHistory.length ? completedWeeklyHistory.reduce((sum, item) => sum + item.quantity, 0) / completedWeeklyHistory.length : 0;
      const baseWeights = [0.1, 0.2, 0.3, 0.4].slice(-completedWeeklyHistory.length);
      const weightTotal = baseWeights.reduce((sum, value) => sum + value, 0);
      const weighted4CompletedWeekQty = weightTotal
        ? completedWeeklyHistory.reduce((sum, item, index) => sum + item.quantity * (baseWeights[index] / weightTotal), 0)
        : 0;
      const stockCoverWeeks = weighted4CompletedWeekQty ? stock / weighted4CompletedWeekQty : null;
      const quantities = completedWeeklyHistory.map((item) => item.quantity);
      const salesTrend = classifyTrend(quantities);
      const stockRisk = classifyStockRisk({ stockCoverWeeks, sellThrough, weighted4CompletedWeekQty });
      const reorderSignals = {
        highSellThrough: sellThrough >= signalConfig.highSellThroughThreshold,
        strongVelocity: weighted4CompletedWeekQty >= signalConfig.strongVelocityQtyThreshold,
        shortStockCover: stockCoverWeeks != null && stockCoverWeeks <= signalConfig.shortStockCoverWeeksThreshold,
        acceleratingSales: salesTrend === "ACCELERATING" || salesTrend === "RISING",
      };
      const reorderSignalScore = Object.values(reorderSignals).filter(Boolean).length;
      const possibleStockout = stockRisk === "CRITICAL" || stockRisk === "HIGH";
      const reorderPreviewV2 = {
        sellThrough,
        weighted4CompletedWeekQty,
        lastCompleteWeekQty,
        previousCompleteWeekQty,
        completedWeekWow,
        stock,
        stockCoverWeeks,
        salesTrend,
        stockRisk,
        possibleStockout,
        historyWeeks: completedWeeklyHistory.length,
        previewScore: 0,
      };

      const name = String(meta[10] || sku);
      const category = String(meta[2] || sku.match(/^WA\d{4}([A-Z]{2})/)?.[1] || "ETC");
      const gender = styleGender(name);

      styles.push({
        sku,
        name,
        category,
        categoryName: category,
        productGroup: productGroupForCategory(category),
        season: `${meta[0] || ""}${meta[1] || ""}` || "",
        gender,
        genderGroup: genderGroupFor({ gender, name }),
        sales,
        priorSales,
        quantity,
        orderQty: Number(meta[5] || 0),
        inQty,
        cumQty,
        stock,
        sellThrough,
        stockRate: Math.max(0, 100 - sellThrough),
        wow: priorSales ? ((sales - priorSales) / priorSales) * 100 : null,
        weeklyHistory: completedWeeklyHistory,
        completedWeeklyHistory,
        currentWtdPeriod,
        currentWtdSales,
        currentWtdQty,
        forecastCompletedHistory,
        srp: Number(window.PDET?.[sku]?.srp || 0),
        currentWeekQty: lastCompleteWeekQty,
        previousWeekQty: previousCompleteWeekQty,
        lastCompleteWeekQty,
        previousCompleteWeekQty,
        qtyWow: completedWeekWow,
        completedWeekWow,
        avg4WeekQty: avg4CompletedWeekQty,
        avg4CompletedWeekQty,
        weighted4WeekQty: weighted4CompletedWeekQty,
        weighted4CompletedWeekQty,
        stockCoverWeeks,
        salesTrend,
        reorderSignals,
        reorderSignalScore,
        reorderPreviewV2,
        stockRisk,
        possibleStockout,
        previewScore: 0,
        isSpecialMarket: String(meta[10] || "").includes("[대만]"),
        // Overseas channel filter fields (diagnostic-grade, owner-confirmed 2026-09-11): "해외 사입"
        // channel quantity from the Sales Dashboard's own real channel breakdown. Does not change
        // sales/stock/stockRisk/previewScore/salesTrend; UI-level filter only, see reorder-monitor.js.
        overseasCumQty,
        domesticCumQty,
        overseasCumQtyAvailable,
        overseasCumSalesSharePct,
        overseasCurrentWtdQty,
        hasOverseasSales,
        // Domestic-only view toggle fields (owner-requested 2026-09-14): mirror of the completed-week
        // trend metrics above, computed with the "해외 사입" channel excluded. `domesticPreviewScore`/
        // `domesticStockRisk` are ranked within a SEPARATE domestic-only percentile pass below (see
        // domesticVelocityByCategory) - they are not comparable 1:1 with the all-channel previewScore.
        domesticWeeklyHistory,
        domesticCompletedWeeklyHistory: domesticWeeklyHistory,
        domesticCurrentWtdQty: domesticCurrentWtdQtyResolved,
        domesticLastCompleteWeekQty,
        domesticPreviousCompleteWeekQty,
        domesticCompletedWeekWow,
        domesticAvg4CompletedWeekQty,
        domesticWeighted4CompletedWeekQty,
        domesticStockCoverWeeks,
        domesticSalesTrend,
        domesticSellThrough,
        domesticStockRisk,
        domesticPreviewScore: 0,
        imageUrl: image.imageUrl || "",
        productUrl: image.productUrl || "",
      });
    }

    const velocityByCategory = {};
    for (const row of styles) {
      const key = row.category || "ETC";
      if (!velocityByCategory[key]) velocityByCategory[key] = [];
      velocityByCategory[key].push(row.weighted4CompletedWeekQty || 0);
    }
    for (const values of Object.values(velocityByCategory)) {
      values.sort((a, b) => a - b);
    }
    function percentileInCategory(category, value) {
      const values = velocityByCategory[category || "ETC"] || [];
      if (!values.length) return 0;
      const belowOrEqual = values.filter((item) => item <= value).length;
      return belowOrEqual / values.length;
    }
    function stockUrgencyScore(row) {
      if (row.stockCoverWeeks == null || !row.weighted4CompletedWeekQty) return 0;
      if (row.stockCoverWeeks <= 1) return 40;
      if (row.stockCoverWeeks >= 10) return 0;
      return Math.max(0, Math.min(40, ((10 - row.stockCoverWeeks) / 9) * 40));
    }
    function sellThroughScore(value) {
      return Math.max(0, Math.min(20, ((value - 20) / 70) * 20));
    }
    function trendScore(trend) {
      return { ACCELERATING: 15, RISING: 10, STABLE: 5, DECLINING: 0, NEW: 2 }[trend] ?? 0;
    }
    for (const row of styles) {
      const velocityScore = percentileInCategory(row.category, row.weighted4CompletedWeekQty || 0) * 25;
      const score = stockUrgencyScore(row) + velocityScore + sellThroughScore(row.sellThrough || 0) + trendScore(row.salesTrend);
      row.previewScore = Math.round(Math.max(0, Math.min(100, score)));
      row.reorderPreviewV2.previewScore = row.previewScore;
      row.reorderPreviewV2.stockRisk = row.stockRisk;
    }

    // Domestic-only view toggle: a SEPARATE percentile pass over domesticWeighted4CompletedWeekQty,
    // so domesticPreviewScore is ranked against other domestic-only velocities (not the all-channel
    // distribution above). Does not change previewScore/stockRisk/reorderPreviewV2.
    const domesticVelocityByCategory = {};
    for (const row of styles) {
      const key = row.category || "ETC";
      if (!domesticVelocityByCategory[key]) domesticVelocityByCategory[key] = [];
      domesticVelocityByCategory[key].push(row.domesticWeighted4CompletedWeekQty || 0);
    }
    for (const values of Object.values(domesticVelocityByCategory)) {
      values.sort((a, b) => a - b);
    }
    function domesticPercentileInCategory(category, value) {
      const values = domesticVelocityByCategory[category || "ETC"] || [];
      if (!values.length) return 0;
      const belowOrEqual = values.filter((item) => item <= value).length;
      return belowOrEqual / values.length;
    }
    for (const row of styles) {
      const velocityScore = domesticPercentileInCategory(row.category, row.domesticWeighted4CompletedWeekQty || 0) * 25;
      const score = stockUrgencyScore({ stockCoverWeeks: row.domesticStockCoverWeeks, weighted4CompletedWeekQty: row.domesticWeighted4CompletedWeekQty })
        + velocityScore + sellThroughScore(row.domesticSellThrough || 0) + trendScore(row.domesticSalesTrend);
      row.domesticPreviewScore = Math.round(Math.max(0, Math.min(100, score)));
    }

    return {
      period,
      sourceUpdatedAt,
      weeklyPeriods,
      currentWtdPeriod,
      styles,
      knownSkuPresent: styles.some((row) => row.sku === knownSku),
    };
  }, { knownSku: KNOWN_SKU, productImages, signalConfig: REORDER_SIGNAL_CONFIG, productGroupByCategory: PRODUCT_GROUP_BY_CATEGORY });
}

function normalizeLatestPayload({ period, sourceUpdatedAt, weeklyPeriods = [], currentWtdPeriod = "", styles }) {
  const normalizedStyles = styles.map((row) => {
    const sales = round(row.sales);
    const priorSales = round(row.priorSales);
    const sellThrough = round(row.sellThrough);
    const stockRate = round(row.stockRate);
    const wow = row.wow == null ? null : round(row.wow);
    const stock = Math.round(Number(row.stock || 0));
    const decision = decideAction({ wow, sellThrough, stock });
    const note = wow == null ? decision.note : `${decision.note} (전주 대비 ${wow >= 0 ? "+" : ""}${wow.toFixed(1)}%)`;
    return {
      ...row,
      sales,
      priorSales,
      productGroup: row.productGroup || productGroupForCategory(row.category),
      genderGroup: row.genderGroup || genderGroupFor({ gender: row.gender, name: row.name }),
      quantity: Math.round(Number(row.quantity || 0)),
      orderQty: Math.round(Number(row.orderQty || 0)),
      inQty: Math.round(Number(row.inQty || 0)),
      cumQty: Math.round(Number(row.cumQty || 0)),
      stock,
      sellThrough,
      stockRate,
      wow,
      weeklyHistory: (row.weeklyHistory || []).map((item) => ({
        period: item.period,
        sales: round(item.sales),
        quantity: Math.round(Number(item.quantity || 0)),
      })),
      completedWeeklyHistory: (row.completedWeeklyHistory || row.weeklyHistory || []).map((item) => ({
        period: item.period,
        sales: round(item.sales),
        quantity: Math.round(Number(item.quantity || 0)),
      })),
      currentWtdPeriod: row.currentWtdPeriod || "",
      currentWtdSales: round(row.currentWtdSales),
      currentWtdQty: Math.round(Number(row.currentWtdQty || 0)),
      currentWeekQty: Math.round(Number(row.currentWeekQty || 0)),
      previousWeekQty: row.previousWeekQty == null ? null : Math.round(Number(row.previousWeekQty || 0)),
      lastCompleteWeekQty: Math.round(Number(row.lastCompleteWeekQty || row.currentWeekQty || 0)),
      previousCompleteWeekQty: row.previousCompleteWeekQty == null ? null : Math.round(Number(row.previousCompleteWeekQty || 0)),
      qtyWow: row.qtyWow == null ? null : round(row.qtyWow),
      completedWeekWow: row.completedWeekWow == null ? null : round(row.completedWeekWow),
      avg4WeekQty: round(row.avg4WeekQty),
      avg4CompletedWeekQty: round(row.avg4CompletedWeekQty),
      weighted4WeekQty: round(row.weighted4WeekQty),
      weighted4CompletedWeekQty: round(row.weighted4CompletedWeekQty),
      stockCoverWeeks: row.stockCoverWeeks == null ? null : round(row.stockCoverWeeks),
      salesTrend: row.salesTrend || calculateTrend((row.weeklyHistory || []).map((item) => Number(item.quantity || 0))),
      reorderSignals: row.reorderSignals || {},
      reorderSignalScore: Math.round(Number(row.reorderSignalScore || 0)),
      reorderPreviewV2: row.reorderPreviewV2 ? {
        ...row.reorderPreviewV2,
        sellThrough: round(row.reorderPreviewV2.sellThrough),
        weighted4CompletedWeekQty: round(row.reorderPreviewV2.weighted4CompletedWeekQty),
        lastCompleteWeekQty: Math.round(Number(row.reorderPreviewV2.lastCompleteWeekQty || 0)),
        previousCompleteWeekQty: row.reorderPreviewV2.previousCompleteWeekQty == null ? null : Math.round(Number(row.reorderPreviewV2.previousCompleteWeekQty || 0)),
        completedWeekWow: row.reorderPreviewV2.completedWeekWow == null ? null : round(row.reorderPreviewV2.completedWeekWow),
        stock: Math.round(Number(row.reorderPreviewV2.stock || 0)),
        stockCoverWeeks: row.reorderPreviewV2.stockCoverWeeks == null ? null : round(row.reorderPreviewV2.stockCoverWeeks),
        stockRisk: row.reorderPreviewV2.stockRisk || row.stockRisk || "UNKNOWN",
        previewScore: Math.round(Number(row.reorderPreviewV2.previewScore || 0)),
      } : null,
      stockRisk: row.stockRisk || row.reorderPreviewV2?.stockRisk || "UNKNOWN",
      possibleStockout: Boolean(row.possibleStockout),
      previewScore: Math.round(Number(row.previewScore || 0)),
      isSpecialMarket: Boolean(row.isSpecialMarket),
      domesticWeeklyHistory: (row.domesticWeeklyHistory || []).map((item) => ({
        period: item.period,
        sales: round(item.sales),
        quantity: Math.round(Number(item.quantity || 0)),
      })),
      domesticCompletedWeeklyHistory: (row.domesticCompletedWeeklyHistory || row.domesticWeeklyHistory || []).map((item) => ({
        period: item.period,
        sales: round(item.sales),
        quantity: Math.round(Number(item.quantity || 0)),
      })),
      domesticCurrentWtdQty: Math.round(Number(row.domesticCurrentWtdQty || 0)),
      domesticLastCompleteWeekQty: Math.round(Number(row.domesticLastCompleteWeekQty || 0)),
      domesticPreviousCompleteWeekQty: row.domesticPreviousCompleteWeekQty == null ? null : Math.round(Number(row.domesticPreviousCompleteWeekQty || 0)),
      domesticCompletedWeekWow: row.domesticCompletedWeekWow == null ? null : round(row.domesticCompletedWeekWow),
      domesticAvg4CompletedWeekQty: round(row.domesticAvg4CompletedWeekQty),
      domesticWeighted4CompletedWeekQty: round(row.domesticWeighted4CompletedWeekQty),
      domesticStockCoverWeeks: row.domesticStockCoverWeeks == null ? null : round(row.domesticStockCoverWeeks),
      domesticSalesTrend: row.domesticSalesTrend || "NEW",
      domesticSellThrough: row.domesticSellThrough == null ? null : round(row.domesticSellThrough),
      domesticStockRisk: row.domesticStockRisk || "UNKNOWN",
      domesticPreviewScore: Math.round(Number(row.domesticPreviewScore || 0)),
      action: decision.action,
      priority: decision.priority,
      reorderTiming: decision.reorderTiming,
      note,
    };
  });

  const grouped = new Map();
  for (const row of normalizedStyles) {
    const key = row.category || "ETC";
    const item = grouped.get(key) || {
      category: key,
      categoryName: row.categoryName || key,
      season: row.season,
      sales: 0,
      target: 0,
      stock: 0,
      quantity: 0,
    };
    item.sales += Number(row.sales || 0);
    item.target += Number(row.priorSales || 0);
    item.stock += Number(row.stock || 0);
    item.quantity += Number(row.cumQty || row.quantity || 0);
    grouped.set(key, item);
  }

  const categories = Array.from(grouped.values()).map((row) => {
    const denominator = row.stock + row.quantity;
    return {
      ...row,
      sales: round(row.sales),
      target: round(row.target),
      sellThrough: denominator ? round((row.quantity / denominator) * 100) : 0,
      stockRate: denominator ? round((row.stock / denominator) * 100) : 0,
      wow: row.target ? round(((row.sales - row.target) / row.target) * 100) : 0,
    };
  }).sort((a, b) => Number(b.sales || 0) - Number(a.sales || 0));

  const syncedAt = new Date().toISOString();
  const totalSales = normalizedStyles.reduce((sum, row) => sum + Number(row.sales || 0), 0);
  const totalPriorSales = normalizedStyles.reduce((sum, row) => sum + Number(row.priorSales || 0), 0);
  const totalWow = totalPriorSales ? round(((totalSales - totalPriorSales) / totalPriorSales) * 100) : 0;

  return {
    meta: {
      brand: "Wacky Willy",
      season: "WA ALL",
      weekLabel: period,
      period,
      comparePeriod: "previous matched period",
      amountUnit: "VAT- / 백만원",
      source: "SALES_DASHBOARD",
      sourceUpdatedAt,
      syncedAt,
      weeklyPeriods,
      currentWtdPeriod,
      reorderSignalConfig: REORDER_SIGNAL_CONFIG,
      forecastV1: {
        referenceVersion: FORECAST_CONFIG.referenceVersion,
        denominator: "PMETA[7] net receipts",
        highSellThroughThreshold: FORECAST_CONFIG.forecast.highSellThroughThreshold,
        currentWtdExcludedFromTrend: true,
      },
      targetLabel: "전년 동기간 매출",
    },
    categories,
    styles: normalizedStyles.sort((a, b) => Number(b.sales || 0) - Number(a.sales || 0)),
    summary: {
      headline: `${period} WA 전체 STYLE 매출은 ${round(totalSales, 1).toLocaleString("ko-KR")}백만원, 전년 동기간 대비 ${totalWow >= 0 ? "+" : ""}${totalWow.toFixed(1)}%입니다.`,
      message: "영업기획 대시보드 Snowflake 동기화 데이터를 기준으로 자동 생성했습니다.",
    },
  };
}

function validateCandidate(payload) {
  const errors = [];
  const warnings = [];
  if (!payload || typeof payload !== "object") errors.push("payload object is required");
  if (!payload?.meta?.sourceUpdatedAt) errors.push("meta.sourceUpdatedAt is required");
  const styles = Array.isArray(payload?.styles) ? payload.styles : [];
  if (!styles.length) errors.push("styles must not be empty");
  const seen = new Set();
  for (const row of styles) {
    if (!row.sku || typeof row.sku !== "string") errors.push("style row missing sku");
    if (row.sku && !row.sku.startsWith("WA")) errors.push(`non-WA sku leaked: ${row.sku}`);
    if (seen.has(row.sku)) errors.push(`duplicate sku: ${row.sku}`);
    seen.add(row.sku);
    for (const field of ["sales", "priorSales", "quantity", "inQty", "cumQty", "stock", "sellThrough", "stockRate"]) {
      if (!Number.isFinite(Number(row[field]))) errors.push(`${row.sku} invalid numeric field: ${field}`);
    }
    for (const field of ["name", "category", "season", "gender", "productGroup", "genderGroup", "action", "priority", "reorderTiming", "note"]) {
      if (row[field] == null || row[field] === "") errors.push(`${row.sku} missing field: ${field}`);
    }
    const forecast = row.forecastV1;
    if (!forecast) errors.push(`${row.sku} missing forecastV1`);
    if (row.productGroup === "ACC" && (forecast?.eligible !== false || forecast?.reason !== "ACC_NOT_SUPPORTED_V1")) {
      errors.push(`${row.sku} ACC forecast must be disabled`);
    }
    if (row.productGroup === "APP" && forecast?.eligible !== true) errors.push(`${row.sku} APP forecast must be eligible`);
    if ((forecast?.analogStyles || []).some((analog) => analog.styleCode === row.sku)) errors.push(`${row.sku} analog target leakage`);
    if ((forecast?.analogStyles || []).some((analog) => analog.category !== row.category)) errors.push(`${row.sku} analog category mismatch`);
    if (forecast?.adjustedForecastQty != null && Number(forecast.adjustedForecastQty) < Number(row.cumQty)) errors.push(`${row.sku} adjusted forecast below cumulative sales`);
    if (forecast?.forecastSellThrough != null) {
      const expected = Number(forecast.adjustedForecastQty) / Number(row.inQty);
      if (!Number.isFinite(expected) || Math.abs(Number(forecast.forecastSellThrough) - expected) > 0.0001) errors.push(`${row.sku} forecast denominator mismatch`);
    }
  }
  if (!seen.has(KNOWN_SKU)) warnings.push(`${KNOWN_SKU} not present in current WA dataset`);
  return { errors, warnings };
}

function atomicWriteJson(path, payload) {
  const tmp = `${path}.tmp-${process.pid}`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(tmp, JSON.stringify(payload, null, 2) + "\n", "utf8");
  renameSync(tmp, path);
}

async function sync() {
  const context = await openContext({ headless: true });
  try {
    const page = await openDashboard(context);
    await waitForRuntimeData(page);
    const globals = await inspectGlobals(page);
    const productImages = readProductImages();
    const waCount = globals.PMETA?.waKeyCount || 0;
    const candidate = await buildLatestJsonFromConfirmedSchema(page, productImages);
    const forecastReference = JSON.parse(readFileSync(FORECAST_REFERENCE_PATH, "utf8"));
    candidate.styles = applyForecastV1(candidate.styles, forecastReference, FORECAST_CONFIG);
    const payload = normalizeLatestPayload(candidate);
    const validation = validateCandidate(payload);

    mkdirSync(SNAPSHOT_DIR, { recursive: true });
    writeFileSync(
      resolve(SNAPSHOT_DIR, "sync-preflight.json"),
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        waCount,
        period: candidate.period,
        sourceUpdatedAt: candidate.sourceUpdatedAt,
        styleCount: payload.styles.length,
        knownSkuPresent: candidate.knownSkuPresent,
        knownSku: globals.PMETA?.knownSkuSample,
        productImageCount: Object.keys(productImages).length,
        validation,
      }, null, 2) + "\n",
      "utf8",
    );

    if (validation.errors.length) {
      throw new Error(`Production sync validation failed. Existing latest.json was kept unchanged: ${validation.errors.join("; ")}`);
    }

    for (const path of LATEST_PATHS) atomicWriteJson(path, payload);
    console.log(JSON.stringify({
      ok: true,
      source: "SALES_DASHBOARD",
      period: payload.meta.period,
      sourceUpdatedAt: payload.meta.sourceUpdatedAt,
      syncedAt: payload.meta.syncedAt,
      waRuntimeCount: waCount,
      styleCount: payload.styles.length,
      knownSku: payload.styles.find((row) => row.sku === KNOWN_SKU) || null,
      validation,
      written: LATEST_PATHS,
    }, null, 2));
  } finally {
    await context.close();
  }
}

async function main() {
  const command = process.argv[2];
  if (!command || command === "--help" || command === "-h") {
    usage();
    return;
  }
  if (command === "login") return login();
  if (command === "inspect") return inspect();
  if (command === "sync") return sync();
  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
