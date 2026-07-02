import { Page } from "@playwright/test";
import * as fs from "fs";
import * as nodePath from "path";

export const CREDENTIALS = {
  operator: { email: "operator@sihuni.dev", password: "sihuni123" },
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

/**
 * Simpan screenshot ke folder per-KF.
 *
 * Aturan pemetaan prefix → subfolder:
 *   kfXX-*           → KF-XX/
 *   cf-01-* / cf-02-*→ KF-01/ / KF-04/   (comprehensive flows)
 *   cf-03-*          → KF-02/
 *   cf-04-*          → KF-03/
 *   cf-05-*          → KF-05/
 *   cf-06-*          → KF-06/
 *   cf-07-*          → KF-07/
 *   cf-08-*          → KF-08/
 *   cf-09-*          → KF-12/
 *   cf-10-*          → KF-11/
 *   cf-11-*          → KF-01/  (profile/settings = auth scope)
 *   cf-12-*          → KF-10/
 *   cf-13-* / cf-14-*→ misc/
 *   notifications-*  → KF-12/
 *   profile-*        → KF-01/
 *   settings-*       → KF-14/
 *   audit-*          → KF-11/
 *   ux-* / perf-*    → misc/
 */
const CF_TO_KF: Record<string, string> = {
  "01": "KF-01",
  "02": "KF-04",
  "03": "KF-02",
  "04": "KF-03",
  "05": "KF-05",
  "06": "KF-06",
  "07": "KF-07",
  "08": "KF-08",
  "09": "KF-12",
  "10": "KF-11",
  "11": "KF-01",
  "12": "KF-10",
  "13": "misc",
  "14": "misc",
};

function resolveSubfolder(name: string): string {
  // kfXX- prefix
  const kfMatch = name.match(/^kf(\d{2})-/i);
  if (kfMatch) return `KF-${kfMatch[1]}`;

  // cf-XX- prefix
  const cfMatch = name.match(/^cf-(\d{2})-/i);
  if (cfMatch) return CF_TO_KF[cfMatch[1]] ?? "misc";

  // named prefixes
  if (/^notifications-/i.test(name)) return "KF-12";
  if (/^profile-/i.test(name)) return "KF-01";
  if (/^settings-/i.test(name)) return "KF-14";
  if (/^audit-/i.test(name)) return "KF-11";

  return "misc";
}

export async function saveScreenshot(page: Page, name: string) {
  const BASE_DIR = "f:/Coding/React/Sistem-Hunian-V2/docs/testing/screenshots";

  const subfolder = resolveSubfolder(name);
  // Hapus prefix routing dari nama file agar lebih bersih
  const filename =
    name
      .replace(/^kf\d{2}-/i, "")
      .replace(/^cf-\d{2}-/i, "")
      .replace(/^(notifications|profile|settings|audit)-/i, "") + ".png";
  const dir = nodePath.join(BASE_DIR, subfolder);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fullPath = nodePath.join(dir, filename);
  await page.screenshot({ path: fullPath, fullPage: true });
  return fullPath;
}
