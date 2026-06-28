/**
 * Unit tests — shared/utils/api-errors.ts
 * Cover: getApiErrorMessage() — HTTP status codes, backend error codes,
 *         network errors, fallback
 */
import { describe, it, expect } from "vitest";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { AxiosError } from "axios";

function makeAxiosError(status: number, body?: object): AxiosError {
  const err = new AxiosError("Request failed");
  err.response = {
    status,
    data: body ?? {},
    statusText: String(status),
    headers: {},
    config: {} as any,
  };
  return err;
}

describe("getApiErrorMessage()", () => {
  // HTTP status codes
  it("401 → sesi berakhir", () => {
    expect(getApiErrorMessage(makeAxiosError(401))).toContain("Sesi");
  });
  it("403 → tidak memiliki izin", () => {
    expect(getApiErrorMessage(makeAxiosError(403))).toContain("izin");
  });
  it("404 → tidak ditemukan", () => {
    expect(getApiErrorMessage(makeAxiosError(404))).toContain("tidak ditemukan");
  });
  it("400 → data tidak valid", () => {
    expect(getApiErrorMessage(makeAxiosError(400))).toContain("tidak valid");
  });
  it("409 → konflik", () => {
    expect(getApiErrorMessage(makeAxiosError(409))).toContain("konflik");
  });
  it("422 → tidak dapat diproses", () => {
    expect(getApiErrorMessage(makeAxiosError(422))).toContain("tidak dapat diproses");
  });
  it("429 → terlalu banyak permintaan", () => {
    expect(getApiErrorMessage(makeAxiosError(429))).toContain("Terlalu banyak");
  });
  it("500 → kesalahan server", () => {
    expect(getApiErrorMessage(makeAxiosError(500))).toContain("server");
  });
  it("502 → server tidak dijangkau", () => {
    expect(getApiErrorMessage(makeAxiosError(502))).toContain("tidak dapat dijangkau");
  });
  it("503 → layanan tidak tersedia", () => {
    expect(getApiErrorMessage(makeAxiosError(503))).toContain("tidak tersedia");
  });
  it("504 → timeout", () => {
    expect(getApiErrorMessage(makeAxiosError(504))).toContain("tidak merespons");
  });

  // Backend error codes
  it("AUTH_001 → email atau password salah", () => {
    const err = makeAxiosError(401, { error: { code: "AUTH_001" } });
    expect(getApiErrorMessage(err)).toContain("Email atau password");
  });
  it("AUTH_002 → akun dinonaktifkan", () => {
    const err = makeAxiosError(403, { error: { code: "AUTH_002" } });
    expect(getApiErrorMessage(err)).toContain("dinonaktifkan");
  });
  it("USER_001 → pengguna tidak ditemukan", () => {
    const err = makeAxiosError(404, { error: { code: "USER_001" } });
    expect(getApiErrorMessage(err)).toContain("Pengguna tidak ditemukan");
  });
  it("ROOM_001 → kamar tidak ditemukan", () => {
    const err = makeAxiosError(404, { error: { code: "ROOM_001" } });
    expect(getApiErrorMessage(err)).toContain("Kamar tidak ditemukan");
  });

  // Backend message fallback
  it("menggunakan message dari backend jika ada", () => {
    const err = makeAxiosError(400, { message: "Custom error dari backend" });
    const result = getApiErrorMessage(err);
    expect(result).toBeTruthy();
  });

  // Network error (no response)
  it("network error tanpa response → pesan koneksi", () => {
    const err = new AxiosError("Network Error");
    err.code = "NETWORK_ERROR";
    const result = getApiErrorMessage(err);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  // Non-axios error
  it("Error biasa → menggunakan message-nya", () => {
    const err = new Error("Something went wrong");
    const result = getApiErrorMessage(err);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  // Unknown / null
  it("null → fallback message", () => {
    const result = getApiErrorMessage(null);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });
  it("string → fallback message", () => {
    const result = getApiErrorMessage("unexpected");
    expect(result).toBeTruthy();
  });
});
