/**
 * Unit tests — shared/utils/breadcrumbUtils.ts
 * Cover: generateBreadcrumbs(), getRoleDashboardLabel()
 */
import { describe, it, expect } from "vitest";
import {
  generateBreadcrumbs,
  getRoleDashboardLabel,
} from "@/shared/utils/breadcrumbUtils";

describe("getRoleDashboardLabel()", () => {
  it("operator → 'Operator'", () => {
    expect(getRoleDashboardLabel("operator")).toBe("Operator");
  });
  it("viewer → 'Viewer'", () => {
    expect(getRoleDashboardLabel("viewer")).toBe("Viewer");
  });
  it("unknown role → 'Dashboard'", () => {
    expect(getRoleDashboardLabel("manager" as any)).toBe("Dashboard");
  });
});

describe("generateBreadcrumbs()", () => {
  it("menghasilkan breadcrumb untuk path /dashboard", () => {
    const crumbs = generateBreadcrumbs("operator", "/dashboard");
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0].label).toBe("Dashboard");
    expect(crumbs[0].path).toBe("/dashboard");
    expect(crumbs[0].isCurrent).toBe(true);
  });

  it("menghasilkan breadcrumb untuk path /properties", () => {
    const crumbs = generateBreadcrumbs("operator", "/properties");
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0].label).toBe("Properti");
  });

  it("menghasilkan breadcrumb untuk path /rooms", () => {
    const crumbs = generateBreadcrumbs("operator", "/rooms");
    expect(crumbs[0].label).toBe("Kamar");
  });

  it("menghasilkan breadcrumb untuk path /tenants", () => {
    const crumbs = generateBreadcrumbs("operator", "/tenants");
    expect(crumbs[0].label).toBe("Penghuni");
  });

  it("menghasilkan breadcrumb untuk path /payments", () => {
    const crumbs = generateBreadcrumbs("operator", "/payments");
    expect(crumbs[0].label).toBe("Pembayaran");
  });

  it("menghasilkan breadcrumb untuk path /maintenance", () => {
    const crumbs = generateBreadcrumbs("operator", "/maintenance");
    expect(crumbs[0].label).toBe("Maintenance");
  });

  it("menghasilkan breadcrumb untuk path /audit", () => {
    const crumbs = generateBreadcrumbs("operator", "/audit");
    expect(crumbs[0].label).toBe("Audit Trail");
  });

  it("menghasilkan breadcrumb nested /tenants/:id dengan label 'Detail'", () => {
    // UUID format harus digunakan untuk trigger 'Detail' label
    const crumbs = generateBreadcrumbs("operator", "/tenants/550e8400-e29b-41d4-a716-446655440000");
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0].label).toBe("Penghuni");
    expect(crumbs[0].isCurrent).toBe(false);
    expect(crumbs[1].label).toBe("Detail");
    expect(crumbs[1].isCurrent).toBe(true);
  });

  it("menghasilkan breadcrumb nested /properties/:id dengan UUID", () => {
    const crumbs = generateBreadcrumbs(
      "operator",
      "/properties/550e8400-e29b-41d4-a716-446655440000"
    );
    expect(crumbs[1].label).toBe("Detail");
  });

  it("menghasilkan breadcrumb untuk path numerik ID", () => {
    const crumbs = generateBreadcrumbs("operator", "/payments/123");
    expect(crumbs[1].label).toBe("Detail");
  });

  it("menangani path dengan leading slash", () => {
    const crumbs = generateBreadcrumbs("operator", "/profile");
    expect(crumbs[0].label).toBe("Profil");
  });

  it("mengembalikan array kosong untuk path root /", () => {
    const crumbs = generateBreadcrumbs("operator", "/");
    expect(crumbs).toHaveLength(0);
  });

  it("menggunakan Title Case untuk segment tidak dikenal", () => {
    const crumbs = generateBreadcrumbs("operator", "/unknown-page");
    expect(crumbs[0].label).toBe("Unknown-page");
  });
});
