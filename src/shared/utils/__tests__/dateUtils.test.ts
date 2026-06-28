/**
 * Unit tests — shared/utils/dateUtils.ts
 * Cover: formatDisplayDate(), formatISODate(), getDaysDifference(),
 *         isDueSoon(), isOverdue(), getDaysUntilDue(),
 *         getMonthDateRange(), getLastNDaysRange(), getNextNDaysRange()
 */
import { describe, it, expect } from "vitest";
import {
  formatDisplayDate,
  formatISODate,
  getDaysDifference,
  isDueSoon,
  isOverdue,
  getDaysUntilDue,
  getMonthDateRange,
  getLastNDaysRange,
  getNextNDaysRange,
  getCurrentMonthDateRange,
  getPreviousMonthDateRange,
} from "@/shared/utils/dateUtils";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

describe("formatDisplayDate()", () => {
  it("memformat string ISO ke format tampilan default", () => {
    const result = formatDisplayDate("2025-06-15T00:00:00Z");
    expect(result).toContain("15");
    expect(result).toContain("Jun");
    expect(result).toContain("2025");
  });
  it("memformat Date object", () => {
    const result = formatDisplayDate(new Date("2025-01-01"));
    expect(result).toContain("2025");
  });
  it("mengembalikan '-' untuk string tidak valid", () => {
    const result = formatDisplayDate("invalid-date");
    expect(result).toBe("-");
  });
  it("mendukung format custom", () => {
    const result = formatDisplayDate("2025-06-15", "yyyy/MM/dd");
    expect(result).toBe("2025/06/15");
  });
});

describe("formatISODate()", () => {
  it("memformat Date ke string YYYY-MM-DD", () => {
    const date = new Date("2025-06-15T12:00:00Z");
    const result = formatISODate(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getDaysDifference()", () => {
  it("menghitung selisih hari positif", () => {
    const d1 = new Date("2025-06-20");
    const d2 = new Date("2025-06-15");
    expect(getDaysDifference(d1, d2)).toBe(5);
  });
  it("menghitung selisih hari negatif", () => {
    const d1 = new Date("2025-06-10");
    const d2 = new Date("2025-06-15");
    expect(getDaysDifference(d1, d2)).toBe(-5);
  });
  it("mengembalikan 0 untuk tanggal sama", () => {
    const d = new Date("2025-06-15");
    expect(getDaysDifference(d, d)).toBe(0);
  });
});

describe("isDueSoon()", () => {
  it("mengembalikan true jika jatuh tempo dalam threshold hari", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    expect(isDueSoon(soon, 7)).toBe(true);
  });
  it("mengembalikan false jika jatuh tempo > threshold hari", () => {
    const far = new Date();
    far.setDate(far.getDate() + 30);
    expect(isDueSoon(far, 7)).toBe(false);
  });
  it("mengembalikan false jika sudah lewat (kemarin)", () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(isDueSoon(past, 7)).toBe(false);
  });
  it("menerima string date", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    expect(isDueSoon(soon.toISOString(), 7)).toBe(true);
  });
});

describe("isOverdue()", () => {
  it("mengembalikan true jika tanggal sudah lewat", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(isOverdue(past)).toBe(true);
  });
  it("mengembalikan false jika tanggal hari ini", () => {
    expect(isOverdue(new Date())).toBe(false);
  });
  it("mengembalikan false jika tanggal di masa depan", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(isOverdue(future)).toBe(false);
  });
  it("menerima string date", () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(isOverdue(past.toISOString())).toBe(true);
  });
});

describe("getDaysUntilDue()", () => {
  it("mengembalikan angka positif untuk tanggal di masa depan", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const result = getDaysUntilDue(future);
    expect(result).toBeGreaterThanOrEqual(9);
    expect(result).toBeLessThanOrEqual(10);
  });
  it("mengembalikan angka negatif untuk tanggal lampau", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(getDaysUntilDue(past)).toBeLessThan(0);
  });
});

describe("getMonthDateRange()", () => {
  it("mengembalikan start dan end bulan yang benar", () => {
    const date = new Date("2025-06-15");
    const { start, end } = getMonthDateRange(date);
    expect(start).toEqual(startOfMonth(date));
    expect(end).toEqual(endOfMonth(date));
  });
});

describe("getLastNDaysRange()", () => {
  it("mengembalikan range N hari terakhir", () => {
    const { start, end } = getLastNDaysRange(7);
    const diff = getDaysDifference(end, start);
    expect(diff).toBe(7);
  });
});

describe("getNextNDaysRange()", () => {
  it("mengembalikan range N hari ke depan", () => {
    const { start, end } = getNextNDaysRange(14);
    const diff = getDaysDifference(end, start);
    expect(diff).toBe(14);
  });
});

describe("getCurrentMonthDateRange()", () => {
  it("mengembalikan range bulan ini", () => {
    const { start, end } = getCurrentMonthDateRange();
    const now = new Date();
    expect(start).toEqual(startOfMonth(now));
    expect(end).toEqual(endOfMonth(now));
  });
});

describe("getPreviousMonthDateRange()", () => {
  it("mengembalikan range bulan lalu", () => {
    const { start, end } = getPreviousMonthDateRange();
    const lastMonth = subMonths(new Date(), 1);
    expect(start).toEqual(startOfMonth(lastMonth));
    expect(end).toEqual(endOfMonth(lastMonth));
  });
});
