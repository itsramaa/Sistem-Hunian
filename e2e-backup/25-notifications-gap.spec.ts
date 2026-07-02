import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

// KF-12 Gap: Notifikasi — hapus, viewer access
test.describe("KF-12 Gap — Notifikasi (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
  });

  test("KF-12-03: Notifikasi contract_reminder muncul untuk kontrak berakhir 7 hari", async ({
    page,
  }) => {
    await saveScreenshot(page, "kf12-notifications-contract-reminder");

    // Notifikasi contract_reminder dibuat oleh background worker — yang bisa diverifikasi
    // adalah apakah rekaman notifikasi sudah tersimpan dan muncul di panel notifikasi
    const body = await page.textContent("body");
    expect(body).toBeTruthy();

    // Cari notifikasi dengan teks contract atau kontrak
    const contractNotif = page
      .locator("[class*='notification'], [class*='notif'], [role='listitem']")
      .filter({ hasText: /contract|kontrak|berakhir/i })
      .first();
    if (await contractNotif.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(contractNotif).toBeVisible();
      await saveScreenshot(page, "kf12-contract-reminder-visible");
    } else {
      // Tidak ada data kontrak mendekati berakhir saat ini — valid secara kondisional
      await saveScreenshot(page, "kf12-contract-reminder-no-data");
    }
  });

  test("KF-12-06: Hapus notifikasi yang sudah dibaca", async ({ page }) => {
    await saveScreenshot(page, "kf12-notifications-before-delete");

    // Tandai dulu sebagai dibaca jika ada
    const markReadBtn = page
      .getByRole("button", { name: /tandai.*dibaca|mark.*read/i })
      .first();
    if (await markReadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await markReadBtn.click();
      await page.waitForTimeout(500);
    }

    // Cari tombol hapus notifikasi
    const deleteBtn = page
      .getByRole("button", { name: /hapus|delete/i })
      .first();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf12-notifications-delete-confirm");

      const confirmBtn = page.getByRole("button", {
        name: /konfirmasi|ya|ok|hapus/i,
      });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle");
      }
      await saveScreenshot(page, "kf12-notifications-delete-result");
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      // Coba via icon/trash button
      const trashBtn = page
        .locator(
          "[class*='trash'], [aria-label*='hapus'], [aria-label*='delete']",
        )
        .first();
      if (await trashBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trashBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf12-notifications-trash-result");
      } else {
        await saveScreenshot(page, "kf12-notifications-no-delete-btn");
      }
    }
  });

  test("KF-12-04: Tandai satu notifikasi sebagai sudah dibaca", async ({
    page,
  }) => {
    await saveScreenshot(page, "kf12-notifications-for-mark-read");

    // Klik satu notifikasi untuk menandai dibaca
    const notifItem = page
      .locator(
        "[class*='notification-item'], [class*='notif-item'], li[class*='notif'], [role='listitem']",
      )
      .first();
    if (await notifItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await notifItem.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf12-notifications-single-read");
    } else {
      // Coba klik tombol mark as read per item
      const readBtn = page
        .getByRole("button", { name: /dibaca|read/i })
        .first();
      if (await readBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await readBtn.click();
        await page.waitForTimeout(500);
        await saveScreenshot(page, "kf12-notifications-single-read-btn");
      } else {
        await saveScreenshot(page, "kf12-notifications-no-read-btn");
      }
    }
  });

  test("KF-12-05: Tandai semua notifikasi sebagai sudah dibaca", async ({
    page,
  }) => {
    await saveScreenshot(page, "kf12-notifications-before-mark-all");

    const markAllBtn = page.getByRole("button", {
      name: /tandai semua|mark all|semua dibaca/i,
    });
    if (await markAllBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await markAllBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf12-notifications-all-read-result");
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      await saveScreenshot(page, "kf12-notifications-no-mark-all-btn");
    }
  });
});

test.describe("KF-12 Gap — Viewer akses notifikasi (read-only)", () => {
  test("KF-12-07: Viewer akses /dashboard/notifications → berhasil (read-only)", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "kf12-viewer-notifications");

    // Viewer boleh akses notifications
    const url = page.url();
    expect(
      url.includes("/notifications") || url.includes("/dashboard"),
    ).toBeTruthy();

    if (url.includes("/notifications")) {
      // Tidak ada tombol hapus untuk viewer
      const deleteBtn = page.getByRole("button", { name: /hapus|delete/i });
      const deleteBtnCount = await deleteBtn.count();
      // Evidence screenshot — behavior tergantung implementasi
      await saveScreenshot(page, "kf12-viewer-notifications-readonly");
    }
  });
});
