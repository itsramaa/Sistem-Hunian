const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'https://sihuni-frontend.vercel.app';
const OUT_DIR = path.resolve(__dirname);

const ROUTES = [
  { path: '/',                        name: '09-home' },
  { path: '/login',                   name: '10-login' },
  { path: '/reset-password',          name: '11-reset-password' },
  { path: '/update-password',         name: '12-update-password' },
  { path: '/unauthorized',            name: '13-unauthorized' },
  { path: '/dashboard',               name: '14-dashboard' },
  { path: '/dashboard/properties',    name: '15-properties' },
  { path: '/dashboard/rooms',         name: '16-rooms' },
  { path: '/dashboard/tenants',       name: '17-tenants' },
  { path: '/dashboard/payments',      name: '18-payments' },
  { path: '/dashboard/confirmations', name: '19-confirmations' },
  { path: '/dashboard/maintenance',   name: '20-maintenance' },
  { path: '/dashboard/audit',         name: '21-audit' },
  { path: '/dashboard/notifications', name: '22-notifications' },
  { path: '/dashboard/profile',       name: '23-profile' },
  { path: '/dashboard/settings',      name: '24-settings' },
  { path: '/merchant',                name: '25-merchant-redirect' },
  { path: '/does-not-exist',          name: '26-404' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();

  const results = [];

  for (const route of ROUTES) {
    const consoleErrors = [];
    const handler = msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); };
    page.on('console', handler);

    try {
      await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1500);
    } catch (e) {
      results.push({ ...route, finalUrl: '(timeout)', title: '', h1: '', errors: [e.message] });
      page.off('console', handler);
      continue;
    }

    const finalUrl = page.url().replace(BASE, '') || '/';
    const title = await page.title().catch(() => '');
    const h1 = await page.evaluate(() => document.querySelector('h1,h2')?.textContent?.trim() || '').catch(() => '');

    const screenshotPath = path.join(OUT_DIR, route.name + '.png');
    await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});

    results.push({ route: route.path, finalUrl, title, h1, errors: [...consoleErrors] });
    page.off('console', handler);

    console.log(`[${consoleErrors.length > 0 ? 'ERR' : ' OK'}] ${route.path.padEnd(35)} → ${finalUrl.padEnd(35)} | ${title}`);
  }

  await browser.close();

  // Write JSON summary
  fs.writeFileSync(path.join(OUT_DIR, 'route-results.json'), JSON.stringify(results, null, 2));
  console.log('\nDone. Results saved to route-results.json');
})();
