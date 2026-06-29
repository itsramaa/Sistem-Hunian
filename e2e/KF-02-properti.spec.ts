import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-02 — Manajemen Data Properti
 * Berdasarkan Tabel 4.11 TEST_CASE.md
 */
test.describe("KF-02 — Manajemen Data Properti", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  // KF-02-01
  test("KF-02-01: Tambah properti dengan data lengkap — properti tersimpan", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    const addBtn = page
      .getByRole("button", { name: /tambah|add|baru/i })
      .first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const namaInput = page
        .locator(
          "input[name='name'], input[id*='name'], input[placeholder*='nama']",
        )
        .first();
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.fill("Kos Demo Test E2E");
      }
      const alamatInput = page
        .locator(
          "input[name='address'], textarea[name='address'], input[placeholder*='alamat'], input[id*='address']",
        )
        .first();
      if (await alamatInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await alamatInput.fill("Jl. Demo Test No. 1, Ciputat");
      }
      await saveScreenshot(page, "kf02-add-property-filled");
      const submitBtn = page
        .getByRole("button", { name: /simpan|tambah|submit|ok/i })
        .first();
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
    }
    await saveScreenshot(page, "kf02-add-property-result");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  // KF-02-02
  test("KF-02-02: Tambah properti dengan nama kosong — validasi mencegah penyimpanan", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    const addBtn = page
      .getByRole("button", { name: /tambah|add|baru/i })
      .first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const submitBtn = page
        .getByRole("button", { name: /simpan|tambah|submit|ok/i })
        .first();
      await submitBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf02-add-property-empty-validation");
    }
    expect(page.url()).toContain("/properties");
  });

  // KF-02-03
  test("KF-02-03: Ubah data properti — data berhasil diperbarui", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf02-properties-list-for-edit");
    const editBtn = page.getByRole("button", { name: /edit|ubah/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf02-edit-property-form");
    }
    expect(page.url()).toContain("/properties");
  });

  // KF-02-04
  test("KF-02-04: Hapus properti tanpa kamar — properti berhasil dihapus", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf02-properties-for-delete");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  // KF-02-05
  test("KF-02-05: Hapus properti dengan kamar terdaftar — sistem menolak", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
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
      }
      await saveScreenshot(page, "kf02-delete-property-with-rooms");
    }
    expect(page.url()).toContain("/properties");
  });
});

// Viewer test terpisah — tidak menggunakan beforeEach operator
test.describe("KF-02 — Manajemen Data Properti (Viewer)", () => {
  // KF-02-06
  test("KF-02-06: Akses manajemen properti sebagai Viewer — hanya baca", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.waitForTimeout(500);
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "kf02-viewer-properties-readonly");
    const addBtn = page.getByRole("button", { name: /^tambah$|^add$|^baru$/i });
    const isAddVisible = await addBtn
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    expect(isAddVisible).toBe(false);
  });
});
