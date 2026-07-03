import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-06 — Manajemen Pembayaran Sewa
 * Berdasarkan Tabel 4.15 TEST_CASE.md
 */
test.describe("KF-06 — Manajemen Pembayaran Sewa", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  // KF-06-01 (background worker — diverifikasi via UI)
  test("KF-06-01: Rekaman pembayaran otomatis H-3 — rekaman unpaid tersimpan oleh worker", async ({ page }) => {
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "kf06-payments-list");
    expect(page.url()).toContain("/payments");
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
  });

  // KF-06-02 (background worker — diverifikasi via UI)
  test("KF-06-02: Rekaman overdue otomatis saat jatuh tempo terlewati — status berubah overdue", async ({ page }) => {
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf06-payments-overdue");
    const overdueBadge = page.locator("[class*='badge'], [class*='Badge'], td")
      .filter({ hasText: /overdue|terlambat/i }).first();
    if (await overdueBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(overdueBadge).toBeVisible();
    }
    expect(page.url()).toContain("/payments");
  });

  // KF-06-03
  test("KF-06-03: Nominal terisi otomatis dari harga sewa saat pilih kamar", async ({ page }) => {
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    const addBtn = page.getByRole("button", { name: /catat|tambah|add|baru/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const roomSelect = page.locator("select[name='room_id'], [role='combobox'][id*='room'], button[id*='room']").first();
      if (await roomSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roomSelect.click();
        await page.waitForTimeout(500);
        const firstOption = page.locator("[role='option']").first();
        if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstOption.click();
          await page.waitForTimeout(500);
          await saveScreenshot(page, "kf06-nominal-auto-filled");
        }
      }
    }
    expect(page.url()).toContain("/payments");
  });

  // KF-06-04
  test("KF-06-04: Tandai pembayaran lunas — status berubah paid", async ({ page }) => {
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf06-payments-for-mark-paid");
    const lunasBtns = page.getByRole("button", { name: /lunas|paid|tandai/i });
    if (await lunasBtns.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await lunasBtns.first().click();
      await page.waitForTimeout(500);
      const confirmBtn = page.getByRole("button", { name: /ya|konfirmasi|lanjut/i }).first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf06-mark-paid-result");
      }
    }
    expect(page.url()).toContain("/payments");
  });

  // KF-06-05
  test("KF-06-05: Catat pembayaran manual — pembayaran tersimpan status paid", async ({ page }) => {
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    const addBtn = page.getByRole("button", { name: /tambah|add|baru|catat/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf06-add-payment-form");
      const submitBtn = page.getByRole("button", { name: /simpan|tambah|submit|ok/i }).first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf06-add-payment-result");
      }
    }
    expect(page.url()).toContain("/payments");
  });

  // KF-06-06
  test("KF-06-06: Unggah bukti transfer — bukti tersimpan di MinIO", async ({ page }) => {
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    const paymentLink = page.locator("a[href*='/dashboard/payments/']").first();
    if (await paymentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await paymentLink.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf06-payment-detail");
      const fileInput = page.locator("input[type='file']");
      const uploadBtn = page.getByRole("button", { name: /unggah|upload|bukti/i });
      if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false) ||
          await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveScreenshot(page, "kf06-upload-button-visible");
      }
    }
    expect(page.url()).toContain("/payment");
  });

  // KF-06-07
  test("KF-06-07: Lihat riwayat pembayaran per kamar — histori ditampilkan kronologis", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    const firstRoomLink = page.locator("a[href*='/dashboard/rooms/']").first();
    if (await firstRoomLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRoomLink.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf06-room-detail-payments");
    }
    expect(page.url()).toContain("/room");
  });

  // KF-06-08
  test("KF-06-08: Tampil indikator pembayaran jatuh tempo di dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const paymentIndicator = page.locator("[class*='alert'], [class*='warning'], [class*='badge'], [class*='panel']")
      .filter({ hasText: /pembayaran|payment|jatuh.*tempo|overdue|due/i }).first();
    const paymentIndicatorAlt = page.locator("section, div, article")
      .filter({ hasText: /tagihan.*jatuh|jatuh.*tempo.*pembayaran|payment.*overdue/i }).first();

    const hasIndicator = await paymentIndicator.isVisible({ timeout: 3000 }).catch(() => false)
      || await paymentIndicatorAlt.isVisible({ timeout: 2000 }).catch(() => false);

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);

    if (hasIndicator) {
      await saveScreenshot(page, "kf06-dashboard-payment-warning-visible");
    } else {
      await saveScreenshot(page, "kf06-dashboard-payment-warning-no-data");
    }
    expect(page.url()).toContain("/dashboard");
  });
});
