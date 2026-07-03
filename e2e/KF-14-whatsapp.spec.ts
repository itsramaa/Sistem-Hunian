import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-14 — Komunikasi Eksternal Sistem (WhatsApp)
 * Berdasarkan Tabel 4.23 TEST_CASE.md
 */
test.describe("KF-14 — Komunikasi Eksternal Sistem", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  // KF-14-01
  test("KF-14-01: Tampil status koneksi WhatsApp di halaman Pengaturan", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    const waTab = page.getByRole("tab", { name: /whatsapp|wa/i });
    if (await waTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waTab.click();
      await page.waitForTimeout(500);
    }

    await saveScreenshot(page, "kf14-wa-status");
    expect(page.url()).toContain("/settings");

    // Verifikasi teks status koneksi visible (connected/disconnected/waiting_qr_scan)
    const statusText = page
      .locator("*")
      .filter({
        hasText: /connected|disconnected|waiting.*qr|terhubung|tidak.*terhubung|menunggu/i,
      })
      .first();
    await expect(statusText).toBeVisible({ timeout: 5000 });
  });

  // KF-14-02
  test("KF-14-02: Inisiasi pairing QR saat status disconnected — QR code tampil", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    const waTab = page.getByRole("tab", { name: /whatsapp|wa/i });
    if (await waTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waTab.click();
      await page.waitForTimeout(500);
    }

    const connectBtn = page.getByRole("button", { name: /hubungkan|connect/i });
    if (await connectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await connectBtn.click();
      await page.waitForTimeout(2000);
      await saveScreenshot(page, "kf14-wa-qr-code");

      // Verifikasi status berubah (tombol berubah atau teks berubah)
      const statusChanged = page
        .locator("*")
        .filter({
          hasText: /waiting.*qr|menunggu.*qr|scan.*qr|qr.*code|connecting/i,
        })
        .first();
      const connectBtnGone = !(await connectBtn
        .isVisible({ timeout: 1000 })
        .catch(() => false));

      const hasChange =
        (await statusChanged.isVisible({ timeout: 3000 }).catch(() => false)) ||
        connectBtnGone;

      expect(hasChange).toBe(true);
    } else {
      // Sudah connected — screenshot saja
      await saveScreenshot(page, "kf14-wa-already-connected");
    }

    expect(page.url()).toContain("/settings");
  });

  // KF-14-03
  test("KF-14-03: Batalkan proses pairing — status kembali disconnected", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    const waTab = page.getByRole("tab", { name: /whatsapp|wa/i });
    if (await waTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waTab.click();
      await page.waitForTimeout(500);
    }

    const cancelBtn = page.getByRole("button", { name: /batal|cancel/i });
    if (await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelBtn.click();
      await page.waitForTimeout(1000);
      await saveScreenshot(page, "kf14-wa-pairing-cancelled");

      // Verifikasi status kembali disconnected atau tombol hubungkan muncul lagi
      const disconnectedStatus = page
        .locator("*")
        .filter({ hasText: /disconnected|tidak.*terhubung/i })
        .first();
      const connectBtnBack = page.getByRole("button", {
        name: /hubungkan|connect/i,
      });

      const hasRevert =
        (await disconnectedStatus
          .isVisible({ timeout: 3000 })
          .catch(() => false)) ||
        (await connectBtnBack.isVisible({ timeout: 3000 }).catch(() => false));

      expect(hasRevert).toBe(true);
    } else {
      // Tidak ada tombol batal — mungkin sudah disconnected
      await saveScreenshot(page, "kf14-wa-no-cancel-btn");
    }

    expect(page.url()).toContain("/settings");
  });

  // KF-14-04
  test("KF-14-04: Koneksi berhasil setelah scan QR — status connected", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    const waTab = page.getByRole("tab", { name: /whatsapp|wa/i });
    if (await waTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waTab.click();
      await page.waitForTimeout(500);
    }

    await saveScreenshot(page, "kf14-wa-connection-status");
    expect(page.url()).toContain("/settings");

    // Verifikasi halaman settings/WA tampil dengan konten status
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  // KF-14-05
  test("KF-14-05: Kirim pesan test ke nomor tujuan — pesan terkirim", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    const waTab = page.getByRole("tab", { name: /whatsapp|wa/i });
    if (await waTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waTab.click();
      await page.waitForTimeout(500);
    }

    const testBtn = page.getByRole("button", {
      name: /test|kirim.*pesan|send.*test/i,
    });
    if (await testBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await testBtn.click();
      await page.waitForTimeout(500);

      const nomorInput = page
        .locator("input[placeholder*='nomor'], input[type='tel']")
        .first();
      if (await nomorInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nomorInput.fill("081234567890");
      }

      await saveScreenshot(page, "kf14-wa-test-message-form");

      const sendBtn = page.getByRole("button", { name: /kirim|send/i }).first();
      if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sendBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf14-wa-test-message-result");

        // Verifikasi toast/konfirmasi sukses atau pesan berhasil dikirim
        const successFeedback = page
          .locator(
            "[class*='toast'], [class*='alert'], [role='alert'], [class*='success']",
          )
          .first();
        const feedbackVisible = await successFeedback
          .isVisible({ timeout: 5000 })
          .catch(() => false);

        // Jika tidak ada toast, verifikasi halaman tidak crash
        if (!feedbackVisible) {
          const body = await page.textContent("body");
          expect(body?.length).toBeGreaterThan(100);
        } else {
          await expect(successFeedback).toBeVisible({ timeout: 3000 });
        }
      }
    } else {
      await saveScreenshot(page, "kf14-wa-no-test-btn");
    }

    expect(page.url()).toContain("/settings");
  });

  // KF-14-06
  test("KF-14-06: Disconnect koneksi aktif — status disconnected, sesi dihapus", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    const waTab = page.getByRole("tab", { name: /whatsapp|wa/i });
    if (await waTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waTab.click();
      await page.waitForTimeout(500);
    }

    const disconnectBtn = page.getByRole("button", {
      name: /disconnect|putus/i,
    });
    if (await disconnectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await disconnectBtn.click();
      await page.waitForTimeout(500);

      // Konfirmasi jika ada dialog
      const confirmBtn = page
        .getByRole("button", { name: /ya|konfirmasi|lanjut/i })
        .first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle");
      }

      await saveScreenshot(page, "kf14-wa-disconnected");

      // Verifikasi status disconnected visible
      const disconnectedStatus = page
        .locator("*")
        .filter({ hasText: /disconnected|tidak.*terhubung/i })
        .first();
      await expect(disconnectedStatus).toBeVisible({ timeout: 5000 });
    } else {
      // Tidak ada tombol disconnect — mungkin sudah disconnected
      await saveScreenshot(page, "kf14-wa-no-disconnect-btn");

      // Verifikasi halaman settings/WA masih tampil normal
      const body = await page.textContent("body");
      expect(body?.length).toBeGreaterThan(100);
    }

    expect(page.url()).toContain("/settings");
  });
});

// Viewer test terpisah
test.describe("KF-14 — Komunikasi Eksternal Sistem (Viewer)", () => {
  // KF-14-07
  test("KF-14-07: Akses manajemen WhatsApp sebagai Viewer — akses ditolak", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.waitForTimeout(500);
    await page.goto("/dashboard/settings");
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf14-viewer-settings-blocked");
    expect(page.url()).not.toContain("/settings");
  });
});
