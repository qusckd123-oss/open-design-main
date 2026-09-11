import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.REORDER_TEST_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
try {
  const response = await page.goto(`${baseUrl}/sku-current-risk-diagnostic.html`, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);
  await page.locator("#status").waitFor();
  assert.match(await page.locator("#status").innerText(), /586개 전체/);
  assert.equal(await page.locator("#rows tr").count(), 586);
  const bodyText = await page.locator("body").innerText();
  assert.match(bodyText, /DIAGNOSTIC ONLY/);
  assert.match(bodyText, /Legacy 속도/);
  assert.match(bodyText, /Selling-age 속도/);
  assert.doesNotMatch(bodyText, /Forecast Signal|priority/);
  await page.locator("#search").fill("WA2603BG51BK");
  assert.equal(await page.locator("#rows tr").count(), 1);
  await page.locator("#rows tr").click();
  await page.locator("body.open").waitFor();
  assert.equal(await page.locator("body").evaluate((el) => el.classList.contains("open")), true);
  const drawerText = await page.locator("#drawer").innerText();
  assert.match(drawerText, /Legacy 완료 속도/);
  assert.match(drawerText, /Selling-age Cover/);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, rows: 586 }));
} finally { await browser.close(); }
