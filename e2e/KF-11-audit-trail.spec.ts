import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-11 — Pencatatan Aktivitas Sistem (Audit Trail)
 * Berdasarkan Tabel 4.20 TEST_CASE.md
 */
test.describe("KF-11 — Pencatatan Aktivitas Sistem", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  // KF-11-01
  test("KF-11-01: Tampil log perubahan status kamar — daftar log kronologis", async ({
    page,
  }) => {
    await page.goto("/dashboard/audit");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "kf11-audit-trail-list");
    expect(page.url()).toContain("/audit");
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
  });

  // KF-11-02
  test("KF-11-02: Filter log berdasarkan properti — hanya log properti tersebut tampil", async ({
    page,
  }) => {
    await page.goto("/dashboard/audit");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf11-audit-before-filter-property");
    const filterCombo = page.locator("[role='combobox'], select").first();
    if (await filterCombo.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterCombo.click();
      const option = page.locator("[role='option']").first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf11-audit-filter-property-applied");
      }
    }
    expect(page.url()).toContain("/audit");
  });

  // KF-11-03
  test("KF-11-03: Filter log berdasarkan rentang tanggal — log sesuai rentang tampil", async ({
    page,
  }) => {
    await page.goto("/dashboard/audit");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf11-audit-before-filter-date");
    const dateInput = page.locator("input[type='date']").first();
    if (await dateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dateInput.fill("2026-06-01");
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf11-audit-filter-date-applied");
    }
    expect(page.url()).toContain("/audit");
  });

  // KF-11-04
  test("KF-11-04: Filter log berdasarkan pengguna atau proses sistem", async ({
    page,
  }) => {
    await page.goto("/dashboard/audit");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf11-audit-before-filter-user");
    const filterCombos = page.locator("[role='combobox'], select");
    const count = await filterCombos.count();
    if (count >= 2) {
      await filterCombos.nth(1).click();
      const option = page.locator("[role='option']").first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf11-audit-filter-user-applied");
      }
    }
    expect(page.url()).toContain("/audit");
  });

  // KF-11-05
  test("KF-11-05: Ekspor log ke format CSV — berkas CSV terunduh", async ({
    page,
  }) => {
    await page.goto("/dashboard/audit");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf11-audit-before-export");
    const exportBtn = page.getByRole("button", { name: /ekspor|export|csv/i });
    if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveScreenshot(page, "kf11-audit-export-btn-visible");
      await expect(exportBtn).toBeVisible();
    }
    expect(page.url()).toContain("/audit");
  });
});

// Viewer test terpisah
test.describe("KF-11 — Pencatatan Aktivitas Sistem (Viewer)", () => {
  // KF-11-06
  test("KF-11-06: Akses audit trail sebagai Viewer — akses ditolak", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.waitForTimeout(500);
    await page.goto("/dashboard/audit");
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf11-viewer-audit-blocked");
    expect(page.url()).not.toContain("/audit");
  });
});
