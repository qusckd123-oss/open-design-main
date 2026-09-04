import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SALES_DASHBOARD_URL = process.env.SALES_DASHBOARD_URL || "https://sales-dashboard-13g.pages.dev/dashboard/";
const PROFILE_DIR = resolve(ROOT, process.env.SALES_DASHBOARD_PROFILE_DIR || ".local-sales-dashboard-profile");
const SNAPSHOT_DIR = resolve(ROOT, ".local-sales-snapshot");
const DOC_PATH = resolve(ROOT, "docs/sales-dashboard-schema.md");
const KNOWN_SKU = "WA2602CD52";
const GLOBAL_NAMES = ["PMETA", "PDET", "PDPER", "ORD", "ATOM", "IMG"];
const USAGE_TERMS = [
  "PMETA", "PDET", "PDPER", "ORD", "ATOM", "IMG",
  "PMETA[", "PDET[", "PDPER[", "ORD[", "ATOM[",
  "sellThrough", "priorSales", "current", "period", "Snowflake", "stock", "quantity",
];

async function openContext() {
  mkdirSync(PROFILE_DIR, { recursive: true });
  return chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    viewport: { width: 1440, height: 1000 },
  });
}

async function openDashboard(context) {
  const page = context.pages()[0] || await context.newPage();
  await page.goto(SALES_DASHBOARD_URL, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.PMETA && window.PDET && window.PDPER && window.ORD && window.ATOM), null, { timeout: 45_000 });
  return page;
}

function formatNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function inspectRuntime(page) {
  return page.evaluate(({ knownSku, globalNames, usageTerms }) => {
    const MAX_KEYS = 12;

    function typeOf(value) {
      if (Array.isArray(value)) return "array";
      if (value === null) return "null";
      return typeof value;
    }

    function small(value) {
      if (typeof value === "string") return value.length > 120 ? `${value.slice(0, 117)}...` : value;
      if (typeof value === "number" || typeof value === "boolean" || value == null) return value;
      return undefined;
    }

    function summarize(value, depth = 0, maxDepth = 3) {
      const type = typeOf(value);
      if (!value || typeof value !== "object") return { type, sample: small(value) };
      const keys = Object.keys(value);
      const out = { type, keyCount: keys.length, sampleKeys: keys.slice(0, MAX_KEYS) };
      if (Array.isArray(value)) {
        out.length = value.length;
        out.sample = value.slice(0, MAX_KEYS).map((item) => (item && typeof item === "object" ? summarize(item, depth + 1, maxDepth) : small(item)));
        return out;
      }
      if (depth < maxDepth) {
        out.children = {};
        for (const key of keys.slice(0, MAX_KEYS)) out.children[key] = summarize(value[key], depth + 1, maxDepth);
      }
      return out;
    }

    function findPath(root, targetKey, maxDepth = 6) {
      const seen = new Set();
      const queue = [{ value: root, path: [] }];
      while (queue.length) {
        const { value, path } = queue.shift();
        if (!value || typeof value !== "object" || seen.has(value) || path.length > maxDepth) continue;
        seen.add(value);
        if (Object.prototype.hasOwnProperty.call(value, targetKey)) return { path: [...path, targetKey], valueSummary: summarize(value[targetKey], 0, 2) };
        for (const key of Object.keys(value).slice(0, 5000)) {
          const next = value[key];
          if (next && typeof next === "object") queue.push({ value: next, path: [...path, key] });
        }
      }
      return null;
    }

    function nestedKeyStats(value, maxDepth = 3) {
      const byDepth = {};
      const seen = new Set();
      function walk(node, level) {
        if (!node || typeof node !== "object" || seen.has(node) || level > maxDepth) return;
        seen.add(node);
        const keys = Object.keys(node);
        byDepth[level] = (byDepth[level] || 0) + keys.length;
        for (const key of keys.slice(0, 5000)) walk(node[key], level + 1);
      }
      walk(value, 0);
      return byDepth;
    }

    function globalSummary(name) {
      const value = window[name];
      const keys = value && typeof value === "object" ? Object.keys(value) : [];
      const waKeys = keys.filter((key) => key.startsWith("WA"));
      return {
        type: typeOf(value),
        keyCount: keys.length,
        waKeyCount: waKeys.length,
        sampleKeys: keys.slice(0, 10),
        sampleWaKeys: waKeys.slice(0, 10),
        knownSkuExists: Boolean(value && typeof value === "object" && knownSku in value),
        knownSkuSample: value && typeof value === "object" && knownSku in value ? summarize(value[knownSku], 0, 2) : null,
      };
    }

    function sumPdetChannels(pdetRow) {
      const sums = [0, 0, 0];
      const sampleRows = [];
      const ch = pdetRow?.ch;
      for (const [channel, row] of Object.entries(ch || {})) {
        if (!Array.isArray(row)) continue;
        for (let i = 0; i < 3; i += 1) sums[i] += Number(row[i] || 0);
        if (sampleRows.length < 8) sampleRows.push({ channel, values: row.slice(0, 3) });
      }
      return { channelCount: Object.keys(ch || {}).length, sums, sampleRows };
    }

    function snippetAround(text, term, radius = 700) {
      const idx = text.indexOf(term);
      if (idx < 0) return null;
      return text.slice(Math.max(0, idx - radius), Math.min(text.length, idx + term.length + radius)).replace(/\s+/g, " ");
    }

    const pmeta = window.PMETA?.[knownSku] || null;
    const pdet = window.PDET?.[knownSku] || null;
    const pdetSums = sumPdetChannels(pdet);
    const pdperKeys = Object.keys(window.PDPER || {});
    const pdperFirstThree = pdperKeys.slice(0, 3).map((key) => ({
      key,
      valueType: typeOf(window.PDPER[key]),
      valueSummary: summarize(window.PDPER[key], 0, 3),
      knownSkuPath: findPath(window.PDPER[key], knownSku, 7),
    }));
    const pdperKnownSkuPeriods = pdperKeys.map((key) => {
      const path = findPath(window.PDPER[key], knownSku, 7);
      return path ? { key, path } : null;
    }).filter(Boolean);

    const inlineMatches = Array.from(document.scripts)
      .map((script, index) => ({ index, text: script.innerText || script.textContent || "" }))
      .filter((entry) => entry.text.length)
      .map((entry) => ({
        index: entry.index,
        hits: usageTerms.map((term) => ({ term, snippet: snippetAround(entry.text, term) })).filter((hit) => hit.snippet),
      }))
      .filter((entry) => entry.hits.length);

    const resourceUrls = new Set();
    for (const script of Array.from(document.scripts)) if (script.src) resourceUrls.add(script.src);
    for (const entry of performance.getEntriesByType("resource")) if (/\.(js|html|txt)(\?|$)/.test(entry.name)) resourceUrls.add(entry.name);

    const visibleText = document.body?.innerText || "";
    const freshnessMatches = Array.from(visibleText.matchAll(/(?:Snowflake|동기화|갱신|업데이트|기준|version|Version)[^\n]{0,100}/gi)).map((match) => match[0]).slice(0, 20);
    const controls = Array.from(document.querySelectorAll("select, input, button, [role='button'], [aria-selected]")).slice(0, 160).map((el) => ({
      tag: el.tagName,
      id: el.id || null,
      name: el.getAttribute("name"),
      type: el.getAttribute("type"),
      value: el.value,
      text: (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 160),
      options: el.tagName === "SELECT" ? Array.from(el.options).slice(0, 100).map((option) => ({ value: option.value, text: option.textContent })) : undefined,
    }));

    return {
      url: location.href,
      generatedAt: new Date().toISOString(),
      globals: Object.fromEntries(globalNames.map((name) => [name, globalSummary(name)])),
      knownSku,
      pmetaKnownSkuRaw: pmeta,
      pdetKnownSku: {
        summary: summarize(pdet, 0, 3),
        srp: pdet?.srp ?? null,
        channelSums: pdetSums,
        relationships: {
          pmeta3: pmeta?.[3] ?? null,
          pmeta5: pmeta?.[5] ?? null,
          pmeta8: pmeta?.[8] ?? null,
          pmeta11: pmeta?.[11] ?? null,
          pmeta12: pmeta?.[12] ?? null,
          pmeta8OverPmeta5: pmeta?.[5] ? Number((pmeta[8] / pmeta[5]).toFixed(6)) : null,
          pdetQtySumEqualsPmeta8: pdetSums.sums[2] === pmeta?.[8],
          pmeta4FromInQtySrpVatExcluded: pmeta?.[5] && pdet?.srp ? pmeta[5] * pdet.srp / 1.1 : null,
        },
      },
      pdper: {
        keyCount: pdperKeys.length,
        keys: pdperKeys,
        y26Keys: pdperKeys.filter((key) => key.startsWith("26-")),
        augustLikeKeys: pdperKeys.filter((key) => key.startsWith("26-08") || /08|8|W3|W4/i.test(key)),
        firstThree: pdperFirstThree,
        knownSkuPeriods: pdperKnownSkuPeriods.slice(0, 40),
      },
      ord: {
        keys: Object.keys(window.ORD || {}),
        waSummary: summarize(window.ORD?.WA, 0, 3),
        waNestedKeyStats: nestedKeyStats(window.ORD?.WA, 3),
        knownSkuPath: findPath(window.ORD?.WA, knownSku, 7),
        sampleSkuLikeKeys: Object.keys(window.ORD?.WA || {}).filter((key) => /^WA/.test(key)).slice(0, 40),
      },
      atom: {
        keys: Object.keys(window.ATOM || {}),
        y26Summary: summarize(window.ATOM?.["26"], 0, 4),
        y26NestedKeyStats: nestedKeyStats(window.ATOM?.["26"], 4),
      },
      img: {
        knownSkuSummary: summarize(window.IMG?.[knownSku], 0, 2),
        knownSkuPrefix: typeof window.IMG?.[knownSku] === "string" ? window.IMG[knownSku].slice(0, 80) : null,
      },
      page: {
        title: document.title,
        freshnessMatches,
        controls,
        metaText: {
          dataStatus: document.getElementById("dataStatus")?.textContent || null,
          metaPeriod: document.getElementById("metaPeriod")?.textContent || null,
          metaSeason: document.getElementById("metaSeason")?.textContent || null,
          metaUnit: document.getElementById("metaUnit")?.textContent || null,
          metaUpdated: document.getElementById("metaUpdated")?.textContent || null,
        },
      },
      sources: {
        sourceCount: resourceUrls.size,
        urls: Array.from(resourceUrls).slice(0, 120),
        inlineMatches,
      },
    };
  }, { knownSku: KNOWN_SKU, globalNames: GLOBAL_NAMES, usageTerms: USAGE_TERMS });
}

