import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const URL = process.env.SALES_DASHBOARD_URL || "https://sales-dashboard-13g.pages.dev/dashboard/";
const PROFILE_DIR = resolve(ROOT, process.env.SALES_DASHBOARD_PROFILE_DIR || ".local-sales-dashboard-profile");
const SNAPSHOT_DIR = resolve(ROOT, ".local-sales-snapshot");
const DOC_PATH = resolve(ROOT, "docs/sales-dashboard-schema.md");
const SKU = "WA2602CD52";
const PERIODS = ["26-08W3", "26-08W4"];

function sumChannels(stylePeriod) {
  const sums = Array(15).fill(0);
  const channels = stylePeriod && typeof stylePeriod === "object" ? Object.keys(stylePeriod) : [];
  for (const values of Object.values(stylePeriod || {})) {
    if (!Array.isArray(values)) continue;
    for (let index = 0; index < Math.min(values.length, sums.length); index += 1) sums[index] += Number(values[index] || 0);
  }
  return { channelCount: channels.length, channels, sums };
}

function compactArray(values, limit = 15) {
  return Array.isArray(values) ? values.slice(0, limit) : values;
}

async function main() {
  mkdirSync(PROFILE_DIR, { recursive: true });
  const context = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1440, height: 1000 } });
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto(URL, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.PMETA && window.PDET && window.PDPER && window.ORD && window.ATOM), null, { timeout: 45_000 });

    const summary = await page.evaluate(({ sku, periods }) => {
      function typeOf(value) {
        if (Array.isArray(value)) return "array";
        if (value === null) return "null";
        return typeof value;
      }
      function sumChannelsInPage(stylePeriod) {
        const sums = Array(15).fill(0);
        const channels = stylePeriod && typeof stylePeriod === "object" ? Object.keys(stylePeriod) : [];
        const samples = [];
        for (const [channel, values] of Object.entries(stylePeriod || {})) {
          if (!Array.isArray(values)) continue;
          for (let index = 0; index < Math.min(values.length, sums.length); index += 1) sums[index] += Number(values[index] || 0);
          if (samples.length < 4) samples.push({ channel, values: values.slice(0, 15) });
        }
        return { channelCount: channels.length, channels, sums, samples };
      }
      function pdetSums(row) {
        const sums = [0, 0, 0];
        const samples = [];
        for (const [channel, values] of Object.entries(row?.ch || {})) {
          if (!Array.isArray(values)) continue;
          for (let index = 0; index < 3; index += 1) sums[index] += Number(values[index] || 0);
          if (samples.length < 6) samples.push({ channel, values: values.slice(0, 3) });
        }
        return { channelCount: Object.keys(row?.ch || {}).length, sums, samples };
      }
      function globalInfo(name) {
        const value = window[name];
        const keys = value && typeof value === "object" ? Object.keys(value) : [];
        const waKeys = keys.filter((key) => key.startsWith("WA"));
        return {
          type: typeOf(value),
          keyCount: keys.length,
          waKeyCount: waKeys.length,
          sampleKeys: keys.slice(0, 8),
          sampleWaKeys: waKeys.slice(0, 8),
          knownSkuExists: Boolean(value && typeof value === "object" && sku in value),
        };
      }

      const pdperPeriodSummary = {};
      for (const period of periods) {
        const entry = window.PDPER?.[period] || {};
        pdperPeriodSummary[period] = {
          keys: Object.keys(entry),
          curHasSku: Boolean(entry.cur?.[sku]),
          prevHasSku: Boolean(entry.prev?.[sku]),
          cur: sumChannelsInPage(entry.cur?.[sku]),
          prev: sumChannelsInPage(entry.prev?.[sku]),
        };
      }

      const annPeriod = document.getElementById("annPeriod");
      const periodOptions = annPeriod
        ? Array.from(annPeriod.options).map((option) => ({ value: option.value, text: option.textContent }))
        : [];
      const visibleText = document.body?.innerText || "";
      const scripts = Array.from(document.scripts).map((script, index) => ({ index, src: script.src, text: script.innerText || script.textContent || "" }));
      const terms = ["PMETA[", "PDET[", "PDPER[", "ORD[", "ATOM[", "PDPER", "ORD", "ATOM", "Snowflake"];
      const inlineMatches = scripts
        .filter((script) => script.text)
        .map((script) => ({
          index: script.index,
          hits: terms.map((term) => {
            const at = script.text.indexOf(term);
            return at >= 0 ? { term, snippet: script.text.slice(Math.max(0, at - 500), Math.min(script.text.length, at + 800)).replace(/\s+/g, " ") } : null;
          }).filter(Boolean),
        }))
        .filter((entry) => entry.hits.length);

      return {
        generatedAt: new Date().toISOString(),
        url: location.href,
        title: document.title,
        globals: Object.fromEntries(["PMETA", "PDET", "PDPER", "ORD", "ATOM", "IMG"].map((name) => [name, globalInfo(name)])),
        pmeta: window.PMETA?.[sku] || null,
        pdet: {
          srp: window.PDET?.[sku]?.srp ?? null,
          channels: Object.keys(window.PDET?.[sku]?.ch || {}),
          sums: pdetSums(window.PDET?.[sku]),
        },
        pdper: {
          keyCount: Object.keys(window.PDPER || {}).length,
          keys: Object.keys(window.PDPER || {}),
          firstThreeShape: Object.keys(window.PDPER || {}).slice(0, 3).map((key) => {
            const entry = window.PDPER[key];
            const firstSku = Object.keys(entry?.cur || {})[0];
            const firstChannel = firstSku ? Object.keys(entry.cur[firstSku] || {})[0] : null;
            return {
              key,
              topKeys: Object.keys(entry || {}),
              curSkuCount: Object.keys(entry?.cur || {}).length,
              prevSkuCount: Object.keys(entry?.prev || {}).length,
              firstSku,
              firstChannel,
              firstValues: firstSku && firstChannel ? entry.cur[firstSku][firstChannel].slice(0, 15) : null,
            };
          }),
          selectedValue: annPeriod?.value || null,
          options: periodOptions,
          periods: pdperPeriodSummary,
        },
        ord: {
          keys: Object.keys(window.ORD || {}),
          waCategoryCount: Object.keys(window.ORD?.WA || {}).length,
          waSampleCategories: Object.keys(window.ORD?.WA || {}).slice(0, 28),
          sample: Object.fromEntries(Object.entries(window.ORD?.WA || {}).slice(0, 5).map(([category, value]) => [category, {
            keys: Object.keys(value || {}),
            values: Object.fromEntries(Object.entries(value || {}).slice(0, 6).map(([key, arr]) => [key, Array.isArray(arr) ? arr.slice(0, 5) : arr])),
          }])),
          knownSkuDirect: Boolean(window.ORD?.WA?.[sku]),
        },
        atom: {
          keys: Object.keys(window.ATOM || {}),
          y26TopKeys: Object.keys(window.ATOM?.["26"] || {}),
          y26Sample: Object.fromEntries(Object.entries(window.ATOM?.["26"] || {}).slice(0, 3).map(([topKey, value]) => [topKey, {
            keyCount: Object.keys(value || {}).length,
            sampleKeys: Object.keys(value || {}).slice(0, 12),
            firstChild: (() => {
              const firstKey = Object.keys(value || {})[0];
              const child = firstKey ? value[firstKey] : null;
              return { key: firstKey, type: typeOf(child), sampleKeys: child && typeof child === "object" ? Object.keys(child).slice(0, 12) : [], sample: Array.isArray(child) ? child.slice(0, 15) : null };
            })(),
          }])),
        },
        img: {
          knownSkuExists: Boolean(window.IMG?.[sku]),
          knownSkuType: typeOf(window.IMG?.[sku]),
          knownSkuPrefix: typeof window.IMG?.[sku] === "string" ? window.IMG[sku].slice(0, 80) : null,
        },
        page: {
          freshnessMatches: Array.from(visibleText.matchAll(/(?:Snowflake|동기화|갱신|업데이트|기준|version|Version)[^\n]{0,100}/gi)).map((match) => match[0]).slice(0, 20),
          selectedPeriodText: periodOptions.find((option) => option.value === annPeriod?.value)?.text || null,
          controlSummary: {
            annPeriodExists: Boolean(annPeriod),
            annPeriodValue: annPeriod?.value || null,
            buttonTexts: Array.from(document.querySelectorAll("button")).map((button) => button.innerText.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 80),
          },
        },
        sources: {
          scripts: scripts.map((script) => ({ index: script.index, src: script.src || null, inlineLength: script.src ? 0 : script.text.length })),
          inlineMatches,
        },
      };
    }, { sku: SKU, periods: PERIODS });

    summary.pdet.relationships = {
      pmeta3EqualsPmeta8OverPmeta5: summary.pmeta?.[5] ? Number((summary.pmeta[8] / summary.pmeta[5]).toFixed(6)) === Number(summary.pmeta[3].toFixed(6)) : false,
      pmeta4EqualsInQtySrpVatExcluded: summary.pmeta?.[5] && summary.pdet.srp ? Math.round(summary.pmeta[5] * summary.pdet.srp / 1.1) === Math.round(summary.pmeta[4]) : false,
      pdetQtySumEqualsPmeta8: summary.pdet.sums.sums[2] === summary.pmeta?.[8],
    };

    mkdirSync(SNAPSHOT_DIR, { recursive: true });
    mkdirSync(resolve(ROOT, "docs"), { recursive: true });
    writeFileSync(resolve(SNAPSHOT_DIR, "inspect-summary.json"), JSON.stringify(summary, null, 2) + "\n", "utf8");
    writeFileSync(DOC_PATH, renderDoc(summary), "utf8");
    console.log(JSON.stringify({
      ok: true,
      summaryPath: resolve(SNAPSHOT_DIR, "inspect-summary.json"),
      docPath: DOC_PATH,
      selectedPeriod: summary.pdper.selectedValue,
      selectedPeriodText: summary.page.selectedPeriodText,
      freshness: summary.page.freshnessMatches,
      pdperPeriods: summary.pdper.periods,
    }, null, 2));
  } finally {
    await context.close();
  }
}

