/**
 * Menjalankan perintah Supabase CLI terhadap database memakai SUPABASE_DB_URL
 * dari .env.local, sehingga tidak perlu proses `supabase link`.
 * Usage: node scripts/db.mjs <push|dry|list|repair> [args...]
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readDbUrl() {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  const line = raw
    .split(/\r?\n/)
    .find((l) => l.startsWith("SUPABASE_DB_URL="));
  if (!line) {
    console.error("SUPABASE_DB_URL tidak ditemukan di .env.local");
    process.exit(1);
  }
  return line.slice("SUPABASE_DB_URL=".length).trim();
}

const dbUrl = readDbUrl();
const [cmd, ...rest] = process.argv.slice(2);

const map = {
  push: ["db", "push"],
  dry: ["db", "push", "--dry-run"],
  list: ["migration", "list"],
  repair: ["migration", "repair"],
};

if (!cmd || !map[cmd]) {
  console.error("Perintah: push | dry | list | repair");
  process.exit(1);
}

const args = [...map[cmd], ...rest, "--db-url", dbUrl];
const res = spawnSync("npx", ["supabase", ...args], {
  stdio: "inherit",
  cwd: root,
  shell: process.platform === "win32",
});

process.exit(res.status ?? 1);
