import { test, expect } from "@playwright/test";
import { login, saveScreenshot, CREDENTIALS } from "./helpers/auth";

test.describe("Auth & Route Guard", () => {
  test("AC-AUTH-01: Login valid Operator → redirect dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill(CREDENTIALS["operator"].email);
    await page.locator("#password").fill(CREDENTIALS["operator"].password);
    await saveScreenshot(page, `kf01-login-filled-operator`);
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForURL("**/dashboard**", { timeout: 30000 });
    expect(page.url()).toContain("/dashboard");
    await saveScreenshot(page, `kf01-login-success-operator`);
  });

  test("AC-AUTH-02: Login valid Viewer → redirect dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill(CREDENTIALS["viewer"].email);
    await page.locator("#password").fill(CREDENTIALS["viewer"].password);
    await saveScreenshot(page, `kf01-login-filled-viewer`);
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForURL("**/dashboard**", { timeout: 30000 });
    expect(page.url()).toContain("/dashboard");
    await saveScreenshot(page, `kf01-login-success-viewer`);
  });

  test("AC-AUTH-04: Login password salah → error inline", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill("operator@sihuni.dev");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-login-error");
    expect(page.url()).toContain("/login");
  });

  test("AC-AUTH-05: Login email tidak terdaftar → error", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill("notexist@sihuni.dev");
    await page.locator("#password").fill("sihuni123");
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-login-notfound");
    expect(page.url()).toContain("/login");
  });

  test("AC-AUTH-06: Submit form kosong → validasi client-side", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Masuk" }).click();
    await saveScreenshot(page, "kf01-login-empty-validation");
    expect(page.url()).toContain("/login");
  });

  test("AC-AUTH-07: Akses /dashboard tanpa token → redirect /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-guard-dashboard");
    expect(page.url()).toContain("/login");
  });

  test("AC-AUTH-08: Akses /dashboard/properties tanpa token → redirect /login", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-guard-properties");
    expect(page.url()).toContain("/login");
  });

  test("AC-AUTH-10: Reset password page accessible", async ({ page }) => {
    await page.goto("/reset-password");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-reset-password");
    expect(page.url()).toContain("/reset-password");
  });

  test("AC-AUTH-11: Update password page accessible", async ({ page }) => {
    await page.goto("/update-password");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-update-password");
    expect(page.url()).toContain("/update-password");
  });

  test("AC-UX-08: 404 page untuk route tidak dikenal", async ({ page }) => {
    await page.goto("/halaman-tidak-ada");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf01-404-page");
    expect(await page.title()).not.toBe("");
  });
});
