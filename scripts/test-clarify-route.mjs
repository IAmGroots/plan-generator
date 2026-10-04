/**
 * Uji route /api/ai/clarify end-to-end: buat user + proyek di Supabase,
 * ambil cookie sesi Supabase, lalu panggil route di dev server.
 * Usage: node --env-file=.env.local scripts/test-clarify-route.mjs
 */
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = "http://localhost:3001";
const email = `pf-clarify-${Date.now()}@example.com`;
const password = "test-password-123";

async function main() {
  // 1. Buat user terkonfirmasi.
  const u = await (
    await fetch(`${sbUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, email_confirm: true }),
    })
  ).json();

  // 2. Login untuk sesi.
  const s = await (
    await fetch(`${sbUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  ).json();

  // 3. Buat proyek dengan ide.
  const p = await (
    await fetch(`${sbUrl}/rest/v1/projects`, {
      method: "POST",
      headers: { apikey: anon, Authorization: `Bearer ${s.access_token}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ user_id: u.id, title: "Kasir UMKM", raw_idea: "Aplikasi kasir sederhana untuk UMKM: cetak struk dan lacak stok barang." }),
    })
  ).json();
  const projectId = p[0].id;
  console.log(`user+project siap, projectId: ${projectId}`);

  // 4. Susun cookie sesi Supabase (format @supabase/ssr).
  const ref = new URL(sbUrl).hostname.split(".")[0];
  const session = JSON.stringify({
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + s.expires_in,
    expires_in: s.expires_in,
    token_type: "bearer",
    user: s.user,
  });
  const cookieName = `sb-${ref}-auth-token`;
  const cookie = `${cookieName}=${encodeURIComponent("base64-" + Buffer.from(session).toString("base64"))}`;

  // 5. Panggil route.
  const res = await fetch(`${appUrl}/api/ai/clarify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ projectId }),
  });
  console.log(`route status: ${res.status}`);
  const body = await res.json();
  console.log("respons:", JSON.stringify(body).slice(0, 400));

  // 6. Cek pesan tersimpan.
  const msgs = await (
    await fetch(`${sbUrl}/rest/v1/clarify_messages?select=role,content&project_id=eq.${projectId}`, {
      headers: { apikey: anon, Authorization: `Bearer ${s.access_token}` },
    })
  ).json();
  console.log(`pesan tersimpan: ${msgs.length}`);
  const proj = await (
    await fetch(`${sbUrl}/rest/v1/projects?select=status&id=eq.${projectId}`, {
      headers: { apikey: anon, Authorization: `Bearer ${s.access_token}` },
    })
  ).json();
  console.log(`status proyek: ${proj[0]?.status}`);

  // 7. Cleanup.
  await fetch(`${sbUrl}/auth/v1/admin/users/${u.id}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  console.log("cleanup: selesai");
}

main().catch((e) => console.error("ERROR:", e.message));
