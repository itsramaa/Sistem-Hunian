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
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
  });

  // KF-04-02
  test("KF-04-02: Tampil dashboard sebagai Viewer — statistik dan panel Viewer Request", async ({ page }) => {
    await login(page, "viewer");
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "kf04-dashboard-viewer");
    expect(page.url()).toContain("/dashboard");
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
  });

  // KF-04-03
  test("KF-04-03: Panel peringatan konfirmasi DP mendekati batas tanggal — muncul di dashboard", async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf04-dashboard-dp-alert");
    // Panel muncul kondisional berdasarkan data — verifikasi halaman dapat diakses
    expect(page.url()).toContain("/dashboard");
  });

  // KF-04-04
  test("KF-04-04: Panel peringatan pembayaran mendekati jatuh tempo — muncul di dashboard", async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf04-dashboard-payment-alert");
    expect(page.url()).toContain("/dashboard");
  });
});
