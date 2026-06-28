import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

test.describe("Dashboard - Operator", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  test("AC-DASH-01: Summary cards tampil lengkap", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf04-operator-desktop");
    // Summary cards harus ada
    const cards = page.locator(
      "[class*='card'], [class*='stat'], [class*='summary']",
    );
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
  });

  test("AC-DASH-07: Dark mode readable", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // Toggle dark mode jika ada ThemeToggle
    const themeBtn = page.getByRole("button", {
      name: /theme|dark|light|mode/i,
    });
    if (await themeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeBtn.click();
      await page.waitForTimeout(500);
    } else {
      await page.evaluate(() => document.documentElement.classList.add("dark"));
    }
    await saveScreenshot(page, "kf04-operator-dark");
  });

  test("AC-DASH-08: Light mode readable", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.evaluate(() =>
      document.documentElement.classList.remove("dark"),
    );
    await saveScreenshot(page, "kf04-operator-light");
  });

  test("AC-DASH-09: Mobile responsive 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf04-operator-mobile");
    // Tidak ada horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(390);
  });
});

test.describe("Dashboard - Viewer", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "viewer");
  });

  test("AC-DASH-05: Viewer hanya melihat summary cards", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf04-viewer-desktop");
    expect(page.url()).toContain("/dashboard");
  });

  test("AC-DASH-09: Viewer mobile 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf04-viewer-mobile");
  });
});
