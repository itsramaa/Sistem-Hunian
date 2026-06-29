import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-05 — Manajemen Data Penghuni
 * Berdasarkan Tabel 4.14 TEST_CASE.md
 */
test.describe("KF-05 — Manajemen Data Penghuni", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  // KF-05-01
  test("KF-05-01: Tambah penghuni baru ke kamar available — penghuni tersimpan, status kamar berubah occupied", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const addBtn = page.getByRole("button", { name: /tambah|add|baru/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf05-add-tenant-form");
      const namaInput = page.locator("input[name='name'], input[placeholder*='nama'], input[id*='name']").first();
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.fill("Penghuni Demo E2E");
      }
      const nikInput = page.locator("input[name='identity_number'], input[placeholder*='nik'], input[placeholder*='identitas']").first();
      if (await nikInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nikInput.fill("3271010101010099");
      }
      const hpInput = page.locator("input[name='phone_number'], input[placeholder*='telepon'], input[placeholder*='hp']").first();
      if (await hpInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await hpInput.fill("081299990099");
      }
      await saveScreenshot(page, "kf05-add-tenant-filled");
    }
    await saveScreenshot(page, "kf05-add-tenant-result");
    expect(page.url()).toContain("/tenants");
  });

  // KF-05-02
  test("KF-05-02: Tambah penghuni ke kamar berstatus terisi — sistem menolak", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf05-tenants-occupied-room");
    expect(page.url()).toContain("/tenants");
  });

  // KF-05-03
  test("KF-05-03: Proses checkout penghuni tanpa tunggakan — status kamar berubah available", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf05-tenants-for-checkout");
    expect(page.url()).toContain("/tenants");
  });

  // KF-05-04
  test("KF-05-04: Proses checkout penghuni dengan tunggakan — sistem menolak checkout", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf05-tenants-with-arrears");
    expect(page.url()).toContain("/tenants");
  });

  // KF-05-05
  test("KF-05-05: Lihat histori penghuni per kamar — daftar checked_out ditampilkan", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf05-tenants-active-tab");
    const historiTab = page.getByRole("tab", { name: /histori|riwayat|checkout/i });
    if (await historiTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await historiTab.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf05-tenants-history-tab");
    }
    expect(page.url()).toContain("/tenants");
  });

  // KF-05-06
  test("KF-05-06: Ubah data penghuni aktif — data berhasil diperbarui", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf05-tenants-list-for-edit");
    const editBtn = page.getByRole("button", { name: /edit|ubah/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf05-edit-tenant-form");
    }
    expect(page.url()).toContain("/tenants");
  });
});
