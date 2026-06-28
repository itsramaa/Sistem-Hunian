/**
 * Unit tests — shared/utils/haptic.ts
 * Cover: triggerHaptic() — semua tipe, dengan dan tanpa navigator.vibrate
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { triggerHaptic } from "@/shared/utils/haptic";

describe("triggerHaptic()", () => {
  let vibrateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vibrateMock = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      writable: true,
      value: vibrateMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("memanggil navigator.vibrate([50,30,50]) untuk tipe 'error'", () => {
    triggerHaptic("error");
    expect(vibrateMock).toHaveBeenCalledWith([50, 30, 50]);
  });

  it("memanggil navigator.vibrate(30) untuk tipe 'success'", () => {
    triggerHaptic("success");
    expect(vibrateMock).toHaveBeenCalledWith(30);
  });

  it("memanggil navigator.vibrate(10) untuk tipe 'light'", () => {
    triggerHaptic("light");
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it("memanggil navigator.vibrate(10) untuk tipe 'medium'", () => {
    triggerHaptic("medium");
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it("memanggil navigator.vibrate(10) untuk tipe 'heavy'", () => {
    triggerHaptic("heavy");
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it("tidak throw jika navigator.vibrate tidak tersedia", () => {
    Object.defineProperty(navigator, "vibrate", {
      writable: true,
      value: undefined,
    });
    expect(() => triggerHaptic("success")).not.toThrow();
  });
});
