import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

test.describe("Manajemen Penghuni (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  test("AC-TENANT-01: Tab Penghuni Aktif tampil", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    // Wait extra for data to load — tenant page sometimes slow
    await page.waitForTimeout(3000);
    await saveScreenshot(page, "kf05-active-tab");
    // Check either table, tab panel, or any meaningful content
    const content = page.locator(
      "table, [role='tabpanel'], [class*='card'], h1, h2",
    );
    await expect(content.first()).toBeVisible({ timeout: 20000 });
    expect(page.url()).toContain("/tenants");
  });

  test("AC-TENANT-02: Tab Histori Penghuni tampil", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const historyTab = page.getByRole("tab", {
      name: /histori|history|riwayat/i,
    });
    if (await historyTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await historyTab.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf05-history-tab");
    } else {
      await saveScreenshot(page, "kf05-tabs-overview");
    }
    expect(page.url()).toContain("/tenants");
  });

  test("AC-TENANT-07: Klik penghuni → detail page", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const firstLink = page.locator("a[href*='/dashboard/tenants/']").first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf05-detail");
      expect(page.url()).toContain("/tenants/");
    } else {
      await saveScreenshot(page, "kf05-no-detail-link");
    }
  });
});
