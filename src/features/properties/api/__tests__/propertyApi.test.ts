/**
 * Unit tests — features/properties/api/propertyApi.ts
 * Cover: list(), getById(), create(), update(), remove()
 */
import { describe, it, expect } from "vitest";
import { propertyApi } from "@/features/properties/api/propertyApi";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { mockProperty, mockPropertiesList } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("propertyApi.list()", () => {
  it("mengembalikan daftar properti dengan pagination", async () => {
    const result = await propertyApi.list();
    expect(result.properties).toHaveLength(mockPropertiesList.length);
    expect(result.pagination).toBeTruthy();
    expect(result.properties[0].property_name).toBe("Kos Anggrek");
  });

  it("mengembalikan array kosong saat tidak ada data", async () => {
    server.use(
      http.get(`${BASE}/properties`, () =>
        HttpResponse.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0 } })
      )
    );
    const result = await propertyApi.list();
    expect(result.properties).toEqual([]);
  });

  it("mengirim parameter search, page, limit", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/properties`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: mockPropertiesList, pagination: null });
      })
    );
    await propertyApi.list("anggrek", 2, 10);
    expect(capturedUrl).toContain("search=anggrek");
    expect(capturedUrl).toContain("page=2");
    expect(capturedUrl).toContain("limit=10");
  });

  it("throw error saat server error (500)", async () => {
    server.use(
      http.get(`${BASE}/properties`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 })
      )
    );
    await expect(propertyApi.list()).rejects.toThrow();
  });
});

describe("propertyApi.getById()", () => {
  it("mengembalikan properti berdasarkan ID", async () => {
    const result = await propertyApi.getById("prop-1");
    expect(result.id).toBe("prop-1");
    expect(result.property_name).toBe("Kos Anggrek");
  });

  it("throw error saat properti tidak ditemukan (404)", async () => {
    server.use(
      http.get(`${BASE}/properties/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    await expect(propertyApi.getById("tidak-ada")).rejects.toThrow();
  });
});

describe("propertyApi.create()", () => {
  it("membuat properti baru dan mengembalikan data", async () => {
    const payload = {
      property_name: "Kos Baru",
      address: "Jl. Baru No.1",
      description: "Kos baru",
    };
    const result = await propertyApi.create(payload);
    expect(result.id).toBe("prop-new");
    expect(result.property_name).toBe("Kos Baru");
  });

  it("throw error saat validasi gagal (400)", async () => {
    server.use(
      http.post(`${BASE}/properties`, () =>
        HttpResponse.json({ error: "Bad Request" }, { status: 400 })
      )
    );
    await expect(
      propertyApi.create({ property_name: "", address: "" })
    ).rejects.toThrow();
  });
});

describe("propertyApi.update()", () => {
  it("mengupdate properti dan mengembalikan data baru", async () => {
    const result = await propertyApi.update("prop-1", {
      property_name: "Kos Anggrek Updated",
    });
    expect(result.id).toBe("prop-1");
    expect(result.property_name).toBe("Kos Anggrek Updated");
  });

  it("throw error saat properti tidak ditemukan (404)", async () => {
    server.use(
      http.put(`${BASE}/properties/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    await expect(
      propertyApi.update("tidak-ada", { property_name: "X" })
    ).rejects.toThrow();
  });
});

describe("propertyApi.remove()", () => {
  it("menghapus properti tanpa error", async () => {
    await expect(propertyApi.remove("prop-1")).resolves.not.toThrow();
  });

  it("throw error saat properti tidak ditemukan (404)", async () => {
    server.use(
      http.delete(`${BASE}/properties/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    await expect(propertyApi.remove("tidak-ada")).rejects.toThrow();
  });
});
