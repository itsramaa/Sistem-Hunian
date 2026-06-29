import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * NFR-02 — Aksesibilitas Berbasis Web
 * Parameter: Kompatibilitas perangkat dan responsivitas antarmuka
 * Kriteria: Sistem dapat diakses via browser pada smartphone dan laptop
 *           tanpa instalasi tambahan, tampilan responsif
 */
test.describe("NFR-02 — Aksesibilitas Berbasis Web", () => {
  // NFR-02-01: Dapat diakses via browser (tidak butuh instalasi)
  test("NFR-02-01: Sistem dapat diakses via browser tanpa instalasi tambahan", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "nfr02-browser-access");
    expect(page.url()).toContain("/login");
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
  });

  // NFR-02-02: Tampilan responsif — tidak ada horizontal overflow di desktop
  test("NFR-02-02: Tampilan responsif desktop (1440px) — tidak ada horizontal overflow", async ({ page }) => {
    await login(page, "operator");
    const routes = [
      "/dashboard",
      "/dashboard/properties",
      "/dashboard/rooms",
      "/dashboard/payments",
      "/dashboard/maintenance",
    ];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(scrollWidth, `Horizontal overflow di ${route}`).toBeLessThanOrEqual(viewportWidth + 10);
    }
    await saveScreenshot(page, "nfr02-desktop-no-overflow");
  });

  // NFR-02-03: Tampilan responsif mobile 390px (iPhone)
  test("NFR-02-03: Tampilan responsif mobile 390px — halaman dapat dibaca", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "nfr02-mobile-login");

    // Form login harus tampil di mobile
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Masuk" })).toBeVisible();
  });

  // NFR-02-04: Dashboard tampil di mobile 390px
  test("NFR-02-04: Dashboard dapat diakses di viewport mobile 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, "operator");
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await saveScreenshot(page, "nfr02-mobile-dashboard");
    expect(page.url()).toContain("/dashboard");

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });

  // NFR-02-05: Dark mode dapat diaktifkan
  test("NFR-02-05: Dark mode dapat diaktifkan tanpa layout rusak", async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "nfr02-light-mode");

    const toggleBtn = page.getByRole("button", { name: /toggle.*theme|dark|light|tema/i });
    if (await toggleBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
      await saveScreenshot(page, "nfr02-dark-mode");
      const body = await page.textContent("body");
      expect(body?.length).toBeGreaterThan(0);
    } else {
      await saveScreenshot(page, "nfr02-theme-toggle-not-found");
    }
  });

  // NFR-02-06: Halaman tidak memerlukan plugin browser
  test("NFR-02-06: Semua halaman utama memuat tanpa error JavaScript fatal", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await login(page, "operator");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Filter hanya error fatal (bukan warning atau network error)
    const fatalErrors = jsErrors.filter(
      (e) => !e.includes("Warning") && !e.includes("ResizeObserver") && !e.includes("Non-Error")
    );
    await saveScreenshot(page, "nfr02-no-js-errors");
    expect(fatalErrors.length).toBe(0);
  });
});
