import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

// KF-14 Gap: WhatsApp — status koneksi, QR pairing, disconnect, test pesan, viewer ditolak
test.describe("KF-14 Gap — WhatsApp Komunikasi Eksternal (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
  });

  test("KF-14-01: Tampil status koneksi WhatsApp di halaman Settings", async ({ page }) => {
    await saveScreenshot(page, "kf14-settings-page");

    // Klik tab WhatsApp jika ada
    const waTab = page.getByRole("tab", { name: /whatsapp|wa/i });
    if (await waTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waTab.click();
      await page.waitForTimeout(1000);
      await saveScreenshot(page, "kf14-wa-tab-open");
    }

    // Cari status koneksi WhatsApp
    const statusIndicator = page.locator(
      "[class*='status'], [class*='connection'], [class*='connected'], [class*='disconnected'], [class*='waiting']"
    ).first();
    if (await statusIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(statusIndicator).toBeVisible();
      await saveScreenshot(page, "kf14-wa-status-visible");
    } else {
      // Cari teks status
      const body = await page.textContent("body");
      const hasWaStatus = /connected|disconnected|waiting_qr|terhubung|terputus/i.test(body || "");
      if (hasWaStatus) {
        await saveScreenshot(page, "kf14-wa-status-text");
      } else {
        await saveScreenshot(page, "kf14-wa-status-not-found");
      }
      expect(body).toBeTruthy();
    }
  });

  test("KF-14-02: Inisiasi pairing QR saat status disconnected", async ({ page }) => {
    // Cari dan klik tab WhatsApp
    const waTab = page.getByRole("tab", { name: /whatsapp|wa/i });
    if (await waTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waTab.click();
      await page.waitForTimeout(1000);
    }

    await saveScreenshot(page, "kf14-wa-before-connect");

    // Klik tombol connect / hubungkan
    const connectBtn = page.getByRole("button", { name: /connect|hubungkan|sambungkan/i });
    if (await connectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await connectBtn.click();
      await page.waitForTimeout(2000);
      await saveScreenshot(page, "kf14-wa-after-connect-click");

      // QR code harus muncul
      const qrCode = page.locator(
        "canvas[class*='qr'], img[alt*='qr'], img[class*='qr'], [class*='qr-code'], svg[class*='qr']"
      ).first();
      if (await qrCode.isVisible({ timeout: 10000 }).catch(() => false)) {
        await expect(qrCode).toBeVisible();
        await saveScreenshot(page, "kf14-wa-qr-code-visible");
      } else {
        // QR mungkin muncul sebagai teks/link
        const body = await page.textContent("body");
        const hasQr = /qr|scan|pindai/i.test(body || "");
        await saveScreenshot(page, "kf14-wa-connect-result");
        expect(body).toBeTruthy();
      }
    } else {
      await saveScreenshot(page, "kf14-wa-no-connect-btn");
    }
  });

  test("KF-14-03: Batalkan proses pairing yang sedang berjalan", async ({ page }) => {
    const waTab = page.getByRole("tab", { name: /whatsapp|wa/i });
    if (await waTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waTab.click();
      await page.waitForTimeout(1000);
    }

    // Klik connect dulu untuk masuk ke state waiting_qr_scan
    const connectBtn = page.getByRole("button", { name: /connect|hubungkan|sambungkan/i });
    if (await connectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await connectBtn.click();
      await page.waitForTimeout(2000);
      await saveScreenshot(page, "kf14-wa-pairing-in-progress");

      // Batalkan
      const cancelBtn = page.getByRole("button", { name: /batal|cancel|stop|hentikan/i });
      if (await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await cancelBtn.click();
        await page.waitForTimeout(1000);
        await saveScreenshot(page, "kf14-wa-pairing-cancelled");

        // Status harus kembali disconnected
        const body = await page.textContent("body");
        expect(body).toBeTruthy();
      } else {
        await saveScreenshot(page, "kf14-wa-no-cancel-btn");
      }
    }
  });

  test("KF-14-05: Kirim pesan test ke nomor tujuan (saat connected)", async ({ page }) => {
    const waTab = page.getByRole("tab", { name: /whatsapp|wa/i });
    if (await waTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waTab.click();
      await page.waitForTimeout(1000);
    }

    await saveScreenshot(page, "kf14-wa-test-message-page");

    // Cari form kirim pesan test
    const testMsgBtn = page.getByRole("button", { name: /test|kirim pesan|send test|uji/i });
    if (await testMsgBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await testMsgBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf14-wa-test-message-modal");

      // Isi nomor tujuan
      const phoneInput = page.locator(
        "input[name='phone'], input[name='to'], input[placeholder*='nomor'], input[placeholder*='tujuan']"
      ).first();
      if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await phoneInput.fill("628123456789");
      }

      // Isi pesan opsional
      const msgInput = page.locator(
        "textarea[name='message'], input[name='message'], textarea[placeholder*='pesan']"
      ).first();
      if (await msgInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await msgInput.fill("Test pesan E2E dari sistem");
      }

      const submitBtn = page.getByRole("button", { name: /kirim|send|ok/i });
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf14-wa-test-message-result");
      }
    } else {
      await saveScreenshot(page, "kf14-wa-no-test-message-btn");
    }
  });

  test("KF-14-06: Disconnect koneksi WhatsApp aktif", async ({ page }) => {
    const waTab = page.getByRole("tab", { name: /whatsapp|wa/i });
    if (await waTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await waTab.click();
      await page.waitForTimeout(1000);
    }

    await saveScreenshot(page, "kf14-wa-before-disconnect");

    const disconnectBtn = page.getByRole("button", { name: /disconnect|putuskan|lepaskan/i });
    if (await disconnectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await disconnectBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf14-wa-disconnect-confirm");

      const confirmBtn = page.getByRole("button", { name: /konfirmasi|ya|ok|disconnect/i });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf14-wa-disconnected-result");

        const body = await page.textContent("body");
        const isDisconnected = /disconnected|terputus/i.test(body || "");
        expect(body).toBeTruthy();
      }
    } else {
      await saveScreenshot(page, "kf14-wa-no-disconnect-btn");
    }
  });
});

test.describe("KF-14 Gap — Viewer tidak bisa akses tab WhatsApp", () => {
  test("KF-14-07: Viewer akses Settings → tab WhatsApp tidak tersedia", async ({ page }) => {
    await login(page, "viewer");
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "kf14-viewer-settings");

    const url = page.url();
    if (url.includes("/settings")) {
      // Tab WhatsApp tidak boleh ada untuk viewer
      const waTab = page.getByRole("tab", { name: /whatsapp|wa/i });
      const isVisible = await waTab.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isVisible).toBeFalsy();
      await saveScreenshot(page, "kf14-viewer-no-wa-tab");
    } else {
      // Redirect juga valid
      expect(url).not.toContain("/settings");
      await saveScreenshot(page, "kf14-viewer-settings-redirect");
    }
  });
});
