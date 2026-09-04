import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SALES_DASHBOARD_URL = process.env.SALES_DASHBOARD_URL || "https://sales-dashboard-13g.pages.dev/dashboard/";
const PROFILE_DIR = resolve(ROOT, process.env.SALES_DASHBOARD_PROFILE_DIR || ".local-sales-dashboard-profile");
const SNAPSHOT_DIR = resolve(ROOT, ".local-sales-snapshot");
const DOC_PATH = resolve(ROOT, "docs/sales-dashboard-schema.md");
const LATEST_PATHS = [resolve(ROOT, "data/latest.json"), resolve(ROOT, "public/data/latest.json")];
const KNOWN_SKU = "WA2602CD52";
const GLOBAL_NAMES = ["PMETA", "PDET", "PDPER", "ORD", "ATOM", "IMG"];

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

function validateCandidate(payload) {
  const errors = [];
  const warnings = [];
  if (!payload || typeof payload !== "object") errors.push("payload object is required");
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
    for (const field of ["name", "category", "season", "gender", "action", "priority", "reorderTiming", "note"]) {
      if (row[field] == null || row[field] === "") errors.push(`${row.sku} missing field: ${field}`);
    }
  }
  if (!seen.has(KNOWN_SKU)) warnings.push(`${KNOWN_SKU} not present in current WA dataset`);
  return { errors, warnings };
}

function atomicWriteJson(path, payload) {
  const tmp = `${path}.tmp-${process.pid}`;
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

    mkdirSync(SNAPSHOT_DIR, { recursive: true });
    writeFileSync(
      resolve(SNAPSHOT_DIR, "sync-preflight.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), waCount, knownSku: globals.PMETA?.knownSkuSample, productImageCount: Object.keys(productImages).length }, null, 2) + "\n",
      "utf8",
    );

    const missing = [
      "current period sales",
      "prior period sales",
      "current period quantity",
      "stock/inventory source confirmed by dashboard code",
      "period or Snowflake freshness timestamp",
    ];

    throw new Error(
      `Production sync stopped at Phase 5. Confirm these fields before writing latest.json: ${missing.join(", ")}. Existing latest.json was kept unchanged.`,
    );

    // Future production path:
    // const payload = buildLatestJsonFromConfirmedSchema(...);
    // const validation = validateCandidate(payload);
    // if (validation.errors.length) throw new Error(validation.errors.join("; "));
    // for (const path of LATEST_PATHS) atomicWriteJson(path, payload);
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
