/**
 * Integration tests — features/confirmations/hooks/useConfirmations.ts
 * Cover: useConfirmations(), useCreateConfirmation(), useExpireConfirmation(),
 *         useConfirmDP(), useUpdateDeadline()
 */
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { createWrapper } from "@/test/test-utils";
import {
  useConfirmations,
  useCreateConfirmation,
  useExpireConfirmation,
  useConfirmDP,
  useUpdateDeadline,
} from "@/features/confirmations/hooks/useConfirmations";
import { mockConfirmationList } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("useConfirmations()", () => {
  it("memuat daftar konfirmasi DP berhasil", async () => {
    const { result } = renderHook(() => useConfirmations(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.confirmations).toHaveLength(mockConfirmationList.length);
  });

  it("mengirim filter status=pending", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/confirmations`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    const { result } = renderHook(
      () => useConfirmations(1, 20, "pending"),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain("status=pending");
  });

  it("isError = true saat API gagal (500)", async () => {
    server.use(
      http.get(`${BASE}/confirmations`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useConfirmations(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCreateConfirmation()", () => {
  it("mutation berhasil membuat konfirmasi DP baru", async () => {
    const { result } = renderHook(() => useCreateConfirmation(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      room_id: "room-2",
      prospect_name: "Ahmad Farid",
      phone_number: "08777666555",
      down_payment_amount: 600000,
      confirmation_deadline: "2025-07-10T00:00:00Z",
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("conf-new");
  });

  it("mutation gagal saat konflik (409)", async () => {
    server.use(
      http.post(`${BASE}/confirmations`, () =>
        HttpResponse.json({ error: "Active confirmation exists" }, { status: 409 })
      )
    );
    const { result } = renderHook(() => useCreateConfirmation(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      room_id: "room-3",
      prospect_name: "X",
      phone_number: "08000",
      down_payment_amount: 100000,
      confirmation_deadline: "2025-07-10T00:00:00Z",
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useExpireConfirmation()", () => {
  it("mutation berhasil mengkadaluarkan konfirmasi", async () => {
    const { result } = renderHook(() => useExpireConfirmation(), {
      wrapper: createWrapper(),
    });
    result.current.mutate("conf-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("mutation gagal saat tidak ditemukan (404)", async () => {
    server.use(
      http.post(`${BASE}/confirmations/:id/expire`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    const { result } = renderHook(() => useExpireConfirmation(), {
      wrapper: createWrapper(),
    });
    result.current.mutate("tidak-ada");
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useConfirmDP()", () => {
  it("mutation berhasil mengkonfirmasi DP", async () => {
    const { result } = renderHook(() => useConfirmDP(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      id: "conf-1",
      payload: {
        name: "Andi Wijaya",
        identity_number: "3201234567890010",
        phone_number: "08133344455",
        check_in_date: "2025-07-01",
        rental_duration: 6,
      },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("mutation gagal saat konfirmasi sudah expired (400)", async () => {
    server.use(
      http.post(`${BASE}/confirmations/:id/confirm`, () =>
        HttpResponse.json({ error: "Confirmation expired" }, { status: 400 })
      )
    );
    const { result } = renderHook(() => useConfirmDP(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      id: "conf-expired",
      payload: {
        name: "X",
        identity_number: "123",
        phone_number: "08000",
        check_in_date: "2025-07-01",
        rental_duration: 3,
      },
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUpdateDeadline()", () => {
  it("mutation berhasil mengupdate deadline konfirmasi", async () => {
    const { result } = renderHook(() => useUpdateDeadline(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      id: "conf-1",
      payload: { confirmation_deadline: "2025-08-01T00:00:00Z" },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
