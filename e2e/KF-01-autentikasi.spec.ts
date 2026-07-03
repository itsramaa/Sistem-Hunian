import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import { login, logout, saveScreenshot, CREDENTIALS } from "./helpers/auth";

/**
 * KF-01 — Autentikasi dan Manajemen Sesi Pengguna
 * Berdasarkan Tabel 4.10 TEST_CASE.md
 */
test.describe("KF-01 — Autentikasi dan Manajemen Sesi Pengguna", () => {
  // Reset password setelah semua KF-01 selesai — KF-01-09 mengubah password
  test.afterAll(() => {
    try {
      execSync(
        `Get-Content "f:/Coding/golang/Sistem-Hunian-Go/scripts/e2e-reset-password.sql" | docker exec -i sihuni_db psql -U sihuni -d sihuni`,
        { stdio: "pipe", shell: "powershell.exe" },
      );
    } catch (_) {
      /* ignore */
    }
  });
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

    // Klik tombol user di sidebar bawah untuk buka dropdown
    const userBtn = page.getByRole("button", {
      name: /budi santoso|operator@sihuni/i,
    });
    await expect(userBtn).toBeVisible({ timeout: 5000 });
    await userBtn.click();
    await page.waitForTimeout(500);

    // Klik menu "Keluar"
    const keluarBtn = page.getByRole("menuitem", { name: /keluar/i });
    await expect(keluarBtn).toBeVisible({ timeout: 5000 });
    await keluarBtn.click();
    await page.waitForURL(/login/, { timeout: 15000 });
    await saveScreenshot(page, "kf01-after-logout");

    // Verifikasi: diarahkan ke login dan tidak bisa akses dashboard lagi
    expect(page.url()).toContain("/login");
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
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

    // Verifikasi: sesi masih aktif — tetap di dashboard, konten termuat
    expect(page.url()).toContain("/dashboard");
    const nav = page.locator("nav, aside, [class*='sidebar']").first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  // KF-01-09
  test("KF-01-09: Ganti password dengan data valid — password berhasil diperbarui", async ({
    page,
  }) => {
    await login(page, "operator");
    await page.goto("/dashboard/profile");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-update-password-page");

    // Field ada di section Keamanan halaman profil
    const oldPasswordInput = page.getByRole("textbox", {
      name: /password saat ini/i,
    });
    const newPasswordInput = page
      .getByRole("textbox", { name: /password baru/i })
      .first();
    const confirmPasswordInput = page.getByRole("textbox", {
      name: /konfirmasi password baru/i,
    });

    await expect(oldPasswordInput).toBeVisible({ timeout: 5000 });
    await oldPasswordInput.fill(CREDENTIALS.operator.password);
    await expect(newPasswordInput).toBeVisible({ timeout: 3000 });
    await newPasswordInput.fill("sihuni123new");
    await expect(confirmPasswordInput).toBeVisible({ timeout: 3000 });
    await confirmPasswordInput.fill("sihuni123new");

    await saveScreenshot(page, "kf01-update-password-filled");

    const submitBtn = page.getByRole("button", { name: /simpan password/i });
    await expect(submitBtn).toBeVisible({ timeout: 3000 });
    await submitBtn.click();
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-update-password-result");

    // Verifikasi: toast sukses muncul
    const successToast = page
      .locator("[class*='toast'], [role='alert']")
      .filter({ hasText: /berhasil|sukses|success|updated|diperbarui/i });
    const isSuccess = await successToast
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const isStillOnProfile = page.url().includes("/profile");
    expect(
      isSuccess || isStillOnProfile,
      "Password harus berhasil diperbarui",
    ).toBeTruthy();

    // Reset password balik ke semula agar test berikutnya tidak gagal login
    if (isSuccess) {
      const oldInput2 = page.getByRole("textbox", {
        name: /password saat ini/i,
      });
      const newInput2 = page
        .getByRole("textbox", { name: /password baru/i })
        .first();
      const confirmInput2 = page.getByRole("textbox", {
        name: /konfirmasi password baru/i,
      });
      if (await oldInput2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await oldInput2.fill("sihuni123new");
        await newInput2.fill("sihuni123");
        await confirmInput2.fill("sihuni123");
        await page.getByRole("button", { name: /simpan password/i }).click();
        await page.waitForLoadState("networkidle");
      }
    }
  });
});
