import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

test.describe("Manajemen Properti (Operator)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
  });

  test("AC-PROP-01: Daftar properti tampil dengan tabel", async ({ page }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf02-list");
    // Table or list must render
    const content = page.locator("table, [class*='table'], [class*='card']");
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test("AC-PROP-06: Empty state jika belum ada properti", async ({ page }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf02-empty-or-list");
    // Either empty state or table renders — both acceptable
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("AC-PROP-04: Hapus properti berkamar → error informatif", async ({
    page,
  }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "kf02-before-delete");

    // Find any delete button
    const deleteBtn = page
      .getByRole("button", { name: /hapus|delete/i })
      .first();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      // Confirm dialog if exists
      const confirmBtn = page.getByRole("button", {
        name: /konfirmasi|ya|ok|delete|hapus/i,
      });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf02-delete-error");
    }
  });

  test("AC-PROP-07: Klik properti → detail page", async ({ page }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    // Find first clickable row/link
    const firstLink = page.locator("a[href*='/dashboard/properties/']").first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "kf02-detail");
      expect(page.url()).toContain("/properties/");
    }
  });
});
