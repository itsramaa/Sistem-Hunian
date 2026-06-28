/**
 * Integration tests — features/maintenance/hooks/useMaintenance.ts
 * Cover: useMaintenances(), useMaintenanceById(), useCreateMaintenance(),
 *         useUpdateMaintenance(), useUploadFotoKerusakan(),
 *         useUploadFotoPenanganan(), useMaintenanceLogs()
 */
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { createWrapper } from "@/test/test-utils";
import {
  useMaintenances,
  useMaintenanceById,
  useCreateMaintenance,
  useUpdateMaintenance,
  useUploadFotoKerusakan,
  useUploadFotoPenanganan,
  useMaintenanceLogs,
} from "@/features/maintenance/hooks/useMaintenance";
import { mockMaintenanceList } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("useMaintenances()", () => {
  it("memuat daftar maintenance berhasil", async () => {
    const { result } = renderHook(() => useMaintenances(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.maintenances).toHaveLength(mockMaintenanceList.length);
  });

  it("mengirim filter status=reported", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/maintenances`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    const { result } = renderHook(
      () => useMaintenances(1, 20, "reported"),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain("status=reported");
  });

  it("mengirim filter property_id dan room_id", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/maintenances`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    const { result } = renderHook(
      () => useMaintenances(1, 20, undefined, "prop-1", "room-1"),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain("property_id=prop-1");
    expect(capturedUrl).toContain("room_id=room-1");
  });

  it("isError = true saat API gagal (500)", async () => {
    server.use(
      http.get(`${BASE}/maintenances`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useMaintenances(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useMaintenanceById()", () => {
  it("memuat maintenance berdasarkan ID", async () => {
    const { result } = renderHook(() => useMaintenanceById("maint-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("maint-1");
    expect(result.current.data?.damage_description).toBe("AC tidak dingin");
    expect(result.current.data?.status).toBe("completed");
  });

  it("tidak fetch saat id = undefined", () => {
    const { result } = renderHook(() => useMaintenanceById(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("isError = true saat tidak ditemukan (404)", async () => {
    server.use(
      http.get(`${BASE}/maintenances/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    const { result } = renderHook(() => useMaintenanceById("tidak-ada"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCreateMaintenance()", () => {
  it("mutation berhasil membuat laporan maintenance", async () => {
    const { result } = renderHook(() => useCreateMaintenance(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      room_id: "room-2",
      report_date: "2025-06-26",
      damage_description: "Pintu macet",
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("maint-new");
  });

  it("mutation gagal saat validasi gagal (400)", async () => {
    server.use(
      http.post(`${BASE}/maintenances`, () =>
        HttpResponse.json({ error: "Bad Request" }, { status: 400 })
      )
    );
    const { result } = renderHook(() => useCreateMaintenance(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      room_id: "",
      report_date: "",
      damage_description: "",
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUpdateMaintenance()", () => {
  it("mutation berhasil mengupdate status ke in_progress", async () => {
    const { result } = renderHook(() => useUpdateMaintenance(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ id: "maint-2", payload: { status: "in_progress" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("mutation berhasil mengupdate ke completed dengan detail", async () => {
    const { result } = renderHook(() => useUpdateMaintenance(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      id: "maint-3",
      payload: { status: "completed", repair_action: "Ganti kran", cost: 150000 },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useUploadFotoKerusakan()", () => {
  it("mutation berhasil mengupload foto kerusakan", async () => {
    const { result } = renderHook(() => useUploadFotoKerusakan(), {
      wrapper: createWrapper(),
    });
    const file = new File(["content"], "kerusakan.jpg", { type: "image/jpeg" });
    result.current.mutate({ id: "maint-2", file });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.url).toContain("damage-new.jpg");
  });
});

describe("useUploadFotoPenanganan()", () => {
  it("mutation berhasil mengupload foto penanganan", async () => {
    const { result } = renderHook(() => useUploadFotoPenanganan(), {
      wrapper: createWrapper(),
    });
    const file = new File(["content"], "penanganan.jpg", { type: "image/jpeg" });
    result.current.mutate({ id: "maint-3", file });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.url).toContain("repair-new.jpg");
  });
});

describe("useMaintenanceLogs()", () => {
  it("memuat log maintenance berhasil", async () => {
    const { result } = renderHook(() => useMaintenanceLogs("maint-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
    // data bisa sudah di-unwrap oleh axios interceptor
    if (result.current.data && result.current.data.length > 0) {
      expect(result.current.data[0]).toHaveProperty("id");
    }
  });

  it("tidak fetch saat id = undefined", () => {
    const { result } = renderHook(() => useMaintenanceLogs(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
