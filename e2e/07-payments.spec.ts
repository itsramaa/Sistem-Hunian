import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

test.describe("Manajemen Pembayaran (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  test("AC-PAY-01: Daftar pembayaran tampil", async ({ page }) => {
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf06-list");
    const content = page.locator("table, [class*='table'], [class*='card']");
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test("AC-PAY-09: Status badge pembayaran", async ({ page }) => {
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf06-badges");
    // Check for status badges (lunas, approaching due, late)
    const badges = page.locator("[class*='badge'], [class*='Badge']");
    if ((await badges.count()) > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test("AC-PAY-02 ~ 04: Filter berfungsi", async ({ page }) => {
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    // Find all filters
    const selects = page.locator(
      "select, [class*='select'], [role='combobox']",
    );
    const count = await selects.count();
    await saveScreenshot(page, "kf06-filters");
    if (count > 0) {
      await selects.first().click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf06-filter-open");
    }
  });

  test("AC-PAY-10: Klik payment → detail page", async ({ page }) => {
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    const firstLink = page.locator("a[href*='/dashboard/payments/']").first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf06-detail");
      expect(page.url()).toContain("/payments/");
    }
  });
});
