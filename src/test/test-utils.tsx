/**
 * Test utilities — wrapper untuk React Query dan Auth context
 */
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { UserProfile } from "@/features/auth/types/auth";
import { mockOperatorProfile, mockViewerProfile } from "./mocks/fixtures";

// Buat QueryClient baru untuk setiap test (isolasi cache)
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper dengan QueryClientProvider
export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

// Custom render dengan providers
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const queryClient = createTestQueryClient();
  const Wrapper = createWrapper(queryClient);
  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

// Helper: set token di localStorage untuk simulate authenticated state
export function setAuthToken(token = "mock-jwt-token-abc123") {
  localStorage.setItem("sihuni_access_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("sihuni_access_token");
  sessionStorage.removeItem("sihuni_access_token");
}

// Helper: get profile fixture by role
export function getProfileByRole(role: "operator" | "viewer"): UserProfile {
  return role === "operator" ? mockOperatorProfile : mockViewerProfile;
}
