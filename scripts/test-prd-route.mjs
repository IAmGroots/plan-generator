/**
 * Uji route /api/ai/prd end-to-end: buat user + proyek + pesan klarifikasi,
 * lalu panggil route PRD dan validasi hasil tersimpan.
 * Usage: node --env-file=.env.local scripts/test-prd-route.mjs
 */
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = "http://localhost:3001";
const email = `pf-prd-${Date.now()}@example.com`;
const password = "test-password-123";

async function main() {
  const u = await (
    await fetch(`${sbUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, email_confirm: true }),
    })
  ).json();

  const s = await (
    await fetch(`${sbUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  ).json();

  const authHeaders = { apikey: anon, Authorization: `Bearer ${s.access_token}`, "Content-Type": "application/json" };

  const p = await (
    await fetch(`${sbUrl}/rest/v1/projects`, {
      method: "POST",
      headers: { ...authHeaders, Prefer: "return=representation" },
      body: JSON.stringify({ user_id: u.id, title: "Kasir UMKM", raw_idea: "Aplikasi kasir sederhana untuk UMKM: cetak struk dan lacak stok." }),
    })
  ).json();
  const projectId = p[0].id;

  // Seed satu pesan klarifikasi (assistant + user answer) agar PRD punya konteks.
  await fetch(`${sbUrl}/rest/v1/clarify_messages`, {
    method: "POST",
    headers: { ...authHeaders, Prefer: "return=representation" },
    body: JSON.stringify([
      { project_id: projectId, role: "assistant", content: JSON.stringify({ questions: ["Siapa pengguna utama?", "Platform apa?"] }) },
      { project_id: projectId, role: "user", content: "Pemilik warung dan toko kelontong\n\nWeb dulu, mobile menyusul" },
    ]),
  });

  const ref = new URL(sbUrl).hostname.split(".")[0];
  const session = JSON.stringify({
    access_token: s.access_token, refresh_token: s.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + s.expires_in, expires_in: s.expires_in,
    token_type: "bearer", user: s.user,
  });
  const cookie = `sb-${ref}-auth-token=${encodeURIComponent("base64-" + Buffer.from(session).toString("base64"))}`;

  const res = await fetch(`${appUrl}/api/ai/prd`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ projectId }),
  });
  console.log(`route status: ${res.status}`);
  const body = await res.json();
  console.log(`hasil: title="${body.title}", goals=${body.goals?.length}, features=${body.features?.length}, personas=${body.personas?.length}`);
  console.log(`tech_stack: ${JSON.stringify(body.tech_stack)}`);
  console.log(`non_goals: ${body.non_goals?.length}`);

  const prds = await (
    await fetch(`${sbUrl}/rest/v1/prds?select=title,project_id&project_id=eq.${projectId}`, { headers: authHeaders })
  ).json();
  console.log(`PRD tersimpan: ${prds.length}`);
  const proj = await (
    await fetch(`${sbUrl}/rest/v1/projects?select=status&id=eq.${projectId}`, { headers: authHeaders })
  ).json();
  console.log(`status proyek: ${proj[0]?.status}`);

  await fetch(`${sbUrl}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: { apikey: service, Authorization: `Bearer ${service}` } });
  console.log("cleanup: selesai");
}

main().catch((e) => console.error("ERROR:", e.message));
