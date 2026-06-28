/**
 * Component tests — shared/components/ui/TablePagination.tsx
 * Cover: tidak render saat totalPages <= 1, render tombol prev/next,
 *         disable tombol di halaman pertama/terakhir, memanggil onPageChange,
 *         menampilkan info "Showing X to Y of Z"
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TablePagination } from "@/shared/components/ui/TablePagination";
import React from "react";

describe("TablePagination", () => {
  it("tidak merender saat totalPages <= 1", () => {
    const { container } = render(
      <TablePagination
        page={1}
        totalPages={1}
        totalItems={10}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("tidak merender saat totalPages = 0", () => {
    const { container } = render(
      <TablePagination
        page={1}
        totalPages={0}
        totalItems={0}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("merender tombol Previous dan Next saat totalPages > 1", () => {
    render(
      <TablePagination
        page={2}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("menonaktifkan tombol Previous di halaman pertama", () => {
    render(
      <TablePagination
        page={1}
        totalPages={3}
        totalItems={60}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("menonaktifkan tombol Next di halaman terakhir", () => {
    render(
      <TablePagination
        page={3}
        totalPages={3}
        totalItems={60}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("mengaktifkan kedua tombol di halaman tengah", () => {
    render(
      <TablePagination
        page={2}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /previous/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
  });

  it("memanggil onPageChange(page - 1) saat klik Previous", () => {
    const onPageChange = vi.fn();
    render(
      <TablePagination
        page={3}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={onPageChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("memanggil onPageChange(page + 1) saat klik Next", () => {
    const onPageChange = vi.fn();
    render(
      <TablePagination
        page={2}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={onPageChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("menampilkan info 'Showing X to Y of Z items'", () => {
    render(
      <TablePagination
        page={2}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByText(/showing 21 to 40 of 100/i)).toBeInTheDocument();
  });

  it("menampilkan custom itemLabel", () => {
    render(
      <TablePagination
        page={1}
        totalPages={3}
        totalItems={50}
        itemsPerPage={20}
        onPageChange={vi.fn()}
        itemLabel="kamar"
      />
    );
    expect(screen.getByText(/kamar/i)).toBeInTheDocument();
  });

  it("menampilkan Page X of Y", () => {
    render(
      <TablePagination
        page={2}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByText(/page 2 of 5/i)).toBeInTheDocument();
  });

  it("menampilkan item terakhir yang benar di halaman terakhir parsial", () => {
    // 45 items, page 3 of 3, shows 41-45
    render(
      <TablePagination
        page={3}
        totalPages={3}
        totalItems={45}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByText(/showing 41 to 45 of 45/i)).toBeInTheDocument();
  });
});