function renderDoc(summary) {
  const globalRows = Object.entries(summary.globals).map(([name, info]) =>
    `| ${name} | ${info.type} | ${info.keyCount} | ${info.waKeyCount} | ${info.knownSkuExists ? "yes" : "no"} | ${info.sampleKeys.join(", ")} |`
  ).join("\n");
  const mapping = [
    ["sku", "PMETA key", "CONFIRMED"],
    ["name", "PMETA[10]", "CONFIRMED"],
    ["category", "PMETA[2] and SKU code", "INFERRED"],
    ["season", "PMETA[0], PMETA[1], SKU code", "INFERRED"],
    ["gender", "PMETA[10] product name text", "INFERRED"],
    ["sales", "PDPER[period].cur[sku][channel][0] sum", "CONFIRMED"],
    ["priorSales", "PDPER[period].prev[sku][channel][0] sum", "CONFIRMED"],
    ["quantity", "PDPER[period].cur[sku][channel][2] sum", "CONFIRMED"],
    ["inQty", "PMETA[5]", "INFERRED"],
    ["cumQty", "PMETA[8] and sum(PDET.ch[*][2])", "CONFIRMED"],
    ["stock", "PMETA[11] candidate", "UNKNOWN"],
    ["sellThrough", "PMETA[3] = PMETA[8] / PMETA[5]", "INFERRED"],
    ["stockRate", "100 - sellThrough", "INFERRED"],
    ["wow", "(sales - priorSales) / priorSales", "CONFIRMED"],
    ["sourceUpdatedAt", "visible page text: Snowflake sync timestamp", "CONFIRMED"],
  ].map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} |`).join("\n");

  return `# Sales Dashboard Schema

