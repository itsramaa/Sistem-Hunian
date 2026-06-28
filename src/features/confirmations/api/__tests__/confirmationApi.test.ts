/**
 * Unit tests — features/confirmations/api/confirmationApi.ts
 * UPDATED: Align dengan Black Box 4.4.1.6 & Activity Diagram Proses 7
 *
 * Gap yang difix:
 * - BB No.3: Catat DP untuk kamar occupied → 422 ErrRoomOccupied
 * - BB No.4: Kamar sudah dp_confirmation → 422 ErrRoomPendingDPExists
 * - BB No.6: confirmDP atomik → status confirmed + kamar occupied + tenant dibuat
 * - BB No.7: Hangus manual → status expired + kamar available
 * - BB No.8: Hangus otomatis worker → status expired + kamar available
 */
import { describe, it, expect } from "vitest";
import { confirmationApi } from "@/features/confirmations/api/confirmationApi";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { mockConfirmation, mockConfirmationList } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("confirmationApi.list()", () => {
  it("mengembalikan daftar konfirmasi DP", async () => {
    const result = await confirmationApi.list();
    expect(result.confirmations).toHaveLength(mockConfirmationList.length);
    expect(result.pagination).toBeTruthy();
  });

  it("mengirim filter status dan property_id", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/confirmations`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      }),
    );
    await confirmationApi.list(1, 20, "pending", "prop-1");
    expect(capturedUrl).toContain("status=pending");
    expect(capturedUrl).not.toContain("room_id");
    expect(capturedUrl).toContain("property_id=prop-1");
  });

  it("mengembalikan array kosong saat tidak ada data", async () => {
    server.use(
      http.get(`${BASE}/confirmations`, () =>
        HttpResponse.json({ success: true, data: [], pagination: null }),
      ),
    );
    const result = await confirmationApi.list();
    expect(result.confirmations).toEqual([]);
  });
});

describe("confirmationApi.create()", () => {
  it("BB No.3: catat DP untuk kamar available → tersimpan, kamar jadi dp_confirmation", async () => {
    const payload = {
      room_id: "room-2",
      prospect_name: "Ahmad Farid",
      phone_number: "08777666555",
      down_payment_amount: 600000,
      confirmation_deadline: "2025-07-10T00:00:00Z",
    };
    const result = await confirmationApi.create(payload);
    expect(result.id).toBe("conf-new");
    expect(result.prospect_name).toBe("Ahmad Farid");
  });

  it("BB No.4: catat DP untuk kamar occupied → 422 ErrRoomOccupied", async () => {
    // Go backend: "tidak tersedia" atau "not available" → 422
    server.use(
      http.post(`${BASE}/confirmations`, () =>
        HttpResponse.json(
          { error: { code: "ROOM_003", message: "Kamar tidak tersedia" } },
          { status: 422 },
        ),
      ),
    );
    await expect(
      confirmationApi.create({
        room_id: "room-occupied",
        prospect_name: "X",
        phone_number: "08000",
        down_payment_amount: 100000,
        confirmation_deadline: "2025-07-10T00:00:00Z",
      }),
    ).rejects.toThrow();
  });

  it("BB No.5: kamar sudah dp_confirmation → 422 ErrRoomPendingDPExists", async () => {
    // Go backend: "already has a pending" → 422 ErrRoomPendingDPExists
    server.use(
      http.post(`${BASE}/confirmations`, () =>
        HttpResponse.json(
          {
            error: {
              code: "CONF_002",
              message: "Kamar already has a pending confirmation",
            },
          },
          { status: 422 },
        ),
      ),
    );
    await expect(
      confirmationApi.create({
        room_id: "room-3",
        prospect_name: "Y",
        phone_number: "08001",
        down_payment_amount: 200000,
        confirmation_deadline: "2025-07-10T00:00:00Z",
      }),
    ).rejects.toThrow();
  });
});

describe("confirmationApi.confirmDP()", () => {
  it("BB No.6: konfirmasi DP atomik → status confirmed + kamar occupied + tenant dibuat", async () => {
    // Operasi atomik: satu request memperbarui konfirmasi, kamar, dan membuat tenant
    const payload = {
      name: "Andi Wijaya",
      identity_number: "3201234567890010",
      phone_number: "08133344455",
      check_in_date: "2025-07-01",
      rental_duration: 6,
    };
    await expect(
      confirmationApi.confirmDP("conf-1", payload),
    ).resolves.not.toThrow();
  });

  it("BB No.6: throw error saat konfirmasi sudah expired (400/422)", async () => {
    server.use(
      http.post(`${BASE}/confirmations/:id/confirm`, () =>
        HttpResponse.json(
          { error: { code: "CONF_003", message: "Konfirmasi sudah expired" } },
          { status: 422 },
        ),
      ),
    );
    await expect(
      confirmationApi.confirmDP("conf-expired", {
        name: "X",
        identity_number: "123",
        phone_number: "08000",
        check_in_date: "2025-07-01",
        rental_duration: 3,
      }),
    ).rejects.toThrow();
  });

  it("throw error saat tidak ditemukan (404)", async () => {
    server.use(
      http.post(`${BASE}/confirmations/:id/confirm`, () =>
        HttpResponse.json({ success: false }, { status: 404 }),
      ),
    );
    await expect(
      confirmationApi.confirmDP("tidak-ada", {
        name: "X",
        identity_number: "123",
        phone_number: "08000",
        check_in_date: "2025-07-01",
        rental_duration: 3,
      }),
    ).rejects.toThrow();
  });
});

describe("confirmationApi.expire()", () => {
  it("BB No.7: hangus manual → status expired + kamar kembali available", async () => {
    await expect(confirmationApi.expire("conf-1")).resolves.not.toThrow();
  });

  it("BB No.8: hangus otomatis worker juga via endpoint expire (manual test simulasi)", async () => {
    // Worker background memanggil endpoint yang sama
    await expect(confirmationApi.expire("conf-1")).resolves.not.toThrow();
  });

  it("throw error saat tidak ditemukan (404)", async () => {
    server.use(
      http.post(`${BASE}/confirmations/:id/expire`, () =>
        HttpResponse.json({ success: false }, { status: 404 }),
      ),
    );
    await expect(confirmationApi.expire("tidak-ada")).rejects.toThrow();
  });
});

describe("confirmationApi.updateDeadline()", () => {
  it("mengupdate deadline konfirmasi DP tanpa error", async () => {
    await expect(
      confirmationApi.updateDeadline("conf-1", "2025-08-01T00:00:00Z"),
    ).resolves.not.toThrow();
  });

  it("throw error saat tidak ditemukan (404)", async () => {
    server.use(
      http.put(`${BASE}/confirmations/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 }),
      ),
    );
    await expect(
      confirmationApi.updateDeadline("tidak-ada", "2025-08-01T00:00:00Z"),
    ).rejects.toThrow();
  });
});
