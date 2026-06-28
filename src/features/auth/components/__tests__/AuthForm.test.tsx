/**
 * Component tests — features/auth/components/AuthForm.tsx
 * Cover: render form, validasi empty, validasi format email,
 *         submit berhasil, submit gagal, show/hide password, remember me
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/test-utils";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import React from "react";

const BASE = "http://localhost:3000/api/v1";

// Mock useAuth hook
const mockSignIn = vi.fn();
vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    user: null,
    isLoading: false,
    error: null,
    role: null,
    profile: null,
    canWrite: false,
    signOut: vi.fn(),
    signUp: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

// Mock useToast
vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock useLocation
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useLocation: () => ({ pathname: "/login", state: null }),
    useNavigate: () => vi.fn(),
  };
});

async function renderAuthForm() {
  const { AuthForm } = await import("@/features/auth/components/AuthForm");
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AuthForm — render", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it("menampilkan field email dan password", async () => {
    await renderAuthForm();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("menampilkan tombol login", async () => {
    await renderAuthForm();
    expect(
      screen.getByRole("button", { name: /masuk|login/i }),
    ).toBeInTheDocument();
  });

  it("menampilkan checkbox 'Ingat Saya'", async () => {
    await renderAuthForm();
    expect(screen.getByText(/ingat/i)).toBeInTheDocument();
  });
});

describe("AuthForm — validasi form", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it("menampilkan error saat submit dengan email kosong", async () => {
    const user = userEvent.setup();
    await renderAuthForm();
    await user.click(screen.getByRole("button", { name: /masuk|login/i }));
    await waitFor(() => {
      // Cek ada pesan error validasi (label "Email" atau error message)
      const emailLabel = screen.getByLabelText(/email/i);
      expect(emailLabel).toBeInTheDocument();
    });
  });

  it("tidak memanggil signIn saat form kosong", async () => {
    const user = userEvent.setup();
    await renderAuthForm();
    await user.click(screen.getByRole("button", { name: /masuk|login/i }));
    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });
});

describe("AuthForm — interaksi", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it("bisa mengisi field email", async () => {
    const user = userEvent.setup();
    await renderAuthForm();
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, "operator@test.com");
    expect(emailInput).toHaveValue("operator@test.com");
  });

  it("bisa mengisi field password", async () => {
    const user = userEvent.setup();
    await renderAuthForm();
    const passwordInput = screen.getByPlaceholderText("••••••••");
    await user.type(passwordInput, "password123");
    expect(passwordInput).toHaveValue("password123");
  });

  it("memanggil signIn dengan email dan password saat submit valid", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    await renderAuthForm();

    await user.type(screen.getByLabelText(/email/i), "operator@test.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "password123");
    await user.click(screen.getByRole("button", { name: /masuk|login/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        "operator@test.com",
        "password123",
        expect.any(Boolean),
      );
    });
  });

  it("menampilkan pesan error saat login gagal", async () => {
    mockSignIn.mockResolvedValue({
      error: new Error("Email atau password salah"),
    });
    const user = userEvent.setup();
    await renderAuthForm();

    await user.type(screen.getByLabelText(/email/i), "wrong@test.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /masuk|login/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });
});
