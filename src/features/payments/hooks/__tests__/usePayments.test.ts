/**
 * Integration tests — features/payments/hooks/usePayments.ts
 * Cover: usePayments(), usePaymentById(), useCreatePayment(),
 *         useMarkPaid(), useUploadBukti(), useUpdatePayment()
 */
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { createWrapper } from "@/test/test-utils";
import {
  usePayments,
  usePaymentById,
  useCreatePayment,
  useMarkPaid,
  useUploadBukti,
  useUpdatePayment,
} from "@/features/payments/hooks/usePayments";
import { mockPaymentsList } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("usePayments()", () => {
  it("memuat daftar pembayaran berhasil", async () => {
    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.payments).toHaveLength(mockPaymentsList.length);
  });

  it("isError = true saat API gagal (500)", async () => {
    server.use(
      http.get(`${BASE}/payments`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 })
      )
    );
    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("mengirim filter status=unpaid", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/payments`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    const { result } = renderHook(
      () => usePayments(1, 20, undefined, undefined, "unpaid"),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain("status=unpaid");
  });

  it("mengirim filter period=2025-06", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/payments`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    const { result } = renderHook(
      () => usePayments(1, 20, undefined, undefined, undefined, undefined, "2025-06"),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain("period=2025-06");
  });
});

describe("usePaymentById()", () => {
  it("memuat pembayaran berdasarkan ID", async () => {
    const { result } = renderHook(() => usePaymentById("pay-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("pay-1");
    expect(result.current.data?.status).toBe("paid");
  });

  it("tidak fetch saat id = undefined", () => {
    const { result } = renderHook(() => usePaymentById(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreatePayment()", () => {
  it("mutation berhasil membuat pembayaran baru", async () => {
    const { result } = renderHook(() => useCreatePayment(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      room_id: "room-1",
      tenant_id: "tenant-1",
      period: "2025-08",
      amount: 1500000,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("pay-new");
  });

  it("mutation gagal saat duplikat periode (409)", async () => {
    server.use(
      http.post(`${BASE}/payments`, () =>
        HttpResponse.json({ error: "Conflict" }, { status: 409 })
      )
    );
    const { result } = renderHook(() => useCreatePayment(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      room_id: "room-1",
      tenant_id: "tenant-1",
      period: "2025-06",
      amount: 1500000,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useMarkPaid()", () => {
  it("mutation berhasil menandai pembayaran sebagai lunas", async () => {
    const { result } = renderHook(() => useMarkPaid(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ id: "pay-2" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("mutation berhasil dengan payment_date custom", async () => {
    const { result } = renderHook(() => useMarkPaid(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ id: "pay-2", payment_date: "2026-06-20" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("mutation gagal saat tidak ditemukan (404)", async () => {
    server.use(
      http.patch(`${BASE}/payments/:id/mark-paid`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    const { result } = renderHook(() => useMarkPaid(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ id: "tidak-ada" });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUploadBukti()", () => {
  it("mutation berhasil mengupload bukti transfer", async () => {
    const { result } = renderHook(() => useUploadBukti(), {
      wrapper: createWrapper(),
    });
    const file = new File(["content"], "bukti.jpg", { type: "image/jpeg" });
    result.current.mutate({ id: "pay-2", file });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toContain("bukti-new.jpg");
  });
});

describe("useUpdatePayment()", () => {
  it("mutation berhasil mengupdate pembayaran", async () => {
    const { result } = renderHook(() => useUpdatePayment(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ id: "pay-2", payload: { amount: 1600000 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
