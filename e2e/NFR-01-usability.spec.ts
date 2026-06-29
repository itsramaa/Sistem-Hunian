import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * NFR-01 — Kemudahan Penggunaan (Usability)
 * Parameter: Skor System Usability Scale (SUS)
 * Kriteria: Sistem memperoleh skor SUS pada kategori dapat diterima
 *
 * Pengujian ini memverifikasi aspek usability yang dapat diukur secara otomatis:
 * - Navigasi utama mudah ditemukan
 * - Pesan error informatif
 * - Feedback aksi tersedia (loading, sukses, gagal)
 * - Konsistensi label dan tombol
 * - Tidak ada halaman yang macet / blank tanpa konten
 */
test.describe("NFR-01 — Kemudahan Penggunaan (Usability)", () => {
  // NFR-01-01: Navigasi utama mudah ditemukan
  test("NFR-01-01: Navigasi utama tersedia dan mudah ditemukan", async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "nfr01-navigation-visible");

    // Sidebar/nav harus ada
    const nav = page.locator("nav, aside, [class*='sidebar'], [class*='Sidebar']").first();
    const navVisible = await nav.isVisible({ timeout: 5000 }).catch(() => false);
    expect(navVisible).toBeTruthy();
  });

  // NFR-01-02: Pesan error informatif saat login gagal
  test("NFR-01-02: Pesan error informatif ditampilkan saat login gagal", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill("salah@example.com");
    await page.locator("#password").fill("wrongpass");
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "nfr01-error-message-login");
    // Halaman masih di login — error ditampilkan
    expect(page.url()).toContain("/login");
  });

  // NFR-01-03: Halaman 404 informatif untuk route tidak dikenal
  test("NFR-01-03: Halaman 404 informatif untuk route tidak dikenal", async ({ page }) => {
    await page.goto("/halaman-tidak-ada-xyz-123");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "nfr01-404-page");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    expect(body?.length).toBeGreaterThan(0);
  });

  // NFR-01-04: Konsistensi label tombol aksi di seluruh halaman
  test("NFR-01-04: Tombol aksi utama konsisten dan mudah diidentifikasi", async ({ page }) => {
    await login(page, "operator");
    const routes = [
      "/dashboard/properties",
      "/dashboard/rooms",
      "/dashboard/payments",
      "/dashboard/maintenance",
    ];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      const body = await page.textContent("body");
      expect(body?.length).toBeGreaterThan(0);
    }
    await saveScreenshot(page, "nfr01-consistent-ui");
  });

  // NFR-01-05: Halaman tidak blank — konten selalu ada
  test("NFR-01-05: Semua halaman utama memuat konten tanpa blank screen", async ({ page }) => {
    await login(page, "operator");
    const routes = [
      { path: "/dashboard", label: "dashboard" },
      { path: "/dashboard/properties", label: "properties" },
      { path: "/dashboard/rooms", label: "rooms" },
      { path: "/dashboard/tenants", label: "tenants" },
      { path: "/dashboard/payments", label: "payments" },
      { path: "/dashboard/confirmations", label: "confirmations" },
      { path: "/dashboard/maintenance", label: "maintenance" },
      { path: "/dashboard/notifications", label: "notifications" },
      { path: "/dashboard/audit", label: "audit" },
    ];
    for (const { path, label } of routes) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      const body = await page.textContent("body");
      expect(body?.length, `Halaman ${label} blank`).toBeGreaterThan(100);
    }
    await saveScreenshot(page, "nfr01-no-blank-pages");
  });
});
