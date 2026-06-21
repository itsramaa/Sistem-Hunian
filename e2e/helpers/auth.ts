import { Page } from "@playwright/test";

export const CREDENTIALS = {
  operator: { email: "operator@sihuni.dev", password: "sihuni123" },
  manager: { email: "manager@sihuni.dev", password: "sihuni123" },
  viewer: { email: "viewer@sihuni.dev", password: "sihuni123" },
} as const;

export const BASE_URL = "https://sihuni-frontend.vercel.app";

export async function login(page: Page, role: keyof typeof CREDENTIALS) {
  const creds = CREDENTIALS[role];
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  // Input ids are "email" and "password" per AuthForm.tsx
  await page.locator("#email").fill(creds.email);
  await page.locator("#password").fill(creds.password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 25000 });
}

export async function logout(page: Page) {
  // Try sidebar user menu / dropdown logout
  const logoutBtn = page.getByRole("button", { name: /logout|keluar/i });
  if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutBtn.click();
  } else {
    // fallback: navigate to login
    await page.goto("/login");
  }
  await page.waitForLoadState("networkidle");
}

export async function saveScreenshot(page: Page, name: string) {
  const path = `f:/Coding/React/Sistem-Hunian-V2/docs/testing/e2e-${name}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}
