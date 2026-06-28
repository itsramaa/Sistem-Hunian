/**
 * Integration tests — features/rooms/hooks/useRooms.ts
 * Cover: useRooms(), useRoomById(), useCreateRoom(), useUpdateRoom(), useDeleteRoom()
 */
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { createWrapper } from "@/test/test-utils";
import {
  useRooms,
  useRoomById,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
} from "@/features/rooms/hooks/useRooms";
import { mockRoomsList } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("useRooms()", () => {
  it("memuat daftar kamar berhasil", async () => {
    const { result } = renderHook(() => useRooms(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.rooms).toHaveLength(mockRoomsList.length);
  });

  it("mengirim filter property_id dan status", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/rooms`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    const { result } = renderHook(
      () => useRooms("", 1, 20, "prop-1", "available"),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain("property_id=prop-1");
    expect(capturedUrl).toContain("status=available");
  });

  it("isError = true saat API gagal", async () => {
    server.use(
      http.get(`${BASE}/rooms`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useRooms(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useRoomById()", () => {
  it("memuat kamar berdasarkan ID", async () => {
    const { result } = renderHook(() => useRoomById("room-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.room_number).toBe("A01");
    expect(result.current.data?.status).toBe("occupied");
  });

  it("tidak fetch saat id = undefined", () => {
    const { result } = renderHook(() => useRoomById(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateRoom()", () => {
  it("mutation berhasil membuat kamar baru", async () => {
    const { result } = renderHook(() => useCreateRoom(), { wrapper: createWrapper() });
    result.current.mutate({
      property_id: "prop-1",
      room_number: "C01",
      room_type: "Standard",
      rent_price: 1200000,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("room-new");
  });

  it("mutation gagal saat duplikat (409)", async () => {
    server.use(
      http.post(`${BASE}/rooms`, () =>
        HttpResponse.json({ error: "Conflict" }, { status: 409 })
      )
    );
    const { result } = renderHook(() => useCreateRoom(), { wrapper: createWrapper() });
    result.current.mutate({
      property_id: "prop-1",
      room_number: "A01",
      room_type: "Standard",
      rent_price: 1000000,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUpdateRoom()", () => {
  it("mutation berhasil mengupdate kamar", async () => {
    const { result } = renderHook(() => useUpdateRoom(), { wrapper: createWrapper() });
    result.current.mutate({ id: "room-1", payload: { rent_price: 2000000 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useDeleteRoom()", () => {
  it("mutation berhasil menghapus kamar", async () => {
    const { result } = renderHook(() => useDeleteRoom(), { wrapper: createWrapper() });
    result.current.mutate("room-2");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("mutation gagal saat kamar masih terisi (400)", async () => {
    server.use(
      http.delete(`${BASE}/rooms/:id`, () =>
        HttpResponse.json({ error: "Room occupied" }, { status: 400 })
      )
    );
    const { result } = renderHook(() => useDeleteRoom(), { wrapper: createWrapper() });
    result.current.mutate("room-1");
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
