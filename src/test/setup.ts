import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi } from "vitest";
import { server } from "./mocks/server";

// ─── window.location ──────────────────────────────────────────────────────────
// MSW resolves relative URLs from window.location — must stay absolute.
// Also prevents axios 401 interceptor from mutating location during tests.
Object.defineProperty(window, "location", {
  configurable: true,
  writable: true,
  value: {
    href: "http://localhost:3000/dashboard",
    pathname: "/dashboard",
    origin: "http://localhost:3000",
    host: "localhost:3000",
    hostname: "localhost",
    port: "3000",
    protocol: "http:",
    search: "",
    hash: "",
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    toString: () => "http://localhost:3000/dashboard",
  },
});

// Make href setter a no-op so axios redirect doesn't corrupt MSW base URL
Object.defineProperty(window.location, "href", {
  configurable: true,
  get: () => "http://localhost:3000/dashboard",
  set: vi.fn(),
});

// ─── MSW lifecycle ────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

// ─── Browser API mocks ────────────────────────────────────────────────────────
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "sessionStorage", { value: sessionStorageMock });

Object.defineProperty(navigator, "vibrate", {
  writable: true,
  value: vi.fn(),
});

vi.spyOn(console, "warn").mockImplementation(() => {});

// ─── Radix UI browser API polyfills ───────────────────────────────────────────
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
