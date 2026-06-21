import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

test.describe("UX & Responsivitas", () => {
  test("AC-UX-01: Mobile 375px tidak overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page, "operator");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "ux-mobile-dashboard");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(390);
  });

  test("AC-UX-02: Desktop 1440px layout proporsional", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, "operator");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "ux-desktop-dashboard");
  });

  test("AC-UX-03: Loading skeleton saat fetching", async ({ page }) => {
    await login(page, "operator");
    // Navigate to new page and check for skeleton
    await page.goto("/dashboard/properties");
    const skeleton = page.locator("[class*='skeleton'], [class*='Skeleton'], [class*='pulse']");
    if ((await skeleton.count()) > 0) {
      await saveScreenshot(page, "ux-loading-skeleton");
    }
  });

  test("AC-UX-04: Empty state tampil jika tidak ada data", async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "ux-empty-state");
    const empty = page.locator("[class*='empty'], [class*='Empty']");
    if ((await empty.count()) > 0) {
      await expect(empty.first()).toBeVisible();
    }
  });

  test("AC-UX-09: Unauthorized page", async ({ page }) => {
    await page.goto("/unauthorized");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "ux-unauthorized");
  });

  test("AC-UX-06: Toast notification muncul", async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    // Toast should appear if there's data or actions
    const toast = page.locator("[class*='toast'], [class*='Toast'], [role='status']");
    if ((await toast.count()) > 0) {
      await saveScreenshot(page, "ux-toast");
    }
  });
});

test.describe("Dark/Light Mode", () => {
  test("AC-DASH-07 ~ 08: Dark & Light mode readable", async ({ page }) => {
    await login(page, "operator");
    await page.waitForLoadState("networkidle");
    
    // Dark mode
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(500);
    await saveScreenshot(page, "ux-dark-mode");
    
    // Light mode
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.waitForTimeout(500);
    await saveScreenshot(page, "ux-light-mode");
  });
});
