import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const latest = JSON.parse(readFileSync("data/sku-latest.json", "utf8"));
const styleLatest = JSON.parse(readFileSync("data/latest.json", "utf8"));
const baseUrl = process.env.REORDER_TEST_URL || "http://127.0.0.1:3000";
const displayedStyles = new Set(styleLatest.styles.map((style: any) => style.sku));
const styleWithSku = Object.values(latest.styles).find((style: any) => style.skus?.length && displayedStyles.has(style.styleCode)) as any;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
try {
  const response = await page.goto(`${baseUrl}/reorder-monitor.html`, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);
  await page.locator("#searchFilter").fill(styleWithSku.styleCode);
  const row = page.locator(`#styleRows tr[data-sku="${styleWithSku.styleCode}"]`);
  await row.click();
  assert.equal(await page.locator("#drawerSkuTableWrap").isVisible(), true);
  assert.equal(await page.locator("#drawerSkuRows tr").count(), styleWithSku.skus.length);
  assert.match(await row.innerText(), new RegExp(`SKU ${styleWithSku.skus.length} COLORS`));
  await page.locator("#drawerSkuSort").selectOption("erpStockQty");
  const firstStock = Number((await page.locator("#drawerSkuRows tr").first().locator("td").nth(5).innerText()).replace(/,/g, ""));
  assert.equal(firstStock, Math.max(...styleWithSku.skus.map((sku: any) => sku.erpStockQty)));

  await page.locator("#drawerClose").click();
  const styleWithoutSku = styleLatest.styles.find((style: any) => !latest.styles[style.sku]);
  if (styleWithoutSku) {
    await page.locator("#searchFilter").fill(styleWithoutSku.sku);
    await page.locator(`#styleRows tr[data-sku="${styleWithoutSku.sku}"]`).click();
    assert.equal(await page.locator("#drawerSkuStatus").innerText(), "SKU 주간 데이터 없음");
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, style: styleWithSku.styleCode, skuCount: styleWithSku.skus.length }));
} finally { await browser.close(); }
