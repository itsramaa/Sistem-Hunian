/**
 * Unit tests — shared/utils/currency.ts
 * Cover: formatCurrency(), formatCurrencyCompact(), parseCurrency()
 */
import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyCompact,
  parseCurrency,
} from "@/shared/utils/currency";

describe("formatCurrency()", () => {
  it("memformat angka ke Rupiah", () => {
    const result = formatCurrency(1500000);
    expect(result).toContain("1.500.000");
    expect(result).toContain("Rp");
  });
  it("mengembalikan '-' untuk null", () => {
    expect(formatCurrency(null)).toBe("-");
  });
  it("mengembalikan '-' untuk undefined", () => {
    expect(formatCurrency(undefined)).toBe("-");
  });
  it("memformat angka nol", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });
  it("memformat angka negatif", () => {
    const result = formatCurrency(-500000);
    expect(result).toContain("500.000");
  });
});

describe("formatCurrencyCompact()", () => {
  it("memformat miliar ke B", () => {
    expect(formatCurrencyCompact(1_500_000_000)).toBe("Rp 1.5B");
  });
  it("memformat juta ke M", () => {
    expect(formatCurrencyCompact(2_500_000)).toBe("Rp 2.5M");
  });
  it("memformat ribuan ke K", () => {
    expect(formatCurrencyCompact(750_000)).toBe("Rp 750.0K");
  });
  it("memformat angka kecil dengan formatCurrency biasa", () => {
    const result = formatCurrencyCompact(500);
    expect(result).toContain("Rp");
  });
  it("memformat tepat 1 miliar", () => {
    expect(formatCurrencyCompact(1_000_000_000)).toBe("Rp 1.0B");
  });
  it("memformat tepat 1 juta", () => {
    expect(formatCurrencyCompact(1_000_000)).toBe("Rp 1.0M");
  });
  it("memformat tepat 1 ribu", () => {
    expect(formatCurrencyCompact(1_000)).toBe("Rp 1.0K");
  });
});

describe("parseCurrency()", () => {
  it("mengurai string Rupiah ke angka", () => {
    expect(parseCurrency("Rp 1.500.000")).toBe(1500000);
  });
  it("mengurai string dengan simbol Rp dan titik", () => {
    expect(parseCurrency("Rp1.500.000")).toBe(1500000);
  });
  it("mengembalikan 0 untuk string tidak valid", () => {
    expect(parseCurrency("abc")).toBe(0);
  });
  it("mengurai angka sederhana", () => {
    expect(parseCurrency("500000")).toBe(500000);
  });
});
