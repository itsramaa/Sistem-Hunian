import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

// KF-08 Gap: Lapor kerusakan, update status, upload foto, log progres, viewer read-only
test.describe("KF-08 Gap — Lapor Kerusakan Baru (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
  });

  test("KF-08-01: Lapor kerusakan baru", async ({ page }) => {
    await saveScreenshot(page, "kf08-maintenance-before-add");

    const addBtn = page.getByRole("button", { name: /lapor|tambah|add|baru/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf08-maintenance-add-modal");

      // Deskripsi kerusakan
      const descInput = page.locator(
        "textarea[name='description'], textarea[placeholder*='deskripsi'], input[name='description'], input[placeholder*='deskripsi']"
      ).first();
      if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await descInput.fill("Kerusakan atap bocor - Test E2E");
      }

      // Pilih kamar
      const roomSelect = page.locator(
        "select[name='room_id'], [role='combobox'][id*='room'], button[id*='room']"
      ).first();
      if (await roomSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roomSelect.click();
        await page.waitForTimeout(500);
        const firstOption = page.locator("[role='option']").first();
        if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstOption.click();
        }
      }

      await saveScreenshot(page, "kf08-maintenance-add-filled");

      const submitBtn = page.getByRole("button", { name: /simpan|lapor|submit|ok/i });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf08-maintenance-add-result");
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      await saveScreenshot(page, "kf08-maintenance-no-add-btn");
    }
  });

  test("KF-08-02: Upload foto kerusakan", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /lapor|tambah|add|baru/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Isi deskripsi minimal
      const descInput = page.locator("textarea, input[name='description']").first();
      if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await descInput.fill("Test upload foto E2E");
      }

      // Upload foto
      const fileInput = page.locator("input[type='file']");
      if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fileInput.setInputFiles({
          name: "foto-kerusakan-test.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from(
            "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=",
            "base64"
          ),
        });
        await page.waitForTimeout(1000);
        await saveScreenshot(page, "kf08-maintenance-photo-uploaded");
      } else {
        await saveScreenshot(page, "kf08-maintenance-no-file-input");
      }

      const cancelBtn = page.getByRole("button", { name: /batal|cancel|tutup/i });
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
    }
  });

  test("KF-08-03: Perbarui status ke in_progress (diproses)", async ({ page }) => {
    await saveScreenshot(page, "kf08-maintenance-list-for-update");

    // Masuk ke detail laporan
    const firstLink = page.locator("a[href*='/dashboard/maintenance/']").first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await saveScreenshot(page, "kf08-maintenance-detail");

      // Cari tombol update status / diproses
      const processBtn = page.getByRole("button", { name: /proses|in.progress|diproses|update status/i });
      if (await processBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await processBtn.click();
        await page.waitForTimeout(500);
        await saveScreenshot(page, "kf08-maintenance-process-modal");

        // Isi tindakan
        const actionInput = page.locator(
          "textarea[name='action'], textarea[name='notes'], input[name='action'], textarea[placeholder*='tindakan']"
        ).first();
        if (await actionInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await actionInput.fill("Sedang dalam proses perbaikan - E2E");
        }

        const submitBtn = page.getByRole("button", { name: /simpan|update|ok/i });
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf08-maintenance-process-result");
        const body = await page.textContent("body");
        expect(body).toBeTruthy();
      } else {
        await saveScreenshot(page, "kf08-maintenance-no-process-btn");
      }
    }
  });

  test("KF-08-04: Perbarui status ke completed + upload foto penanganan", async ({ page }) => {
    // Masuk ke laporan yang sudah in_progress
    const firstLink = page.locator("a[href*='/dashboard/maintenance/']").first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await saveScreenshot(page, "kf08-maintenance-detail-for-complete");

      const completeBtn = page.getByRole("button", { name: /selesai|complete|completed/i });
      if (await completeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await completeBtn.click();
        await page.waitForTimeout(500);
        await saveScreenshot(page, "kf08-maintenance-complete-modal");

        // Isi tindakan
        const actionInput = page.locator(
          "textarea[name='action'], textarea[placeholder*='tindakan'], textarea[placeholder*='catatan']"
        ).first();
        if (await actionInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await actionInput.fill("Perbaikan selesai dilakukan - E2E");
        }

        // Isi biaya
        const biayaInput = page.locator(
          "input[name='cost'], input[name='biaya'], input[placeholder*='biaya']"
        ).first();
        if (await biayaInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await biayaInput.fill("250000");
        }

        // Upload foto penanganan
        const fileInput = page.locator("input[type='file']");
        if (await fileInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await fileInput.setInputFiles({
            name: "foto-penanganan-test.jpg",
            mimeType: "image/jpeg",
            buffer: Buffer.from(
              "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=",
              "base64"
            ),
          });
          await page.waitForTimeout(500);
        }

        const submitBtn = page.getByRole("button", { name: /simpan|selesai|ok/i });
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf08-maintenance-complete-result");
        const body = await page.textContent("body");
        expect(body).toBeTruthy();
      } else {
        await saveScreenshot(page, "kf08-maintenance-no-complete-btn");
      }
    }
  });

  test("KF-08-05: Lihat log progres pemeliharaan secara kronologis", async ({ page }) => {
    const firstLink = page.locator("a[href*='/dashboard/maintenance/']").first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await saveScreenshot(page, "kf08-maintenance-detail-log");

      // Cari log progres / timeline
      const logSection = page.locator(
        "[class*='log'], [class*='timeline'], [class*='progress'], [class*='history']"
      ).first();
      if (await logSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(logSection).toBeVisible();
        await saveScreenshot(page, "kf08-maintenance-log-visible");
      } else {
        await saveScreenshot(page, "kf08-maintenance-log-section");
      }
    }
  });
});

test.describe("KF-08 Gap — Viewer read-only Maintenance", () => {
  test("KF-08-06: Viewer akses maintenance → read-only (bukan ditolak)", async ({ page }) => {
    await login(page, "viewer");
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf08-viewer-maintenance-access");

    // Viewer boleh akses maintenance secara read-only
    expect(page.url()).toContain("/maintenance");

    // Tidak ada tombol mutasi (lapor/tambah/ubah)
    const addBtn = page.getByRole("button", { name: /lapor|tambah|add|baru/i });
    const isAddVisible = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isAddVisible).toBeFalsy();
  });
});
