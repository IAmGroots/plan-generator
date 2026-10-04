/**
 * Uji endpoint model & alur pemilihan model per user.
 * Usage: node --env-file=.env.local scripts/test-models.mjs
 */
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = "http://localhost:3001";
const email = `pf-model-${Date.now()}@example.com`;
const password = "test-password-123";

let fail = 0;
const check = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? "PASS" : "FAIL"} - ${msg}`); };

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

  const ref = new URL(sbUrl).hostname.split(".")[0];
  const session = JSON.stringify({
    access_token: s.access_token, refresh_token: s.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + s.expires_in, expires_in: s.expires_in,
    token_type: "bearer", user: s.user,
  });
  const cookie = `sb-${ref}-auth-token=${encodeURIComponent("base64-" + Buffer.from(session).toString("base64"))}`;

  // 1. Endpoint models.
  const res = await fetch(`${appUrl}/api/ai/models`, { headers: { Cookie: cookie } });
  check(res.status === 200, `GET /api/ai/models -> ${res.status}`);
  const body = await res.json();
  check(Array.isArray(body.models) && body.models.length > 100, `daftar model terisi (${body.models?.length})`);
  const sample = body.models?.[0];
  check(sample && "id" in sample && "owned_by" in sample && "reasoning" in sample, "bentuk model {id, owned_by, reasoning}");

  // 2. Simpan model valid ke profiles.
  const validModel = "groq/openai/gpt-oss-120b";
  let upd = await fetch(`${sbUrl}/rest/v1/profiles?id=eq.${u.id}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ ai_model: validModel }),
  });
  let prof = await (await fetch(`${sbUrl}/rest/v1/profiles?select=ai_model&id=eq.${u.id}`, { headers: H })).json();
  // Kolom belum ada jika migrasi 0003 belum dijalankan.
  if (prof[0]?.ai_model === undefined) {
    console.log("SKIP - kolom ai_model belum ada (jalankan migrasi 0003 dulu)");
  } else {
    check(prof[0].ai_model === validModel, `model tersimpan di profil (${prof[0].ai_model})`);
  }

  await fetch(`${sbUrl}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: { apikey: service, Authorization: `Bearer ${service}` } });
  console.log(`\n=== ${fail === 0 ? "SEMUA LOLOS" : fail + " GAGAL"} ===`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
