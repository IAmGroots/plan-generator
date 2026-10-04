/**
 * Uji alur proyek secara end-to-end lewat REST Supabase, memakai service role.
 * Membuat user tes, login, lalu create/list/delete project.
 * Usage: node --env-file=.env.local scripts/test-projects.mjs
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = `planforge-test-${Date.now()}@example.com`;
const password = "test-password-123";

const authHeaders = (token) => ({
  apikey: anon,
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

async function main() {
  // 1. Buat user terkonfirmasi lewat admin API.
  const createRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  console.log(`buat user: ${createRes.status}`);
  const user = await createRes.json();
  if (!user.id) {
    console.log(JSON.stringify(user).slice(0, 300));
    return;
  }

  // 2. Login untuk dapat token user.
  const loginRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const session = await loginRes.json();
  console.log(`login: ${loginRes.status}, ada token: ${!!session.access_token}`);
  const token = session.access_token;

  // 3. Buat proyek.
  const insRes = await fetch(`${url}/rest/v1/projects`, {
    method: "POST",
    headers: { ...authHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: user.id,
      title: "Proyek tes",
      raw_idea: "Ide untuk pengujian alur.",
    }),
  });
  const inserted = await insRes.json();
  console.log(`insert project: ${insRes.status}, id: ${inserted?.[0]?.id ?? "-"}`);
  const projectId = inserted?.[0]?.id;

  // 4. List proyek.
  const listRes = await fetch(`${url}/rest/v1/projects?select=id,title`, {
    headers: authHeaders(token),
  });
  const list = await listRes.json();
  console.log(`list projects: ${listRes.status}, jumlah: ${list.length}`);

  // 5. Cek trigger profil otomatis.
  const profRes = await fetch(
    `${url}/rest/v1/profiles?select=id,email&id=eq.${user.id}`,
    { headers: authHeaders(token) },
  );
  const prof = await profRes.json();
  console.log(`profil otomatis: ${profRes.status}, ada: ${prof.length === 1}`);

  // 6. Hapus proyek (uji cascade + RLS delete).
  if (projectId) {
    const delRes = await fetch(`${url}/rest/v1/projects?id=eq.${projectId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    console.log(`delete project: ${delRes.status}`);
  }

  // 7. Bersihkan user tes.
  await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  console.log("cleanup user: selesai");
}

main().catch((e) => console.error("ERROR:", e.message));
