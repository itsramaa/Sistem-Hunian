/**
 * Unit tests — features/dashboard/api/dashboardApi.ts
 * Cover: getSummary(), getAlerts()
 *
 * Notifikasi (getNotifications, markNotificationRead, markAllNotificationsRead,
 * clearReadNotifications) telah dipindahkan ke features/notifications/api/notificationsApi.ts
 */
import { describe, it, expect } from "vitest";
import { dashboardApi } from "@/features/dashboard/api/dashboardApi";
import { notificationsApi } from "@/features/notifications/api/notificationsApi";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import {
  mockDashboardSummary,
  mockDashboardAlerts,
} from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("dashboardApi.getSummary()", () => {
  it("mengembalikan ringkasan dashboard", async () => {
    const result = await dashboardApi.getSummary();
    expect(result.total_properties).toBe(2);
    expect(result.total_rooms).toBe(18);
    expect(result.rooms_available).toBe(5);
    expect(result.rooms_occupied).toBe(11);
  });

  it("throw error saat server error (500)", async () => {
    server.use(
      http.get(`${BASE}/dashboard`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 }),
      ),
    );
    await expect(dashboardApi.getSummary()).rejects.toThrow();
  });

  it("throw error saat tidak terautentikasi (401)", async () => {
    server.use(
      http.get(`${BASE}/dashboard`, () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ),
    );
    await expect(dashboardApi.getSummary()).rejects.toThrow();
  });
});

describe("dashboardApi.getAlerts()", () => {
  it("mengembalikan dp_alerts dan payment_alerts", async () => {
    const result = await dashboardApi.getAlerts();
    expect(result.dp_alerts).toHaveLength(1);
    expect(result.payment_alerts).toHaveLength(1);
    expect(result.dp_alerts[0].room_number).toBe("A03");
    expect(result.payment_alerts[0].period).toBe("2025-05");
  });

  it("mengembalikan arrays kosong saat tidak ada alerts", async () => {
    server.use(
      http.get(`${BASE}/dashboard/alerts`, () =>
        HttpResponse.json({
          success: true,
          data: { dp_alerts: [], payment_alerts: [] },
        }),
      ),
    );
    const result = await dashboardApi.getAlerts();
    expect(result.dp_alerts).toEqual([]);
    expect(result.payment_alerts).toEqual([]);
  });
});

describe("notificationsApi.list()", () => {
  it("mengembalikan semua notifikasi", async () => {
    const result = await notificationsApi.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe("payment_overdue");
  });

  it("mengirim filter is_read=false", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/notifications`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [] });
      }),
    );
    await notificationsApi.list(false);
    expect(capturedUrl).toContain("is_read=false");
  });

  it("mengirim filter is_read=true", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/notifications`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [] });
      }),
    );
    await notificationsApi.list(true);
    expect(capturedUrl).toContain("is_read=true");
  });

  it("tidak mengirim filter is_read saat undefined", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/notifications`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [] });
      }),
    );
    await notificationsApi.list(undefined);
    expect(capturedUrl).not.toContain("is_read");
  });
});

describe("notificationsApi.markRead()", () => {
  it("menandai notifikasi sebagai sudah dibaca tanpa error", async () => {
    await expect(notificationsApi.markRead("notif-1")).resolves.not.toThrow();
  });

  it("throw error saat tidak ditemukan (404)", async () => {
    server.use(
      http.patch(`${BASE}/notifications/:id/read`, () =>
        HttpResponse.json({ success: false }, { status: 404 }),
      ),
    );
    await expect(notificationsApi.markRead("tidak-ada")).rejects.toThrow();
  });
});

describe("notificationsApi.markAllRead()", () => {
  it("menandai semua notifikasi sebagai sudah dibaca tanpa error", async () => {
    await expect(notificationsApi.markAllRead()).resolves.not.toThrow();
  });
});

describe("notificationsApi.clearRead()", () => {
  it("menghapus semua notifikasi yang sudah dibaca tanpa error", async () => {
    await expect(notificationsApi.clearRead()).resolves.not.toThrow();
  });

  it("throw error saat server error (500)", async () => {
    server.use(
      http.delete(`${BASE}/notifications/read`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 }),
      ),
    );
    await expect(notificationsApi.clearRead()).rejects.toThrow();
  });
});
