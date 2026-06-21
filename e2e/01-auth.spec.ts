import { test, expect } from "@playwright/test";
import { login, saveScreenshot, CREDENTIALS } from "./helpers/auth";

test.describe("Auth & Route Guard", () => {
  test("AC-AUTH-01 ~ 03: Login valid semua role", async ({ page }) => {
    for (const role of ["operator", "manager", "viewer"] as const) {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
      // Use id selectors — inputs have id="email" and id="password" per AuthForm.tsx
      await page.locator("#email").fill(CREDENTIALS[role].email);
      await page.locator("#password").fill(CREDENTIALS[role].password);
      await saveScreenshot(page, `auth-login-filled-${role}`);
      await page.getByRole("button", { name: "Masuk" }).click();
      await page.waitForURL("**/dashboard**", { timeout: 30000 });
      expect(page.url()).toContain("/dashboard");
      await saveScreenshot(page, `auth-login-success-${role}`);
      // Clear storage before next role
      await page.evaluate(() => localStorage.clear());
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
    }
  });

  test("AC-AUTH-04: Login password salah → error inline", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill("operator@sihuni.dev");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "auth-login-error");
    expect(page.url()).toContain("/login");
  });

  test("AC-AUTH-05: Login email tidak terdaftar → error", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill("notexist@sihuni.dev");
    await page.locator("#password").fill("sihuni123");
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "auth-login-notfound");
    expect(page.url()).toContain("/login");
  });

  test("AC-AUTH-06: Submit form kosong → validasi client-side", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Masuk" }).click();
    await saveScreenshot(page, "auth-login-empty-validation");
    expect(page.url()).toContain("/login");
  });

  test("AC-AUTH-07: Akses /dashboard tanpa token → redirect /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "auth-guard-dashboard");
    expect(page.url()).toContain("/login");
  });

  test("AC-AUTH-08: Akses /dashboard/properties tanpa token → redirect /login", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "auth-guard-properties");
    expect(page.url()).toContain("/login");
  });

  test("AC-AUTH-10: Reset password page accessible", async ({ page }) => {
    await page.goto("/reset-password");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "auth-reset-password");
    expect(page.url()).toContain("/reset-password");
  });

  test("AC-AUTH-11: Update password page accessible", async ({ page }) => {
    await page.goto("/update-password");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "auth-update-password");
    expect(page.url()).toContain("/update-password");
  });

  test("AC-UX-08: 404 page untuk route tidak dikenal", async ({ page }) => {
    await page.goto("/halaman-tidak-ada");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "auth-404-page");
    expect(await page.title()).not.toBe("");
  });
});
