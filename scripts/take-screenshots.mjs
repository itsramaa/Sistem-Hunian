import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const BASE_URL = "http://localhost:8080";
const OUTPUT_DIR = "f:\\Collage\\Skripsi\\TA\\Implementasi";
const CREDS = { email: "operator@sihuni.dev", password: "sihuni123" };

async function login(page) {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill(CREDS.email);
    await page.locator("#password").fill(CREDS.password);
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForURL("**/dashboard**", { timeout: 25000 });
    await page.waitForLoadState("networkidle");
}

async function shot(page, filename) {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const filepath = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`✓ ${filename}`);
}

async function openDialog(page, btnPattern) {
    const btn = page.getByRole("button", { name: btnPattern }).first();
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1500);
        return true;
    }
    return false;
}

async function clickFirst(page, selector) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 5000 }).catch(() => false)) {
        await el.click();
        await page.waitForTimeout(700);
        return true;
    }
    return false;
}

async function main() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await login(page);
    console.log("Login OK\n");

    // ── 04 - Formulir Properti ──────────────────────────────────────
    await page.goto(`${BASE_URL}/dashboard/properties`);
    await page.waitForLoadState("networkidle");
    await openDialog(page, /tambah properti/i);
    await shot(page, "04_Formulir Properti.png");

    // tutup dialog / navigate away
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    // ── 05 - Detail Properti ────────────────────────────────────────
    await page.goto(`${BASE_URL}/dashboard/properties`);
    await page.waitForLoadState("networkidle");
    // klik baris properti pertama
    const propRow = page.locator("table tbody tr").first();
    if (await propRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await propRow.click();
        await page.waitForLoadState("networkidle");
    }
    await shot(page, "05_Detail Properti.png");

    // ── 07 - Formulir Kamar ─────────────────────────────────────────
    await page.goto(`${BASE_URL}/dashboard/rooms`);
    await page.waitForLoadState("networkidle");
    await openDialog(page, /tambah kamar/i);
    await shot(page, "07_Formulir Kamar.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    // ── 08 - Detail Kamar ───────────────────────────────────────────
    await page.goto(`${BASE_URL}/dashboard/rooms`);
    await page.waitForLoadState("networkidle");
    const roomRow = page.locator("table tbody tr").first();
    if (await roomRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await roomRow.click();
        await page.waitForLoadState("networkidle");
    }
    await shot(page, "08_Detail Kamar.png");

    // ── 10 - Formulir Penghuni ──────────────────────────────────────
    await page.goto(`${BASE_URL}/dashboard/tenants`);
    await page.waitForLoadState("networkidle");
    await openDialog(page, /tambah penghuni/i);
    await shot(page, "10_Formulir Penghuni.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    // ── 11 - Formulir Checkout ──────────────────────────────────────
    await page.goto(`${BASE_URL}/dashboard/tenants`);
    await page.waitForLoadState("networkidle");
    // cari tombol checkout di baris pertama
    const checkoutBtn = page.getByRole("button", { name: /checkout/i }).first();
    if (await checkoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await checkoutBtn.click();
        await page.waitForTimeout(1500);
        await shot(page, "11_Formulir Checkout.png");
        await page.keyboard.press("Escape");
    } else {
        // fallback: buka menu aksi baris pertama
        const menuBtn = page.locator("table tbody tr").first().getByRole("button").first();
        if (await menuBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await menuBtn.click();
            await page.waitForTimeout(1000);
            const coBtn = page.getByRole("menuitem", { name: /checkout/i }).first();
            if (await coBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                await coBtn.click();
                await page.waitForTimeout(1500);
                await shot(page, "11_Formulir Checkout.png");
                await page.keyboard.press("Escape");
            }
        }
    }

    // ── 12 - Detail Penghuni ────────────────────────────────────────
    await page.goto(`${BASE_URL}/dashboard/tenants`);
    await page.waitForLoadState("networkidle");
    const tenantRow = page.locator("table tbody tr").first();
    if (await tenantRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await tenantRow.click();
        await page.waitForLoadState("networkidle");
    }
    await shot(page, "12_Detail Penghuni.png");

    // ── 14 - Formulir Pembayaran ────────────────────────────────────
    await page.goto(`${BASE_URL}/dashboard/payments`);
    await page.waitForLoadState("networkidle");
    await openDialog(page, /tambah|catat pembayaran/i);
    await shot(page, "14_Formulir Pembayaran.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    // ── 15 - Detail Pembayaran ──────────────────────────────────────
    await page.goto(`${BASE_URL}/dashboard/payments`);
    await page.waitForLoadState("networkidle");
    const payRow = page.locator("table tbody tr").first();
    if (await payRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await payRow.click();
        await page.waitForLoadState("networkidle");
    }
    await shot(page, "15_Detail Pembayaran.png");

    // ── 17 - Formulir Konfirmasi Calon Penghuni ─────────────────────
    await page.goto(`${BASE_URL}/dashboard/confirmations`);
    await page.waitForLoadState("networkidle");
    await openDialog(page, /catat konfirmasi dp/i);
    await shot(page, "17_Formulir Konfirmasi Calon Penghuni.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    // ── 18 - Formulir Konfirmasi Down Payment ───────────────────────
    await page.goto(`${BASE_URL}/dashboard/confirmations`);
    await page.waitForLoadState("networkidle");
    const konfirmMasukBtn = page.getByRole("button", { name: /konfirmasi masuk/i }).first();
    if (await konfirmMasukBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await konfirmMasukBtn.click();
        await page.waitForTimeout(1500);
        await shot(page, "18_Formulir Konfirmasi Down Payment.png");
        await page.keyboard.press("Escape");
        await page.waitForTimeout(1000);
    }

    // ── 19 - Formulir Perpanjang Batas Konfirmasi ───────────────────
    await page.goto(`${BASE_URL}/dashboard/confirmations`);
    await page.waitForLoadState("networkidle");
    const perpanjangBtn = page.getByRole("button", { name: /perpanjang|extend/i }).first();
    if (await perpanjangBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await perpanjangBtn.click();
        await page.waitForTimeout(1500);
        await shot(page, "19_Formulir Perpanjang Batas Konfirmasi.png");
        await page.keyboard.press("Escape");
    } else {
        // fallback: buka menu aksi baris pertama
        const menuBtn2 = page.locator("table tbody tr button").first();
        if (await menuBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
            await menuBtn2.click();
            await page.waitForTimeout(1000);
            const extBtn = page.getByRole("menuitem", { name: /perpanjang|extend/i }).first();
            if (await extBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                await extBtn.click();
                await page.waitForTimeout(1500);
                await shot(page, "19_Formulir Perpanjang Batas Konfirmasi.png");
                await page.keyboard.press("Escape");
            }
        }
    }

    // ── 21 - Formulir Laporan Kerusakan ────────────────────────────
    await page.goto(`${BASE_URL}/dashboard/maintenance`);
    await page.waitForLoadState("networkidle");
    await openDialog(page, /lapor|tambah|laporkan/i);
    await shot(page, "21_Formulir Laporan Kerusakan.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    // ── 22 - Detail Pemeliharaan ────────────────────────────────────
    await page.goto(`${BASE_URL}/dashboard/maintenance`);
    await page.waitForLoadState("networkidle");
    const maintRow = page.locator("table tbody tr").first();
    if (await maintRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await maintRow.click();
        await page.waitForLoadState("networkidle");
    }
    await shot(page, "22_Detail Pemeliharaan.png");

    // ── 25 - Profil ─────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/dashboard/profile`);
    await page.waitForLoadState("networkidle");
    await shot(page, "25_Profil.png");

    await browser.close();
    console.log("\nSemua screenshot selesai!");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
