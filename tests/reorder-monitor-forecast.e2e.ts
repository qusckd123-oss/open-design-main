import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const latest = JSON.parse(readFileSync("data/latest.json", "utf8"));
const expected = {
  total: latest.styles.length,
  high: latest.styles.filter((row) => row.forecastSignal === "HIGH").length,
  lowHigh: latest.styles.filter((row) => row.stockRisk === "LOW" && row.forecastSignal === "HIGH").length,
  acc: latest.styles.filter((row) => row.productGroup === "ACC").length,
};
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

try {
  const response = await page.goto("http://127.0.0.1:3000/reorder-monitor.html", { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);
  await page.waitForSelector("#styleRows tr");
  const initialCount = await page.locator("#styleRows tr").count();
  assert.equal(initialCount, expected.total);
  assert.equal(await page.evaluate(() => window.__WACKY_DASHBOARD_CONFIG__?.REORDER_READ_ONLY), true);
  assert.equal(await page.locator("#readOnlyBadge").isVisible(), true);
  assert.equal(await page.locator(".eligibility-select").count(), 0);
  assert.equal(await page.locator("#drawerMemo").isVisible(), false);
  assert.equal(await page.locator("#exportOverrides").isVisible(), false);
  assert.deepEqual(await page.locator("#forecastFilter option").allTextContents(), ["전체", "HIGH", "WATCH", "NORMAL", "INSUFFICIENT"]);

  const firstStyle = latest.styles[0];
  const filterChecks = [
    ["productGroupFilter", "APP"],
    ["genderGroupFilter", "UNISEX"],
    ["seasonFilter", firstStyle.season],
    ["categoryFilter", firstStyle.category],
    ["trendFilter", "STABLE"],
    ["riskFilter", "LOW"],
    ["previewFilter", "NORMAL"],
    ["eligibilityFilter", "UNSET"],
    ["specialMarketFilter", "special"],
  ];
  for (const [id, value] of filterChecks) {
    await page.locator(`#${id}`).selectOption(value);
    const count = await page.locator("#styleRows tr").count();
    assert.ok(count > 0 && count <= initialCount, `${id} filter returned ${count}`);
    await page.locator("#resetFilters").click();
  }
  await page.locator("#searchFilter").fill(firstStyle.sku);
  assert.ok(await page.locator("#styleRows tr").count() > 0);
  await page.locator("#resetFilters").click();

  await page.getByRole("button", { name: "미래 위험 HIGH", exact: true }).click();
  const highCount = await page.locator("#styleRows tr").count();
  assert.equal(highCount, expected.high);
  assert.equal(await page.locator("#styleRows tr td:nth-child(17)").first().innerText(), "HIGH");

  await page.getByRole("button", { name: "현재 LOW + 미래 HIGH", exact: true }).click();
  const lowHighCount = await page.locator("#styleRows tr").count();
  assert.equal(lowHighCount, expected.lowHigh);
  assert.equal(await page.locator("#styleRows tr td:nth-child(15)").first().innerText(), "LOW");
  assert.equal(await page.locator("#styleRows tr td:nth-child(17)").first().innerText(), "HIGH");

  await page.locator("#resetFilters").click();
  await page.locator("#productGroupFilter").selectOption("ACC");
  assert.equal(await page.locator("#styleRows tr").count(), expected.acc);
  await page.locator("#forecastFilter").selectOption("INSUFFICIENT");
  assert.equal(await page.locator("#styleRows tr").count(), expected.acc);

  await page.locator("#resetFilters").click();
  await page.getByRole("button", { name: "미래 위험 HIGH", exact: true }).click();
  const firstRow = page.locator("#styleRows tr").first();
  const firstSku = await firstRow.getAttribute("data-sku");
  const eligibilityBefore = await firstRow.locator("td:nth-child(18)").innerText();
  await firstRow.click();
  assert.equal(await page.locator("#drawerForecast").isVisible(), true);
  assert.match(await page.locator("#drawerForecast").innerText(), /현재 위험[\s\S]*미래 위험[\s\S]*Forecast: HIGH/);
  assert.ok(await page.locator("#drawerForecast li").count() <= 5);
  assert.equal(await page.locator("#historyChart").count(), 1);
  mkdirSync(".local-sales-snapshot", { recursive: true });
  await page.screenshot({ path: ".local-sales-snapshot/forecast-drawer-readonly.png", fullPage: false });
  await page.locator("#drawerClose").click();

  await page.evaluate(({ sku, value }) => localStorage.setItem("wacky.reorderOverrides.v1", JSON.stringify({ [sku]: { reorderEligibility: value } })), { sku: firstSku, value: eligibilityBefore === "ACTIVE" ? "CLOSED" : "ACTIVE" });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("#styleRows tr");
  const persistedRow = page.locator(`#styleRows tr[data-sku="${firstSku}"]`);
  assert.equal(await persistedRow.locator("td:nth-child(18)").innerText(), eligibilityBefore);

  await page.screenshot({ path: ".local-sales-snapshot/forecast-readonly.png", fullPage: false });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, initialCount, highCount, lowHighCount, accCount: expected.acc, firstSku, readOnly: true }));
} finally {
  await browser.close();
}
