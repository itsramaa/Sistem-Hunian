import { execSync } from "child_process";

/**
 * Playwright Global Setup — Clean + Seed DB sebelum test suite
 *
 * Menjalankan:
 *   1. e2e-clean.sql  → TRUNCATE semua tabel
 *   2. seed-only.sql  → INSERT data seed dev
 *
 * Koneksi langsung ke container Docker sihuni_db via psql pipe.
 */
export default async function globalSetup() {
  const cleanSql = "f:/Coding/golang/Sistem-Hunian-Go/scripts/e2e-clean.sql";
  const seedSql = "f:/Coding/golang/Sistem-Hunian-Go/scripts/seed-only.sql";

  const psql = (file: string) =>
    `Get-Content "${file}" | docker exec -i sihuni_db psql -U sihuni -d sihuni`;

  console.log("\n[global-setup] Membersihkan database...");
  execSync(psql(cleanSql), { stdio: "inherit", shell: "powershell.exe" });

  console.log("[global-setup] Menyemai data seed...");
  execSync(psql(seedSql), { stdio: "inherit", shell: "powershell.exe" });

  console.log("[global-setup] Database siap untuk testing.\n");
}
