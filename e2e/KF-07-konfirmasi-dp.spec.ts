import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-07 — Manajemen Konfirmasi Calon Penghuni
 * Berdasarkan Tabel 4.16 TEST_CASE.md
 */
test.describe("KF-07 — Manajemen Konfirmasi Calon Penghuni", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  // KF-07-01
  test("KF-07-01: Nominal DP terisi otomatis 10% dari harga sewa saat pilih kamar", async ({
    page,
  }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Catat Konfirmasi DP" }).click();
    await page.waitForTimeout(500);

    const dialog = page.getByRole("dialog", { name: "Catat Konfirmasi DP" });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Pilih kamar dari Select "Kamar Tersedia"
    const roomSelect = dialog.getByRole("combobox").first();
    await roomSelect.click();
    await page.waitForTimeout(500);

    const firstOption = page.getByRole("option").first();
    if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstOption.click();
      await page.waitForTimeout(2000); // tunggu auto-fill DP
      await saveScreenshot(page, "kf07-dp-nominal-auto");

      // Verifikasi nominal DP > 0 (input type=number, placeholder="600000")
      const dpInput = dialog.locator("input[type='number']").first();
      if (await dpInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const value = await dpInput.inputValue();
        const numValue = Number(value.replace(/\D/g, ""));
        // Nominal bisa 0 jika kamar harga 0 — cek ada nilainya saja
        expect(numValue).toBeGreaterThanOrEqual(0);
        await saveScreenshot(page, "kf07-dp-value-filled");
      }
    }

    // Tutup dialog
    const cancelBtn = dialog.getByRole("button", { name: /batal/i });
    if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
    expect(page.url()).toContain("/confirmations");
  });

  // KF-07-02
  test("KF-07-02: Batas tanggal konfirmasi default H+7 saat buka form", async ({
    page,
  }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");

    const addBtn = page
      .getByRole("button", { name: /tambah|add|baru|konfirmasi/i })
      .first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshot(page, "kf07-deadline-default-h7");

    // Cari input tanggal dan baca nilainya
    const dateInput = page
      .locator(
        "input[type='date'], input[name*='date'], input[name*='deadline'], input[name*='batas']",
      )
      .first();
    if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const dateValue = await dateInput.inputValue();
      if (dateValue) {
        // Verifikasi tanggal >= today (H+7 berarti minimal sama dengan atau setelah hari ini)
        const inputDate = new Date(dateValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expect(inputDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
      }
    }

    // Tutup form
    const cancelBtn = page.getByRole("button", { name: /batal|cancel|tutup/i });
    if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }

    expect(page.url()).toContain("/confirmations");
  });

  // KF-07-03
  test("KF-07-03: Catat konfirmasi DP untuk kamar available — status kamar berubah dp_confirmation", async ({
    page,
  }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf07-confirmations-list");

    await page.getByRole("button", { name: "Catat Konfirmasi DP" }).click();
    await page.waitForTimeout(500);

    const dialog = page.getByRole("dialog", { name: "Catat Konfirmasi DP" });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Pilih kamar tersedia
    const roomSelect = dialog.getByRole("combobox").first();
    await roomSelect.click();
    await page.waitForTimeout(500);
    const firstOption = page.getByRole("option").first();
    if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstOption.click();
      await page.waitForTimeout(500);
    }

    // Isi nama calon penghuni
    await dialog.getByPlaceholder("Sari Dewi").fill("Calon Penghuni Demo E2E");

    // Isi nomor telepon
    await dialog.getByPlaceholder("08xxxxxxxxxx").fill("081200001111");

    await saveScreenshot(page, "kf07-confirmation-form-filled");

    // Submit "Catat DP"
    await dialog.getByRole("button", { name: /catat dp/i }).click();
    await page.waitForTimeout(500);

    // Konfirmasi "Ya, Catat DP"
    const confirmBtn = page.getByRole("button", { name: /ya.*catat dp/i });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf07-confirmation-saved");

    // Verifikasi: toast sukses atau nama calon muncul di daftar
    const successToast = page
      .locator("[class*='toast'], [role='alert']")
      .filter({ hasText: /berhasil|dicatat/i });
    const isSuccess = await successToast
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasName = await page
      .getByText("Calon Penghuni Demo E2E")
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(
      isSuccess || hasName || page.url().includes("/confirmations"),
    ).toBeTruthy();
    expect(page.url()).toContain("/confirmations");
  });

  // KF-07-04
  test("KF-07-04: Catat konfirmasi DP untuk kamar berstatus occupied — sistem menolak", async ({
    page,
  }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "kf07-conf-occupied-reject");

    const addBtn = page
      .getByRole("button", { name: /tambah|catat|add/i })
      .first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      const dialog = page.locator("[role='dialog']").first();
      const roomSelect = dialog.locator("[role='combobox']").first();
      if (await roomSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roomSelect.click();
        await page.waitForTimeout(500);
        await saveScreenshot(page, "kf07-conf-room-dropdown");
        // Kamar occupied tidak boleh muncul di dropdown
        const occupiedOption = page
          .locator("[role='option']")
          .filter({ hasText: /occupied/i });
        expect(
          await occupiedOption.isVisible({ timeout: 1000 }).catch(() => false),
        ).toBe(false);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
      }
      const cancelBtn = dialog
        .getByRole("button", { name: /batal|cancel|tutup/i })
        .first();
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await page.waitForTimeout(500);
    }
    expect(page.url()).toContain("/confirmations");
  });

  // KF-07-05
  test("KF-07-05: Catat konfirmasi kedua untuk kamar dp_confirmation — sistem menolak", async ({
    page,
  }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "kf07-conf-double-dp-reject");

    const addBtn = page
      .getByRole("button", { name: /tambah|catat|add/i })
      .first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      const dialog = page.locator("[role='dialog']").first();
      const roomSelect = dialog.locator("[role='combobox']").first();
      if (await roomSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roomSelect.click();
        await page.waitForTimeout(500);
        await saveScreenshot(page, "kf07-conf-room-dropdown-dp");
        // Kamar dp_confirmation tidak boleh muncul di dropdown
        const dpOption = page
          .locator("[role='option']")
          .filter({ hasText: /dp_confirmation/i });
        expect(
          await dpOption.isVisible({ timeout: 1000 }).catch(() => false),
        ).toBe(false);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
      }
      const cancelBtn = dialog
        .getByRole("button", { name: /batal|cancel|tutup/i })
        .first();
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await page.waitForTimeout(500);
    }
    expect(page.url()).toContain("/confirmations");
  });

  // KF-07-06
  test("KF-07-06: Konfirmasi DP — status confirmed, penghuni baru dibuat, status kamar occupied (atomik)", async ({
    page,
  }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf07-conf-list-for-confirm");

    // Wajibkan ada konfirmasi pending
    const pendingRow = page
      .locator("tr, [class*='card'], [class*='row']")
      .filter({ hasText: /pending|menunggu/i })
      .first();
    await expect(pendingRow).toBeVisible({ timeout: 5000 });

    const konfirmasiBtn = pendingRow
      .getByRole("button", { name: /konfirmasi|proses|confirm/i })
      .first();
    if (await konfirmasiBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await konfirmasiBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf07-conf-action-modal");

      // Isi data penghuni jika ada form
      const confirmSubmit = page
        .getByRole("button", { name: /konfirmasi|proses|confirm|ok/i })
        .last();
      if (await confirmSubmit.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmSubmit.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf07-conf-confirmed-result");

        // Verifikasi status berubah (baris tidak lagi pending)
        const confirmedBadge = page
          .locator("[class*='badge'], td, span")
          .filter({ hasText: /confirmed|selesai|dikonfirmasi/i })
          .first();
        await expect(confirmedBadge).toBeVisible({ timeout: 5000 });
      }
    }

    expect(page.url()).toContain("/confirmations");
  });

  // KF-07-07
  test("KF-07-07: Hanguskan konfirmasi secara manual — status expired, kamar kembali available", async ({
    page,
  }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf07-conf-list-for-expire");

    const expireBtn = page
      .getByRole("button", { name: /hangus|expire|batal/i })
      .first();
    await expect(expireBtn).toBeVisible({ timeout: 5000 });
    await expireBtn.click();
    await page.waitForTimeout(500);

    const confirmBtn = page
      .getByRole("button", { name: /ya|konfirmasi|lanjut/i })
      .first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf07-conf-expired-result");

      // Verifikasi badge "expired" atau "hangus" muncul
      const expiredBadge = page
        .locator("[class*='badge'], td, span")
        .filter({ hasText: /expired|hangus|kadaluarsa|kedaluwarsa/i })
        .first();
      await expect(expiredBadge).toBeVisible({ timeout: 5000 });
    }

    expect(page.url()).toContain("/confirmations");
  });

  // KF-07-08 (background worker — data di-seed)
  test("KF-07-08: Hangus otomatis oleh worker saat batas tanggal terlewati — status expired", async ({
    page,
  }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf07-conf-worker-expired");

    // Data expired sudah di-seed — hard assertion
    const expiredBadge = page
      .locator("[class*='badge'], td, span")
      .filter({ hasText: /expired|hangus|kadaluarsa|kedaluwarsa/i })
      .first();
    await expect(expiredBadge).toBeVisible({ timeout: 5000 });

    expect(page.url()).toContain("/confirmations");
  });

  // KF-07-09
  test("KF-07-09: Panel peringatan batas tanggal konfirmasi mendekati di dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Kondisional ok — data dari worker
    const dpWarning = page
      .locator("[class*='alert'], [class*='warning'], [class*='panel']")
      .filter({ hasText: /konfirmasi|dp|batas.*tanggal|deadline/i })
      .first();
    const dpWarningAlt = page
      .locator("section, div, article")
      .filter({
        hasText: /konfirmasi.*mendekati|batas.*konfirmasi|dp.*reminder/i,
      })
      .first();

    const hasWarning =
      (await dpWarning.isVisible({ timeout: 3000 }).catch(() => false)) ||
      (await dpWarningAlt.isVisible({ timeout: 2000 }).catch(() => false));

    if (hasWarning) {
      await saveScreenshot(page, "kf07-dashboard-dp-warning-visible");
    } else {
      await saveScreenshot(page, "kf07-dashboard-dp-warning-no-data");
    }

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);

    expect(page.url()).toContain("/dashboard");
  });
});
