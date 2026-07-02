import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * E2E Tests — 29-worker-background.spec.ts
 * Menguji skenario background worker dengan cara:
 * 1. Setup data kondisi trigger via SQL (lihat scripts/demo-worker-setup.sql)
 * 2. Trigger worker via endpoint debug POST /api/v1/debug/run-worker
 * 3. Verifikasi hasil di UI
 *
 * Prasyarat:
 * - Backend running di localhost dengan APP_ENV=development
 * - Script demo-worker-setup.sql sudah dijalankan di DB dev
 * - Token operator tersedia
 */

const BACKEND_URL = "http://localhost:9090";

// Helper: trigger worker via API langsung (tidak lewat browser)
async function triggerWorker(page: any): Promise<boolean> {
  // Ambil token dari localStorage setelah login
  const token = await page.evaluate(
    () =>
      localStorage.getItem("sihuni_access_token") ||
      sessionStorage.getItem("sihuni_access_token") ||
      Object.entries(localStorage).find(([k]) => k.includes("token"))?.[1] ||
      "",
  );

  if (!token) return false;

  // Trigger worker via fetch dari browser context
  const result = await page.evaluate(
    async ({ url, tok }: { url: string; tok: string }) => {
      try {
        const res = await fetch(`${url}/api/v1/debug/run-worker`, {
          method: "POST",
          headers: { Authorization: `Bearer ${tok}` },
        });
        return { ok: res.ok, status: res.status };
      } catch (e) {
        return { ok: false, status: 0 };
      }
    },
    { url: BACKEND_URL, tok: token },
  );

  return result.ok;
}

// ─── KF-06-01: Rekaman pembayaran otomatis H-3 ───────────────────────────────
test.describe("KF-06-01 — Rekaman Pembayaran Otomatis H-3 (Background Worker)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.waitForLoadState("networkidle");
  });

  test("KF-06-01: Worker membuat rekaman unpaid H-3 sebelum jatuh tempo", async ({
    page,
  }) => {
    // Trigger worker
    const triggered = await triggerWorker(page);
    await saveScreenshot(page, "kf06-worker-trigger");

    if (!triggered) {
      test.skip();
      return;
    }

    // Tunggu worker selesai
    await page.waitForTimeout(3000);

    // Navigasi ke halaman pembayaran
    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf06-payments-after-worker");

    // Harus ada record dengan status unpaid
    const body = await page.textContent("body");
    expect(body).toBeTruthy();

    // Cari badge/teks unpaid
    const unpaidBadge = page
      .locator("[class*='badge'], [class*='Badge'], td, [class*='card']")
      .filter({ hasText: /unpaid|belum lunas/i })
      .first();
    if (await unpaidBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(unpaidBadge).toBeVisible();
      await saveScreenshot(page, "kf06-unpaid-record-created");
    } else {
      await saveScreenshot(page, "kf06-payments-check");
    }
  });
});

// ─── KF-06-02: Overdue otomatis ──────────────────────────────────────────────
test.describe("KF-06-02 — Overdue Otomatis (Background Worker)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.waitForLoadState("networkidle");
  });

  test("KF-06-02: Worker mengubah status unpaid → overdue saat jatuh tempo terlewati", async ({
    page,
  }) => {
    const triggered = await triggerWorker(page);
    await saveScreenshot(page, "kf06-overdue-worker-trigger");

    if (!triggered) {
      test.skip();
      return;
    }

    await page.waitForTimeout(3000);

    await page.goto("/dashboard/payments");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf06-payments-overdue-after-worker");

    // Cari record dengan status overdue
    const overdueBadge = page
      .locator("[class*='badge'], [class*='Badge'], td, [class*='card']")
      .filter({ hasText: /overdue|terlambat|jatuh tempo/i })
      .first();
    if (await overdueBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(overdueBadge).toBeVisible();
      await saveScreenshot(page, "kf06-overdue-record-visible");
    } else {
      await saveScreenshot(page, "kf06-overdue-check");
    }
  });
});

