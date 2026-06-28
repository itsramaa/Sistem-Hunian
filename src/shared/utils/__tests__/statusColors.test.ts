/**
 * Unit tests — shared/utils/statusColors.ts
 * Cover: getSiHuniStatus() untuk semua domain status SiHuni
 */
import { describe, it, expect } from "vitest";
import { getSiHuniStatus } from "@/shared/utils/statusColors";

describe("getSiHuniStatus() — Room status", () => {
  it("available → label Tersedia", () => expect(getSiHuniStatus("available").label).toBe("Tersedia"));
  it("dp_confirmation → label Konfirmasi DP", () => expect(getSiHuniStatus("dp_confirmation").label).toBe("Konfirmasi DP"));
  it("occupied → label Terisi", () => expect(getSiHuniStatus("occupied").label).toBe("Terisi"));
});

describe("getSiHuniStatus() — Tenant status", () => {
  it("active → label Aktif", () => expect(getSiHuniStatus("active").label).toBe("Aktif"));
  it("checked_out → label Checkout", () => expect(getSiHuniStatus("checked_out").label).toBe("Checkout"));
});

describe("getSiHuniStatus() — Payment status", () => {
  it("paid → label Lunas", () => expect(getSiHuniStatus("paid").label).toBe("Lunas"));
  it("unpaid → label Belum Bayar", () => expect(getSiHuniStatus("unpaid").label).toBe("Belum Bayar"));
  it("overdue → label Jatuh Tempo", () => expect(getSiHuniStatus("overdue").label).toBe("Jatuh Tempo"));
});

describe("getSiHuniStatus() — Confirmation (DP) status", () => {
  it("pending → label Pending", () => expect(getSiHuniStatus("pending").label).toBe("Pending"));
  it("confirmed → label Dikonfirmasi", () => expect(getSiHuniStatus("confirmed").label).toBe("Dikonfirmasi"));
  it("expired → label Kedaluwarsa", () => expect(getSiHuniStatus("expired").label).toBe("Kedaluwarsa"));
});

describe("getSiHuniStatus() — Maintenance status", () => {
  it("reported → label Dilaporkan", () => expect(getSiHuniStatus("reported").label).toBe("Dilaporkan"));
  it("in_progress → label Diproses", () => expect(getSiHuniStatus("in_progress").label).toBe("Diproses"));
  it("completed → label Selesai", () => expect(getSiHuniStatus("completed").label).toBe("Selesai"));
});

describe("getSiHuniStatus() — fallback", () => {
  it("status tidak dikenal → kembalikan label sama dengan status", () => {
    const result = getSiHuniStatus("unknown_status");
    expect(result.label).toBe("unknown_status");
    expect(result.className).toBe("bg-muted text-muted-foreground border-border");
  });
});
