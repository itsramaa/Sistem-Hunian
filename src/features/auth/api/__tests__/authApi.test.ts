/**
 * Unit tests — features/auth/api/authApi.ts
 * Cover: login(), getMe(), updateMe(), changePassword()
 */
import { describe, it, expect, beforeEach } from "vitest";
import { authApi } from "@/features/auth/api/authApi";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { mockOperatorProfile, mockAuthTokens } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("authApi.login()", () => {
  it("mengembalikan token dan user saat login berhasil", async () => {
    const result = await authApi.login("operator@test.com", "password123");
    expect(result.access_token).toBe(mockAuthTokens.access_token);
    expect(result.user.email).toBe("operator@test.com");
  });

  it("throw error saat credential salah (401)", async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json(
          { error: { code: "AUTH_001", message: "Invalid credentials" } },
          { status: 401 }
        )
      )
    );
    await expect(authApi.login("wrong@test.com", "wrong")).rejects.toThrow();
  });

  it("throw error saat server error (500)", async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json({ error: "Internal Server Error" }, { status: 500 })
      )
    );
    await expect(authApi.login("a@b.com", "pass")).rejects.toThrow();
  });
});

describe("authApi.getMe()", () => {
  it("mengembalikan profil user yang sedang login", async () => {
    const result = await authApi.getMe();
    expect(result.id).toBe(mockOperatorProfile.id);
    expect(result.email).toBe(mockOperatorProfile.email);
    expect(result.role).toBe("operator");
    expect(result.is_active).toBe(true);
  });

  it("throw error saat tidak terautentikasi (401)", async () => {
    server.use(
      http.get(`${BASE}/auth/me`, () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
      )
    );
    await expect(authApi.getMe()).rejects.toThrow();
  });
});

describe("authApi.updateMe()", () => {
  it("berhasil update profil tanpa error", async () => {
    await expect(
      authApi.updateMe({ name: "Operator Baru" })
    ).resolves.not.toThrow();
  });

  it("berhasil update phone_number", async () => {
    await expect(
      authApi.updateMe({ phone_number: "08999888777" })
    ).resolves.not.toThrow();
  });

  it("throw error saat validasi gagal (400)", async () => {
    server.use(
      http.patch(`${BASE}/auth/me`, () =>
        HttpResponse.json({ error: "Bad Request" }, { status: 400 })
      )
    );
    await expect(authApi.updateMe({ name: "" })).rejects.toThrow();
  });
});

describe("authApi.changePassword()", () => {
  it("berhasil ganti password", async () => {
    await expect(
      authApi.changePassword("oldPass123!", "NewStr0ng@Pass!")
    ).resolves.not.toThrow();
  });

  it("throw error saat password lama salah (401)", async () => {
    server.use(
      http.post(`${BASE}/auth/change-password`, () =>
        HttpResponse.json(
          { error: { code: "AUTH_005" } },
          { status: 401 }
        )
      )
    );
    await expect(
      authApi.changePassword("wrongOld", "NewStr0ng@Pass!")
    ).rejects.toThrow();
  });
});