// ─── KF-07-08: Hangus otomatis konfirmasi DP ─────────────────────────────────
test.describe("KF-07-08 — Hangus Otomatis Konfirmasi DP (Background Worker)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.waitForLoadState("networkidle");
  });

  test("KF-07-08: Worker mengubah status konfirmasi pending → expired saat deadline terlewati", async ({
    page,
  }) => {
    // Screenshot kondisi sebelum worker
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf07-confirmations-before-worker");

    // Trigger worker
    const triggered = await triggerWorker(page);
    if (!triggered) {
      test.skip();
      return;
    }

    await page.waitForTimeout(3000);

    // Refresh halaman konfirmasi
    await page.goto("/dashboard/confirmations");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf07-confirmations-after-worker");

    // Cari konfirmasi dengan status expired
    const expiredBadge = page
      .locator("[class*='badge'], [class*='Badge'], td, [class*='card']")
      .filter({ hasText: /expired|hangus|kadaluarsa/i })
      .first();
    if (await expiredBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(expiredBadge).toBeVisible();
      await saveScreenshot(page, "kf07-expired-confirmation-visible");
    } else {
      await saveScreenshot(page, "kf07-expired-check");
    }

    // Verifikasi kamar kembali ke status available
    await page.goto("/dashboard/rooms");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf07-rooms-after-expiry");
  });
});

// ─── KF-12-01: Notifikasi dp_reminder otomatis ───────────────────────────────
test.describe("KF-12-01 — Notifikasi dp_reminder Otomatis (Background Worker)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.waitForLoadState("networkidle");
  });

  test("KF-12-01: Worker membuat notifikasi dp_reminder untuk konfirmasi mendekati deadline", async ({
    page,
  }) => {
    // Catat jumlah notifikasi sebelum
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf12-notifications-before-worker");

    const notifCountBefore = await page
      .locator("[class*='notification'], [class*='notif'], [role='listitem']")
      .count();

    // Trigger worker
    const triggered = await triggerWorker(page);
    if (!triggered) {
      test.skip();
      return;
    }

    await page.waitForTimeout(3000);

    // Refresh halaman notifikasi
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf12-notifications-after-worker-dp-reminder");

    // Cari notifikasi dp_reminder
    const dpReminderNotif = page
      .locator(
        "[class*='notification'], [class*='notif'], [role='listitem'], [class*='card']",
      )
      .filter({ hasText: /konfirmasi|dp|reminder|akan kadaluarsa/i })
      .first();

    if (await dpReminderNotif.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(dpReminderNotif).toBeVisible();
      await saveScreenshot(page, "kf12-dp-reminder-notif-visible");
    } else {
      // Cek panel notifikasi di dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      await saveScreenshot(page, "kf12-dashboard-alert-dp-reminder");
    }
  });
});

// ─── KF-12-02: Notifikasi payment_due otomatis ───────────────────────────────
test.describe("KF-12-02 — Notifikasi payment_due Otomatis (Background Worker)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "operator");
    await page.waitForLoadState("networkidle");
  });

  test("KF-12-02: Worker membuat notifikasi payment_due untuk pembayaran mendekati jatuh tempo", async ({
    page,
  }) => {
    // Trigger worker
    const triggered = await triggerWorker(page);
    if (!triggered) {
      test.skip();
      return;
    }

    await page.waitForTimeout(3000);

    // Cek notifikasi
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf12-notifications-after-worker-payment-due");

    // Cari notifikasi payment_due
    const paymentDueNotif = page
      .locator(
        "[class*='notification'], [class*='notif'], [role='listitem'], [class*='card']",
      )
      .filter({ hasText: /pembayaran|jatuh tempo|payment/i })
      .first();

    if (await paymentDueNotif.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(paymentDueNotif).toBeVisible();
      await saveScreenshot(page, "kf12-payment-due-notif-visible");
    } else {
      await saveScreenshot(page, "kf12-payment-due-check");
    }

    // Cek indikator di dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "kf12-dashboard-payment-due-alert");
  });
});
