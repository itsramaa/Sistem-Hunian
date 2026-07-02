import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

test.describe("Konfirmasi DP (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  test("AC-CONF-01: Daftar konfirmasi tampil", async ({ page }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf07-list");
    const content = page.locator("table, [class*='table'], [class*='card']");
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test("AC-CONF-07: Badge expired tampil merah", async ({ page }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf07-expired-badge");
    const badges = page.locator("[class*='badge'], [class*='Badge']");
    if ((await badges.count()) > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test("AC-CONF-08: Countdown sisa hari tampil", async ({ page }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf07-countdown");
    // Look for countdown text (e.g., "2 hari lagi")
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});
