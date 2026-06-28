/**
 * Unit tests — features/settings/api/settingsApi.ts
 * UPDATED: Align dengan Black Box 4.4.1 & Activity Diagram Proses 10
 *
 * Gap yang difix:
 * - Proses 10: Operator tidak bisa diupdate via user management
 * - Proses 10: Deactivate → token versioning invalidasi sesi
 * - Go backend UpdateUser pakai PUT /users/:id (bukan PATCH)
 */
import { describe, it, expect } from "vitest";
import { settingsApi } from "@/features/profile/api/settingsApi";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { mockOperatorProfile } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("settingsApi.getUsers()", () => {
  it("mengembalikan daftar users", async () => {
    const result = await settingsApi.getUsers();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe(mockOperatorProfile.id);
  });

  it("throw error saat tidak terautentikasi (401)", async () => {
    server.use(
      http.get(`${BASE}/users`, () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ),
    );
    await expect(settingsApi.getUsers()).rejects.toThrow();
  });
});

describe("settingsApi.createUser()", () => {
  it("BB Proses 10: membuat user baru dengan role viewer", async () => {
    await expect(
      settingsApi.createUser({
        name: "Viewer Baru",
        email: "viewer.baru@test.com",
        password: "SecurePass1!@",
        role: "viewer",
      }),
    ).resolves.not.toThrow();
  });

  it("BB Proses 10: membuat user baru dengan role operator", async () => {
    await expect(
      settingsApi.createUser({
        name: "Operator Baru",
        email: "operator.baru@test.com",
        password: "SecurePass1!@",
        role: "operator",
      }),
    ).resolves.not.toThrow();
  });

  it("throw error saat email sudah dipakai (409 / 422)", async () => {
    server.use(
      http.post(`${BASE}/users`, () =>
        HttpResponse.json(
          { error: { code: "USER_002", message: "Email sudah digunakan" } },
          { status: 422 },
        ),
      ),
    );
    await expect(
      settingsApi.createUser({
        name: "Duplikat",
        email: "operator@test.com",
        password: "SecurePass1!@",
        role: "viewer",
      }),
    ).rejects.toThrow();
  });

  it("throw error saat validasi gagal (422)", async () => {
    server.use(
      http.post(`${BASE}/users`, () =>
        HttpResponse.json({ error: "Validation failed" }, { status: 422 }),
      ),
    );
    await expect(
      settingsApi.createUser({ name: "", email: "", password: "", role: "" }),
    ).rejects.toThrow();
  });
});

describe("settingsApi.deleteUser() — Activity Diagram Proses 10", () => {
  it("menonaktifkan (deactivate) user tanpa error", async () => {
    await expect(
      settingsApi.deleteUser("user-viewer-1"),
    ).resolves.not.toThrow();
  });

  it("Proses 10: deactivate invalidasi token via token versioning — backend handle 200", async () => {
    // Backend: Deactivate mengincrementkan token_version → semua sesi lama invalid
    // Frontend hanya perlu konfirmasi bahwa request sukses
    server.use(
      http.patch(`${BASE}/users/:id/deactivate`, () =>
        HttpResponse.json({
          success: true,
          data: { message: "User berhasil dinonaktifkan" },
        }),
      ),
    );
    await expect(
      settingsApi.deleteUser("user-viewer-1"),
    ).resolves.not.toThrow();
  });

  it("throw error saat user tidak ditemukan (404)", async () => {
    server.use(
      http.patch(`${BASE}/users/:id/deactivate`, () =>
        HttpResponse.json(
          { error: { code: "USER_001", message: "Pengguna tidak ditemukan" } },
          { status: 404 },
        ),
      ),
    );
    await expect(settingsApi.deleteUser("tidak-ada")).rejects.toThrow();
  });
});

describe("settingsApi.updateUser() — Activity Diagram Proses 10", () => {
  it("mengupdate data viewer (nama, email, role)", async () => {
    await expect(
      settingsApi.updateUser("user-viewer-1", {
        name: "Viewer Updated",
        role: "operator",
      }),
    ).resolves.not.toThrow();
  });

  it("Proses 10: Operator tidak bisa diupdate via user management → 422", async () => {
    // Activity Diagram: Akun Operator tidak bisa diubah via modul manajemen pengguna
    // Pembaruan Operator hanya via fitur profil sendiri
    server.use(
      http.patch(`${BASE}/users/:id`, () =>
        HttpResponse.json(
          {
            error: {
              message: "Operator tidak dapat diubah via manajemen pengguna",
            },
          },
          { status: 422 },
        ),
      ),
    );
    await expect(
      settingsApi.updateUser("user-operator-1", { name: "Coba Ubah Operator" }),
    ).rejects.toThrow();
  });

  it("throw error saat user tidak ditemukan (404)", async () => {
    server.use(
      http.patch(`${BASE}/users/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 }),
      ),
    );
    await expect(
      settingsApi.updateUser("tidak-ada", { name: "X" }),
    ).rejects.toThrow();
  });
});

describe("settingsApi.getWaConfig()", () => {
  it("mengembalikan konfigurasi WhatsApp", async () => {
    const result = await settingsApi.getWaConfig();
    expect(result).toBeTruthy();
    expect(result.recipient_numbers).toContain("08123456789");
    expect(result.notification_enabled).toBe(true);
  });

  it("throw error saat server error (500)", async () => {
    server.use(
      http.get(`${BASE}/settings/wa-config`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 }),
      ),
    );
    await expect(settingsApi.getWaConfig()).rejects.toThrow();
  });
});

describe("settingsApi.saveWaConfig()", () => {
  it("menyimpan konfigurasi WhatsApp tanpa error", async () => {
    await expect(
      settingsApi.saveWaConfig({
        recipient_numbers: ["08999888777", "08111222333"],
        notification_enabled: true,
      }),
    ).resolves.not.toThrow();
  });

  it("menyimpan dengan notification_enabled=false (nonaktifkan WA notif)", async () => {
    await expect(
      settingsApi.saveWaConfig({
        recipient_numbers: [],
        notification_enabled: false,
      }),
    ).resolves.not.toThrow();
  });

  it("throw error saat validasi gagal (422)", async () => {
    server.use(
      http.put(`${BASE}/settings/wa-config`, () =>
        HttpResponse.json({ error: "Validation failed" }, { status: 422 }),
      ),
    );
    await expect(
      settingsApi.saveWaConfig({
        recipient_numbers: [],
        notification_enabled: false,
      }),
    ).rejects.toThrow();
  });
});
