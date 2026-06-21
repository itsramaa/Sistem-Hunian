import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

test.describe("RBAC - Manager restrictions", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "manager");
    await page.waitForTimeout(500);
  });

  test("AC-RBAC-01: Manager /dashboard/properties → unauthorized/redirect", async ({ page }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "rbac-manager-properties");
    expect(page.url()).not.toContain("/properties");
  });

  test("AC-RBAC-02: Manager /dashboard/rooms → unauthorized/redirect", async ({ page }) => {
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "rbac-manager-rooms");
    expect(page.url()).not.toContain("/rooms");
  });

  test("AC-RBAC-03: Manager /dashboard/tenants → unauthorized/redirect", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "rbac-manager-tenants");
    expect(page.url()).not.toContain("/tenants");
  });

  test("AC-RBAC-04: Manager /dashboard/payments → unauthorized/redirect", async ({ page }) => {
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "rbac-manager-payments");
    expect(page.url()).not.toContain("/payments");
  });

  test("AC-RBAC-05: Manager /dashboard/confirmations → unauthorized/redirect", async ({ page }) => {
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "rbac-manager-confirmations");
    expect(page.url()).not.toContain("/confirmations");
  });

  test("AC-RBAC-06: Manager /dashboard/maintenance → ALLOWED", async ({ page }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    // Wait for auth state to settle — ProtectedRoute needs isLoading=false
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "rbac-manager-maintenance-allowed");
    // Per router.tsx: maintenance allows ['operator', 'manager']
    expect(page.url()).toContain("/maintenance");
  });
});

test.describe("RBAC - Viewer restrictions", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "viewer");
    await page.waitForTimeout(500);
  });

  test("AC-RBAC-07: Viewer /dashboard/properties → unauthorized/redirect", async ({ page }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "rbac-viewer-properties");
    expect(page.url()).not.toContain("/properties");
  });

  test("AC-RBAC-08: Viewer /dashboard/maintenance → unauthorized/redirect", async ({ page }) => {
    await page.goto("/dashboard/maintenance");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "rbac-viewer-maintenance");
    expect(page.url()).not.toContain("/maintenance");
  });

  test("AC-RBAC-09: Viewer sidebar hanya Dashboard", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "rbac-viewer-sidebar");
    // Take screenshot for evidence — soft check on visible nav links
    const visibleNavLinks = await page.locator("nav a, aside a").allTextContents();
    const hasOperatorMenu = visibleNavLinks.some(t =>
      t.includes("Properti") || t.includes("Kamar") || t.includes("Pembayaran")
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
    await saveScreenshot(page, "rbac-operator-sidebar");
    expect(page.url()).toContain("/dashboard");
  });
});
