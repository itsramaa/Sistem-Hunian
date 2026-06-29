import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * KF-10 — Manajemen Hak Akses Pengguna (RBAC)
 * Berdasarkan Tabel 4.19 TEST_CASE.md
 */
test.describe("KF-10 — Manajemen Hak Akses Pengguna", () => {
  // KF-10-01
  test("KF-10-01: Operator mengakses seluruh fitur — semua menu dapat diakses", async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf10-operator-sidebar");
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);

    const routes = [
      "/dashboard",
      "/dashboard/properties",
      "/dashboard/rooms",
      "/dashboard/tenants",
      "/dashboard/payments",
      "/dashboard/confirmations",
      "/dashboard/maintenance",
      "/dashboard/audit",
      "/dashboard/settings",
    ];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain(route.replace("/dashboard", ""));
    }
    await saveScreenshot(page, "kf10-operator-full-access");
  });

  // KF-10-02
  test("KF-10-02: Viewer hanya mengakses fitur baca — tombol mutasi tidak tersedia", async ({ page }) => {
    await login(page, "viewer");
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf10-viewer-sidebar");

    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "kf10-viewer-properties-readonly");

    const addBtn = page.getByRole("button", { name: /^tambah$|^add$|^baru$/i });
    const isAddVisible = await addBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isAddVisible).toBe(false);
  });

  // KF-10-03
  test("KF-10-03: Viewer mengakses halaman khusus Operator — akses ditolak", async ({ page }) => {
    await login(page, "viewer");
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto("/dashboard/audit");
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf10-viewer-audit-blocked");
    expect(page.url()).not.toContain("/audit");
  });

  // KF-10-04
  test("KF-10-04: Operator mengakses fitur Viewer Request — daftar permintaan ditampilkan", async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/viewer-requests");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf10-operator-viewer-requests");
    expect(page.url()).toContain("/viewer-requests");
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
  });
});
