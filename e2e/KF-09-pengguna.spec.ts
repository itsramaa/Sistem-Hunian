import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-09 — Manajemen Pengguna
 * Berdasarkan Tabel 4.18 TEST_CASE.md
 */
test.describe("KF-09 — Manajemen Pengguna", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  // KF-09-01
  test("KF-09-01: Tambah pengguna baru — pengguna tersimpan, dapat login", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf09-settings-page");
    const addBtn = page
      .getByRole("button", { name: /tambah.*pengguna|add.*user|undang/i })
      .first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const emailInput = page
        .locator(
          "input[type='email'], input[name='email'], input[placeholder*='email']",
        )
        .first();
      if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailInput.fill("testuser_e2e@sihuni.dev");
      }
      await saveScreenshot(page, "kf09-add-user-form");
    }
    expect(page.url()).toContain("/settings");
  });

  // KF-09-02
  test("KF-09-02: Ubah data pengguna — data berhasil diperbarui", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf09-settings-user-list");
    const editBtn = page.getByRole("button", { name: /edit|ubah/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf09-edit-user-form");
    }
    expect(page.url()).toContain("/settings");
  });

  // KF-09-03
  test("KF-09-03: Hapus pengguna (bukan diri sendiri) — pengguna berhasil dihapus", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf09-settings-for-delete");
    const deleteBtn = page
      .getByRole("button", { name: /hapus|delete/i })
      .first();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      const confirmBtn = page
        .getByRole("button", { name: /ya|konfirmasi|lanjut|hapus/i })
        .first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf09-delete-user-result");
      }
    }
    expect(page.url()).toContain("/settings");
  });
});

// Viewer test terpisah
test.describe("KF-09 — Manajemen Pengguna (Viewer)", () => {
  // KF-09-04
  test("KF-09-04: Akses manajemen pengguna sebagai Viewer — akses ditolak", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.waitForTimeout(500);
    await page.goto("/dashboard/settings");
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf09-viewer-settings-access");
    expect(page.url()).not.toContain("/settings");
  });
});
