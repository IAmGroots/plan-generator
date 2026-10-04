/**
 * Uji rate limit dengan burst paralel cepat agar window 60s tidak ter-reset.
 * Karena endpoint AI butuh waktu, kita kirim banyak permintaan berbarengan.
 * Usage: node --env-file=.env.local scripts/test-ratelimit.mjs
 */
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = "http://localhost:3001";
const email = `pf-rl-${Date.now()}@example.com`;
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
    body: JSON.stringify({ user_id: u.id, title: "RL", raw_idea: "ide uji" }),
  })).json();
  const projectId = p[0].id;

  const ref = new URL(sbUrl).hostname.split(".")[0];
  const session = JSON.stringify({
    access_token: s.access_token, refresh_token: s.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + s.expires_in, expires_in: s.expires_in,
    token_type: "bearer", user: s.user,
  });
  const cookie = `sb-${ref}-auth-token=${encodeURIComponent("base64-" + Buffer.from(session).toString("base64"))}`;

  // Kirim 33 permintaan paralel: hitungan rate limit terjadi sebelum AI dipanggil,
  // jadi yang menentukan hanya jumlah, bukan waktu respons.
  const reqs = Array.from({ length: 33 }, () =>
    fetch(`${appUrl}/api/ai/clarify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ projectId }),
    }).then((r) => r.status),
  );
  const codes = await Promise.all(reqs);
  const ok = codes.filter((c) => c === 200).length;
  const limited = codes.filter((c) => c === 429).length;
  console.log(`200: ${ok}, 429: ${limited}`);
  console.log(`rate limit 30/menit bekerja: ${limited >= 1 && ok <= 30}`);

  await fetch(`${sbUrl}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: { apikey: service, Authorization: `Bearer ${service}` } });
  console.log("cleanup: selesai");
}

main().catch((e) => console.error("ERROR:", e.message));
