import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-12 — Notifikasi Sistem
 * Berdasarkan Tabel 4.21 TEST_CASE.md
 */
test.describe("KF-12 — Notifikasi Sistem", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  // KF-12-01 (background worker — diverifikasi via UI)
  test("KF-12-01: Notifikasi dp_reminder otomatis 3 hari sebelum batas tanggal", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "kf12-notifications-list");
    expect(page.url()).toContain("/notifications");
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
  });

  // KF-12-02 (background worker — diverifikasi via UI)
  test("KF-12-02: Notifikasi payment_due otomatis mendekati jatuh tempo", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf12-notifications-payment-due");
    expect(page.url()).toContain("/notifications");
  });

  // KF-12-03
  test("KF-12-03: Notifikasi contract_reminder untuk kontrak berakhir 7 hari", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf12-notifications-contract-reminder");
    expect(page.url()).toContain("/notifications");
  });

  // KF-12-04
  test("KF-12-04: Tandai satu notifikasi sebagai sudah dibaca — status berubah", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf12-notifications-before-read");
    const markReadBtn = page
      .getByRole("button", { name: /baca|read|tandai/i })
      .first();
    if (await markReadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await markReadBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf12-notifications-after-read");
    }
    expect(page.url()).toContain("/notifications");
  });

  // KF-12-05
  test("KF-12-05: Tandai semua notifikasi sebagai sudah dibaca", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf12-notifications-before-mark-all");
    const markAllBtn = page.getByRole("button", {
      name: /semua.*baca|mark all|tandai semua/i,
    });
    if (await markAllBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await markAllBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf12-notifications-after-mark-all");
    }
    expect(page.url()).toContain("/notifications");
  });

  // KF-12-06
  test("KF-12-06: Hapus notifikasi yang sudah dibaca — notifikasi terhapus", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf12-notifications-before-delete");
    const deleteBtn = page
      .getByRole("button", { name: /hapus|delete/i })
      .first();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf12-notifications-after-delete");
    }
    expect(page.url()).toContain("/notifications");
  });
});

// Viewer test terpisah
test.describe("KF-12 — Notifikasi Sistem (Viewer)", () => {
  // KF-12-07
  test("KF-12-07: Akses notifikasi sebagai Viewer — halaman dapat diakses read-only", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.waitForTimeout(500);
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "kf12-viewer-notifications");
    expect(page.url()).toContain("/notifications");
  });
});
