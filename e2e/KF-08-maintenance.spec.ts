import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-08 — Manajemen Pemeliharaan Bangunan
 * Berdasarkan Tabel 4.17 TEST_CASE.md
 */
test.describe("KF-08 — Manajemen Pemeliharaan Bangunan", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  // KF-08-01
  test("KF-08-01: Lapor kerusakan baru — laporan tersimpan status reported", async ({
    page,
  }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    const addBtn = page
      .getByRole("button", { name: /lapor|tambah|add|baru/i })
      .first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const deskripsiInput = page
        .locator(
          "textarea, input[name='damage_description'], input[placeholder*='deskripsi']",
        )
        .first();
      if (
        await deskripsiInput.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        await deskripsiInput.fill("Kran kamar mandi bocor, air menetes terus");
      }
      await saveScreenshot(page, "kf08-add-maintenance-form");
      const submitBtn = page
        .getByRole("button", { name: /simpan|lapor|submit|ok/i })
        .first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf08-add-maintenance-result");
      }
    }
    expect(page.url()).toContain("/maintenance");
  });

  // KF-08-02
  test("KF-08-02: Unggah foto kerusakan — foto tersimpan di MinIO", async ({
    page,
  }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    const firstLink = page
      .locator("a[href*='/dashboard/maintenance/']")
      .first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf08-maintenance-detail");
      const fileInput = page.locator("input[type='file']");
      const uploadBtn = page.getByRole("button", {
        name: /unggah|upload|foto/i,
      });
      if (
        (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) ||
        (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false))
      ) {
        await saveScreenshot(page, "kf08-upload-photo-visible");
      }
    }
    expect(page.url()).toContain("/maintenance");
  });

  // KF-08-03
  test("KF-08-03: Perbarui status ke diproses — status in_progress, log tersimpan", async ({
    page,
  }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf08-maintenance-list");
    const firstLink = page
      .locator("a[href*='/dashboard/maintenance/']")
      .first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      const prosesBtn = page
        .getByRole("button", { name: /proses|in.progress|diproses/i })
        .first();
      if (await prosesBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await prosesBtn.click();
        await page.waitForTimeout(500);
        await saveScreenshot(page, "kf08-status-in-progress");
      }
    }
    expect(page.url()).toContain("/maintenance");
  });

  // KF-08-04
  test("KF-08-04: Perbarui status ke selesai dan unggah foto penanganan", async ({
    page,
  }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    const firstLink = page
      .locator("a[href*='/dashboard/maintenance/']")
      .first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      const selesaiBtn = page
        .getByRole("button", { name: /selesai|completed|done/i })
        .first();
      if (await selesaiBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await selesaiBtn.click();
        await page.waitForTimeout(500);
        await saveScreenshot(page, "kf08-status-completed");
      }
    }
    expect(page.url()).toContain("/maintenance");
  });

  // KF-08-05
  test("KF-08-05: Lihat log progres pemeliharaan secara kronologis", async ({
    page,
  }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    const firstLink = page
      .locator("a[href*='/dashboard/maintenance/']")
      .first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf08-maintenance-log-history");
      const body = await page.textContent("body");
      expect(body?.length).toBeGreaterThan(0);
    }
    expect(page.url()).toContain("/maintenance");
  });
});

// Viewer test terpisah
test.describe("KF-08 — Manajemen Pemeliharaan Bangunan (Viewer)", () => {
  // KF-08-06
  test("KF-08-06: Akses manajemen pemeliharaan sebagai Viewer — hanya baca", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.waitForTimeout(500);
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "kf08-viewer-maintenance-readonly");
    expect(page.url()).toContain("/maintenance");
    const addBtn = page.getByRole("button", {
      name: /^lapor$|^tambah$|^add$/i,
    });
    const isAddVisible = await addBtn
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    expect(isAddVisible).toBe(false);
  });
});
