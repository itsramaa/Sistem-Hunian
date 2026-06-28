/**
 * Integration tests — features/dashboard/hooks/useDashboard.ts
 * Cover: useDashboardSummary(), useDashboardAlerts(), useNotifications(),
 *         useMarkNotificationRead(), useMarkAllNotificationsRead(),
 *         useClearReadNotifications()
 */
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { createWrapper } from "@/test/test-utils";
import {
  useDashboardSummary,
  useDashboardAlerts,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useClearReadNotifications,
} from "@/features/dashboard/hooks/useDashboard";
import { mockDashboardSummary } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("useDashboardSummary()", () => {
  it("memuat ringkasan dashboard berhasil", async () => {
    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total_properties).toBe(2);
    expect(result.current.data?.total_rooms).toBe(18);
    expect(result.current.data?.rooms_occupied).toBe(11);
  });

  it("isError = true saat API gagal (500)", async () => {
    server.use(
      http.get(`${BASE}/dashboard`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("isError = true saat tidak terautentikasi (401)", async () => {
    server.use(
      http.get(`${BASE}/dashboard`, () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
      )
    );
    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useDashboardAlerts()", () => {
  it("memuat alerts berhasil", async () => {
    const { result } = renderHook(() => useDashboardAlerts(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.dp_alerts).toHaveLength(1);
    expect(result.current.data?.payment_alerts).toHaveLength(1);
  });

  it("mengembalikan arrays kosong saat tidak ada alert", async () => {
    server.use(
      http.get(`${BASE}/dashboard/alerts`, () =>
        HttpResponse.json({
          success: true,
          data: { dp_alerts: [], payment_alerts: [] },
        })
      )
    );
    const { result } = renderHook(() => useDashboardAlerts(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.dp_alerts).toEqual([]);
    expect(result.current.data?.payment_alerts).toEqual([]);
  });
});

describe("useNotifications()", () => {
  it("memuat notifikasi berhasil", async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
  });

  it("mengirim filter is_read=false untuk notifikasi belum dibaca", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/notifications`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [] });
      })
    );
    const { result } = renderHook(() => useNotifications(false), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain("is_read=false");
  });

  it("menghitung notifikasi belum dibaca dari data", async () => {
    const { result } = renderHook(() => useNotifications(false), {
      wrapper: createWrapper(),
    });
    server.use(
      http.get(`${BASE}/notifications`, () =>
        HttpResponse.json({
          success: true,
          data: [
            { id: "n1", is_read: false, type: "payment_overdue", message: "Test", created_at: "2025-06-01T00:00:00Z" },
            { id: "n2", is_read: false, type: "dp_reminder", message: "Test2", created_at: "2025-06-02T00:00:00Z" },
          ],
        })
      )
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useMarkNotificationRead()", () => {
  it("mutation berhasil menandai notifikasi sebagai dibaca", async () => {
    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createWrapper(),
    });
    result.current.mutate("notif-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("mutation gagal saat tidak ditemukan (404)", async () => {
    server.use(
      http.patch(`${BASE}/notifications/:id/read`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createWrapper(),
    });
    result.current.mutate("tidak-ada");
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useMarkAllNotificationsRead()", () => {
  it("mutation berhasil menandai semua notifikasi dibaca", async () => {
    const { result } = renderHook(() => useMarkAllNotificationsRead(), {
      wrapper: createWrapper(),
    });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useClearReadNotifications()", () => {
  it("mutation berhasil menghapus notifikasi yang sudah dibaca", async () => {
    const { result } = renderHook(() => useClearReadNotifications(), {
      wrapper: createWrapper(),
    });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("mutation gagal saat server error (500)", async () => {
    server.use(
      http.delete(`${BASE}/notifications/read`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useClearReadNotifications(), {
      wrapper: createWrapper(),
    });
    result.current.mutate();
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
