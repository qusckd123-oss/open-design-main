import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.REORDER_TEST_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
try {
  const response = await page.goto(`${baseUrl}/sku-signal-v1-evidence.html`, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);
  await page.locator("#status").waitFor();
  assert.match(await page.locator("#status").innerText(), /439개 전체/);
  assert.equal(await page.locator("#rows tr").count(), 439);

  const bodyText = await page.locator("body").innerText();
  assert.match(bodyText, /DIAGNOSTIC ONLY/);
  assert.match(bodyText, /Legacy 속도/);
  assert.match(bodyText, /Selling-age 속도/);

  // Raw internal enum tokens must never leak into planner-facing copy.
  assert.doesNotMatch(bodyText, /PRE_SALE|WTD_ONLY|DISPLAY_ONLY|UNAVAILABLE|NOT_APPLICABLE_CONFIRMED_DIRECT_SHIP|LEGACY_VS_SELLING_AGE|NEGATIVE_ERP_STOCK|NEGATIVE_STOCK_COVER|NEGATIVE_REMAINING_ORDER/);
  // No score/rank/priority/reorder-quantity production concept is introduced.
  assert.doesNotMatch(bodyText, /Signal score|priority score|reorderTiming|reorder qty|P1\/P2/);

  // Lifecycle filter reproduces the state-machine reconciliation counts.
  await page.selectOption("#lifecycle", "PRE_SALE");
  await page.waitForTimeout(150);
  assert.equal(await page.locator("#rows tr").count(), 254);
  await page.selectOption("#lifecycle", "all");

  // Special Market filter reproduces the confirmed direct-ship candidate count.
  await page.selectOption("#market", "SPECIAL_MARKET");
  await page.waitForTimeout(150);
  assert.equal(await page.locator("#rows tr").count(), 5);
  await page.selectOption("#market", "all");

  // Row detail joins state-machine facts with the Special Market diagnostic
  // for a confirmed direct-ship SKU without hiding preserved negative values.
  await page.locator("#search").fill("WA2603CRT1BK");
  await page.waitForTimeout(150);
  assert.equal(await page.locator("#rows tr").count(), 1);
  await page.locator("#rows tr").click();
  await page.locator("body.open").waitFor();
  const drawerText = await page.locator("#drawer").innerText();
  assert.match(drawerText, /-48/);
  assert.match(drawerText, /해외 직배송 확정/);
  assert.match(drawerText, /ERP 재고 원천값이 음수/);

  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, rows: 439 }));
} finally { await browser.close(); }
