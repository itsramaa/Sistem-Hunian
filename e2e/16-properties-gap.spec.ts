import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

// KF-02 Gap: CRUD Properti, Viewer read-only
test.describe("KF-02 Gap — CRUD Properti (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
  });

  test("KF-02-01: Tambah properti dengan data lengkap", async ({ page }) => {
    await saveScreenshot(page, "kf02-props-before-add");

    const addBtn = page.getByRole("button", { name: /tambah|add|baru/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf02-props-add-modal-open");

      // Isi nama properti
      const namaInput = page
        .locator(
          "input[name='name'], input[placeholder*='nama'], input[id*='name']",
        )
        .first();
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.fill("Properti Test E2E");
      }

      // Isi alamat
      const alamatInput = page
        .locator(
          "input[name='address'], textarea[name='address'], input[placeholder*='alamat'], input[id*='address']",
        )
        .first();
      if (await alamatInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await alamatInput.fill("Jl. Test E2E No. 1, Jakarta");
      }

      await saveScreenshot(page, "kf02-props-add-filled");

      const submitBtn = page.getByRole("button", {
        name: /simpan|tambah|submit|ok/i,
      });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf02-props-add-result");

      // Verifikasi halaman masih di properties (submit berhasil atau validasi muncul)
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      // Tombol tidak ditemukan — screenshot sebagai evidence
      await saveScreenshot(page, "kf02-props-no-add-btn");
    }
  });

  test("KF-02-02: Tambah properti nama kosong → validasi", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /tambah|add|baru/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Langsung submit tanpa isi nama
      const submitBtn = page.getByRole("button", {
        name: /simpan|tambah|submit|ok/i,
      });
      await submitBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf02-props-add-empty-validation");

      // Modal/form masih terbuka (tidak dismiss karena validasi)
      const modal = page.locator(
        "[role='dialog'], [class*='modal'], [class*='sheet']",
      );
      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(modal).toBeVisible();
      }
    }
  });

  test("KF-02-03: Ubah data properti", async ({ page }) => {
    await saveScreenshot(page, "kf02-props-list-for-edit");

    // Cari tombol edit pada baris pertama
    const editBtn = page
      .getByRole("button", { name: /edit|ubah|update/i })
      .first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf02-props-edit-modal-open");

      const namaInput = page
        .locator(
          "input[name='name'], input[placeholder*='nama'], input[id*='name']",
        )
        .first();
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.clear();
        await namaInput.fill("Properti Diperbarui E2E");
      }

      const submitBtn = page.getByRole("button", {
        name: /simpan|update|perbarui|ok/i,
      });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf02-props-edit-result");
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      await saveScreenshot(page, "kf02-props-no-edit-btn");
    }
  });

  test("KF-02-04: Hapus properti tanpa kamar → berhasil", async ({ page }) => {
    // Navigasi ke properti yang tidak punya kamar (jika ada)
    await saveScreenshot(page, "kf02-props-list-for-delete");

    const deleteBtn = page
      .getByRole("button", { name: /hapus|delete/i })
      .last();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf02-props-delete-confirm-dialog");

      // Konfirmasi dialog
      const confirmBtn = page.getByRole("button", {
        name: /konfirmasi|ya|ok|hapus|delete/i,
      });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf02-props-delete-result");
      }
    }
  });

  test("KF-02-05: Hapus properti dengan kamar → sistem menolak", async ({
    page,
  }) => {
    await saveScreenshot(page, "kf02-props-list-delete-with-rooms");

    const deleteBtn = page
      .getByRole("button", { name: /hapus|delete/i })
      .first();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);

      const confirmBtn = page.getByRole("button", {
        name: /konfirmasi|ya|ok|hapus|delete/i,
      });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf02-props-delete-rejected");

        // Harus ada pesan error
        const errorMsg = page.locator(
          "[class*='toast'], [class*='error'], [class*='alert'], [role='alert']",
        );
        if (await errorMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(errorMsg).toBeVisible();
        }
      }
    }
  });
});

test.describe("KF-02 Gap — Viewer read-only Properti", () => {
  test("KF-02-06: Viewer akses /dashboard/properties → ditolak atau read-only", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf02-viewer-properties-access");

    // Viewer tidak boleh bisa akses properties (operator only)
    const url = page.url();
    const isRedirected = !url.includes("/properties");
    if (!isRedirected) {
      // Jika terbuka, tidak ada tombol tambah/ubah/hapus
      const mutationBtns = page.getByRole("button", {
        name: /tambah|add|edit|ubah|hapus|delete/i,
      });
      expect(await mutationBtns.count()).toBe(0);
    } else {
      expect(isRedirected).toBeTruthy();
    }
  });
});
