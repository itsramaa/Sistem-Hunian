/**
 * Integration tests — features/properties/hooks/useProperties.ts
 * Cover: useProperties(), usePropertyById(), useCreateProperty(),
 *         useUpdateProperty(), useDeleteProperty()
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { createWrapper } from "@/test/test-utils";
import {
  useProperties,
  usePropertyById,
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
} from "@/features/properties/hooks/useProperties";
import { mockPropertiesList, mockProperty } from "@/test/mocks/fixtures";

const BASE = "http://localhost:3000/api/v1";

describe("useProperties()", () => {
  it("memuat daftar properti berhasil", async () => {
    const { result } = renderHook(() => useProperties(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.properties).toHaveLength(mockPropertiesList.length);
    expect(result.current.data?.properties[0].property_name).toBe("Kos Anggrek");
  });

  it("status loading saat fetching", () => {
    const { result } = renderHook(() => useProperties(), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });

  it("isError = true saat API gagal", async () => {
    server.use(
      http.get(`${BASE}/properties`, () =>
        HttpResponse.json({ error: "Server Error" }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useProperties(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("mengirim parameter search", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/properties`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], pagination: null });
      })
    );
    const { result } = renderHook(() => useProperties("anggrek", 1, 20), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain("search=anggrek");
  });
});

describe("usePropertyById()", () => {
  it("memuat properti by ID berhasil", async () => {
    const { result } = renderHook(() => usePropertyById("prop-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("prop-1");
    expect(result.current.data?.property_name).toBe("Kos Anggrek");
  });

  it("tidak fetch saat id = undefined", () => {
    const { result } = renderHook(() => usePropertyById(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("isError = true saat tidak ditemukan", async () => {
    server.use(
      http.get(`${BASE}/properties/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    const { result } = renderHook(() => usePropertyById("tidak-ada"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCreateProperty()", () => {
  it("mutation berhasil membuat properti", async () => {
    const { result } = renderHook(() => useCreateProperty(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      property_name: "Kos Baru",
      address: "Jl. Baru No.1",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("prop-new");
  });

  it("mutation gagal saat API error", async () => {
    server.use(
      http.post(`${BASE}/properties`, () =>
        HttpResponse.json({ error: "Bad Request" }, { status: 400 })
      )
    );
    const { result } = renderHook(() => useCreateProperty(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ property_name: "", address: "" });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUpdateProperty()", () => {
  it("mutation berhasil mengupdate properti", async () => {
    const { result } = renderHook(() => useUpdateProperty(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: "prop-1",
      payload: { property_name: "Kos Anggrek Updated" },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.property_name).toBe("Kos Anggrek Updated");
  });
});

describe("useDeleteProperty()", () => {
  it("mutation berhasil menghapus properti", async () => {
    const { result } = renderHook(() => useDeleteProperty(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("prop-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("mutation gagal saat properti tidak ditemukan", async () => {
    server.use(
      http.delete(`${BASE}/properties/:id`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    const { result } = renderHook(() => useDeleteProperty(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("tidak-ada");
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
