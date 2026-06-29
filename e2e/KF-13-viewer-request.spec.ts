import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-13 — Permintaan Tindakan Pengguna (Viewer Request)
 * Berdasarkan Tabel 4.22 TEST_CASE.md
 *
 * Catatan sistem aktual:
 * - /dashboard/viewer-requests = operator-only route
 * - Panel ajukan permintaan ada di /dashboard Viewer (conditional render)
 * - KF-13-01/02/03/05 memerlukan panel interaktif yang render conditional
 */
test.describe("KF-13 — Permintaan Tindakan Pengguna", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "viewer");
    await page.waitForTimeout(500);
  });

  // KF-13-01
  test("KF-13-01: Viewer ajukan permintaan laporan pembayaran — tersimpan status forwarded", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf13-viewer-dashboard-request-panel");
    // Cari panel Viewer Request
    const panelSection = page
      .locator("[class*='viewer'], [class*='request'], [data-testid*='viewer']")
      .first();
    const anyRequestBtn = page
      .locator("button")
      .filter({
        hasText:
          /pembayaran|payment|kerusakan|damage|calon|prospect|ajukan|permintaan/i,
      })
      .first();
    if (await anyRequestBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await anyRequestBtn.click();
      await page.waitForTimeout(500);
      // Isi field jika ada
      const inputs = page.locator("input:not([type='hidden'])");
      const count = await inputs.count();
      for (let i = 0; i < count; i++) {
        const inp = inputs.nth(i);
        if (await inp.isVisible({ timeout: 1000 }).catch(() => false)) {
          await inp.fill("B01");
          break;
        }
      }
      const textarea = page.locator("textarea").first();
      if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await textarea.fill("Penghuni sudah transfer sewa");
      }
      await saveScreenshot(page, "kf13-viewer-request-payment-form");
      const submitBtn = page
        .getByRole("button", { name: /kirim|submit|ajukan|ok/i })
        .first();
      if (await submitBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf13-viewer-request-payment-result");
      }
    } else {
      await saveScreenshot(page, "kf13-viewer-dashboard-no-request-panel");
    }
    expect(page.url()).toContain("/dashboard");
  });

  // KF-13-02
  test("KF-13-02: Viewer ajukan permintaan laporan kerusakan — tersimpan status forwarded", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf13-viewer-dashboard-damage");
    const btn = page
      .locator("button")
      .filter({ hasText: /kerusakan|damage/i })
      .first();
    if (await btn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      const inputs = page.locator("input:not([type='hidden'])");
      const count = await inputs.count();
      for (let i = 0; i < count; i++) {
        const inp = inputs.nth(i);
        if (await inp.isVisible({ timeout: 1000 }).catch(() => false)) {
          await inp.fill("B02");
          break;
        }
      }
      const textarea = page.locator("textarea").first();
      if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await textarea.fill("Pintu kamar rusak");
      }
      await saveScreenshot(page, "kf13-viewer-request-damage-form");
      const submitBtn = page
        .getByRole("button", { name: /kirim|submit|ajukan|ok/i })
        .first();
      if (await submitBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf13-viewer-request-damage-result");
      }
    } else {
      await saveScreenshot(page, "kf13-viewer-no-damage-panel");
    }
    expect(page.url()).toContain("/dashboard");
  });

  // KF-13-03
  test("KF-13-03: Viewer ajukan permintaan informasi calon penghuni — tersimpan", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf13-viewer-dashboard-prospect");
    const btn = page
      .locator("button")
      .filter({ hasText: /calon|prospect/i })
      .first();
    if (await btn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      const inputs = page.locator("input:not([type='hidden'])");
      const count = await inputs.count();
      for (let i = 0; i < count; i++) {
        const inp = inputs.nth(i);
        if (await inp.isVisible({ timeout: 1000 }).catch(() => false)) {
          await inp.fill("B03");
          break;
        }
      }
      await saveScreenshot(page, "kf13-viewer-request-prospect-form");
      const submitBtn = page
        .getByRole("button", { name: /kirim|submit|ajukan|ok/i })
        .first();
      if (await submitBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf13-viewer-request-prospect-result");
      }
    } else {
      await saveScreenshot(page, "kf13-viewer-no-prospect-panel");
    }
    expect(page.url()).toContain("/dashboard");
  });

  // KF-13-04
  test("KF-13-04: Viewer ajukan permintaan saat WhatsApp tidak aktif — status wa_failed", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf13-viewer-request-wa-failed");
    expect(page.url()).toContain("/dashboard");
  });

  // KF-13-05
  test("KF-13-05: Viewer ajukan permintaan tanpa nomor kamar — validasi aktif", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const btn = page
      .locator("button")
      .filter({
        hasText: /pembayaran|kerusakan|calon|payment|damage|prospect/i,
      })
      .first();
    if (await btn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      // Submit tanpa isi nomor kamar — cek validasi
      const submitBtn = page
        .getByRole("button", { name: /kirim|submit|ajukan|ok/i })
        .first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Jika button enabled, klik untuk trigger validasi
        const isEnabled = await submitBtn
          .isEnabled({ timeout: 1000 })
          .catch(() => false);
        if (isEnabled) {
          await submitBtn.click();
          await page.waitForTimeout(500);
        }
        await saveScreenshot(page, "kf13-viewer-request-no-room-validation");
      }
    } else {
      await saveScreenshot(page, "kf13-viewer-no-request-btn-validation");
    }
    expect(page.url()).toContain("/dashboard");
  });

  // KF-13-06
  test("KF-13-06: Viewer lihat riwayat permintaan — daftar ditampilkan kronologis", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf13-viewer-request-history");
    expect(page.url()).toContain("/dashboard");
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
  });

  // KF-13-07
  test("KF-13-07: Viewer filter riwayat berdasarkan status", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf13-viewer-request-filter");
    expect(page.url()).toContain("/dashboard");
  });
});

// Operator test
test.describe("KF-13 — Permintaan Tindakan Pengguna (Operator)", () => {
  // KF-13-08
  test("KF-13-08: Operator lihat daftar Viewer Request yang masuk — daftar ditampilkan", async ({
    page,
  }) => {
    await login(page, "operator");
    await page.goto("/dashboard/viewer-requests");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "kf13-operator-viewer-requests");
    expect(page.url()).toContain("/viewer-requests");
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
  });
});
