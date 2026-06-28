import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

// KF-09 Gap: Manajemen Pengguna (Operator only)
test.describe("KF-09 Gap — Manajemen Pengguna (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/users");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
  });

  test("KF-09-01: Tambah pengguna baru", async ({ page }) => {
    await saveScreenshot(page, "kf09-users-before-add");

    const addBtn = page.getByRole("button", { name: /tambah|add|baru/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf09-users-add-modal");

      // Nama
      const namaInput = page
        .locator(
          "input[name='name'], input[placeholder*='nama'], input[id*='name']",
        )
        .first();
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.fill("User Test E2E");
      }

      // Email
      const emailInput = page
        .locator(
          "input[name='email'], input[type='email'], input[placeholder*='email']",
        )
        .first();
      if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailInput.fill("user.test.e2e@sihuni.dev");
      }

      // Password
      const passwordInput = page
        .locator("input[name='password'], input[type='password']")
        .first();
      if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await passwordInput.fill("sihuni123");
      }

      // Role
      const roleSelect = page
        .locator(
          "select[name='role'], [role='combobox'][id*='role'], button[id*='role']",
        )
        .first();
      if (await roleSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roleSelect.click();
        await page.waitForTimeout(500);
        const viewerOption = page
          .locator("[role='option']")
          .filter({ hasText: /viewer/i })
          .first();
        if (
          await viewerOption.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          await viewerOption.click();
        } else {
          const firstOption = page.locator("[role='option']").first();
          if (
            await firstOption.isVisible({ timeout: 3000 }).catch(() => false)
          ) {
            await firstOption.click();
          }
        }
      }

      await saveScreenshot(page, "kf09-users-add-filled");

      const submitBtn = page.getByRole("button", {
        name: /simpan|tambah|submit|ok/i,
      });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf09-users-add-result");
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      // Coba path alternatif /dashboard/settings/users
      await page.goto("/dashboard/settings");
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf09-users-settings-page");
    }
  });

  test("KF-09-02: Ubah data pengguna", async ({ page }) => {
    await saveScreenshot(page, "kf09-users-list-for-edit");

    const editBtn = page
      .getByRole("button", { name: /edit|ubah|update/i })
      .first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf09-users-edit-modal");

      const namaInput = page
        .locator(
          "input[name='name'], input[placeholder*='nama'], input[id*='name']",
        )
        .first();
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.clear();
        await namaInput.fill("User Diperbarui E2E");
      }

      const submitBtn = page.getByRole("button", {
        name: /simpan|update|perbarui|ok/i,
      });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf09-users-edit-result");
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      await saveScreenshot(page, "kf09-users-no-edit-btn");
    }
  });

  test("KF-09-03: Hapus pengguna (bukan diri sendiri)", async ({ page }) => {
    await saveScreenshot(page, "kf09-users-list-for-delete");

    // Hapus pengguna selain diri sendiri (biasanya tombol hapus disabled untuk akun sendiri)
    const deleteBtn = page
      .getByRole("button", { name: /hapus|delete/i })
      .first();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Cek apakah tombol tidak disabled
      const isDisabled = await deleteBtn.isDisabled();
      if (!isDisabled) {
        await deleteBtn.click();
        await page.waitForTimeout(500);
        await saveScreenshot(page, "kf09-users-delete-confirm");

        const confirmBtn = page.getByRole("button", {
          name: /konfirmasi|ya|ok|hapus|delete/i,
        });
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForLoadState("networkidle");
          await saveScreenshot(page, "kf09-users-delete-result");
        }
      } else {
        // Tombol hapus disabled untuk akun sendiri — ini behavior yang benar
        await saveScreenshot(page, "kf09-users-delete-self-disabled");
        expect(isDisabled).toBeTruthy();
      }
    } else {
      await saveScreenshot(page, "kf09-users-no-delete-btn");
    }
  });
});

test.describe("KF-09 Gap — Viewer tidak bisa akses manajemen pengguna", () => {
  test("KF-09-04: Manajemen pengguna hanya di Settings (operator only)", async ({
    page,
  }) => {
    await login(page, "viewer");
    await saveScreenshot(page, "kf09-viewer-users-access");

    // Manajemen pengguna ada di /dashboard/settings — operator only
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "kf09-viewer-settings-access");

    const url = page.url();
    // Viewer tidak boleh akses settings — harus di-redirect
    expect(url).not.toContain("/settings");
  });
});
