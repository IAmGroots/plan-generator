/**
 * Uji route /api/ai/tasks end-to-end: buat user + proyek + PRD, panggil route,
 * lalu cek fase/task tersimpan dan status proyek.
 * Usage: node --env-file=.env.local scripts/test-tasks-route.mjs
 */
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = "http://localhost:3001";
const email = `pf-tasks-${Date.now()}@example.com`;
const password = "test-password-123";

async function main() {
  const u = await (await fetch(`${sbUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })).json();

  const s = await (await fetch(`${sbUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })).json();

  const H = { apikey: anon, Authorization: `Bearer ${s.access_token}`, "Content-Type": "application/json" };

  const p = await (await fetch(`${sbUrl}/rest/v1/projects`, {
    method: "POST", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ user_id: u.id, title: "Kasir UMKM", raw_idea: "Aplikasi kasir UMKM: struk dan stok." }),
  })).json();
  const projectId = p[0].id;

  // Seed PRD.
  await fetch(`${sbUrl}/rest/v1/prds`, {
    method: "POST", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({
      project_id: projectId, title: "Kasir UMKM", one_liner: "Kasir web untuk UMKM.",
      problem: "Pencatatan manual rawan salah.", goals: ["Catat transaksi cepat", "Pantau stok"],
      personas: [{ name: "Pemilik warung", description: "Usaha kecil" }],
      features: [{ name: "Transaksi", description: "Input dan bayar", priority: "must" }],
      tech_stack: { frontend: "Next.js", backend: "Supabase", database: "Postgres", other: [] },
      non_goals: ["Mobile native"],
    }),
  });

  const ref = new URL(sbUrl).hostname.split(".")[0];
  const session = JSON.stringify({
    access_token: s.access_token, refresh_token: s.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + s.expires_in, expires_in: s.expires_in,
    token_type: "bearer", user: s.user,
  });
  const cookie = `sb-${ref}-auth-token=${encodeURIComponent("base64-" + Buffer.from(session).toString("base64"))}`;

  const res = await fetch(`${appUrl}/api/ai/tasks`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ projectId }),
  });
  console.log(`route status: ${res.status}`);
  const body = await res.json();
  if (body.phases) {
    console.log(`jumlah fase: ${body.phases.length}`);
    body.phases.forEach((ph, i) => console.log(`  Fase ${i + 1}: ${ph.title} (${ph.tasks.length} task)`));
  } else {
    console.log("respons:", JSON.stringify(body).slice(0, 200));
  }

  const phases = await (await fetch(`${sbUrl}/rest/v1/phases?select=id,title&project_id=eq.${projectId}&order=order_index`, { headers: H })).json();
  console.log(`fase tersimpan: ${phases.length}`);
  let taskCount = 0;
  for (const ph of phases) {
    const tasks = await (await fetch(`${sbUrl}/rest/v1/tasks?select=id&phase_id=eq.${ph.id}`, { headers: H })).json();
    taskCount += tasks.length;
  }
  console.log(`task tersimpan: ${taskCount}`);
  const proj = await (await fetch(`${sbUrl}/rest/v1/projects?select=status&id=eq.${projectId}`, { headers: H })).json();
  console.log(`status proyek: ${proj[0]?.status}`);

  await fetch(`${sbUrl}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: { apikey: service, Authorization: `Bearer ${service}` } });
  console.log("cleanup: selesai");
}

main().catch((e) => console.error("ERROR:", e.message));
