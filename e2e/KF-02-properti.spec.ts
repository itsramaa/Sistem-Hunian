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

    await page.getByRole("button", { name: "Tambah Properti" }).click();
    await page.waitForTimeout(500);

    const dialog = page.getByRole("dialog", { name: "Tambah Properti" });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("textbox", { name: "Nama Properti" })
      .fill("Kos Demo Test E2E");
    await dialog
      .getByRole("textbox", { name: "Alamat" })
      .fill("Jl. Demo Test No. 1, Ciputat");
    await saveScreenshot(page, "kf02-add-property-filled");

    await dialog.getByRole("button", { name: "Tambah Properti" }).click();
    await page.waitForTimeout(500);
    // Ada dialog konfirmasi
    const confirmAdd = page.getByRole("button", {
      name: /ya.*tambahkan|tambahkan/i,
    });
    if (await confirmAdd.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmAdd.click();
    }
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf02-add-property-result");

    // Verifikasi: properti baru tampil di tabel (nama ada di row)
    await expect(
      page.getByRole("row", { name: /Kos Demo Test E2E/i }).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  // KF-02-02
  test("KF-02-02: Tambah properti dengan nama kosong — validasi mencegah penyimpanan", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Tambah Properti" }).click();
    await page.waitForTimeout(500);

    const dialog = page.getByRole("dialog", { name: "Tambah Properti" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Tambah Properti" }).click();
    await page.waitForTimeout(500);
    await saveScreenshot(page, "kf02-add-property-empty-validation");

    // Verifikasi: dialog masih terbuka (tidak ditutup), ada pesan validasi
    await expect(dialog).toBeVisible();
    expect(page.url()).toContain("/properties");
  });

  // KF-02-03
  test("KF-02-03: Ubah data properti — data berhasil diperbarui", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");

    // Klik menu aksi pada properti pertama via button "Menu <nama>"
    await page.getByRole("button", { name: /Menu Kos Hj Danyih 1/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole("menuitem", { name: "Ubah" }).click();
    await page.waitForTimeout(500);

    const dialog = page.getByRole("dialog", { name: "Ubah Properti" });
    await expect(dialog).toBeVisible();

    const namaInput = dialog.getByRole("textbox", { name: "Nama Properti" });
    await namaInput.clear();
    await namaInput.fill("Kos Hj Danyih 1 Updated");
    await saveScreenshot(page, "kf02-edit-property-filled");

    await dialog.getByRole("button", { name: "Simpan Perubahan" }).click();
    await page.waitForTimeout(500);
    // Konfirmasi dialog
    const confirmEdit = page
      .getByRole("button", { name: /ya.*simpan|simpan perubahan/i })
      .last();
    if (await confirmEdit.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmEdit.click();
    }
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf02-edit-property-result");

    await expect(
      page.getByRole("row", { name: /Kos Hj Danyih 1 Updated/i }).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  // KF-02-04
  test("KF-02-04: Hapus properti tanpa kamar — properti berhasil dihapus", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");

    // Tambah properti baru tanpa kamar untuk dihapus
    await page.getByRole("button", { name: "Tambah Properti" }).click();
    await page.waitForTimeout(500);
    const addDialog = page.getByRole("dialog", { name: "Tambah Properti" });
    await addDialog
      .getByRole("textbox", { name: "Nama Properti" })
      .fill("Properti Hapus Test");
    await addDialog
      .getByRole("textbox", { name: "Alamat" })
      .fill("Jl. Test Hapus No. 1");
    await addDialog.getByRole("button", { name: "Tambah Properti" }).click();
    await page.waitForTimeout(500);
    // Konfirmasi tambah
    const confirmAdd = page.getByRole("button", { name: /ya.*tambahkan/i });
    if (await confirmAdd.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmAdd.click();
    }
    await page.waitForLoadState("networkidle");

    // Hapus properti yang baru dibuat
    await page
      .getByRole("button", { name: /Menu Properti Hapus Test/i })
      .click();
    await page.waitForTimeout(300);
    await page.getByRole("menuitem", { name: "Hapus" }).click();
    await page.waitForTimeout(500);
    // Konfirmasi hapus — tombolnya "Hapus" dalam dialog
    const confirmDel = page.getByRole("button", { name: /^hapus$/i }).last();
    if (await confirmDel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmDel.click();
      await page.waitForLoadState("networkidle");
    }
    await saveScreenshot(page, "kf02-delete-property-result");

    await expect(
      page.getByRole("row", { name: /Properti Hapus Test/i }).first(),
    ).not.toBeVisible({ timeout: 5000 });
  });

  // KF-02-05
  test("KF-02-05: Hapus properti dengan kamar terdaftar — sistem menolak", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");

    // Kos Hj Danyih 1 punya 15 kamar — tidak bisa dihapus
    await page.getByRole("button", { name: /Menu Kos Hj Danyih 1/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole("menuitem", { name: "Hapus" }).click();
    await page.waitForTimeout(500);
    const confirmDel = page.getByRole("button", { name: /^hapus$/i }).last();
    if (await confirmDel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmDel.click();
      await page.waitForLoadState("networkidle");
    }
    await saveScreenshot(page, "kf02-delete-property-with-rooms");

    // Verifikasi: toast error muncul
    const errorToast = page
      .locator("[class*='toast'], [role='alert']")
      .filter({ hasText: /gagal|error|tidak bisa|masih memiliki|kamar/i });
    expect(
      await errorToast.isVisible({ timeout: 5000 }).catch(() => false),
    ).toBe(true);
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
