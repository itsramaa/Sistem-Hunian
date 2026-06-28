/**
 * Unit tests — shared/utils/utils.ts
 * Cover: cn(), formatRupiah(), formatYear(), formatLabel()
 */
import { describe, it, expect, vi } from "vitest";
import { cn, formatRupiah, formatYear, formatLabel } from "@/shared/utils/utils";

describe("cn()", () => {
  it("menggabungkan class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("menghapus class duplikat dengan tailwind-merge", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("mengabaikan falsy values", () => {
    expect(cn("a", undefined, false, null as unknown as string, "b")).toBe("a b");
  });
  it("mendukung conditional classes", () => {
    expect(cn("base", true && "active", false && "inactive")).toBe("base active");
  });
});

describe("formatRupiah()", () => {
  it("memformat angka ke format Rupiah Indonesia", () => {
    const result = formatRupiah(1500000);
    expect(result).toContain("1.500.000");
    expect(result).toContain("Rp");
  });
  it("memformat angka nol", () => {
    const result = formatRupiah(0);
    expect(result).toContain("0");
  });
  it("memformat angka besar", () => {
    const result = formatRupiah(10000000);
    expect(result).toContain("10.000.000");
  });
  it("tidak menampilkan desimal", () => {
    const result = formatRupiah(1500000);
    expect(result).not.toContain(",");
  });
});

describe("formatYear()", () => {
  it("memformat tahun 4 digit dengan benar", () => {
    expect(formatYear(2025)).toBe("2025");
    expect(formatYear(2020)).toBe("2020");
  });
  it("memformat tahun di luar range dengan warn", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(formatYear(2019)).toBe("2019");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("outside allowed range")
    );
    warnSpy.mockRestore();
  });
  it("memformat tahun kecil dengan padding", () => {
    expect(formatYear(999)).toBe("0999");
  });
});

describe("formatLabel()", () => {
  it("mengkonversi underscore ke spasi dan Title Case", () => {
    expect(formatLabel("high_banget")).toBe("High Banget");
  });
  it("mengkonversi single word", () => {
    expect(formatLabel("pending")).toBe("Pending");
  });
  it("mengembalikan '-' untuk nilai null", () => {
    expect(formatLabel(null)).toBe("-");
  });
  it("mengembalikan '-' untuk undefined", () => {
    expect(formatLabel(undefined)).toBe("-");
  });
  it("mengembalikan '-' untuk string kosong", () => {
    expect(formatLabel("")).toBe("-");
  });
  it("menangani multiple underscore", () => {
    expect(formatLabel("in_progress_now")).toBe("In Progress Now");
  });
});
