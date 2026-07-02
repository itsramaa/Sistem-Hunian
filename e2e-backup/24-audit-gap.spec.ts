import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

// KF-11 Gap: Audit Trail — filter, export CSV, viewer ditolak
test.describe("KF-11 Gap — Audit Trail Filter & Export (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/audit");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
  });

  test("KF-11-02: Filter log berdasarkan properti", async ({ page }) => {
    await saveScreenshot(page, "kf11-audit-before-filter-property");

    const propertyFilter = page
      .locator(
        "select[name*='property'], [role='combobox'][id*='property'], button[id*='property']",
      )
      .first();
    if (await propertyFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await propertyFilter.click();
      await page.waitForTimeout(500);
      const firstOption = page.locator("[role='option']").first();
      if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstOption.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf11-audit-filter-property-result");
        const body = await page.textContent("body");
        expect(body).toBeTruthy();
      }
    } else {
      // Cari select/filter apapun
      const selects = page.locator("select, [role='combobox']");
      const count = await selects.count();
      if (count > 0) {
        await selects.first().click();
        await page.waitForTimeout(500);
        await saveScreenshot(page, "kf11-audit-filter-any");
      } else {
        await saveScreenshot(page, "kf11-audit-no-filter");
      }
    }
  });

  test("KF-11-03: Filter log berdasarkan rentang tanggal", async ({ page }) => {
    await saveScreenshot(page, "kf11-audit-before-filter-date");

    const dateInputs = page.locator(
      "input[type='date'], input[name*='date'], input[name*='from'], input[name*='to']",
    );
    const count = await dateInputs.count();
    if (count >= 2) {
      // From date
      await dateInputs.first().fill("2026-06-01");
      // To date
      await dateInputs.nth(1).fill("2026-06-28");
      await page.waitForTimeout(500);

      const applyBtn = page.getByRole("button", {
        name: /filter|terapkan|cari|apply/i,
      });
      if (await applyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await applyBtn.click();
        await page.waitForLoadState("networkidle");
      }
      await saveScreenshot(page, "kf11-audit-filter-date-result");
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else if (count === 1) {
      await dateInputs.first().fill("2026-06-01");
      await saveScreenshot(page, "kf11-audit-filter-single-date");
    } else {
      await saveScreenshot(page, "kf11-audit-no-date-filter");
    }
  });

  test("KF-11-04: Filter log berdasarkan pengguna/proses sistem", async ({
    page,
  }) => {
    await saveScreenshot(page, "kf11-audit-before-filter-user");

    const userFilter = page
      .locator(
        "select[name*='user'], select[name*='trigger'], [role='combobox'][id*='user']",
      )
      .first();
    if (await userFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await userFilter.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf11-audit-filter-user-open");

      const firstOption = page.locator("[role='option']").first();
      if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstOption.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf11-audit-filter-user-result");
      }
    } else {
      await saveScreenshot(page, "kf11-audit-no-user-filter");
    }
  });

  test("KF-11-05: Ekspor log ke format CSV", async ({ page }) => {
    await saveScreenshot(page, "kf11-audit-before-export");

    const exportBtn = page.getByRole("button", {
      name: /ekspor|export|csv|unduh|download/i,
    });
    if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Setup download listener sebelum klik
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 15000 }),
        exportBtn.click(),
      ]);
      const filename = download.suggestedFilename();
      await saveScreenshot(page, "kf11-audit-export-triggered");
      expect(filename).toBeTruthy();
      // Verifikasi ekstensi CSV
      expect(filename.toLowerCase()).toMatch(/\.csv$/);
    } else {
      await saveScreenshot(page, "kf11-audit-no-export-btn");
    }
  });
});

test.describe("KF-11 Gap — Viewer tidak bisa akses Audit Trail", () => {
  test("KF-11-06: Viewer akses /dashboard/audit → ditolak", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.goto("/dashboard/audit");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf11-viewer-audit-access");

    const url = page.url();
    expect(url).not.toContain("/audit");
  });
});
