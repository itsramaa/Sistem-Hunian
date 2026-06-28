/**
 * Component tests — features/maintenance/permissions.ts (logic)
 * dan shared/components/ui/ThemeToggle.tsx
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ─── ThemeToggle tests ────────────────────────────────────────────────────────
vi.mock("@/app/providers/theme-provider", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

describe("ThemeToggle", () => {
  it("merender tombol toggle tema", async () => {
    const { ThemeToggle } = await import("@/shared/components/ui/ThemeToggle");
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
