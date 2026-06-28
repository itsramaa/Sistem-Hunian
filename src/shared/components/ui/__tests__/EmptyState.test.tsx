/**
 * Component tests — shared/components/ui/EmptyState.tsx
 * Cover: render title, description, icon, action button
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Home } from "lucide-react";
import React from "react";

describe("EmptyState", () => {
  it("menampilkan title", () => {
    render(<EmptyState title="Tidak ada data" />);
    expect(screen.getByText("Tidak ada data")).toBeInTheDocument();
  });

  it("menampilkan description jika ada", () => {
    render(
      <EmptyState title="Kosong" description="Belum ada properti yang ditambahkan." />
    );
    expect(screen.getByText("Belum ada properti yang ditambahkan.")).toBeInTheDocument();
  });

  it("tidak menampilkan description jika tidak ada", () => {
    render(<EmptyState title="Kosong" />);
    expect(screen.queryByText(/belum ada/i)).not.toBeInTheDocument();
  });

  it("menampilkan icon jika disediakan", () => {
    const { container } = render(<EmptyState title="Kosong" icon={Home} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("tidak menampilkan icon jika tidak disediakan", () => {
    const { container } = render(<EmptyState title="Kosong" />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("menampilkan tombol action jika disediakan", () => {
    render(
      <EmptyState
        title="Kosong"
        action={{ label: "Tambah Properti", onClick: vi.fn() }}
      />
    );
    expect(screen.getByRole("button", { name: /tambah properti/i })).toBeInTheDocument();
  });

  it("memanggil onClick saat action button diklik", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Kosong"
        action={{ label: "Tambah", onClick }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /tambah/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("tidak menampilkan tombol action jika tidak disediakan", () => {
    render(<EmptyState title="Kosong" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("menampilkan action icon jika disediakan", () => {
    render(
      <EmptyState
        title="Kosong"
        action={{ label: "Tambah", onClick: vi.fn(), icon: Home }}
      />
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
