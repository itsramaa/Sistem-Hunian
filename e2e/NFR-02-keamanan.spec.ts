import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

/**
 * NFR-02 — Keamanan Data
 * Parameter: Autentikasi dan role-based access control
 * Kriteria: Sistem membatasi akses pengguna sesuai role (Operator dan Viewer)
 *           sehingga data hanya dapat diakses sesuai kewenangan
 */
test.describe("NFR-02 — Keamanan Data", () => {
  // NFR-02-01: Akses tanpa autentikasi selalu di-redirect ke login
  test("NFR-02-01: Akses URL terproteksi tanpa token selalu redirect ke /login", async ({
    page,
  }) => {
    // Pastikan tidak ada token — buka halaman fresh tanpa login
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "nfr02-unauthenticated-redirect");
    expect(page.url()).toContain("/login");
  });

  // NFR-02-02: Viewer tidak dapat mengakses halaman Operator
  test("NFR-02-02: Viewer tidak dapat mengakses halaman eksklusif Operator", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    // Audit trail — operator only
    await page.goto("/dashboard/audit");
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "nfr02-viewer-audit-blocked");
    expect(page.url()).not.toContain("/audit");

    // Settings — operator only
    await page.goto("/dashboard/settings");
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "nfr02-viewer-settings-blocked");
    expect(page.url()).not.toContain("/settings");
  });

  // NFR-02-03: Viewer tidak dapat melihat tombol mutasi data
  test("NFR-02-03: Viewer tidak dapat melihat tombol tambah/ubah/hapus", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    await page.goto("/dashboard/properties");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await saveScreenshot(page, "nfr02-viewer-no-mutation-buttons");

    const addBtn = page.getByRole("button", { name: /^tambah$|^add$|^baru$/i });
    const editBtn = page.getByRole("button", { name: /^edit$|^ubah$/i });
    const deleteBtn = page.getByRole("button", { name: /^hapus$|^delete$/i });

    expect(await addBtn.isVisible({ timeout: 2000 }).catch(() => false)).toBe(
      false,
    );
    expect(await editBtn.isVisible({ timeout: 2000 }).catch(() => false)).toBe(
      false,
    );
    expect(
      await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false),
    ).toBe(false);
  });

  // NFR-02-04: Operator dapat mengakses semua fitur
  test("NFR-02-04: Operator dapat mengakses seluruh fitur sistem", async ({
    page,
  }) => {
    await login(page, "operator");

    const operatorRoutes = [
      "/dashboard",
      "/dashboard/properties",
      "/dashboard/rooms",
      "/dashboard/tenants",
      "/dashboard/payments",
      "/dashboard/confirmations",
      "/dashboard/maintenance",
      "/dashboard/audit",
      "/dashboard/settings",
      "/dashboard/viewer-requests",
      "/dashboard/notifications",
    ];
    for (const route of operatorRoutes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
      expect(page.url(), `Operator tidak bisa akses ${route}`).toContain(
        route.replace("/dashboard", ""),
      );
    }
    await saveScreenshot(page, "nfr02-operator-full-access");
  });

  // NFR-02-05: Token tidak bocor ke URL atau log
  test("NFR-02-05: Token autentikasi tidak muncul di URL", async ({ page }) => {
    await login(page, "operator");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "nfr02-token-not-in-url");

    // Token tidak boleh muncul di URL
    const url = page.url();
    expect(url).not.toContain("token");
    expect(url).not.toContain("Bearer");
    expect(url).not.toContain("access_token");
  });

  // NFR-02-06: Viewer hanya bisa mengakses modul operasional secara read-only
  test("NFR-02-06: Viewer dapat akses modul operasional (read-only) tanpa error", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    const viewerReadRoutes = [
      "/dashboard/properties",
      "/dashboard/rooms",
      "/dashboard/tenants",
      "/dashboard/payments",
      "/dashboard/confirmations",
      "/dashboard/maintenance",
      "/dashboard/notifications",
    ];
    for (const route of viewerReadRoutes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
      expect(page.url(), `Viewer gagal akses ${route}`).toContain(
        route.replace("/dashboard", ""),
      );
    }
    await saveScreenshot(page, "nfr02-viewer-readonly-access");
  });
});

