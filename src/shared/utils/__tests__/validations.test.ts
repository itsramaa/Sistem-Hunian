/**
 * Unit tests — shared/utils/validations/auth.ts
 * Cover: isCommonPassword(), strongPasswordSchema, loginPasswordSchema,
 *        phoneSchema, businessNameSchema, merchantCodeSchema, referralCodeSchema
 */
import { describe, it, expect } from "vitest";
import {
  isCommonPassword,
  strongPasswordSchema,
  loginPasswordSchema,
  phoneSchema,
  businessNameSchema,
  merchantCodeSchema,
  referralCodeSchema,
} from "@/shared/utils/validations/auth";

describe("isCommonPassword()", () => {
  it("mengembalikan true untuk password umum", () => {
    expect(isCommonPassword("password")).toBe(true);
    expect(isCommonPassword("123456")).toBe(true);
    expect(isCommonPassword("qwerty")).toBe(true);
    expect(isCommonPassword("sihuni")).toBe(true);
    expect(isCommonPassword("admin")).toBe(true);
  });
  it("case-insensitive check", () => {
    expect(isCommonPassword("PASSWORD")).toBe(true);
    expect(isCommonPassword("Password")).toBe(true);
  });
  it("mengembalikan false untuk password tidak umum", () => {
    expect(isCommonPassword("Xy!9kZp@2mN#")).toBe(false);
  });
});

describe("strongPasswordSchema", () => {
  it("valid untuk password kuat", () => {
    const result = strongPasswordSchema.safeParse("MyStr0ng@Pass!");
    expect(result.success).toBe(true);
  });
  it("gagal jika kurang dari 12 karakter", () => {
    const result = strongPasswordSchema.safeParse("Sh0rt@1!");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("12 karakter");
  });
  it("gagal jika tidak ada huruf besar", () => {
    const result = strongPasswordSchema.safeParse("mystr0ng@pass!");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("huruf besar");
  });
  it("gagal jika tidak ada huruf kecil", () => {
    const result = strongPasswordSchema.safeParse("MYSTR0NG@PASS!");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("huruf kecil");
  });
  it("gagal jika tidak ada angka", () => {
    const result = strongPasswordSchema.safeParse("MyStrong@Pass!");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("angka");
  });
  it("gagal jika tidak ada karakter spesial", () => {
    const result = strongPasswordSchema.safeParse("MyStr0ngPass1234");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("karakter spesial");
  });
  it("gagal untuk password umum yang memenuhi syarat teknis", () => {
    // password123 too short, but sihuni123 based
    const result = strongPasswordSchema.safeParse("sihuni123");
    expect(result.success).toBe(false);
  });
});

describe("loginPasswordSchema", () => {
  it("valid untuk password >= 6 karakter", () => {
    expect(loginPasswordSchema.safeParse("abc123").success).toBe(true);
  });
  it("gagal untuk password < 6 karakter", () => {
    const result = loginPasswordSchema.safeParse("abc");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("6 karakter");
  });
});

describe("phoneSchema", () => {
  it("valid untuk nomor format 08xx", () => {
    expect(phoneSchema.safeParse("08123456789").success).toBe(true);
  });
  it("valid untuk nomor format +62xx", () => {
    expect(phoneSchema.safeParse("+6281234567890").success).toBe(true);
  });
  it("valid untuk nomor format 62xx", () => {
    expect(phoneSchema.safeParse("6281234567890").success).toBe(true);
  });
  it("valid untuk string kosong (opsional)", () => {
    expect(phoneSchema.safeParse("").success).toBe(true);
  });
  it("valid untuk undefined (opsional)", () => {
    expect(phoneSchema.safeParse(undefined).success).toBe(true);
  });
  it("gagal untuk format tidak valid", () => {
    expect(phoneSchema.safeParse("123").success).toBe(false);
    expect(phoneSchema.safeParse("abc").success).toBe(false);
  });
});

describe("businessNameSchema", () => {
  it("valid untuk nama bisnis normal", () => {
    expect(businessNameSchema.safeParse("Kos Anggrek").success).toBe(true);
    expect(businessNameSchema.safeParse("Kos & Kost 123").success).toBe(true);
  });
  it("gagal untuk nama < 3 karakter", () => {
    const result = businessNameSchema.safeParse("AB");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("3 karakter");
  });
  it("gagal untuk nama > 100 karakter", () => {
    const result = businessNameSchema.safeParse("A".repeat(101));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("100 karakter");
  });
  it("gagal untuk nama dengan karakter tidak valid", () => {
    expect(businessNameSchema.safeParse("Kos@#$").success).toBe(false);
  });
});

describe("merchantCodeSchema", () => {
  it("valid untuk kode 6 karakter alfanumerik", () => {
    expect(merchantCodeSchema.safeParse("ABC123").success).toBe(true);
  });
  it("valid — otomatis uppercase", () => {
    const result = merchantCodeSchema.safeParse("abc123");
    expect(result.success).toBe(true);
    expect(result.data).toBe("ABC123");
  });
  it("gagal untuk kode < 6 karakter", () => {
    expect(merchantCodeSchema.safeParse("AB12").success).toBe(false);
  });
  it("gagal untuk kode > 6 karakter", () => {
    expect(merchantCodeSchema.safeParse("ABC1234").success).toBe(false);
  });
  it("gagal untuk karakter non-alfanumerik", () => {
    expect(merchantCodeSchema.safeParse("AB-123").success).toBe(false);
  });
});

describe("referralCodeSchema", () => {
  it("valid untuk kode 8 karakter alfanumerik", () => {
    expect(referralCodeSchema.safeParse("ABCD1234").success).toBe(true);
  });
  it("valid — otomatis uppercase", () => {
    const result = referralCodeSchema.safeParse("abcd1234");
    expect(result.success).toBe(true);
    expect(result.data).toBe("ABCD1234");
  });
  it("gagal untuk kode < 8 karakter", () => {
    expect(referralCodeSchema.safeParse("ABCD12").success).toBe(false);
  });
  it("gagal untuk kode > 8 karakter", () => {
    expect(referralCodeSchema.safeParse("ABCD12345").success).toBe(false);
  });
});
