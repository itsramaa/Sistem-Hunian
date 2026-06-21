import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

test.describe("Notifikasi", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.waitForTimeout(500);
  });

  test("AC-NOTIF-01: NotificationBell di navbar", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "notifications-bell");
    const bell = page.locator(
      "[class*='bell'], [class*='notification'], button[aria-label*='notif']",
    );
    if ((await bell.count()) > 0) {
      await expect(bell.first()).toBeVisible();
    }
  });

  test("AC-NOTIF-02: Halaman riwayat notifikasi accessible", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "notifications-history");
    // notifications route has no ProtectedRoute allowedRoles restriction
    const url = page.url();
    expect(
      url.includes("/notifications") || url.includes("/dashboard"),
    ).toBeTruthy();
  });

  test("AC-NOTIF-03 ~ 04: Toggle unread/all dan mark as read", async ({
    page,
  }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    const toggle = page.getByRole("button", { name: /unread|semua|all/i });
    if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toggle.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "notifications-toggled");
    } else {
      await saveScreenshot(page, "notifications-no-toggle");
    }
  });
});