Generated at: ${new Date().toISOString()}
Source URL: ${URL}

Compact authenticated inspect only. Raw full dashboard payloads are not stored.

## Runtime Globals

| Global | type | key count | WA key count | ${SKU} exists | sample keys |
| --- | --- | ---: | ---: | --- | --- |
${globalRows}

## PDPER Structure

- Object shape: \`PDPER[periodKey] = { cur, prev }\`
- Period selector id: \`annPeriod\`
- Selected value during inspect: \`${summary.pdper.selectedValue}\`
- Selected label: \`${summary.page.selectedPeriodText}\`
- Key count: ${summary.pdper.keyCount}
- Keys: ${summary.pdper.keys.join(", ")}

\`\`\`json
${JSON.stringify(summary.pdper.firstThreeShape, null, 2)}
\`\`\`

## PDPER Known SKU Period Samples

\`\`\`json
${JSON.stringify(summary.pdper.periods, null, 2)}
\`\`\`

## PDET Known SKU

\`\`\`json
${JSON.stringify({ srp: summary.pdet.srp, channels: summary.pdet.channels, sums: summary.pdet.sums, relationships: summary.pdet.relationships }, null, 2)}
\`\`\`

## PMETA Known SKU

\`\`\`json
${JSON.stringify(summary.pmeta, null, 2)}
\`\`\`

## ORD["WA"]

\`\`\`json
${JSON.stringify(summary.ord, null, 2)}
\`\`\`

## ATOM["26"]

\`\`\`json
${JSON.stringify(summary.atom, null, 2)}
\`\`\`

## Freshness

${summary.page.freshnessMatches.map((line) => `- ${line}`).join("\n")}

## latest.json Mapping Gate

| latest field | source | status |
| --- | --- | --- |
${mapping}

## Production Gate

Writer remains closed until stock or inQty+cumQty are CONFIRMED by dashboard UI/code semantics, not only arithmetic inference.
`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