/**
 * NFR-02 — Black Box: Validasi Otorisasi Peran via API
 * Bab 4.4.1 — Pengujian Black Box: Viewer dilarang akses endpoint mutasi
 *
 * Skenario: Viewer (role=viewer) mencoba memanggil endpoint:
 *   POST   /api/v1/properties  → harus 403 Forbidden
 *   PUT    /api/v1/properties/:id → harus 403 Forbidden
 *   DELETE /api/v1/properties/:id → harus 403 Forbidden
 *
 * Operator (role=operator) memanggil endpoint yang sama → harus 2xx atau 422 (bukan 403)
 */
test.describe("NFR-02 — Black Box: Validasi Otorisasi Peran API /api/v1/properties", () => {
  const API_BASE = "http://localhost:9090/api/v1";

  // Helper: ambil token dari localStorage setelah login
  async function getToken(page: any): Promise<string> {
    return await page.evaluate(() => {
      // Key yang digunakan frontend: sihuni_access_token
      const token =
        localStorage.getItem("sihuni_access_token") ||
        sessionStorage.getItem("sihuni_access_token") ||
        "";
      return token;
    });
  }

  // Helper: hit API dari browser context (sudah authenticated)
  async function apiCall(
    page: any,
    method: string,
    path: string,
    body?: object,
  ): Promise<{ status: number; json: any }> {
    const token = await getToken(page);
    return await page.evaluate(
      async ({ apiBase, method, path, body, token }: any) => {
        const res = await fetch(`${apiBase}${path}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        let json: any = {};
        try {
          json = await res.json();
        } catch {}
        return { status: res.status, json };
      },
      { apiBase: API_BASE, method, path, body, token },
    );
  }

  // NFR-02-BB-01: Viewer POST /api/v1/properties → 403
  test("NFR-02-BB-01: Viewer dilarang membuat properti baru (POST /api/v1/properties) — 403 Forbidden", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    const result = await apiCall(page, "POST", "/properties", {
      property_name: "Properti Test Viewer Forbidden",
      address: "Jl. Test No. 1",
    });

    await saveScreenshot(page, "nfr02-bb-viewer-post-properties");
    expect(result.status).toBe(403);
  });

  // NFR-02-BB-02: Viewer PUT /api/v1/properties/:id → 403
  test("NFR-02-BB-02: Viewer dilarang mengubah data properti (PUT /api/v1/properties/:id) — 403 Forbidden", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Ambil ID properti yang ada dari API
    const listResult = await apiCall(page, "GET", "/properties");
    const firstId =
      listResult.json?.data?.[0]?.id ?? "00000000-0000-0000-0000-000000000001";

    const result = await apiCall(page, "PUT", `/properties/${firstId}`, {
      property_name: "Properti Test Viewer Forbidden Edit",
    });

    await saveScreenshot(page, "nfr02-bb-viewer-put-properties");
    expect(result.status).toBe(403);
  });

  // NFR-02-BB-03: Viewer DELETE /api/v1/properties/:id → 403
  test("NFR-02-BB-03: Viewer dilarang menghapus properti (DELETE /api/v1/properties/:id) — 403 Forbidden", async ({
    page,
  }) => {
    await login(page, "viewer");
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    const listResult = await apiCall(page, "GET", "/properties");
    const firstId =
      listResult.json?.data?.[0]?.id ?? "00000000-0000-0000-0000-000000000001";

    const result = await apiCall(page, "DELETE", `/properties/${firstId}`);

    await saveScreenshot(page, "nfr02-bb-viewer-delete-properties");
    expect(result.status).toBe(403);
  });

  // NFR-02-BB-04: Operator POST /api/v1/properties → bukan 403
  test("NFR-02-BB-04: Operator diizinkan membuat properti baru (POST /api/v1/properties) — bukan 403", async ({
    page,
  }) => {
    await login(page, "operator");
    await page.waitForLoadState("networkidle");

    const result = await apiCall(page, "POST", "/properties", {
      property_name: "Properti Test Operator E2E",
      address: "Jl. Operator Test No. 99",
      description: "Data test E2E — boleh dihapus",
    });

    await saveScreenshot(page, "nfr02-bb-operator-post-properties");
    // Operator harus mendapat 201 (created) atau 422 (validasi) — bukan 403
    expect(result.status).not.toBe(403);
    expect([200, 201, 400, 422]).toContain(result.status);
  });
});
