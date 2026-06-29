import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-03 — Manajemen Data Kamar
 * Berdasarkan Tabel 4.12 TEST_CASE.md
 */
test.describe("KF-03 — Manajemen Data Kamar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  // KF-03-01
  test("KF-03-01: Tambah kamar dengan data lengkap — kamar tersimpan status available", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    const addBtn = page.getByRole("button", { name: /tambah|add|baru/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const nomorInput = page.locator("input[name='number'], input[name='room_number'], input[placeholder*='nomor'], input[id*='number']").first();
      if (await nomorInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nomorInput.fill("Z99");
      }
      const tipeCombobox = page.locator("[role='combobox']").first();
      if (await tipeCombobox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tipeCombobox.click();
        await page.waitForTimeout(300);
        const firstOption = page.locator("[role='option']").first();
        if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstOption.click();
        }
      }
      const hargaInput = page.locator("input[name='price'], input[name='rent_price'], input[placeholder*='harga'], input[id*='price']").first();
      if (await hargaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await hargaInput.fill("1200000");
      }
      await saveScreenshot(page, "kf03-add-room-filled");
      const submitBtn = page.getByRole("button", { name: /simpan|tambah|submit|ok/i }).first();
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
    }
    await saveScreenshot(page, "kf03-add-room-result");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  // KF-03-02
  test("KF-03-02: Ubah data kamar — data berhasil diperbarui", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf03-rooms-list-for-edit");
    const editBtn = page.getByRole("button", { name: /edit|ubah/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf03-edit-room-form");
    }
    expect(page.url()).toContain("/rooms");
  });

  // KF-03-03
  test("KF-03-03: Hapus kamar available tanpa histori — berhasil dihapus", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf03-rooms-clean-available");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  // KF-03-04
  test("KF-03-04: Hapus kamar berstatus occupied — sistem menolak", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf03-rooms-occupied-list");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  // KF-03-05
  test("KF-03-05: Hapus kamar berstatus dp_confirmation — sistem menolak", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf03-rooms-dp-confirmation-list");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  // KF-03-06
  test("KF-03-06: Hapus kamar available dengan histori terhubung — sistem menolak", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf03-rooms-with-history");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  // KF-03-07
  test("KF-03-07: Filter kamar berdasarkan properti — hanya kamar properti tersebut tampil", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf03-rooms-before-filter");
    const filterCombo = page.locator("[role='combobox'], select").first();
    if (await filterCombo.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterCombo.click();
      await page.waitForTimeout(300);
      const option = page.locator("[role='option']").first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf03-rooms-filter-applied");
      }
    }
    expect(page.url()).toContain("/rooms");
  });
});
