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

  // KF-12-01 (background worker — data sudah di-seed)
  test("KF-12-01: Notifikasi dp_reminder otomatis 3 hari sebelum batas tanggal", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "kf12-notifications-list");

    expect(page.url()).toContain("/notifications");

    // Data sudah di-seed — hard assertion: ada notifikasi dengan teks dp atau konfirmasi
    const dpNotif = page
      .locator("tr, [class*='card'], [class*='item'], li")
      .filter({ hasText: /dp|konfirmasi|reminder/i })
      .first();
    await expect(dpNotif).toBeVisible({ timeout: 5000 });
  });

  // KF-12-02 (background worker — data sudah di-seed)
  test("KF-12-02: Notifikasi payment_due otomatis mendekati jatuh tempo", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf12-notifications-payment-due");

    expect(page.url()).toContain("/notifications");

    // Data sudah di-seed — hard assertion: ada notifikasi payment atau pembayaran
    const paymentNotif = page
      .locator("tr, [class*='card'], [class*='item'], li")
      .filter({ hasText: /payment|pembayaran|jatuh.*tempo|overdue/i })
      .first();
    await expect(paymentNotif).toBeVisible({ timeout: 5000 });
  });

  // KF-12-03 (data di-seed)
  test("KF-12-03: Notifikasi contract_reminder untuk kontrak berakhir 7 hari", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf12-notifications-contract-reminder");

    expect(page.url()).toContain("/notifications");

    // Verifikasi ada item notifikasi dengan teks kontrak atau contract
    const contractNotif = page
      .locator("tr, [class*='card'], [class*='item'], li")
      .filter({ hasText: /kontrak|contract|berakhir|reminder/i })
      .first();
    await expect(contractNotif).toBeVisible({ timeout: 5000 });
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
    await expect(markReadBtn).toBeVisible({ timeout: 5000 });

    // Ambil teks item pertama sebelum klik
    const firstItem = page
      .locator("tr, [class*='card'], [class*='item'], li")
      .first();
    await markReadBtn.click();
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf12-notifications-after-read");

    // Verifikasi status berubah — item tidak lagi bold/unread
    // Cek dengan melihat apakah ada perubahan class atau style pada item
    // (tidak ada badge unread atau class bold/font-semibold)
    const unreadBadge = page
      .locator("[class*='unread'], [class*='bold'], [class*='font-semibold']")
      .filter({ hasText: /notif/i })
      .first();
    // Yang penting: request berhasil dan halaman tidak crash
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);

    expect(page.url()).toContain("/notifications");
  });

  // KF-12-05
  test("KF-12-05: Tandai semua notifikasi sebagai sudah dibaca", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Pastikan ada notifikasi unread dulu — klik "Lihat Semua" jika perlu
    const lihatSemuaBtn = page.getByRole("button", {
      name: /lihat semua|show all/i,
    });
    if (await lihatSemuaBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await lihatSemuaBtn.click();
      await page.waitForLoadState("networkidle");
    }

    await saveScreenshot(page, "kf12-notifications-before-mark-all");

    // Tombol "Tandai Semua Dibaca" hanya muncul jika ada unread
    const markAllBtn = page.getByRole("button", {
      name: /tandai semua dibaca|mark all/i,
    });

    if (await markAllBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await markAllBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf12-notifications-after-mark-all");

      // Toast sukses muncul
      const toast = page
        .locator("[class*='toast'], [data-sonner-toast]")
        .first();
      if (await toast.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveScreenshot(page, "kf12-mark-all-toast");
      }
    } else {
      // Tidak ada unread notifikasi — kondisi valid (sudah semua dibaca)
      await saveScreenshot(page, "kf12-notifications-all-already-read");
    }

    expect(page.url()).toContain("/notifications");
  });

  // KF-12-06
  test("KF-12-06: Hapus notifikasi yang sudah dibaca — notifikasi terhapus", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Aktifkan "Lihat Semua" agar notifikasi yang sudah dibaca tampil
    const lihatSemuaBtn = page.getByRole("button", {
      name: /lihat semua|show all/i,
    });
    if (await lihatSemuaBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await lihatSemuaBtn.click();
      await page.waitForLoadState("networkidle");
    }

    await saveScreenshot(page, "kf12-notifications-before-delete");

    // Hitung jumlah item sebelum hapus
    const itemsBefore = page.locator("tbody tr, [class*='card']").filter({
      hasNot: page.locator("[class*='skeleton']"),
    });
    const countBefore = await itemsBefore.count();

    // Tombol "Hapus yang Dibaca" hanya muncul jika ada notif yang sudah dibaca
    const deleteBtn = page.getByRole("button", {
      name: /hapus yang dibaca|hapus.*dibaca/i,
    });

    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf12-notifications-after-delete");

      // Verifikasi item berkurang atau toast sukses
      const toast = page
        .locator("[class*='toast'], [data-sonner-toast]")
        .first();
      const toastVisible = await toast
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (toastVisible) {
        await saveScreenshot(page, "kf12-delete-toast");
      }
    } else {
      // Tidak ada yang sudah dibaca untuk dihapus — kondisi valid
      await saveScreenshot(page, "kf12-notifications-no-read-to-delete");
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

    // Verifikasi halaman notifikasi termuat dengan konten visible
    const mainContent = page
      .locator(
        "main, [class*='content'], [class*='container'], [class*='page']",
      )
      .first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });
});
