/**
 * Render-check: pastikan setiap halaman proyek mengembalikan 200 dan memuat
 * elemen kunci saat login. Ini pelengkap click-through untuk verifikasi.
 * Usage: node --env-file=.env.local scripts/test-pages.mjs
 */
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = "http://localhost:3001";
const email = `pf-pages-${Date.now()}@example.com`;
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
  const H = { apikey: anon, Authorization: `Bearer ${s.access_token}`, "Content-Type": "application/json" };
  const p = await (await fetch(`${sbUrl}/rest/v1/projects`, {
    method: "POST", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ user_id: u.id, title: "Halaman Uji", raw_idea: "Ide uji halaman." }),
  })).json();
  const projectId = p[0].id;

  const ref = new URL(sbUrl).hostname.split(".")[0];
  const session = JSON.stringify({
    access_token: s.access_token, refresh_token: s.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + s.expires_in, expires_in: s.expires_in,
    token_type: "bearer", user: s.user,
  });
  const cookie = `sb-${ref}-auth-token=${encodeURIComponent("base64-" + Buffer.from(session).toString("base64"))}`;

  const pages = [
    { path: "/dashboard", needle: "Proyek kamu", auth: true },
    { path: "/settings", needle: "Settings", auth: true },
    { path: "/projects/" + projectId + "/idea", needle: "Tulis idemu", auth: true },
    { path: "/projects/" + projectId + "/clarify", needle: "Klarifikasi", auth: true },
    { path: "/projects/" + projectId + "/prd", needle: "PRD", auth: true },
    { path: "/projects/" + projectId + "/tasks", needle: "Fase dan task", auth: true },
    { path: "/projects/" + projectId + "/export", needle: "Salin ke agent", auth: true },
    // Halaman publik / tamu.
    { path: "/", needle: "PlanForge", auth: false },
    { path: "/login", needle: "Masuk ke workspace", auth: false },
  ];

  let fail = 0;
  for (const pg of pages) {
    const res = await fetch(`${appUrl}${pg.path}`, {
      headers: pg.auth ? { Cookie: cookie } : {},
      redirect: "manual",
    });
    const html = res.status === 200 ? await res.text() : "";
    const ok = res.status === 200 && html.includes(pg.needle);
    if (!ok) fail++;
    console.log(`${ok ? "PASS" : "FAIL"} - ${pg.path} (${res.status}) ${ok ? "" : "tidak memuat: " + pg.needle}`);
  }

  await fetch(`${sbUrl}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: { apikey: service, Authorization: `Bearer ${service}` } });
  console.log(`\n=== ${fail === 0 ? "SEMUA HALAMAN OK" : fail + " GAGAL"} ===`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
