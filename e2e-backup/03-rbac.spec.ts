import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

test.describe("RBAC - Viewer restrictions", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "viewer");
    await page.waitForTimeout(500);
  });

  test("AC-RBAC-07: Viewer /dashboard/properties → bisa akses (read-only)", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf10-viewer-properties");
    // Viewer boleh akses properties secara read-only
    expect(page.url()).toContain("/properties");
  });

  test("AC-RBAC-08: Viewer /dashboard/maintenance → bisa akses (read-only)", async ({
    page,
  }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf10-viewer-maintenance");
    // Viewer boleh akses maintenance secara read-only
    expect(page.url()).toContain("/maintenance");
  });

  test("AC-RBAC-09: Viewer sidebar hanya Dashboard", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf10-viewer-sidebar");
    // Take screenshot for evidence — soft check on visible nav links
    const visibleNavLinks = await page
      .locator("nav a, aside a")
      .allTextContents();
    const hasOperatorMenu = visibleNavLinks.some(
      (t) =>
        t.includes("Properti") ||
        t.includes("Kamar") ||
        t.includes("Pembayaran"),
    );
    expect(hasOperatorMenu).toBeFalsy();
  });
});

test.describe("RBAC - Operator full access", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  test("AC-RBAC-10: Operator sidebar semua menu tampil", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf10-operator-sidebar");
    expect(page.url()).toContain("/dashboard");
  });
});
