/**
 * Unit tests — features/audit/api/auditApi.ts
 * Cover: getAuditRoomStatus(), exportAuditCsv(), getUsersList()
 */
import { describe, it, expect } from "vitest";
import { getAuditRoomStatus, exportAuditCsv, getUsersList } from "@/features/audit/api/auditApi";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";

const BASE = "http://localhost:3000/api/v1";

describe("getAuditRoomStatus()", () => {
  it("mengembalikan log audit dengan pagination", async () => {
    const result = await getAuditRoomStatus({ page: 1, limit: 20 });
    expect(Array.isArray(result.logs)).toBe(true);
    expect(result.logs[0].room_number).toBe("A01");
    expect(result.logs[0].new_status).toBe("occupied");
    expect(result.pagination).toBeTruthy();
  });

  it("mengirim filter property_id, room_id, new_status, from_date, to_date, changed_by", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/audit/room-status`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    await getAuditRoomStatus({
      page: 1,
      limit: 20,
      property_id: "prop-1",
      room_id: "room-1",
      new_status: "occupied",
      from_date: "2025-01-01",
      to_date: "2025-06-30",
      changed_by: "user-operator-1",
    });
    expect(capturedUrl).toContain("property_id=prop-1");
    expect(capturedUrl).toContain("room_id=room-1");
    expect(capturedUrl).toContain("new_status=occupied");
    expect(capturedUrl).toContain("from_date=2025-01-01");
    expect(capturedUrl).toContain("to_date=2025-06-30");
    expect(capturedUrl).toContain("changed_by=user-operator-1");
  });

  it("tidak mengirim filter kosong", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/audit/room-status`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    await getAuditRoomStatus({ page: 1, limit: 20 });
    expect(capturedUrl).not.toContain("property_id");
    expect(capturedUrl).not.toContain("room_id");
  });

  it("mengembalikan array kosong saat tidak ada log", async () => {
    server.use(
      http.get(`${BASE}/audit/room-status`, () =>
        HttpResponse.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0 } })
      )
    );
    const result = await getAuditRoomStatus({ page: 1, limit: 20 });
    expect(result.logs).toEqual([]);
  });

  it("throw error saat tidak terautentikasi (401)", async () => {
    server.use(
      http.get(`${BASE}/audit/room-status`, () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
      )
    );
    await expect(getAuditRoomStatus({ page: 1, limit: 20 })).rejects.toThrow();
  });
});

describe("exportAuditCsv()", () => {
  it("mengembalikan Blob CSV", async () => {
    const result = await exportAuditCsv({});
    expect(result).toBeInstanceOf(Blob);
  });

  it("mengirim filter ke URL export", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/audit/room-status/export`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(
          new Blob(["data"], { type: "text/csv" })
        );
      })
    );
    await exportAuditCsv({
      property_id: "prop-1",
      from_date: "2025-01-01",
      to_date: "2025-06-30",
    });
    expect(capturedUrl).toContain("property_id=prop-1");
    expect(capturedUrl).toContain("from_date=2025-01-01");
    expect(capturedUrl).toContain("to_date=2025-06-30");
  });

  it("throw error saat server error (500)", async () => {
    server.use(
      http.get(`${BASE}/audit/room-status/export`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 })
      )
    );
    await expect(exportAuditCsv({})).rejects.toThrow();
  });
});

describe("getUsersList()", () => {
  it("mengembalikan daftar users untuk filter audit", async () => {
    const result = await getUsersList();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe("user-operator-1");
  });

  it("throw error saat server error (500)", async () => {
    server.use(
      http.get(`${BASE}/users`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 })
      )
    );
    await expect(getUsersList()).rejects.toThrow();
  });
});
