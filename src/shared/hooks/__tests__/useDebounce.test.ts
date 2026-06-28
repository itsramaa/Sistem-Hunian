/**
 * Unit tests — shared/hooks/useDebounce.ts
 * Cover: delay behavior, value update, cleanup
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/shared/hooks/useDebounce";

describe("useDebounce()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mengembalikan nilai awal sebelum delay", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  it("memperbarui nilai setelah delay berlalu", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    rerender({ value: "updated", delay: 500 });
    expect(result.current).toBe("initial"); // belum update

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe("updated");
  });

  it("tidak memperbarui nilai sebelum delay selesai", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "first", delay: 1000 } }
    );

    rerender({ value: "second", delay: 1000 });

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current).toBe("second");
  });

  it("reset timer jika value berubah sebelum delay selesai", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 500 } }
    );

    rerender({ value: "b", delay: 500 });
    act(() => { vi.advanceTimersByTime(300); });

    rerender({ value: "c", delay: 500 });
    act(() => { vi.advanceTimersByTime(300); });

    // total 600ms tapi timer reset → masih "a"
    expect(result.current).toBe("a");

    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe("c");
  });

  it("bekerja dengan tipe number", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } }
    );

    rerender({ value: 42, delay: 300 });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe(42);
  });

  it("bekerja dengan tipe object", () => {
    const obj1 = { name: "a" };
    const obj2 = { name: "b" };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: obj1, delay: 200 } }
    );

    rerender({ value: obj2, delay: 200 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toEqual({ name: "b" });
  });

  it("membersihkan timer saat unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "x", delay: 500 } }
    );

    rerender({ value: "y", delay: 500 });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
