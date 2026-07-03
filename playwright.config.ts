import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 90000,
  expect: { timeout: 15000 },
  // Urutan file dijalankan sesuai nama: KF-01 → KF-14 → NFR-01 → NFR-02
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    [
      "html",
      {
        outputFolder: "playwright-report",
        open: "never",
        title: "Laporan Pengujian E2E — Sistem Hunian V2",
      },
    ],
    [
      "@kinosuke01/playwright-md-reporter",
      {
        outputFile: "docs/testing/test-report.md",
        includeDate: true,
        includeDuration: true,
        includeError: true,
      },
    ],
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:8881",
    trace: "on-first-retry",
    screenshot: "on",
    video: "off",
    headless: true,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
      // Urutan file: KF-01..KF-14 dulu, lalu NFR-01..NFR-03
      testMatch: [
        "**/KF-01-*.spec.ts",
        "**/KF-02-*.spec.ts",
        "**/KF-03-*.spec.ts",
        "**/KF-04-*.spec.ts",
        "**/KF-05-*.spec.ts",
        "**/KF-06-*.spec.ts",
        "**/KF-07-*.spec.ts",
        "**/KF-08-*.spec.ts",
        "**/KF-09-*.spec.ts",
        "**/KF-10-*.spec.ts",
        "**/KF-11-*.spec.ts",
        "**/KF-12-*.spec.ts",
        "**/KF-13-*.spec.ts",
        "**/KF-14-*.spec.ts",
        "**/NFR-01-*.spec.ts",
        "**/NFR-02-*.spec.ts",
      ],
    },
  ],
  outputDir:
    "f:/Coding/React/Sistem-Hunian-V2/docs/testing/playwright-artifacts",
});
