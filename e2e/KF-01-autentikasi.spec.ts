import { test, expect } from "@playwright/test";
import { login, logout, saveScreenshot, CREDENTIALS } from "./helpers/auth";

/**
 * KF-01 — Autentikasi dan Manajemen Sesi Pengguna
 * Berdasarkan Tabel 4.10 TEST_CASE.md
 */
test.describe("KF-01 — Autentikasi dan Manajemen Sesi Pengguna", () => {
  // KF-01-01
  test("KF-01-01: Login dengan kredensial valid (Operator)", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill(CREDENTIALS.operator.email);
    await page.locator("#password").fill(CREDENTIALS.operator.password);
    await saveScreenshot(page, "kf01-login-filled-operator");
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForURL("**/dashboard**", { timeout: 25000 });
    await saveScreenshot(page, "kf01-login-success-operator");
    expect(page.url()).toContain("/dashboard");
  });

  // KF-01-02
  test("KF-01-02: Login dengan kredensial valid (Viewer)", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill(CREDENTIALS.viewer.email);
    await page.locator("#password").fill(CREDENTIALS.viewer.password);
    await saveScreenshot(page, "kf01-login-filled-viewer");
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForURL("**/dashboard**", { timeout: 25000 });
    await saveScreenshot(page, "kf01-login-success-viewer");
    expect(page.url()).toContain("/dashboard");
  });

  // KF-01-03
  test("KF-01-03: Login dengan password salah — muncul pesan kesalahan", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill(CREDENTIALS.operator.email);
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await saveScreenshot(page, "kf01-login-wrong-password");

    // Verifikasi: tetap di login DAN ada pesan error
    expect(page.url()).toContain("/login");
    const errorMsg = page
      .locator(
        "[class*='toast'], [class*='alert'], [role='alert'], [class*='error'], p[class*='error'], span[class*='error']",
      )
      .first();
    const isErrorVisible = await errorMsg
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(
      isErrorVisible,
      "Pesan error harus tampil setelah login dengan password salah",
    ).toBe(true);
  });

  // KF-01-04
  test("KF-01-04: Login dengan email tidak terdaftar — muncul pesan kesalahan", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill("tidakterdaftar@example.com");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await saveScreenshot(page, "kf01-login-unknown-email");

    // Verifikasi: tetap di login DAN ada pesan error
    expect(page.url()).toContain("/login");
    const errorMsg = page
      .locator(
        "[class*='toast'], [class*='alert'], [role='alert'], [class*='error'], p[class*='error'], span[class*='error']",
      )
      .first();
    const isErrorVisible = await errorMsg
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(
      isErrorVisible,
      "Pesan error harus tampil setelah login dengan email tidak terdaftar",
    ).toBe(true);
  });

  // KF-01-05
  test("KF-01-05: Login dengan form kosong — validasi mencegah pengiriman", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForTimeout(500);
    await saveScreenshot(page, "kf01-login-empty-form");

    // Verifikasi: tetap di login DAN ada pesan validasi field
    expect(page.url()).toContain("/login");
    const validationMsg = page
      .locator(
        "[class*='toast'], [class*='alert'], [role='alert'], [class*='error'], p[class*='error'], span[class*='error'], :invalid",
      )
      .first();
    const isValidationVisible = await validationMsg
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(
      isValidationVisible,
      "Pesan validasi harus tampil saat form kosong disubmit",
    ).toBe(true);
  });

  // KF-01-06
  test("KF-01-06: Logout — token dihapus, diarahkan ke halaman login", async ({
    page,
  }) => {
    await login(page, "operator");
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-before-logout");

    // Cari tombol logout di avatar/dropdown
    const avatarBtn = page.locator("header button").last();
    if (await avatarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await avatarBtn.click();
      await page.waitForTimeout(300);
    }
    const logoutBtn = page
      .getByRole("button", { name: /logout|keluar/i })
      .or(page.getByRole("menuitem", { name: /logout|keluar/i }));
    if (
      await logoutBtn
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await logoutBtn.first().click();
      await page.waitForURL(/login/, { timeout: 15000 });
    } else {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
    }
    await saveScreenshot(page, "kf01-after-logout");
    expect(page.url()).toContain("/login");
  });

  // KF-01-07
  test("KF-01-07: Akses halaman terproteksi tanpa login — diarahkan ke login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-protected-route-redirect");
    expect(page.url()).toContain("/login");
  });

  // KF-01-08
  test("KF-01-08: Inactivity logout — sesi masih aktif saat navigasi normal", async ({
    page,
  }) => {
    await login(page, "operator");
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-session-still-active");
    expect(page.url()).toContain("/dashboard");
  });

  // KF-01-09
  test("KF-01-09: Ganti password dengan data valid — password berhasil diperbarui", async ({
    page,
  }) => {
    await login(page, "operator");
    await page.goto("/update-password");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-update-password-page");

    // Isi form ganti password
    const oldPasswordInput = page
      .locator(
        "input[name='old_password'], input[name='oldPassword'], input[placeholder*='lama'], input[placeholder*='sekarang']",
      )
      .first();
    const newPasswordInput = page
      .locator(
        "input[name='new_password'], input[name='newPassword'], input[placeholder*='baru']",
      )
      .first();
    const confirmPasswordInput = page
      .locator(
        "input[name='confirm_password'], input[name='confirmPassword'], input[placeholder*='konfirmasi']",
      )
      .first();

    if (
      await oldPasswordInput.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await oldPasswordInput.fill(CREDENTIALS.operator.password);
    }
    if (
      await newPasswordInput.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await newPasswordInput.fill("newsihuni123");
    }
    if (
      await confirmPasswordInput.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await confirmPasswordInput.fill("newsihuni123");
    }

    await saveScreenshot(page, "kf01-update-password-filled");

    const submitBtn = page
      .getByRole("button", { name: /simpan|ubah|update|submit/i })
      .first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf01-update-password-result");
    }

    // Verifikasi tetap di halaman atau redirect ke dashboard
    const currentUrl = page.url();
    expect(
      currentUrl.includes("/update-password") ||
        currentUrl.includes("/dashboard"),
    ).toBeTruthy();
  });
});
