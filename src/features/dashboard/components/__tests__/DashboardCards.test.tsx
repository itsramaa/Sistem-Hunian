/**
 * Component tests — features/dashboard/components/DashboardCards.tsx
 * Cover: SummaryCard — render label, value, loading state, onClick
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SummaryCard } from "@/features/dashboard/components/DashboardCards";
import React from "react";

describe("SummaryCard", () => {
  const defaultProps = {
    label: "Total Kamar",
    value: 18,
    icon: <span data-testid="icon">🏠</span>,
    bgClass: "bg-primary/10",
    isLoading: false,
  };

  it("menampilkan label", () => {
    render(<SummaryCard {...defaultProps} />);
    expect(screen.getByText("Total Kamar")).toBeInTheDocument();
  });

  it("menampilkan value angka", () => {
    render(<SummaryCard {...defaultProps} />);
    expect(screen.getByText("18")).toBeInTheDocument();
  });

  it("menampilkan 0 saat value = undefined", () => {
    render(<SummaryCard {...defaultProps} value={undefined} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("menampilkan skeleton saat isLoading = true", () => {
    const { container } = render(
      <SummaryCard {...defaultProps} isLoading={true} />
    );
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByText("18")).not.toBeInTheDocument();
  });

  it("menampilkan icon", () => {
    render(<SummaryCard {...defaultProps} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("memanggil onClick saat diklik", () => {
    const onClick = vi.fn();
    render(<SummaryCard {...defaultProps} onClick={onClick} />);
    const card = screen.getByText("Total Kamar").closest("div")!;
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("tidak menampilkan cursor-pointer saat tidak ada onClick", () => {
    const { container } = render(<SummaryCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain("cursor-pointer");
  });

  it("menampilkan ring saat accent = true", () => {
    const { container } = render(
      <SummaryCard {...defaultProps} accent={true} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("ring-1");
  });
});
