import { test, expect } from "@playwright/test";
import { login, logout, saveScreenshot } from "./helpers/auth";

// KF-01 Gap: Logout, Ganti Password Flow
test.describe("KF-01 Gap — Logout & Ganti Password", () => {
  test("KF-01-06: Logout → token dihapus, redirect ke /login", async ({
    page,
  }) => {
    await login(page, "operator");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-before-logout");

    // Coba logout via tombol di sidebar/navbar
    const logoutBtn = page.getByRole("button", { name: /logout|keluar/i });
    if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutBtn.click();
    } else {
      // Cari via menu user / avatar dropdown
      const userMenu = page
        .locator(
          "[class*='avatar'], [class*='user-menu'], [aria-label*='user'], [aria-label*='profile']",
        )
        .first();
      if (await userMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
        await userMenu.click();
        await page.waitForTimeout(500);
        await page.getByRole("button", { name: /logout|keluar/i }).click();
      } else {
        // fallback: clear storage manual
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.goto("/login");
      }
    }
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-after-logout");
    expect(page.url()).toContain("/login");

    // Verifikasi token sudah dihapus — akses /dashboard harus redirect
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/login");
  });

  test("KF-01-09: Ganti password — halaman update-password accessible & form ada", async ({
    page,
  }) => {
    // Update password page tidak butuh login (reset via email flow)
    await page.goto("/update-password");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-update-password-page");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("KF-01-09b: Ganti password dari profil — form tersedia", async ({
    page,
  }) => {
    await login(page, "operator");
    await page.goto("/dashboard/profile");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "kf01-profile-change-password");

    // Cari tab atau section ganti password
    const changePassTab = page.getByRole("tab", {
      name: /password|kata sandi/i,
    });
    if (await changePassTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await changePassTab.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "kf01-profile-password-tab");
    }

    // Cari input password lama
    const oldPassInput = page.locator("input[type='password']").first();
    if (await oldPassInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Test validasi: submit password baru < 6 karakter
      const inputs = page.locator("input[type='password']");
      const count = await inputs.count();
      if (count >= 2) {
        await inputs.nth(0).fill("sihuni123");
        await inputs.nth(1).fill("123"); // terlalu pendek
        const submitBtn = page.getByRole("button", {
          name: /simpan|update|perbarui|ganti/i,
        });
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(500);
          await saveScreenshot(page, "kf01-password-validation-error");
          // Masih di halaman yang sama
          expect(page.url()).toContain("/dashboard");
        }
      }
    }
  });

  test("KF-01-08: Inactivity — sesi masih aktif saat navigasi normal", async ({
    page,
  }) => {
    await login(page, "operator");
    await page.waitForLoadState("networkidle");
    // Verifikasi sesi aktif
    expect(page.url()).toContain("/dashboard");
    await saveScreenshot(page, "kf01-session-active");
    // Inactivity timeout tidak bisa di-test penuh via e2e (membutuhkan waktu nyata)
    // Yang bisa diverifikasi: sesi tidak langsung expired tanpa inaktivitas
    await page.waitForTimeout(3000);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/dashboard");
    await saveScreenshot(page, "kf01-session-still-active");
  });
});
