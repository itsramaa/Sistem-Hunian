/**
 * Unit tests — features/maintenance/api/maintenanceApi.ts
 * Cover: list(), getById(), create(), update(), uploadFotoKerusakan(),
 *         uploadFotoPenanganan(), getLogs()
 */
import { describe, it, expect } from "vitest";
import { maintenanceApi } from "@/features/maintenance/api/maintenanceApi";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { mockMaintenance, mockMaintenanceList } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("maintenanceApi.list()", () => {
  it("mengembalikan daftar maintenance", async () => {
    const result = await maintenanceApi.list();
    expect(result.maintenances).toHaveLength(mockMaintenanceList.length);
    expect(result.pagination).toBeTruthy();
  });

  it("mengirim filter status, property_id, room_id", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/maintenances`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      }),
    );
    await maintenanceApi.list(1, 20, "reported", "prop-1", "room-1");
    expect(capturedUrl).toContain("status=reported");
    expect(capturedUrl).toContain("property_id=prop-1");
    expect(capturedUrl).toContain("room_id=room-1");
  });

  it("mengembalikan array kosong saat tidak ada data", async () => {
    server.use(
      http.get(`${BASE}/maintenances`, () =>
        HttpResponse.json({ success: true, data: [], pagination: null }),
      ),
    );
    const result = await maintenanceApi.list();
    expect(result.maintenances).toEqual([]);
  });
});

describe("maintenanceApi.getById()", () => {
  it("mengembalikan maintenance berdasarkan ID", async () => {
    const result = await maintenanceApi.getById("maint-1");
    expect(result.id).toBe("maint-1");
    expect(result.damage_description).toBe("AC tidak dingin");
    expect(result.status).toBe("completed");
  });

  it("throw error saat tidak ditemukan (404)", async () => {
    server.use(
      http.get(`${BASE}/maintenances/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 }),
      ),
    );
    await expect(maintenanceApi.getById("tidak-ada")).rejects.toThrow();
  });
});

describe("maintenanceApi.create()", () => {
  it("membuat laporan maintenance baru", async () => {
    const payload = {
      room_id: "room-2",
      report_date: "2025-06-26",
      damage_description: "Pintu macet",
    };
    const result = await maintenanceApi.create(payload);
    expect(result.id).toBe("maint-new");
    expect(result.damage_description).toBe("Pintu macet");
  });

  it("throw error saat room_id tidak valid (400)", async () => {
    server.use(
      http.post(`${BASE}/maintenances`, () =>
        HttpResponse.json({ error: "Bad Request" }, { status: 400 }),
      ),
    );
    await expect(
      maintenanceApi.create({
        room_id: "",
        report_date: "2025-06-26",
        damage_description: "",
      }),
    ).rejects.toThrow();
  });
});

describe("maintenanceApi.update()", () => {
  it("mengupdate status maintenance ke in_progress", async () => {
    const result = await maintenanceApi.update("maint-2", {
      status: "in_progress",
    });
    expect(result.id).toBe("maint-2");
  });

  it("mengupdate status maintenance ke completed dengan detail", async () => {
    const result = await maintenanceApi.update("maint-3", {
      status: "completed",
      repair_action: "Ganti kran",
      cost: 150000,
    });
    expect(result.status).toBe("completed");
  });

  it("throw error saat tidak ditemukan (404)", async () => {
    server.use(
      http.put(`${BASE}/maintenances/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 }),
      ),
    );
    await expect(
      maintenanceApi.update("tidak-ada", { status: "completed" }),
    ).rejects.toThrow();
  });
});

describe("maintenanceApi.uploadFotoKerusakan()", () => {
  it("mengupload foto kerusakan dan mengembalikan URL", async () => {
    const file = new File(["content"], "kerusakan.jpg", { type: "image/jpeg" });
    const result = await maintenanceApi.uploadFotoKerusakan("maint-2", file);
    expect(result.url).toContain("damage-new.jpg");
  });

  it("throw error saat upload gagal (500)", async () => {
    server.use(
      http.patch(`${BASE}/maintenances/:id/upload-damage`, () =>
        HttpResponse.json({ error: "Upload failed" }, { status: 500 })
      ),
      http.patch(`${BASE}/maintenances/:id/upload-kerusakan`, () =>
        HttpResponse.json({ error: "Upload failed" }, { status: 500 })
      )
    );
    const file = new File(["x"], "fail.jpg", { type: "image/jpeg" });
    await expect(
      maintenanceApi.uploadFotoKerusakan("maint-2", file)
    ).rejects.toThrow();
  });
});

describe("maintenanceApi.uploadFotoPenanganan()", () => {
  it("mengupload foto penanganan dan mengembalikan URL", async () => {
    const file = new File(["content"], "penanganan.jpg", {
      type: "image/jpeg",
    });
    const result = await maintenanceApi.uploadFotoPenanganan("maint-3", file);
    expect(result.url).toContain("repair-new.jpg");
  });
});

describe("maintenanceApi.getLogs()", () => {
  it("mengembalikan log history maintenance", async () => {
    const result = await maintenanceApi.getLogs("maint-1");
    expect(Array.isArray(result)).toBe(true);
    // data mungkin sudah di-unwrap oleh axios interceptor
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
    }
  });

  it("mengembalikan array kosong jika belum ada log", async () => {
    server.use(
      http.get(`${BASE}/maintenances/:id/logs`, () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    );
    const result = await maintenanceApi.getLogs("maint-new");
    expect(result).toEqual([]);
  });
});
