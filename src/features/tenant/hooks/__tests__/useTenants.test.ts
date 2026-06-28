/**
 * Integration tests — features/tenant/hooks/useTenants.ts
 * Cover: useTenants(), useTenantById(), useActiveTenants(), useTenantHistory(),
 *         useCreateTenant(), useUpdateTenant(), useCheckoutTenant()
 */
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { createWrapper } from "@/test/test-utils";
import {
  useTenants,
  useTenantById,
  useActiveTenants,
  useTenantHistory,
  useCreateTenant,
  useUpdateTenant,
  useCheckoutTenant,
} from "@/features/tenant/hooks/useTenants";
import { mockTenantsList, mockTenant } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("useTenants()", () => {
  it("memuat daftar penghuni berhasil", async () => {
    const { result } = renderHook(() => useTenants(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tenants).toHaveLength(mockTenantsList.length);
  });

  it("isError = true saat API gagal (500)", async () => {
    server.use(
      http.get(`${BASE}/tenants`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useTenants(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useTenantById()", () => {
  it("memuat penghuni berdasarkan ID", async () => {
    const { result } = renderHook(() => useTenantById("tenant-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe("Budi Santoso");
  });

  it("tidak fetch saat id = undefined", () => {
    const { result } = renderHook(() => useTenantById(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("isError = true saat tidak ditemukan", async () => {
    server.use(
      http.get(`${BASE}/tenants/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    const { result } = renderHook(() => useTenantById("tidak-ada"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useActiveTenants()", () => {
  it("mengirim filter status=active", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/tenants`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [mockTenant], pagination: null });
      })
    );
    const { result } = renderHook(() => useActiveTenants(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain("status=active");
  });
});

describe("useTenantHistory()", () => {
  it("mengirim filter status=checked_out", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/tenants`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    const { result } = renderHook(() => useTenantHistory(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain("status=checked_out");
  });
});

describe("useCreateTenant()", () => {
  it("mutation berhasil membuat penghuni baru", async () => {
    const { result } = renderHook(() => useCreateTenant(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      room_id: "room-2",
      name: "Citra Lestari",
      identity_number: "3201234567890003",
      phone_number: "08333444555",
      check_in_date: "2025-07-01",
      rental_duration: 6,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("tenant-new");
  });

  it("mutation gagal saat kamar tidak tersedia (400)", async () => {
    server.use(
      http.post(`${BASE}/tenants`, () =>
        HttpResponse.json({ error: "Room not available" }, { status: 400 })
      )
    );
    const { result } = renderHook(() => useCreateTenant(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      room_id: "room-occupied",
      name: "X",
      identity_number: "123",
      phone_number: "08000",
      check_in_date: "2025-07-01",
      rental_duration: 3,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUpdateTenant()", () => {
  it("mutation berhasil mengupdate data penghuni", async () => {
    const { result } = renderHook(() => useUpdateTenant(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ id: "tenant-1", payload: { rental_duration: 12 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useCheckoutTenant()", () => {
  it("mutation berhasil melakukan checkout", async () => {
    const { result } = renderHook(() => useCheckoutTenant(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ id: "tenant-1", check_out_date: "2025-09-01" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("mutation gagal saat penghuni sudah checkout (400)", async () => {
    server.use(
      http.post(`${BASE}/tenants/:id/checkout`, () =>
        HttpResponse.json({ error: "Already checked out" }, { status: 400 })
      )
    );
    const { result } = renderHook(() => useCheckoutTenant(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ id: "tenant-2", check_out_date: "2025-09-01" });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
