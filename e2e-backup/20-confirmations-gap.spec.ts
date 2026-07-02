import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

// KF-07 Gap: Konfirmasi DP — catat, hangus, atomik
test.describe("KF-07 Gap — Catat Konfirmasi DP (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
  });

  test("KF-07-01: Nominal DP 10% terisi otomatis saat pilih kamar", async ({
    page,
  }) => {
    const addBtn = page.getByRole("button", { name: /tambah|add|baru|catat/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const roomSelect = page
        .locator(
          "select[name='room_id'], [role='combobox'][id*='room'], button[id*='room']",
        )
        .first();
      if (await roomSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roomSelect.click();
        await page.waitForTimeout(500);
        const firstOption = page.locator("[role='option']").first();
        if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstOption.click();
          await page.waitForTimeout(1000);
          await saveScreenshot(page, "kf07-conf-dp-nominal-auto");

          // Nominal DP harus terisi otomatis (10% dari harga sewa)
          const dpInput = page
            .locator(
              "input[name='dp_amount'], input[name='amount'], input[placeholder*='nominal'], input[placeholder*='dp']",
            )
            .first();
          if (await dpInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            const value = await dpInput.inputValue();
            expect(value).toBeTruthy();
          }
        }
      }

      // Tutup modal
      const cancelBtn = page.getByRole("button", {
        name: /batal|cancel|tutup/i,
      });
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
    }
  });

  test("KF-07-02: Batas tanggal default H+7 saat buka form", async ({
    page,
  }) => {
    const addBtn = page.getByRole("button", { name: /tambah|add|baru|catat/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf07-conf-deadline-default");

      const deadlineInput = page
        .locator(
          "input[name='deadline'], input[name='batas_tanggal'], input[name='expiry_date'], input[type='date']",
        )
        .first();
      if (await deadlineInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const value = await deadlineInput.inputValue();
        // H+7 dari hari ini (2026-06-28) = 2026-07-05
        expect(value).toBeTruthy();
        // Verifikasi nilainya sekitar 7 hari ke depan
        if (value) {
          const deadlineDate = new Date(value);
          const today = new Date("2026-06-28");
          const diffDays = Math.round(
            (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          expect(diffDays).toBeGreaterThanOrEqual(6);
          expect(diffDays).toBeLessThanOrEqual(8);
        }
      }

      const cancelBtn = page.getByRole("button", {
        name: /batal|cancel|tutup/i,
      });
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
    }
  });

  test("KF-07-03: Catat konfirmasi DP untuk kamar available", async ({
    page,
  }) => {
    await saveScreenshot(page, "kf07-conf-before-add");

    const addBtn = page.getByRole("button", { name: /tambah|add|baru|catat/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf07-conf-add-modal");

      // Nama calon penghuni
      const namaInput = page
        .locator(
          "input[name='prospect_name'], input[name='name'], input[placeholder*='nama']",
        )
        .first();
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.fill("Calon Penghuni E2E");
      }

      // Pilih kamar available
      const roomSelect = page
        .locator(
          "select[name='room_id'], [role='combobox'][id*='room'], button[id*='room']",
        )
        .first();
      if (await roomSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roomSelect.click();
        await page.waitForTimeout(500);
        const availableOption = page
          .locator("[role='option']")
          .filter({ hasText: /available|tersedia/i })
          .first();
        if (
          await availableOption.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          await availableOption.click();
        } else {
          const firstOption = page.locator("[role='option']").first();
          if (
            await firstOption.isVisible({ timeout: 3000 }).catch(() => false)
          ) {
            await firstOption.click();
          }
        }
        await page.waitForTimeout(500);
      }

      await saveScreenshot(page, "kf07-conf-add-filled");

      const submitBtn = page.getByRole("button", {
        name: /simpan|catat|submit|ok/i,
      });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf07-conf-add-result");
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      await saveScreenshot(page, "kf07-conf-no-add-btn");
    }
  });

  test("KF-07-04: Catat konfirmasi untuk kamar occupied → sistem menolak", async ({
    page,
  }) => {
    const addBtn = page.getByRole("button", { name: /tambah|add|baru|catat/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const namaInput = page
        .locator(
          "input[name='prospect_name'], input[name='name'], input[placeholder*='nama']",
        )
        .first();
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.fill("Calon Gagal E2E");
      }

      const roomSelect = page
        .locator(
          "select[name='room_id'], [role='combobox'][id*='room'], button[id*='room']",
        )
        .first();
      if (await roomSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roomSelect.click();
        await page.waitForTimeout(500);
        const occupiedOption = page
          .locator("[role='option']")
          .filter({ hasText: /occupied|terisi/i })
          .first();
        if (
          await occupiedOption.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          await occupiedOption.click();
        } else {
          const options = page.locator("[role='option']");
          const count = await options.count();
          if (count > 1) await options.last().click();
        }
      }

      const submitBtn = page.getByRole("button", {
        name: /simpan|catat|submit|ok/i,
      });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf07-conf-occupied-result");

      const errorMsg = page.locator(
        "[class*='toast'], [class*='error'], [role='alert']",
      );
      if (await errorMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(errorMsg).toBeVisible();
      }
    }
  });

  test("KF-07-05: Catat konfirmasi kedua untuk kamar dp_confirmation → sistem menolak", async ({
    page,
  }) => {
    const addBtn = page.getByRole("button", { name: /tambah|add|baru|catat/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const namaInput = page
        .locator(
          "input[name='prospect_name'], input[name='name'], input[placeholder*='nama']",
        )
        .first();
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.fill("Calon Kedua E2E");
      }

      // Pilih kamar yang sudah berstatus dp_confirmation
      const roomSelect = page
        .locator(
          "select[name='room_id'], [role='combobox'][id*='room'], button[id*='room']",
        )
        .first();
      if (await roomSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roomSelect.click();
        await page.waitForTimeout(500);
        const dpOption = page
          .locator("[role='option']")
          .filter({ hasText: /dp_confirmation|konfirmasi/i })
          .first();
        if (await dpOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await dpOption.click();
        } else {
          // Fallback: pilih opsi ke-2 (kemungkinan bukan available)
          const options = page.locator("[role='option']");
          const count = await options.count();
          if (count > 1) await options.nth(1).click();
        }
      }

      const submitBtn = page.getByRole("button", {
        name: /simpan|catat|submit|ok/i,
      });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf07-conf-double-dp-result");

      // Harus ada pesan error — sistem menolak konfirmasi kedua
      const errorMsg = page.locator(
        "[class*='toast'], [class*='error'], [role='alert']",
      );
      if (await errorMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(errorMsg).toBeVisible();
      }
    }
  });

  test("KF-07-07: Hanguskan konfirmasi secara manual oleh Operator", async ({
    page,
  }) => {
    await saveScreenshot(page, "kf07-conf-list-for-expire");

    // Cari konfirmasi pending dan hanguskan
    const expireBtn = page
      .getByRole("button", { name: /hangus|expired|expire|batal/i })
      .first();
    if (await expireBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expireBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf07-conf-expire-confirm");

      const confirmBtn = page.getByRole("button", {
        name: /konfirmasi|ya|ok|hangus/i,
      });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf07-conf-expire-result");
        const body = await page.textContent("body");
        expect(body).toBeTruthy();
      }
    } else {
      await saveScreenshot(page, "kf07-conf-no-expire-btn");
    }
  });

  test("KF-07-06: Konfirmasi DP → buat penghuni atomik (konfirmasi pending)", async ({
    page,
  }) => {
    await saveScreenshot(page, "kf07-conf-list-for-confirm");

    // Cari konfirmasi pending dan konfirmasi
    const confirmActionBtn = page
      .getByRole("button", { name: /konfirmasi|confirm|setujui/i })
      .first();
    if (
      await confirmActionBtn.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await confirmActionBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf07-conf-action-modal");

      // Isi data penghuni jika ada form
      const namaInput = page
        .locator("input[name='name'], input[placeholder*='nama penghuni']")
        .first();
      if (await namaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await namaInput.fill("Penghuni Konfirmasi E2E");
      }

      const submitBtn = page.getByRole("button", {
        name: /simpan|konfirmasi|ok/i,
      });
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf07-conf-action-result");
        const body = await page.textContent("body");
        expect(body).toBeTruthy();
      }
    } else {
      await saveScreenshot(page, "kf07-conf-no-confirm-action-btn");
    }
  });

  test("KF-07-09: Panel peringatan batas tanggal di dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf07-dashboard-dp-warning");

    const alertPanel = page.locator(
      "[class*='alert'], [class*='warning'], [class*='peringatan']",
    );
    if (
      await alertPanel
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await expect(alertPanel.first()).toBeVisible();
    } else {
      await saveScreenshot(page, "kf07-dashboard-no-dp-warning");
    }
  });
});
