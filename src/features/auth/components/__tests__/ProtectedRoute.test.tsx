/**
 * Component tests — features/auth/components/ProtectedRoute.tsx
 * Cover: loading state, unauthenticated redirect, authorized access,
 *         unauthorized role redirect, account disabled redirect
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import React from "react";

// Mock ContentSkeleton
vi.mock("@/shared/components/ui/ContentSkeleton", () => ({
  ContentSkeleton: () => <div data-testid="content-skeleton">Loading...</div>,
}));

// Mock sonner toast
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

let mockAuthState = {
  user: null as any,
  role: null as any,
  isLoading: false,
  error: null as any,
  profile: null as any,
};

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => mockAuthState,
}));

async function importProtectedRoute() {
  const { ProtectedRoute } = await import("@/features/auth/components/ProtectedRoute");
  return ProtectedRoute;
}

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        <Route path="/dashboard" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("menampilkan skeleton saat isLoading = true", async () => {
    mockAuthState = { user: null, role: null, isLoading: true, error: null, profile: null };
    const ProtectedRoute = await importProtectedRoute();
    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByTestId("content-skeleton")).toBeInTheDocument();
  });

  it("redirect ke /login saat user = null dan tidak loading", async () => {
    mockAuthState = { user: null, role: null, isLoading: false, error: null, profile: null };
    const ProtectedRoute = await importProtectedRoute();
    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("menampilkan children saat user authenticated dan tidak ada role restriction", async () => {
    mockAuthState = {
      user: { id: "u1", email: "op@test.com", role: "operator" },
      role: "operator",
      isLoading: false,
      error: null,
      profile: null,
    };
    const ProtectedRoute = await importProtectedRoute();
    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("menampilkan children saat user operator dengan allowedRoles=['operator']", async () => {
    mockAuthState = {
      user: { id: "u1", email: "op@test.com", role: "operator" },
      role: "operator",
      isLoading: false,
      error: null,
      profile: null,
    };
    const ProtectedRoute = await importProtectedRoute();
    renderWithRouter(
      <ProtectedRoute allowedRoles={["operator"]}>
        <div>Operator Only Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("Operator Only Content")).toBeInTheDocument();
  });

  it("redirect ke /unauthorized saat viewer akses halaman operator-only", async () => {
    mockAuthState = {
      user: { id: "u2", email: "viewer@test.com", role: "viewer" },
      role: "viewer",
      isLoading: false,
      error: null,
      profile: null,
    };
    const ProtectedRoute = await importProtectedRoute();
    renderWithRouter(
      <ProtectedRoute allowedRoles={["operator"]}>
        <div>Operator Only Content</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText("Operator Only Content")).not.toBeInTheDocument();
    expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
  });

  it("redirect ke /login saat akun dinonaktifkan (account_disabled)", async () => {
    mockAuthState = {
      user: null,
      role: null,
      isLoading: false,
      error: new Error("account_disabled"),
      profile: null,
    };
    const ProtectedRoute = await importProtectedRoute();
    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
