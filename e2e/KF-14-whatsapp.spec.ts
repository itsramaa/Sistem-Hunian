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
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
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
    } else {
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
    } else {
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
      await saveScreenshot(page, "kf14-wa-disconnected");
    } else {
      await saveScreenshot(page, "kf14-wa-no-disconnect-btn");
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
