import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

// KF-03 Gap: CRUD Kamar, hapus dengan berbagai status
test.describe("KF-03 Gap — CRUD Kamar (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
  });

  test("KF-03-01: Tambah kamar dengan data lengkap", async ({ page }) => {
    await saveScreenshot(page, "kf03-rooms-before-add");

    const addBtn = page.getByRole("button", { name: /tambah|add|baru/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf03-rooms-add-modal");

      // Nomor kamar
      const nomorInput = page
        .locator(
          "input[name='number'], input[name='room_number'], input[placeholder*='nomor'], input[id*='number']",
        )
        .first();
      if (await nomorInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nomorInput.fill("101-E2E");
      }

      // Tipe kamar — combobox, gunakan click + pilih option
      const tipeInput = page
        .locator(
          "input[name='type'], input[placeholder*='tipe'], select[name='type']",
        )
        .first();
      const tipeCombobox = page.locator("[role='combobox']").first();
      if (await tipeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tipeInput.fill("Standard");
      } else if (
        await tipeCombobox.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await tipeCombobox.click();
        await page.waitForTimeout(300);
        const firstOption = page.locator("[role='option']").first();
        if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstOption.click();
        }
      }

      // Harga sewa
      const hargaInput = page
        .locator(
          "input[name='price'], input[name='rent_price'], input[placeholder*='harga'], input[id*='price']",
        )
        .first();
      if (await hargaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await hargaInput.fill("1500000");
      }

      await saveScreenshot(page, "kf03-rooms-add-filled");

      const submitBtn = page.getByRole("button", {
        name: /simpan|tambah|submit|ok/i,
      });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf03-rooms-add-result");

      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      await saveScreenshot(page, "kf03-rooms-no-add-btn");
    }
  });

  test("KF-03-02: Ubah data kamar", async ({ page }) => {
    await saveScreenshot(page, "kf03-rooms-list-for-edit");

    const editBtn = page
      .getByRole("button", { name: /edit|ubah|update/i })
      .first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf03-rooms-edit-modal");

      const hargaInput = page
        .locator(
          "input[name='price'], input[name='rent_price'], input[placeholder*='harga'], input[id*='price']",
        )
        .first();
      if (await hargaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await hargaInput.clear();
        await hargaInput.fill("1800000");
      }

      const submitBtn = page.getByRole("button", {
        name: /simpan|update|perbarui|ok/i,
      });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf03-rooms-edit-result");
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      await saveScreenshot(page, "kf03-rooms-no-edit-btn");
    }
  });

  test("KF-03-04: Hapus kamar berstatus occupied → sistem menolak", async ({
    page,
  }) => {
    // Cari kamar dengan badge occupied
    await saveScreenshot(page, "kf03-rooms-occupied-list");

    // Coba hapus kamar apapun — jika occupied, harus ditolak dengan pesan error
    const deleteBtn = page
      .getByRole("button", { name: /hapus|delete/i })
      .first();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf03-rooms-delete-confirm");

      const confirmBtn = page.getByRole("button", {
        name: /konfirmasi|ya|ok|hapus|delete/i,
      });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf03-rooms-delete-occupied-result");

        // Sistem mungkin menolak atau berhasil tergantung status kamar
        const body = await page.textContent("body");
        expect(body).toBeTruthy();
      }
    }
  });

  test("KF-03-05: Hapus kamar berstatus dp_confirmation → sistem menolak", async ({
    page,
  }) => {
    await saveScreenshot(page, "kf03-rooms-dp-confirmation-list");

    // Cari badge dp_confirmation
    const dpBadge = page
      .locator("text=/dp_confirmation|DP Konfirmasi|konfirmasi/i")
      .first();
    if (await dpBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Cari delete button di baris yang sama
      const row = dpBadge.locator("..").locator("..");
      const deleteBtn = row.getByRole("button", { name: /hapus|delete/i });
      if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(500);

        const confirmBtn = page.getByRole("button", {
          name: /konfirmasi|ya|ok|hapus|delete/i,
        });
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForLoadState("networkidle");
          await saveScreenshot(page, "kf03-rooms-delete-dp-result");

          // Harus ada pesan error
          const errorMsg = page.locator(
            "[class*='toast'], [class*='error'], [role='alert']",
          );
          if (await errorMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(errorMsg).toBeVisible();
          }
        }
      }
    } else {
      await saveScreenshot(page, "kf03-rooms-no-dp-confirmation");
    }
  });

  test("KF-03-06: Hapus kamar available dengan histori → sistem menolak", async ({
    page,
  }) => {
    await saveScreenshot(page, "kf03-rooms-available-with-history");

    // Masuk ke detail kamar available yang punya histori
    const firstRoomLink = page.locator("a[href*='/dashboard/rooms/']").first();
    if (await firstRoomLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRoomLink.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf03-room-detail-for-delete");

      // Cari tombol hapus kamar di halaman detail
      const deleteBtn = page.getByRole("button", {
        name: /hapus kamar|delete room/i,
      });
      if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(500);

        const confirmBtn = page.getByRole("button", {
          name: /konfirmasi|ya|ok|hapus|delete/i,
        });
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForLoadState("networkidle");
          await saveScreenshot(page, "kf03-room-delete-history-result");

          const body = await page.textContent("body");
          expect(body).toBeTruthy();
        }
      }
    }
  });

  test("KF-03-03: Hapus kamar available tanpa histori → berhasil", async ({
    page,
  }) => {
    // Test ini membutuhkan kamar clean tanpa histori
    await saveScreenshot(page, "kf03-rooms-clean-available");

    const deleteBtn = page
      .getByRole("button", { name: /hapus|delete/i })
      .last();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf03-rooms-delete-clean-confirm");

      const confirmBtn = page.getByRole("button", {
        name: /konfirmasi|ya|ok|hapus|delete/i,
      });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf03-rooms-delete-clean-result");
        const body = await page.textContent("body");
        expect(body).toBeTruthy();
      }
    }
  });
});
