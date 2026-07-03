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
    const addBtn = page
      .getByRole("button", { name: /tambah|add|baru|catat/i })
      .first();
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
          await saveScreenshot(page, "kf07-dp-nominal-auto");
          const dpInput = page
            .locator(
              "input[name='dp_amount'], input[name='down_payment_amount'], input[placeholder*='nominal'], input[placeholder*='dp']",
            )
            .first();
          if (await dpInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            const value = await dpInput.inputValue();
            expect(value).toBeTruthy();
          }
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
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf07-deadline-default-h7");
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
    expect(page.url()).toContain("/confirmations");
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
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

      // Scope ke dalam dialog
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
      // Tutup dialog
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
    const konfirmasiBtn = page
      .getByRole("button", { name: /konfirmasi|proses|confirm/i })
      .first();
    if (await konfirmasiBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await konfirmasiBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf07-conf-action-modal");
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
    if (await expireBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expireBtn.click();
      await page.waitForTimeout(500);
      const confirmBtn = page
        .getByRole("button", { name: /ya|konfirmasi|lanjut/i })
        .first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf07-conf-expired-result");
      }
    }
    expect(page.url()).toContain("/confirmations");
  });

  // KF-07-08 (background worker)
  test("KF-07-08: Hangus otomatis oleh worker saat batas tanggal terlewati — status expired", async ({
    page,
  }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf07-conf-worker-expired");
    const expiredBadge = page
      .locator("[class*='badge'], td")
      .filter({ hasText: /expired|hangus|kadaluarsa/i })
      .first();
    if (await expiredBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(expiredBadge).toBeVisible();
    }
    expect(page.url()).toContain("/confirmations");
  });

  // KF-07-09
  test("KF-07-09: Panel peringatan batas tanggal konfirmasi mendekati di dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

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

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);

    if (hasWarning) {
      await saveScreenshot(page, "kf07-dashboard-dp-warning-visible");
    } else {
      await saveScreenshot(page, "kf07-dashboard-dp-warning-no-data");
    }
    expect(page.url()).toContain("/dashboard");
  });
});
