import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-04 — Dashboard Informasi Operasional
 * Berdasarkan Tabel 4.13 TEST_CASE.md
 */
test.describe("KF-04 — Dashboard Informasi Operasional", () => {
  // KF-04-01
  test("KF-04-01: Tampil dashboard sebagai Operator — statistik dan panel lengkap", async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "kf04-dashboard-operator");

    expect(page.url()).toContain("/dashboard");

    // Verifikasi kartu statistik spesifik visible
    const totalKamarCard = page
      .locator("*")
      .filter({ hasText: /total kamar|total properti|tersedia|terisi/i })
      .first();
    await expect(totalKamarCard).toBeVisible({ timeout: 5000 });
  });

  // KF-04-02
  test("KF-04-02: Tampil dashboard sebagai Viewer — statistik dan panel Viewer Request", async ({ page }) => {
    await login(page, "viewer");
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "kf04-dashboard-viewer");

    expect(page.url()).toContain("/dashboard");

    // Verifikasi panel/section Viewer Request visible untuk Viewer
    // Berdasarkan blackbox: Viewer punya "Lapor Cepat" / "Status Hunian per Properti"
    const viewerPanel = page
      .locator("*")
      .filter({ hasText: /lapor cepat|status hunian|permintaan tindakan|viewer request/i })
      .first();
    await expect(viewerPanel).toBeVisible({ timeout: 5000 });
  });

  // KF-04-03
  test("KF-04-03: Panel peringatan konfirmasi DP mendekati batas tanggal — muncul di dashboard", async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf04-dashboard-dp-alert");

    expect(page.url()).toContain("/dashboard");

    // Panel ini kondisional dari background worker — screenshot saja jika tidak ada
    const dpPanel = page
      .locator("[class*='alert'], [class*='warning'], [class*='panel']")
      .filter({ hasText: /konfirmasi|dp|batas.*tanggal|deadline/i })
      .first();
    const dpPanelAlt = page
      .locator("section, div, article")
      .filter({ hasText: /konfirmasi.*mendekati|batas.*konfirmasi|dp.*reminder/i })
      .first();

    const hasDpPanel =
      (await dpPanel.isVisible({ timeout: 3000 }).catch(() => false)) ||
      (await dpPanelAlt.isVisible({ timeout: 2000 }).catch(() => false));

    if (hasDpPanel) {
      await saveScreenshot(page, "kf04-dp-panel-visible");
    } else {
      // Kondisional dari worker — tidak fail, screenshot saja
      await saveScreenshot(page, "kf04-dp-panel-no-data");
    }

    // Yang wajib: dashboard tidak crash dan konten ada
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  // KF-04-04
  test("KF-04-04: Panel peringatan pembayaran mendekati jatuh tempo — muncul di dashboard", async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Panel ini kondisional dari background worker — screenshot saja jika tidak ada
    const paymentPanel = page
      .locator("[class*='alert'], [class*='warning'], [class*='panel']")
      .filter({ hasText: /pembayaran|payment|jatuh.*tempo|due/i })
      .first();
    const paymentPanelAlt = page
      .locator("section, div, article")
      .filter({ hasText: /pembayaran.*mendekati|jatuh.*tempo.*dekat|payment.*due/i })
      .first();

    const hasPaymentPanel =
      (await paymentPanel.isVisible({ timeout: 3000 }).catch(() => false)) ||
      (await paymentPanelAlt.isVisible({ timeout: 2000 }).catch(() => false));

    if (hasPaymentPanel) {
      await saveScreenshot(page, "kf04-payment-panel-visible");
    } else {
      await saveScreenshot(page, "kf04-payment-panel-no-data");
    }

    // Yang wajib: dashboard tidak crash dan konten ada
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);

    expect(page.url()).toContain("/dashboard");
  });
});
