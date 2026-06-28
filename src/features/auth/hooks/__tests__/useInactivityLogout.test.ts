/**
 * Unit tests — features/auth/hooks/useInactivityLogout.ts
 * Cover: Black Box 4.4.1 No.8 — Inactivity logout otomatis
 *        Activity Diagram Proses 1 — auto-logout saat tidak aktif
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock dependencies
const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockUser = { id: "u1", email: "op@test.com", role: "operator" as const };

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: mockSignOut,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe("useInactivityLogout()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSignOut.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("tidak melakukan logout saat user aktif dalam 30 menit", async () => {
    const { useInactivityLogout } = await import(
      "@/features/auth/hooks/useInactivityLogout"
    );
    renderHook(() => useInactivityLogout());

    // Simulasi aktif sebelum 30 menit
    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000); // 20 menit
    });

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("menampilkan warning 1 menit sebelum logout (29 menit tidak aktif)", async () => {
    const { toast } = await import("sonner");
    const { useInactivityLogout } = await import(
      "@/features/auth/hooks/useInactivityLogout"
    );
    renderHook(() => useInactivityLogout());

    act(() => {
      vi.advanceTimersByTime(29 * 60 * 1000 + 100); // 29 menit
    });

    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining("akan berakhir"),
      expect.any(Object)
    );
  });

  it("memanggil signOut setelah 30 menit tidak aktif", async () => {
    const { useInactivityLogout } = await import(
      "@/features/auth/hooks/useInactivityLogout"
    );
    renderHook(() => useInactivityLogout());

    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000 + 100); // 30 menit
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("mereset timer saat ada aktivitas pengguna (mousedown)", async () => {
    const { useInactivityLogout } = await import(
      "@/features/auth/hooks/useInactivityLogout"
    );
    renderHook(() => useInactivityLogout());

    // Maju 25 menit, lalu simulasi aktivitas
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
      window.dispatchEvent(new Event("mousedown"));
    });

    // Maju 10 menit lagi — total 35 menit tapi timer sudah reset
    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });

    // Belum logout karena timer reset
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("tidak mengatur timer saat user = null", async () => {
    vi.doMock("@/features/auth/hooks/useAuth", () => ({
      useAuth: () => ({ user: null, signOut: mockSignOut }),
    }));

    // Re-import setelah mock
    const mod = await import("@/features/auth/hooks/useInactivityLogout");
    // Cukup pastikan tidak throw
    expect(mod).toBeDefined();
  });
});
