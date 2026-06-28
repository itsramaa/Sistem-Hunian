/**
 * Component tests — shared/components/ui/StatCard.tsx
 * Cover: loading skeleton, render value, title, subtitle, tooltip
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/shared/components/ui/StatCard";
import { Home } from "lucide-react";
import React from "react";

describe("StatCard", () => {
  it("menampilkan skeleton saat loading = true", () => {
    const { container } = render(
      <StatCard title="Total Properti" value={5} icon={Home} loading={true} />
    );
    expect(container.querySelector(".animate-fade-in")).toBeInTheDocument();
  });

  it("menampilkan title", () => {
    render(<StatCard title="Total Properti" value={5} icon={Home} />);
    expect(screen.getByText("Total Properti")).toBeInTheDocument();
  });

  it("menampilkan string value langsung", () => {
    render(<StatCard title="Revenue" value="Rp 15.000.000" icon={Home} />);
    expect(screen.getByText("Rp 15.000.000")).toBeInTheDocument();
  });

  it("menampilkan subtitle jika ada", () => {
    render(
      <StatCard
        title="Total Kamar"
        value={18}
        subtitle="10 terisi"
        icon={Home}
      />
    );
    expect(screen.getByText("10 terisi")).toBeInTheDocument();
  });

  it("tidak menampilkan subtitle jika tidak ada", () => {
    render(<StatCard title="Total Kamar" value={18} icon={Home} />);
    expect(screen.queryByText(/terisi/i)).not.toBeInTheDocument();
  });

  it("menampilkan icon", () => {
    const { container } = render(
      <StatCard title="Total" value={1} icon={Home} />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