async function inspectResourceUsage(page, urls) {
  return page.evaluate(async ({ urls, usageTerms }) => {
    function snippetAround(text, term, radius = 700) {
      const idx = text.indexOf(term);
      if (idx < 0) return null;
      return text.slice(Math.max(0, idx - radius), Math.min(text.length, idx + term.length + radius)).replace(/\s+/g, " ");
    }
    const out = [];
    for (const url of urls.slice(0, 120)) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) continue;
        const text = await response.text();
        const hits = usageTerms.map((term) => ({ term, snippet: snippetAround(text, term) })).filter((hit) => hit.snippet);
        if (hits.length) out.push({ url, length: text.length, hits });
      } catch {
        // Ignore unreadable cross-origin resources.
      }
    }
    return out;
  }, { urls, usageTerms: USAGE_TERMS });
}

function statusTable() {
  return [
    ["sku", "PMETA key", "CONFIRMED"],
    ["name", "PMETA[10]", "INFERRED"],
    ["category", "PMETA[2] / SKU regex", "INFERRED"],
    ["season", "PMETA[0], PMETA[1] / SKU regex", "INFERRED"],
    ["gender", "PMETA[10] name text heuristic", "INFERRED"],
    ["sales", "PDET.ch[*][0] or PDPER candidate", "UNKNOWN"],
    ["priorSales", "PDPER period candidate", "UNKNOWN"],
    ["quantity", "PDET.ch[*][2] or PMETA[12]", "UNKNOWN"],
    ["inQty", "PMETA[5]", "INFERRED"],
    ["cumQty", "PMETA[8] / sum(PDET.ch[*][2])", "INFERRED"],
    ["stock", "PMETA[11] candidate", "UNKNOWN"],
    ["sellThrough", "PMETA[3]", "INFERRED"],
    ["stockRate", "100 - sellThrough or stock/inQty", "INFERRED"],
    ["wow", "current/prior sales", "UNKNOWN"],
    ["sourceUpdatedAt", "visible Snowflake text", "CONFIRMED"],
  ];
}

