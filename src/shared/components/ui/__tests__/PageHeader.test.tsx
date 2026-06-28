/**
 * Component tests — shared/components/ui/PageHeader.tsx
 * Cover: render title, description, icon, children (action buttons)
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Home } from "lucide-react";
import React from "react";

describe("PageHeader", () => {
  it("menampilkan title", () => {
    render(<PageHeader icon={Home} title="Manajemen Properti" />);
    expect(screen.getByText("Manajemen Properti")).toBeInTheDocument();
  });

  it("menampilkan description jika ada", () => {
    render(
      <PageHeader
        icon={Home}
        title="Properti"
        description="Kelola semua properti Anda"
      />
    );
    expect(screen.getByText("Kelola semua properti Anda")).toBeInTheDocument();
  });

  it("tidak menampilkan description jika tidak ada", () => {
    render(<PageHeader icon={Home} title="Properti" />);
    expect(screen.queryByText(/kelola/i)).not.toBeInTheDocument();
  });

  it("menampilkan icon", () => {
    const { container } = render(<PageHeader icon={Home} title="Properti" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("menampilkan children (action buttons)", () => {
    render(
      <PageHeader icon={Home} title="Properti">
        <button>Tambah Properti</button>
      </PageHeader>
    );
    expect(screen.getByRole("button", { name: /tambah properti/i })).toBeInTheDocument();
  });

  it("tidak menampilkan children wrapper jika tidak ada children", () => {
    const { container } = render(<PageHeader icon={Home} title="Properti" />);
    // children wrapper hanya muncul jika children ada
    expect(container.querySelector(".flex.items-center.gap-2.flex-wrap")).not.toBeInTheDocument();
  });

  it("menampilkan h1 dengan text yang benar", () => {
    render(<PageHeader icon={Home} title="Dashboard" />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Dashboard");
  });
});
