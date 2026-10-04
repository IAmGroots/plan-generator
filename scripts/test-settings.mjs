/**
 * Cek halaman settings memuat tombol kembali dan opsi select.
 * Usage: node --env-file=.env.local scripts/test-settings.mjs
 */
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = "http://localhost:3001";
const email = `pf-set-${Date.now()}@example.com`;
const password = "test-password-123";

async function main() {
  const u = await (await fetch(`${sbUrl}/auth/v1/admin/users`, {
    method: "POST", headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })).json();
  const s = await (await fetch(`${sbUrl}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })).json();

  const ref = new URL(sbUrl).hostname.split(".")[0];
  const session = JSON.stringify({
    access_token: s.access_token, refresh_token: s.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + s.expires_in, expires_in: s.expires_in,
    token_type: "bearer", user: s.user,
  });
  const cookie = `sb-${ref}-auth-token=${encodeURIComponent("base64-" + Buffer.from(session).toString("base64"))}`;

  const res = await fetch(`${appUrl}/settings`, { headers: { Cookie: cookie } });
  const html = await res.text();
  const checks = {
    "status 200": res.status === 200,
    "tombol Kembali ke daftar proyek": html.includes("Kembali"),
    "link ke /dashboard": html.includes('href="/dashboard"'),
    "ada tombol combobox (aria-haspopup)": html.includes('aria-haspopup="listbox"'),
    "label pilih model": html.includes("Pilih model"),
  };
  let fail = 0;
  for (const [k, v] of Object.entries(checks)) { if (!v) fail++; console.log(`${v ? "PASS" : "FAIL"} - ${k}`); }
  console.log(`\n=== ${fail === 0 ? "SEMUA LOLOS" : fail + " GAGAL"} ===`);

  await fetch(`${sbUrl}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: { apikey: service, Authorization: `Bearer ${service}` } });
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