function renderDoc(summary) {
  const globals = Object.entries(summary.globals)
    .map(([name, info]) => `| ${name} | ${info.type} | ${info.keyCount} | ${info.waKeyCount} | ${info.knownSkuExists ? "yes" : "no"} | ${info.sampleWaKeys.join(", ")} |`)
    .join("\n");
  const mapping = statusTable()
    .map(([field, source, status]) => `| ${field} | ${source} | ${status} |`)
    .join("\n");
  return `# Sales Dashboard Schema

Generated at: ${formatNow()}
Source URL: ${SALES_DASHBOARD_URL}

This document is an inspect-only schema note. Raw authenticated data dumps are intentionally not stored here.

## Runtime Globals

| Global | type | key count | WA key count | ${KNOWN_SKU} | sample WA keys |
| --- | --- | ---: | ---: | --- | --- |
${globals}

## PDPER

- key count: ${summary.pdper.keyCount}
- keys: ${summary.pdper.keys.join(", ")}
- 26-year keys: ${summary.pdper.y26Keys.join(", ")}
- August-like candidates: ${summary.pdper.augustLikeKeys.join(", ") || "none by key name"}
- ${KNOWN_SKU} direct/indirect path count: ${summary.pdper.knownSkuPeriods.length}

First 3 key summaries:

\`\`\`json
${JSON.stringify(summary.pdper.firstThree, null, 2)}
\`\`\`

Known SKU period paths:

\`\`\`json
${JSON.stringify(summary.pdper.knownSkuPeriods, null, 2)}
\`\`\`

## ORD["WA"]

\`\`\`json
${JSON.stringify(summary.ord, null, 2)}
\`\`\`

## ATOM["26"]

\`\`\`json
${JSON.stringify(summary.atom, null, 2)}
\`\`\`

## PMETA / PDET / IMG Known SKU

\`\`\`json
${JSON.stringify({
  PMETA: summary.pmetaKnownSkuRaw,
  PDET: summary.pdetKnownSku,
  IMG: summary.img,
}, null, 2)}
\`\`\`

## Dashboard Runtime Text

\`\`\`json
${JSON.stringify(summary.page, null, 2)}
\`\`\`

## Script Usage Snippets

\`\`\`json
${JSON.stringify({
  inlineMatches: summary.sources.inlineMatches,
  resourceMatches: summary.resourceMatches,
}, null, 2)}
\`\`\`

## latest.json Mapping Gate

| latest field | candidate source | status |
| --- | --- | --- |
${mapping}

## Production Gate

The production writer remains blocked unless current period sales, previous period sales, quantity, sellThrough, and either direct stock or confirmed inQty+cumQty are confirmed from dashboard usage.
`;
}

async function main() {
  const context = await openContext();
  try {
    const page = await openDashboard(context);
    const summary = await inspectRuntime(page);
    summary.resourceMatches = await inspectResourceUsage(page, summary.sources.urls);
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
    mkdirSync(resolve(ROOT, "docs"), { recursive: true });
    writeFileSync(resolve(SNAPSHOT_DIR, "inspect-summary.json"), JSON.stringify(summary, null, 2) + "\n", "utf8");
    writeFileSync(DOC_PATH, renderDoc(summary), "utf8");
    console.log(JSON.stringify({
      ok: true,
      doc: DOC_PATH,
      summary: resolve(SNAPSHOT_DIR, "inspect-summary.json"),
      globals: summary.globals,
      metaText: summary.page.metaText,
      pdperKeyCount: summary.pdper.keyCount,
      pdperKnownSkuPeriodCount: summary.pdper.knownSkuPeriods.length,
      ordKnownSkuPath: summary.ord.knownSkuPath,
      sourceUpdatedAtCandidates: summary.page.freshnessMatches,
    }, null, 2));
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
