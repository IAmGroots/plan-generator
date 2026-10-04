/**
 * Cek koneksi Supabase: auth reachable + tabel ada.
 * Usage: node --env-file=.env.local scripts/test-db.mjs
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("Missing Supabase env di .env.local");
  process.exit(1);
}

// Auth health: endpoint settings harus balas JSON (butuh apikey).
try {
  const res = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  console.log(`Auth settings: ${res.status}`);
  const body = await res.json();
  console.log(
    `  email login: ${body?.external?.email ?? "?"}, google: ${body?.external?.google ?? "?"}`,
  );
} catch (e) {
  console.error("Auth error:", e.message);
}

// Tabel: query projects tanpa sesi harus 200 dengan array kosong (RLS aktif).
try {
  const res = await fetch(`${url}/rest/v1/projects?select=id&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  console.log(`Tabel projects: ${res.status} (200 = ada & RLS aktif)`);
  if (res.status === 404) console.log("  -> tabel belum dibuat, jalankan migrasi");
} catch (e) {
  console.error("REST error:", e.message);
}
