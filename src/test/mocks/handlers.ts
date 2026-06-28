/**
 * MSW Handlers — mock semua API endpoint yang dipakai di Sistem Hunian V2
 */
import { http, HttpResponse } from "msw";
import {
  mockOperatorProfile,
  mockAuthTokens,
  mockPropertiesList,
  mockProperty,
  mockRoomsList,
  mockRoom,
  mockTenantsList,
  mockTenant,
  mockPaymentsList,
  mockPayment,
  mockMaintenanceList,
  mockMaintenance,
  mockConfirmationList,
  mockConfirmation,
  mockDashboardSummary,
  mockDashboardAlerts,
  mockPagination,
} from "./fixtures";

const BASE = "http://localhost:3000/api/v1";

export const handlers = [
  // ─── Auth ──────────────────────────────────────────────────────────────────
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({ success: true, data: mockAuthTokens }),
  ),
  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({ success: true, data: mockOperatorProfile }),
  ),
  http.patch(`${BASE}/auth/me`, () =>
    HttpResponse.json({ success: true, data: mockOperatorProfile }),
  ),
  http.post(`${BASE}/auth/change-password`, () =>
    HttpResponse.json({ success: true }),
  ),

  // ─── Properties ────────────────────────────────────────────────────────────
  http.get(`${BASE}/properties`, () =>
    HttpResponse.json({
      success: true,
      data: mockPropertiesList,
      pagination: mockPagination,
    }),
  ),
  http.get(`${BASE}/properties/:id`, ({ params }) => {
    const found = mockPropertiesList.find((p) => p.id === params.id);
    if (!found) return HttpResponse.json({ success: false }, { status: 404 });
    return HttpResponse.json({ success: true, data: found });
  }),
  http.post(`${BASE}/properties`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { success: true, data: { ...mockProperty, ...body, id: "prop-new" } },
      { status: 201 },
    );
  }),
  http.put(`${BASE}/properties/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...mockProperty, ...body, id: params.id },
    });
  }),
  http.delete(`${BASE}/properties/:id`, () =>
    HttpResponse.json({ success: true }),
  ),

  // ─── Rooms ─────────────────────────────────────────────────────────────────
  http.get(`${BASE}/rooms`, () =>
    HttpResponse.json({
      success: true,
      data: mockRoomsList,
      pagination: mockPagination,
    }),
  ),
  http.get(`${BASE}/rooms/:id`, ({ params }) => {
    const found = mockRoomsList.find((r) => r.id === params.id);
    if (!found) return HttpResponse.json({ success: false }, { status: 404 });
    return HttpResponse.json({ success: true, data: found });
  }),
  http.post(`${BASE}/rooms`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { success: true, data: { ...mockRoom, ...body, id: "room-new" } },
      { status: 201 },
    );
  }),
  http.put(`${BASE}/rooms/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...mockRoom, ...body, id: params.id },
    });
  }),
  http.delete(`${BASE}/rooms/:id`, () => HttpResponse.json({ success: true })),

  // ─── Tenants ───────────────────────────────────────────────────────────────
  http.get(`${BASE}/tenants`, () =>
    HttpResponse.json({
      success: true,
      data: mockTenantsList,
      pagination: mockPagination,
    }),
  ),
  http.get(`${BASE}/tenants/:id`, ({ params }) => {
    const found = mockTenantsList.find((t) => t.id === params.id);
    if (!found) return HttpResponse.json({ success: false }, { status: 404 });
    return HttpResponse.json({ success: true, data: found });
  }),
  http.post(`${BASE}/tenants`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { success: true, data: { ...mockTenant, ...body, id: "tenant-new" } },
      { status: 201 },
    );
  }),
  http.put(`${BASE}/tenants/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...mockTenant, ...body, id: params.id },
    });
  }),
  http.post(`${BASE}/tenants/:id/checkout`, () =>
    HttpResponse.json({ success: true }),
  ),

  // ─── Payments ──────────────────────────────────────────────────────────────
  http.get(`${BASE}/payments`, () =>
    HttpResponse.json({
      success: true,
      data: mockPaymentsList,
      pagination: mockPagination,
    }),
  ),
  http.get(`${BASE}/payments/:id`, ({ params }) => {
    const found = mockPaymentsList.find((p) => p.id === params.id);
    if (!found) return HttpResponse.json({ success: false }, { status: 404 });
    return HttpResponse.json({ success: true, data: found });
  }),
  http.post(`${BASE}/payments`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { success: true, data: { ...mockPayment, ...body, id: "pay-new" } },
      { status: 201 },
    );
  }),
  http.put(`${BASE}/payments/:id`, () => HttpResponse.json({ success: true })),
  http.patch(`${BASE}/payments/:id/mark-paid`, () =>
    HttpResponse.json({ success: true }),
  ),
  http.patch(`${BASE}/payments/:id/upload`, () =>
    HttpResponse.json({
      success: true,
      data: { transfer_proof_url: "https://cdn.example.com/bukti-new.jpg" },
    }),
  ),

  // ─── Maintenance ───────────────────────────────────────────────────────────
  http.get(`${BASE}/maintenances`, () =>
    HttpResponse.json({
      success: true,
      data: mockMaintenanceList,
      pagination: mockPagination,
    }),
  ),
  http.get(`${BASE}/maintenances/:id`, ({ params }) => {
    const found = mockMaintenanceList.find((m) => m.id === params.id);
    if (!found) return HttpResponse.json({ success: false }, { status: 404 });
    return HttpResponse.json({ success: true, data: found });
  }),
  http.post(`${BASE}/maintenances`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { success: true, data: { ...mockMaintenance, ...body, id: "maint-new" } },
      { status: 201 },
    );
  }),
  http.put(`${BASE}/maintenances/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...mockMaintenance, ...body, id: params.id },
    });
  }),
  http.patch(`${BASE}/maintenances/:id/upload-kerusakan`, () =>
    HttpResponse.json({
      success: true,
      data: { url: "https://cdn.example.com/damage-new.jpg" },
    }),
  ),
  http.patch(`${BASE}/maintenances/:id/upload-penanganan`, () =>
    HttpResponse.json({
      success: true,
      data: { url: "https://cdn.example.com/repair-new.jpg" },
    }),
  ),
  // actual API paths used in maintenanceApi.ts
  http.patch(`${BASE}/maintenances/:id/upload-damage`, () =>
    HttpResponse.json({
      success: true,
      data: { url: "https://cdn.example.com/damage-new.jpg" },
    }),
  ),
  http.patch(`${BASE}/maintenances/:id/upload-repair`, () =>
    HttpResponse.json({
      success: true,
      data: { url: "https://cdn.example.com/repair-new.jpg" },
    }),
  ),
  http.get(`${BASE}/maintenances/:id/logs`, () =>
    HttpResponse.json({
      success: true,
      data: [
        {
          id: "log-1",
          maintenance_id: "maint-1",
          status: "reported",
          notes: "Laporan diterima",
          updated_by: "user-operator-1",
          updated_by_name: "Operator Test",
          created_at: "2025-06-10T00:00:00Z",
        },
      ],
    }),
  ),

  // ─── Confirmations ─────────────────────────────────────────────────────────
  http.get(`${BASE}/confirmations`, () =>
    HttpResponse.json({
      success: true,
      data: mockConfirmationList,
      pagination: mockPagination,
    }),
  ),
  http.post(`${BASE}/confirmations`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { success: true, data: { ...mockConfirmation, ...body, id: "conf-new" } },
      { status: 201 },
    );
  }),
  http.post(`${BASE}/confirmations/:id/confirm`, () =>
    HttpResponse.json({ success: true }),
  ),
  http.post(`${BASE}/confirmations/:id/expire`, () =>
    HttpResponse.json({ success: true }),
  ),
  http.put(`${BASE}/confirmations/:id`, () =>
    HttpResponse.json({ success: true }),
  ),

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/dashboard`, () =>
    HttpResponse.json({ success: true, data: mockDashboardSummary }),
  ),
  http.get(`${BASE}/dashboard/alerts`, () =>
    HttpResponse.json({ success: true, data: mockDashboardAlerts }),
  ),

  // ─── Notifications ─────────────────────────────────────────────────────────
  // dashboardApi.getNotifications() does: data.data ?? []
  // axios interceptor unwraps { success, data } -> data (when no pagination)
  // So we need { pagination: null, data: [...] } to preserve the envelope
  http.get(`${BASE}/notifications`, () =>
    HttpResponse.json({
      pagination: null,
      data: [
        {
          id: "notif-1",
          user_id: "user-operator-1",
          type: "payment_overdue",
          reference_id: "pay-3",
          message: "Pembayaran Budi Santoso - A01 periode Mei 2025 sudah jatuh tempo.",
          is_read: false,
          created_at: "2025-06-01T00:00:00Z",
        },
        {
          id: "notif-2",
          user_id: "user-operator-1",
          type: "dp_reminder",
          reference_id: "conf-1",
          message: "Konfirmasi DP Andi Wijaya - A03 berakhir dalam 3 hari.",
          is_read: true,
          created_at: "2025-06-18T00:00:00Z",
        },
      ],
    }),
  ),
  http.patch(`${BASE}/notifications/:id/read`, () =>
    HttpResponse.json({ success: true }),
  ),
  http.patch(`${BASE}/notifications/read-all`, () =>
    HttpResponse.json({ success: true }),
  ),
  http.delete(`${BASE}/notifications/read`, () =>
    HttpResponse.json({ success: true }),
  ),

  // ─── Audit ─────────────────────────────────────────────────────────────────
  http.get(`${BASE}/audit/room-status`, () =>
    HttpResponse.json({
      success: true,
      data: [
        {
          id: "audit-1",
          room_id: "room-1",
          room_number: "A01",
          property_name: "Kos Anggrek",
          old_status: "available",
          new_status: "occupied",
          changed_by: "user-operator-1",
          changed_by_name: "Operator Test",
          created_at: "2025-03-01T00:00:00Z",
        },
      ],
      pagination: mockPagination,
    }),
  ),
  http.get(
    `${BASE}/audit/room-status/export`,
    () =>
      new HttpResponse(
        new Blob(["room_id,status\nroom-1,occupied"], { type: "text/csv" }),
      ),
  ),
  http.get(`${BASE}/users`, () =>
    HttpResponse.json({
      success: true,
      data: [mockOperatorProfile],
    }),
  ),

  // ─── Users / Settings ──────────────────────────────────────────────────────
  http.post(`${BASE}/users`, () =>
    HttpResponse.json(
      { success: true, data: mockOperatorProfile },
      { status: 201 },
    ),
  ),
  http.patch(`${BASE}/users/:id/deactivate`, () =>
    HttpResponse.json({ success: true }),
  ),
  http.put(`${BASE}/users/:id`, () => HttpResponse.json({ success: true })),
  http.patch(`${BASE}/users/:id`, () => HttpResponse.json({ success: true })),
  http.get(`${BASE}/settings/wa-config`, () =>
    HttpResponse.json({
      success: true,
      data: {
        recipient_numbers: ["08123456789"],
        notification_enabled: true,
      },
    }),
  ),
  http.put(`${BASE}/settings/wa-config`, () =>
    HttpResponse.json({ success: true }),
  ),

  // ─── WhatsApp ──────────────────────────────────────────────────────────────
  http.get(`${BASE}/whatsapp/status`, () =>
    HttpResponse.json({
      success: true,
      data: { status: "connected", connected: true, has_qr: false },
    }),
  ),
  http.get(`${BASE}/whatsapp/qr`, () =>
    HttpResponse.json({
      success: true,
      data: {
        qr: "mock-qr-string",
        instruction: "Scan QR ini dengan WhatsApp",
      },
    }),
  ),
  http.post(`${BASE}/whatsapp/connect`, () =>
    HttpResponse.json({ success: true }),
  ),
  http.post(`${BASE}/whatsapp/disconnect`, () =>
    HttpResponse.json({ success: true }),
  ),

  // ─── Viewer Requests ───────────────────────────────────────────────────────
  http.post(`${BASE}/viewer-requests`, () =>
    HttpResponse.json({ success: true }, { status: 201 }),
  ),
  http.get(`${BASE}/viewer-requests`, () =>
    HttpResponse.json({
      success: true,
      data: [],
      pagination: mockPagination,
    }),
  ),
];
