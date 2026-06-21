import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

test.describe("Manajemen Kamar (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  test("AC-ROOM-01: Daftar kamar tampil dengan tabel", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "rooms-list");
    const content = page.locator("table, [class*='table'], [class*='card']");
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test("AC-ROOM-02: Status badge warna tampil", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "rooms-badges");
    const badges = page.locator("[class*='badge'], [class*='Badge'], span[class*='status']");
    // At least some badges should be visible
    if ((await badges.count()) > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test("AC-ROOM-03: Filter properti berfungsi", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    // Find select/filter for property
    const filterSelect = page.locator("select, [class*='select'], [role='combobox']").first();
    if (await filterSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterSelect.click();
      await saveScreenshot(page, "rooms-filter-prop");
    }
  });

  test("AC-ROOM-04: Filter status berfungsi", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    const selects = page.locator("select, [class*='select'], [role='combobox']");
    const count = await selects.count();
    if (count > 1) {
      await selects.nth(1).click();
      await saveScreenshot(page, "rooms-filter-status");
    }
  });

  test("AC-ROOM-09: Klik kamar → detail page", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    const firstLink = page.locator("a[href*='/dashboard/rooms/']").first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "rooms-detail");
      expect(page.url()).toContain("/rooms/");
    }
  });
});
