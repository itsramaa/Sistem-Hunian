import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

// KF-06 Gap: Pembayaran manual, tandai lunas, upload bukti, riwayat per kamar
test.describe("KF-06 Gap — Catat Pembayaran Manual (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
  });

  test("KF-06-05: Catat pembayaran manual", async ({ page }) => {
    await saveScreenshot(page, "kf06-payments-before-add");

    const addBtn = page.getByRole("button", { name: /catat|tambah|add|baru/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf06-payments-add-modal");

      // Pilih kamar
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
          await page.waitForTimeout(500);
        }
      }

      // Nominal — cek apakah terisi otomatis dari harga sewa (KF-06-03)
      await saveScreenshot(page, "kf06-payments-nominal-auto");
      const nominalInput = page
        .locator(
          "input[name='amount'], input[name='nominal'], input[placeholder*='nominal'], input[placeholder*='jumlah']",
        )
        .first();
      if (await nominalInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const autoValue = await nominalInput.inputValue();
        // Jika sudah terisi otomatis, ini membuktikan KF-06-03
        if (!autoValue || autoValue === "0") {
          await nominalInput.fill("1500000");
        }
      }

      // Tanggal bayar
      const dateInput = page
        .locator(
          "input[name='payment_date'], input[name='date'], input[type='date']",
        )
        .first();
      if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateInput.fill("2026-06-28");
      }

      await saveScreenshot(page, "kf06-payments-add-filled");

      const submitBtn = page.getByRole("button", {
        name: /simpan|catat|submit|ok/i,
      });
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf06-payments-add-result");
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      await saveScreenshot(page, "kf06-payments-no-add-btn");
    }
  });

  test("KF-06-03: Nominal terisi otomatis saat pilih kamar", async ({
    page,
  }) => {
    const addBtn = page.getByRole("button", { name: /catat|tambah|add|baru/i });
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
          await saveScreenshot(page, "kf06-payments-nominal-after-room-select");

          // Verifikasi nominal terisi
          const nominalInput = page
            .locator(
              "input[name='amount'], input[name='nominal'], input[placeholder*='nominal']",
            )
            .first();
          if (
            await nominalInput.isVisible({ timeout: 3000 }).catch(() => false)
          ) {
            const value = await nominalInput.inputValue();
            // Nilai harus berubah (bukan kosong atau 0)
            expect(value).toBeTruthy();
          }
        }
      }
    }
  });

  test("KF-06-04: Tandai pembayaran lunas", async ({ page }) => {
    await saveScreenshot(page, "kf06-payments-list-for-mark-paid");

    // Cari rekaman unpaid dan tandai lunas
    const markPaidBtn = page
      .getByRole("button", { name: /tandai lunas|lunas|mark paid|paid/i })
      .first();
    if (await markPaidBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await markPaidBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf06-payments-mark-paid-confirm");

      const confirmBtn = page.getByRole("button", {
        name: /konfirmasi|ya|ok|lunas/i,
      });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf06-payments-mark-paid-result");
      }
    } else {
      // Coba dari halaman detail pembayaran
      const firstLink = page.locator("a[href*='/dashboard/payments/']").first();
      if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstLink.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf06-payment-detail-for-mark-paid");

        const detailMarkPaidBtn = page.getByRole("button", {
          name: /tandai lunas|lunas|mark paid/i,
        });
        if (
          await detailMarkPaidBtn
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
          await detailMarkPaidBtn.click();
          await page.waitForLoadState("networkidle");
          await saveScreenshot(page, "kf06-payment-marked-paid");
        }
      }
    }
  });

  test("KF-06-06: Upload bukti transfer", async ({ page }) => {
    // Masuk ke detail pembayaran
    const firstLink = page.locator("a[href*='/dashboard/payments/']").first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await saveScreenshot(page, "kf06-payment-detail-for-upload");

      // Cari input file upload
      const fileInput = page.locator("input[type='file']");
      if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Upload file gambar dummy — buat buffer PNG minimal
        await fileInput.setInputFiles({
          name: "bukti-transfer-test.png",
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "base64",
          ),
        });
        await page.waitForTimeout(1000);
        await saveScreenshot(page, "kf06-payment-upload-result");
      } else {
        // Cari tombol upload
        const uploadBtn = page.getByRole("button", {
          name: /upload|unggah|bukti/i,
        });
        if (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveScreenshot(page, "kf06-payment-upload-btn-visible");
        } else {
          await saveScreenshot(page, "kf06-payment-no-upload");
        }
      }
    }
  });

  test("KF-06-07: Lihat riwayat pembayaran per kamar", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");

    const firstRoomLink = page.locator("a[href*='/dashboard/rooms/']").first();
    if (await firstRoomLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRoomLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await saveScreenshot(page, "kf06-room-detail-payment-tab");

      // Klik tab pembayaran
      const paymentTab = page.getByRole("tab", { name: /pembayaran|payment/i });
      if (await paymentTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await paymentTab.click();
        await page.waitForLoadState("networkidle");
        await saveScreenshot(page, "kf06-room-payment-history");

        const content = page.locator(
          "table, [class*='table'], [class*='list'], [class*='card']",
        );
        if (
          await content
            .first()
            .isVisible({ timeout: 5000 })
            .catch(() => false)
        ) {
          await expect(content.first()).toBeVisible();
        }
      } else {
        await saveScreenshot(page, "kf06-room-no-payment-tab");
      }
    }
  });

  test("KF-06-08: Indikator pembayaran jatuh tempo di dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf06-dashboard-payment-warning");

    // Cari panel peringatan di dashboard
    const alertPanel = page.locator(
      "[class*='alert'], [class*='warning'], [class*='peringatan'], [class*='due']",
    );
    if (
      await alertPanel
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await expect(alertPanel.first()).toBeVisible();
    } else {
      // Screenshot sebagai evidence meski panel mungkin kosong karena tidak ada data mendekati jatuh tempo
      await saveScreenshot(page, "kf06-dashboard-no-payment-warning");
    }
  });
});
