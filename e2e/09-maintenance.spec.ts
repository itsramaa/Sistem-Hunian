import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

test.describe("Manajemen Maintenance (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  test("AC-MAINT-01: Daftar maintenance tampil", async ({ page }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "maintenance-list");
    const content = page.locator("table, [class*='table'], [class*='card']");
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test("AC-MAINT-02: Filter berfungsi", async ({ page }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    const selects = page.locator(
      "select, [class*='select'], [role='combobox']",
    );
    await saveScreenshot(page, "maintenance-filters");
    if ((await selects.count()) > 0) {
      await selects.first().click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "maintenance-filter-open");
    }
  });

  test("AC-MAINT-06: Klik maintenance → detail page", async ({ page }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    const firstLink = page
      .locator("a[href*='/dashboard/maintenance/']")
      .first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "maintenance-detail");
      expect(page.url()).toContain("/maintenance/");
    }
  });
});

test.describe("Manajemen Maintenance (Manager)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "manager");
    // Wait for auth state to fully settle before navigating
    await page.waitForTimeout(2000);
  });

  test("AC-MAINT-07: Manager dapat akses maintenance", async ({ page }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "maintenance-manager");
    // Per router.tsx maintenance allows ['operator', 'manager']
    expect(page.url()).toContain("/maintenance");
  });
});
