/**
 * Integration tests — features/audit/hooks/useAudit.ts
 * Cover: useAuditRoomStatus(), useAuditUsersList()
 */
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { createWrapper } from "@/test/test-utils";
import {
  useAuditRoomStatus,
  useAuditUsersList,
} from "@/features/audit/hooks/useAudit";

const BASE = "http://localhost:3000/api/v1";

describe("useAuditRoomStatus()", () => {
  it("memuat log audit berhasil", async () => {
    const { result } = renderHook(
      () => useAuditRoomStatus({ page: 1, limit: 20 }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data?.logs)).toBe(true);
    expect(result.current.data?.logs[0].room_number).toBe("A01");
    expect(result.current.data?.pagination).toBeTruthy();
  });

  it("mengirim semua filter dengan benar", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/audit/room-status`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    const { result } = renderHook(
      () =>
        useAuditRoomStatus({
          page: 1,
          limit: 20,
          property_id: "prop-1",
          room_id: "room-1",
          new_status: "occupied",
          from_date: "2025-01-01",
          to_date: "2025-06-30",
          changed_by: "user-operator-1",
        }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain("property_id=prop-1");
    expect(capturedUrl).toContain("new_status=occupied");
    expect(capturedUrl).toContain("from_date=2025-01-01");
    expect(capturedUrl).toContain("to_date=2025-06-30");
  });

  it("mengembalikan array kosong saat tidak ada log", async () => {
    server.use(
      http.get(`${BASE}/audit/room-status`, () =>
        HttpResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 20, total: 0 },
        })
      )
    );
    const { result } = renderHook(
      () => useAuditRoomStatus({ page: 1, limit: 20 }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.logs).toEqual([]);
  });

  it("isError = true saat tidak terautentikasi (401)", async () => {
    server.use(
      http.get(`${BASE}/audit/room-status`, () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
      )
    );
    const { result } = renderHook(
      () => useAuditRoomStatus({ page: 1, limit: 20 }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("re-fetch saat filters berubah", async () => {
    let callCount = 0;
    server.use(
      http.get(`${BASE}/audit/room-status`, () => {
        callCount++;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    const { result, rerender } = renderHook(
      ({ filters }) => useAuditRoomStatus(filters),
      {
        wrapper: createWrapper(),
        initialProps: { filters: { page: 1, limit: 20 } },
      }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ filters: { page: 2, limit: 20 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callCount).toBeGreaterThanOrEqual(2);
  });
});

describe("useAuditUsersList()", () => {
  it("memuat daftar users untuk filter audit", async () => {
    const { result } = renderHook(() => useAuditUsersList(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data?.[0].id).toBe("user-operator-1");
  });

  it("isError = true saat server error (500)", async () => {
    server.use(
      http.get(`${BASE}/users`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useAuditUsersList(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
