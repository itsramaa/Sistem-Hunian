/**
 * Unit tests — features/payments/api/paymentApi.ts
 * Cover: list(), getById(), create(), markPaid(), uploadBukti(), update()
 */
import { describe, it, expect } from "vitest";
import { paymentApi } from "@/features/payments/api/paymentApi";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { mockPayment, mockPaymentsList } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("paymentApi.list()", () => {
  it("mengembalikan daftar pembayaran", async () => {
    const result = await paymentApi.list();
    expect(result.payments).toHaveLength(mockPaymentsList.length);
    expect(result.pagination).toBeTruthy();
  });

  it("mengirim filter room_id, tenant_id, status, property_id, period", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/payments`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    await paymentApi.list(1, 20, "room-1", "tenant-1", "unpaid", "prop-1", "2025-06");
    expect(capturedUrl).toContain("room_id=room-1");
    expect(capturedUrl).toContain("tenant_id=tenant-1");
    expect(capturedUrl).toContain("status=unpaid");
    expect(capturedUrl).toContain("property_id=prop-1");
    expect(capturedUrl).toContain("period=2025-06");
  });

  it("mengembalikan array kosong saat tidak ada data", async () => {
    server.use(
      http.get(`${BASE}/payments`, () =>
        HttpResponse.json({ success: true, data: [], pagination: null })
      )
    );
    const result = await paymentApi.list();
    expect(result.payments).toEqual([]);
  });
});

describe("paymentApi.getById()", () => {
  it("mengembalikan pembayaran berdasarkan ID", async () => {
    const result = await paymentApi.getById("pay-1");
    expect(result.id).toBe("pay-1");
    expect(result.status).toBe("paid");
    expect(result.amount).toBe(1500000);
  });

  it("throw error saat tidak ditemukan (404)", async () => {
    server.use(
      http.get(`${BASE}/payments/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    await expect(paymentApi.getById("tidak-ada")).rejects.toThrow();
  });
});

describe("paymentApi.create()", () => {
  it("membuat pembayaran baru", async () => {
    const payload = {
      room_id: "room-1",
      tenant_id: "tenant-1",
      period: "2025-08",
      amount: 1500000,
    };
    const result = await paymentApi.create(payload);
    expect(result.id).toBe("pay-new");
    expect(result.period).toBe("2025-08");
  });

  it("throw error saat periode duplikat (409)", async () => {
    server.use(
      http.post(`${BASE}/payments`, () =>
        HttpResponse.json({ error: "Payment already exists" }, { status: 409 })
      )
    );
    await expect(
      paymentApi.create({ room_id: "room-1", tenant_id: "tenant-1", period: "2025-06", amount: 1500000 })
    ).rejects.toThrow();
  });
});

describe("paymentApi.markPaid()", () => {
  it("menandai pembayaran sebagai lunas tanpa error", async () => {
    await expect(paymentApi.markPaid("pay-2")).resolves.not.toThrow();
  });

  it("throw error saat pembayaran tidak ditemukan (404)", async () => {
    server.use(
      http.patch(`${BASE}/payments/:id/mark-paid`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    await expect(paymentApi.markPaid("tidak-ada")).rejects.toThrow();
  });
});

describe("paymentApi.uploadBukti()", () => {
  it("mengupload bukti transfer dan mengembalikan URL", async () => {
    const file = new File(["content"], "bukti.jpg", { type: "image/jpeg" });
    const result = await paymentApi.uploadBukti("pay-2", file);
    expect(result).toContain("https://cdn.example.com/bukti-new.jpg");
  });

  it("throw error saat file terlalu besar (413)", async () => {
    server.use(
      http.patch(`${BASE}/payments/:id/upload`, () =>
        HttpResponse.json({ error: "File too large" }, { status: 413 })
      )
    );
    const file = new File(["x".repeat(10 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" });
    await expect(paymentApi.uploadBukti("pay-2", file)).rejects.toThrow();
  });
});

describe("paymentApi.update()", () => {
  it("mengupdate pembayaran tanpa error", async () => {
    await expect(
      paymentApi.update("pay-2", { amount: 1600000 })
    ).resolves.not.toThrow();
  });

  it("throw error saat tidak ditemukan (404)", async () => {
    server.use(
      http.put(`${BASE}/payments/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    await expect(
      paymentApi.update("tidak-ada", { amount: 1000 })
    ).rejects.toThrow();
  });
});
