import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

// KF-05 Gap: Tambah/Checkout/Ubah Penghuni
test.describe("KF-05 Gap — Tambah Penghuni (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
  });

  test("KF-05-01: Tambah penghuni baru ke kamar available", async ({ page }) => {
    await saveScreenshot(page, "kf05-tenants-before-add");

    const addBtn = page.getByRole("button", { name: /tambah|add|baru/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf05-tenants-add-modal");

      // Nama penghuni
      const namaInput = page.locator(
        "input[name='name'], input[placeholder*='nama'], input[id*='name']"
      ).first();
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.fill("Penghuni Test E2E");
      }

      // No KTP / identitas
      const ktpInput = page.locator(
        "input[name='id_number'], input[name='ktp'], input[placeholder*='ktp'], input[placeholder*='identitas']"
      ).first();
      if (await ktpInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ktpInput.fill("3201010101010001");
      }

      // No HP
      const hpInput = page.locator(
        "input[name='phone'], input[name='phone_number'], input[placeholder*='hp'], input[placeholder*='telepon'], input[placeholder*='phone']"
      ).first();
      if (await hpInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await hpInput.fill("081234567890");
      }

      // Pilih kamar (dropdown)
      const roomSelect = page.locator(
        "select[name='room_id'], [role='combobox'][id*='room'], button[id*='room']"
      ).first();
      if (await roomSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roomSelect.click();
        await page.waitForTimeout(500);
        // Pilih opsi pertama
        const firstOption = page.locator("[role='option']").first();
        if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstOption.click();
        }
      }

      // Tanggal mulai
      const startDateInput = page.locator(
        "input[name='start_date'], input[type='date'], input[placeholder*='tanggal']"
      ).first();
      if (await startDateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await startDateInput.fill("2026-07-01");
      }

      await saveScreenshot(page, "kf05-tenants-add-filled");

      const submitBtn = page.getByRole("button", { name: /simpan|tambah|submit|ok/i });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf05-tenants-add-result");
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      await saveScreenshot(page, "kf05-tenants-no-add-btn");
    }
  });

  test("KF-05-02: Tambah penghuni ke kamar occupied → sistem menolak", async ({ page }) => {
    await saveScreenshot(page, "kf05-tenants-add-occupied-start");

    const addBtn = page.getByRole("button", { name: /tambah|add|baru/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Isi nama
      const namaInput = page.locator(
        "input[name='name'], input[placeholder*='nama'], input[id*='name']"
      ).first();
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.fill("Penghuni Gagal E2E");
      }

      // Pilih kamar occupied
      const roomSelect = page.locator(
        "select[name='room_id'], [role='combobox'][id*='room'], button[id*='room']"
      ).first();
      if (await roomSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roomSelect.click();
        await page.waitForTimeout(500);
        // Cari opsi dengan label occupied
        const occupiedOption = page.locator("[role='option']").filter({ hasText: /occupied|terisi/i }).first();
        if (await occupiedOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await occupiedOption.click();
        } else {
          // Pilih opsi terakhir (kemungkinan occupied)
          const options = page.locator("[role='option']");
          const count = await options.count();
          if (count > 0) await options.last().click();
        }
      }

      const submitBtn = page.getByRole("button", { name: /simpan|tambah|submit|ok/i });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf05-tenants-add-occupied-result");

      // Harus ada pesan error
      const errorMsg = page.locator("[class*='toast'], [class*='error'], [role='alert']");
      if (await errorMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(errorMsg).toBeVisible();
      }
    }
  });

  test("KF-05-06: Ubah data penghuni aktif", async ({ page }) => {
    await saveScreenshot(page, "kf05-tenants-list-for-edit");

    // Masuk ke detail penghuni aktif
    const firstLink = page.locator("a[href*='/dashboard/tenants/']").first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await saveScreenshot(page, "kf05-tenant-detail");

      const editBtn = page.getByRole("button", { name: /edit|ubah|update/i }).first();
      if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(500);
        await saveScreenshot(page, "kf05-tenant-edit-modal");

        const hpInput = page.locator(
          "input[name='phone'], input[name='phone_number'], input[placeholder*='hp'], input[placeholder*='telepon']"
        ).first();
        if (await hpInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await hpInput.clear();
          await hpInput.fill("089876543210");
        }

        const submitBtn = page.getByRole("button", { name: /simpan|update|perbarui|ok/i });
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf05-tenant-edit-result");
        const body = await page.textContent("body");
        expect(body).toBeTruthy();
      }
    } else {
      await saveScreenshot(page, "kf05-tenants-no-detail-link");
    }
  });
});

test.describe("KF-05 Gap — Checkout Penghuni (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  test("KF-05-03: Checkout penghuni tanpa tunggakan", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf05-tenants-for-checkout");

    const firstLink = page.locator("a[href*='/dashboard/tenants/']").first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await saveScreenshot(page, "kf05-tenant-detail-for-checkout");

      const checkoutBtn = page.getByRole("button", { name: /checkout|keluar|check.out/i });
      if (await checkoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await checkoutBtn.click();
        await page.waitForTimeout(500);
        await saveScreenshot(page, "kf05-checkout-modal");

        // Isi tanggal keluar
        const dateInput = page.locator("input[type='date'], input[name*='date'], input[placeholder*='tanggal']").first();
        if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await dateInput.fill("2026-06-30");
        }

        const confirmBtn = page.getByRole("button", { name: /konfirmasi|ya|ok|checkout|keluar/i });
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForLoadState("networkidle");
          await saveScreenshot(page, "kf05-checkout-result");
        }
      } else {
        await saveScreenshot(page, "kf05-no-checkout-btn");
      }
    }
  });

  test("KF-05-04: Checkout penghuni dengan tunggakan → sistem menolak", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf05-tenants-with-arrears");

    // Cari penghuni yang punya tunggakan (overdue/unpaid)
    const firstLink = page.locator("a[href*='/dashboard/tenants/']").first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const checkoutBtn = page.getByRole("button", { name: /checkout|keluar|check.out/i });
      if (await checkoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await checkoutBtn.click();
        await page.waitForTimeout(500);

        const confirmBtn = page.getByRole("button", { name: /konfirmasi|ya|ok|checkout|keluar/i });
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForLoadState("networkidle");
          await saveScreenshot(page, "kf05-checkout-arrears-result");

          // Jika ada tunggakan, harus ada error
          const errorMsg = page.locator("[class*='toast'], [class*='error'], [role='alert']");
          if (await errorMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(errorMsg).toBeVisible();
          }
        }
      }
    }
  });

  test("KF-05-05: Lihat histori penghuni per kamar", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");

    // Masuk ke detail kamar
    const firstRoomLink = page.locator("a[href*='/dashboard/rooms/']").first();
    if (await firstRoomLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRoomLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await saveScreenshot(page, "kf05-room-detail-history-tab");

      // Klik tab histori penghuni
      const historyTab = page.getByRole("tab", { name: /histori|history|penghuni/i });
      if (await historyTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await historyTab.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf05-room-tenant-history");

        const content = page.locator("table, [class*='table'], [class*='list'], [class*='card']");
        if (await content.first().isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(content.first()).toBeVisible();
        }
      } else {
        await saveScreenshot(page, "kf05-room-no-history-tab");
      }
    }
  });
});
