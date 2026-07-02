import { test } from "@playwright/test";
import { login, saveScreenshot } from "./helpers/auth";

// Run Lighthouse-style perf checks via browser navigation timing
test.describe("Performance Metrics", () => {
  test("AC-PERF: Login page performance metrics", async ({ page }) => {
    const start = Date.now();
    await page.goto("https://sihuni-frontend.vercel.app/login");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - start;

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType("paint");
      const fcp = paint.find(p => p.name === "first-contentful-paint");
      const lcp = (performance.getEntriesByType("largest-contentful-paint") as any);

      return {
        ttfb: Math.round(nav.responseStart - nav.requestStart),
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        loadComplete: Math.round(nav.loadEventEnd - nav.startTime),
        fcp: fcp ? Math.round(fcp.startTime) : null,
        lcp: lcp.length ? Math.round(lcp[lcp.length - 1].startTime) : null,
        transferSize: nav.transferSize,
        encodedBodySize: nav.encodedBodySize,
      };
    });

    await saveScreenshot(page, "perf-login-page");

    console.log("=== PERFORMANCE METRICS: /login ===");
    console.log(JSON.stringify(metrics, null, 2));
    console.log(`Total wall time: ${loadTime}ms`);
  });

  test("AC-PERF: Dashboard performance metrics (Operator)", async ({ page }) => {
    await login(page, "operator");
    const start = Date.now();
    await page.goto("https://sihuni-frontend.vercel.app/dashboard");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - start;

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType("paint");
      const fcp = paint.find(p => p.name === "first-contentful-paint");

      return {
        ttfb: Math.round(nav.responseStart - nav.requestStart),
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        loadComplete: Math.round(nav.loadEventEnd - nav.startTime),
        fcp: fcp ? Math.round(fcp.startTime) : null,
        transferSize: nav.transferSize,
      };
    });

    await saveScreenshot(page, "perf-dashboard-operator");
    console.log("=== PERFORMANCE METRICS: /dashboard ===");
    console.log(JSON.stringify(metrics, null, 2));
    console.log(`Total wall time: ${loadTime}ms`);
  });

  test("AC-PERF: CLS check (layout shifts)", async ({ page }) => {
    await page.goto("https://sihuni-frontend.vercel.app/login");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1000);
      });
    });

    console.log(`=== CLS Score: ${cls.toFixed(4)} (target < 0.1) ===`);
    await saveScreenshot(page, "perf-cls-login");
  });

  test("AC-PERF: Mobile viewport performance", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const start = Date.now();
    await page.goto("https://sihuni-frontend.vercel.app/login");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - start;

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    await saveScreenshot(page, "perf-mobile-login");

    console.log(`=== MOBILE PERF: load=${loadTime}ms, scrollWidth=${bodyWidth}px ===`);
  });
});
