/**
 * Unit tests — features/rooms/api/roomApi.ts
 * Cover: list(), getById(), create(), update(), remove()
 */
import { describe, it, expect } from "vitest";
import { roomApi } from "@/features/rooms/api/roomApi";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { mockRoom, mockRoomsList } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("roomApi.list()", () => {
  it("mengembalikan daftar kamar", async () => {
    const result = await roomApi.list();
    expect(result.rooms).toHaveLength(mockRoomsList.length);
    expect(result.pagination).toBeTruthy();
  });

  it("mengirim parameter search, page, limit, property_id, status", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/rooms`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    await roomApi.list("A01", 2, 10, "prop-1", "available");
    expect(capturedUrl).toContain("search=A01");
    expect(capturedUrl).toContain("property_id=prop-1");
    expect(capturedUrl).toContain("status=available");
  });

  it("mengembalikan array kosong saat tidak ada data", async () => {
    server.use(
      http.get(`${BASE}/rooms`, () =>
        HttpResponse.json({ success: true, data: [], pagination: null })
      )
    );
    const result = await roomApi.list();
    expect(result.rooms).toEqual([]);
  });
});

describe("roomApi.getById()", () => {
  it("mengembalikan kamar berdasarkan ID", async () => {
    const result = await roomApi.getById("room-1");
    expect(result.id).toBe("room-1");
    expect(result.room_number).toBe("A01");
    expect(result.status).toBe("occupied");
  });

  it("throw error saat tidak ditemukan (404)", async () => {
    server.use(
      http.get(`${BASE}/rooms/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    await expect(roomApi.getById("tidak-ada")).rejects.toThrow();
  });
});

describe("roomApi.create()", () => {
  it("membuat kamar baru", async () => {
    const payload = {
      property_id: "prop-1",
      room_number: "C01",
      room_type: "Standard",
      rent_price: 1200000,
    };
    const result = await roomApi.create(payload);
    expect(result.id).toBe("room-new");
    expect(result.room_number).toBe("C01");
  });

  it("throw error saat duplikat room_number (409)", async () => {
    server.use(
      http.post(`${BASE}/rooms`, () =>
        HttpResponse.json({ error: "Conflict" }, { status: 409 })
      )
    );
    await expect(
      roomApi.create({ property_id: "prop-1", room_number: "A01", room_type: "Standard", rent_price: 1000000 })
    ).rejects.toThrow();
  });
});

describe("roomApi.update()", () => {
  it("mengupdate kamar", async () => {
    const result = await roomApi.update("room-1", { rent_price: 2000000 });
    expect(result.id).toBe("room-1");
  });

  it("throw error saat tidak ditemukan (404)", async () => {
    server.use(
      http.put(`${BASE}/rooms/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    await expect(roomApi.update("tidak-ada", { rent_price: 1000 })).rejects.toThrow();
  });
});

describe("roomApi.remove()", () => {
  it("menghapus kamar tanpa error", async () => {
    await expect(roomApi.remove("room-1")).resolves.not.toThrow();
  });

  it("throw error saat kamar masih terisi (400)", async () => {
    server.use(
      http.delete(`${BASE}/rooms/:id`, () =>
        HttpResponse.json({ error: "Room is occupied" }, { status: 400 })
      )
    );
    await expect(roomApi.remove("room-occupied")).rejects.toThrow();
  });
});
