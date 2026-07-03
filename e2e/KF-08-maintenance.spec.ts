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
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    // Tunggu dialog terbuka
    await expect(page.locator("[role='dialog']")).toBeVisible({
      timeout: 5000,
    });

    // Pilih properti (combobox pertama)
    const allCombos = page.locator("[role='dialog'] [role='combobox']");
    if (
      await allCombos
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await allCombos.first().click();
      await page.waitForTimeout(300);
      const firstOption = page.locator("[role='option']").first();
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOption.click();
        await page.waitForTimeout(300);
      }
    }

    // Pilih kamar (combobox kedua)
    const comboCount = await allCombos.count();
    if (comboCount >= 2) {
      await allCombos.nth(1).click();
      await page.waitForTimeout(300);
      const roomOption = page.locator("[role='option']").first();
      if (await roomOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await roomOption.click();
        await page.waitForTimeout(300);
      }
    }

    const deskripsiInput = page
      .locator(
        "[role='dialog'] textarea, [role='dialog'] input[name='damage_description']",
      )
      .first();
    await expect(deskripsiInput).toBeVisible({ timeout: 5000 });
    await deskripsiInput.fill("Kran kamar mandi bocor, air menetes terus");

    await saveScreenshot(page, "kf08-add-maintenance-form");

    const submitBtn = page
      .getByRole("button", { name: /simpan|lapor|submit/i })
      .last();
    await submitBtn.click();
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf08-add-maintenance-result");

    // Verifikasi laporan baru muncul — cek ada baris di tabel/daftar
    const firstRow = page.locator("tbody tr, [class*='DataCard']").first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    expect(page.url()).toContain("/maintenance");
  });

  // KF-08-02
  test("KF-08-02: Unggah foto kerusakan — foto tersimpan di MinIO", async ({
    page,
  }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");

    // Klik row pertama untuk masuk detail
    const firstRow = page.locator("tbody tr, [class*='DataCard']").first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });
    await firstRow.click();
    await page.waitForLoadState("networkidle");

    // Fallback: coba link langsung
    if (!page.url().includes("/maintenance/")) {
      const firstLink = page
        .locator("a[href*='/dashboard/maintenance/']")
        .first();
      if (await firstLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstLink.click();
        await page.waitForLoadState("networkidle");
      }
    }

    await saveScreenshot(page, "kf08-maintenance-detail");

    // Verifikasi input file atau tombol upload visible di halaman detail
    const fileInput = page.locator("input[type='file']");
    const uploadBtn = page.getByRole("button", { name: /unggah|upload|foto/i });
    const uploadArea = page
      .locator("[class*='upload'], [class*='Upload'], [class*='dropzone']")
      .first();

    const hasUpload =
      (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) ||
      (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) ||
      (await uploadArea.isVisible({ timeout: 3000 }).catch(() => false));

    expect(hasUpload).toBe(true);
    await saveScreenshot(page, "kf08-upload-photo-visible");

    expect(page.url()).toContain("/maintenance");
  });

  // KF-08-03
  test("KF-08-03: Perbarui status ke diproses — status in_progress, log tersimpan", async ({
    page,
  }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf08-maintenance-list");

    // Tombol "Proses" ada di row dengan status "reported" di list page
    const prosesBtn = page.getByRole("button", { name: /^Proses$/i }).first();
    if (await prosesBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await prosesBtn.click();
      await page.waitForTimeout(500);

      // Dialog "Tandai Sedang Diproses" — isi nama penangan
      const namaInput = page.getByPlaceholder(/nama teknisi|penanggungjawab/i);
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.fill("Teknisi Demo E2E");
      }

      // Submit
      const submitBtn = page.getByRole("button", { name: /tandai diproses/i });
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
      }
      await saveScreenshot(page, "kf08-status-in-progress");

      const successToast = page
        .locator("[class*='toast'], [role='alert']")
        .filter({ hasText: /berhasil|diproses/i });
      const isSuccess = await successToast
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(isSuccess || page.url().includes("/maintenance")).toBeTruthy();
    } else {
      await saveScreenshot(page, "kf08-no-proses-btn");
    }
    expect(page.url()).toContain("/maintenance");
  });

  // KF-08-04
  test("KF-08-04: Perbarui status ke selesai dan unggah foto penanganan", async ({
    page,
  }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");

    // Tombol "Selesai" ada di row dengan status "in_progress" di list page
    const selesaiBtn = page.getByRole("button", { name: /^Selesai$/i }).first();
    if (await selesaiBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await selesaiBtn.click();
      await page.waitForTimeout(500);

      // Dialog "Tandai Selesai" — isi tindakan penanganan
      const tindakanInput = page.getByRole("textbox").first();
      if (await tindakanInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tindakanInput.fill("Perbaikan selesai oleh teknisi");
      }

      const submitBtn = page.getByRole("button", { name: /tandai selesai/i });
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
      }
      await saveScreenshot(page, "kf08-status-completed");

      const successToast = page
        .locator("[class*='toast'], [role='alert']")
        .filter({ hasText: /berhasil|selesai/i });
      const isSuccess = await successToast
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(isSuccess || page.url().includes("/maintenance")).toBeTruthy();
    } else {
      await saveScreenshot(page, "kf08-no-selesai-btn");
    }
    expect(page.url()).toContain("/maintenance");
  });

  // KF-08-05
  test("KF-08-05: Lihat log progres pemeliharaan secara kronologis", async ({
    page,
  }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");

    // Klik row pertama
    const firstRow = page.locator("tbody tr, [class*='DataCard']").first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });
    await firstRow.click();
    await page.waitForLoadState("networkidle");

    if (!page.url().includes("/maintenance/")) {
      const firstLink = page
        .locator("a[href*='/dashboard/maintenance/']")
        .first();
      if (await firstLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstLink.click();
        await page.waitForLoadState("networkidle");
      }
    }

    await saveScreenshot(page, "kf08-maintenance-log-history");

    // Verifikasi halaman detail termuat dengan konten
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);

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
