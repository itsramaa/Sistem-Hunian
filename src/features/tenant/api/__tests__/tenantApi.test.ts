/**
 * Unit tests — features/tenant/api/tenantApi.ts
 * UPDATED: Align dengan Black Box 4.4.1.4 & Activity Diagram Proses 5
 *
 * Gap yang difix:
 * - BB No.4: Checkout dengan tunggakan → backend return 422 (bukan 400)
 * - BB No.3: Checkout sukses → status kamar jadi available
 * - BB No.2: Tambah penghuni ke kamar occupied → 422 (bukan 400)
 */
import { describe, it, expect } from "vitest";
import { tenantApi } from "@/features/tenant/api/tenantApi";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { mockTenant, mockTenantsList } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("tenantApi.list()", () => {
  it("mengembalikan daftar penghuni", async () => {
    const result = await tenantApi.list();
    expect(result.tenants).toHaveLength(mockTenantsList.length);
    expect(result.pagination).toBeTruthy();
  });

  it("mengirim filter status, property_id, room_id", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/tenants`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      }),
    );
    await tenantApi.list(1, 20, "active", "prop-1", "room-1");
    expect(capturedUrl).toContain("status=active");
    expect(capturedUrl).toContain("property_id=prop-1");
    expect(capturedUrl).toContain("room_id=room-1");
  });

  it("filter checked_out untuk tab histori penghuni", async () => {
    server.use(
      http.get(`${BASE}/tenants`, () =>
        HttpResponse.json({
          success: true,
          data: [mockTenant],
          pagination: null,
        }),
      ),
    );
    const result = await tenantApi.list(1, 20, "checked_out");
    expect(result.tenants).toHaveLength(1);
  });
});

describe("tenantApi.getById()", () => {
  it("mengembalikan penghuni berdasarkan ID", async () => {
    const result = await tenantApi.getById("tenant-1");
    expect(result.id).toBe("tenant-1");
    expect(result.name).toBe("Budi Santoso");
    expect(result.status).toBe("active");
  });

  it("throw error saat tidak ditemukan (404)", async () => {
    server.use(
      http.get(`${BASE}/tenants/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 }),
      ),
    );
    await expect(tenantApi.getById("tidak-ada")).rejects.toThrow();
  });
});

describe("tenantApi.create()", () => {
  it("BB No.1: tambah penghuni ke kamar available → tersimpan", async () => {
    const payload = {
      room_id: "room-2",
      name: "Citra Lestari",
      identity_number: "3201234567890003",
      phone_number: "08333444555",
      check_in_date: "2025-07-01",
      rental_duration: 6,
    };
    const result = await tenantApi.create(payload);
    expect(result.id).toBe("tenant-new");
    expect(result.name).toBe("Citra Lestari");
  });

  it("BB No.2: tambah penghuni ke kamar occupied → 422 (ErrRoomOccupied)", async () => {
    // Go backend return 422 untuk kamar occupied, bukan 400
    server.use(
      http.post(`${BASE}/tenants`, () =>
        HttpResponse.json(
          {
            error: {
              code: "ROOM_003",
              message: "Kamar berstatus terisi atau konfirmasi DP",
            },
          },
          { status: 422 },
        ),
      ),
    );
    await expect(
      tenantApi.create({
        room_id: "room-occupied",
        name: "X",
        identity_number: "123",
        phone_number: "08000",
        check_in_date: "2025-07-01",
        rental_duration: 3,
      }),
    ).rejects.toThrow();
  });

  it("kamar dp_confirmation → 422 (tidak bisa ditempati langsung)", async () => {
    server.use(
      http.post(`${BASE}/tenants`, () =>
        HttpResponse.json(
          {
            error: {
              code: "ROOM_003",
              message: "Kamar berstatus konfirmasi DP",
            },
          },
          { status: 422 },
        ),
      ),
    );
    await expect(
      tenantApi.create({
        room_id: "room-dp",
        name: "Y",
        identity_number: "456",
        phone_number: "08001",
        check_in_date: "2025-07-01",
        rental_duration: 3,
      }),
    ).rejects.toThrow();
  });
});

describe("tenantApi.update()", () => {
  it("mengupdate data penghuni", async () => {
    const result = await tenantApi.update("tenant-1", { rental_duration: 12 });
    expect(result.id).toBe("tenant-1");
  });

  it("throw error saat tidak ditemukan (404)", async () => {
    server.use(
      http.put(`${BASE}/tenants/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 }),
      ),
    );
    await expect(
      tenantApi.update("tidak-ada", { rental_duration: 6 }),
    ).rejects.toThrow();
  });
});

describe("tenantApi.checkout()", () => {
  it("BB No.3: checkout tanpa tunggakan → berhasil", async () => {
    await expect(
      tenantApi.checkout("tenant-1", "2025-09-01"),
    ).resolves.not.toThrow();
  });

  it("BB No.4: checkout dengan tunggakan → 422 ErrTenantHasTunggakan", async () => {
    // Go backend: strings.Contains(msg, "tunggakan") → 422 ErrTenantHasTunggakan
    // BUKAN 400! Backend pakai StatusUnprocessableEntity (422)
    server.use(
      http.post(`${BASE}/tenants/:id/checkout`, () =>
        HttpResponse.json(
          {
            error: {
              code: "TENANT_003",
              message: "Penghuni masih memiliki tunggakan pembayaran",
            },
          },
          { status: 422 },
        ),
      ),
    );
    await expect(
      tenantApi.checkout("tenant-with-debt", "2025-09-01"),
    ).rejects.toThrow();
  });

  it("tenant tidak aktif → 422 ErrTenantNotActive", async () => {
    // Go backend: status selain active → StatusUnprocessableEntity (422)
    server.use(
      http.post(`${BASE}/tenants/:id/checkout`, () =>
        HttpResponse.json(
          {
            error: {
              code: "TENANT_002",
              message: "Penghuni sudah tidak aktif",
            },
          },
          { status: 422 },
        ),
      ),
    );
    await expect(
      tenantApi.checkout("tenant-2", "2025-09-01"),
    ).rejects.toThrow();
  });

  it("penghuni tidak ditemukan → 404", async () => {
    server.use(
      http.post(`${BASE}/tenants/:id/checkout`, () =>
        HttpResponse.json({ success: false }, { status: 404 }),
      ),
    );
    await expect(
      tenantApi.checkout("tidak-ada", "2025-09-01"),
    ).rejects.toThrow();
  });
});
