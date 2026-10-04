/**
 * Uji alur penuh end-to-end lewat route app: ide -> PRD -> tasks, lalu
 * bangun Markdown export dari data tersimpan dan cek isinya.
 * Usage: node --env-file=.env.local scripts/test-e2e-full.mjs
 */
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = "http://localhost:3001";
const email = `pf-e2e-${Date.now()}@example.com`;
const password = "test-password-123";

const log = (ok, msg) => console.log(`${ok ? "PASS" : "FAIL"} - ${msg}`);
let failures = 0;
const check = (cond, msg) => { if (!cond) failures++; log(cond, msg); };

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
    body: JSON.stringify({ user_id: u.id, title: "E2E Kasir", raw_idea: "Aplikasi kasir UMKM: cetak struk, lacak stok, laporan harian." }),
  })).json();
  const projectId = p[0].id;
  check(!!projectId, "proyek dibuat");

  const ref = new URL(sbUrl).hostname.split(".")[0];
  const session = JSON.stringify({
    access_token: s.access_token, refresh_token: s.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + s.expires_in, expires_in: s.expires_in,
    token_type: "bearer", user: s.user,
  });
  const cookie = `sb-${ref}-auth-token=${encodeURIComponent("base64-" + Buffer.from(session).toString("base64"))}`;
  const call = (path, body) => fetch(`${appUrl}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify(body),
  });

  // Langkah 2: clarify
  const c = await (await call("/api/ai/clarify", { projectId })).json();
  check(Array.isArray(c.questions), `clarify mengembalikan pertanyaan (${c.questions?.length})`);

  // Jawab pertanyaan pertama.
  if (c.questions?.length) {
    await fetch(`${sbUrl}/rest/v1/clarify_messages`, {
      method: "POST", headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify({ project_id: projectId, role: "user", content: c.questions.map(() => "Web dulu, offline-friendly").join("\n\n") }),
    });
  }

  // Langkah 3: PRD
  const pr = await (await call("/api/ai/prd", { projectId })).json();
  check(!!pr.title && Array.isArray(pr.features), `PRD dibuat (fitur: ${pr.features?.length})`);

  // Langkah 4: tasks
  const t = await (await call("/api/ai/tasks", { projectId })).json();
  const totalTasks = (t.phases ?? []).reduce((n, ph) => n + ph.tasks.length, 0);
  check((t.phases?.length ?? 0) >= 3, `task dibuat (${t.phases?.length} fase, ${totalTasks} task)`);

  // Status akhir
  const proj = await (await fetch(`${sbUrl}/rest/v1/projects?select=status&id=eq.${projectId}`, { headers: H })).json();
  check(proj[0]?.status === "tasks_ready", `status akhir tasks_ready (${proj[0]?.status})`);

  // Markdown export dari data tersimpan.
  const phases = await (await fetch(`${sbUrl}/rest/v1/phases?select=id,title,description,order_index&project_id=eq.${projectId}&order=order_index`, { headers: H })).json();
  const mdParts = [`# ${p[0].title}`];
  for (const ph of phases) {
    const tasks = await (await fetch(`${sbUrl}/rest/v1/tasks?select=title,detail,is_done&phase_id=eq.${ph.id}&order=order_index`, { headers: H })).json();
    mdParts.push(`### ${ph.title}`);
    tasks.forEach((tk) => mdParts.push(`- [${tk.is_done ? "x" : " "}] ${tk.title}`));
  }
  const md = mdParts.join("\n");
  check(md.includes("- [ ]"), "markdown berisi checkbox task");
  check(!md.includes("\u2014"), "markdown tanpa em dash");

  // Cleanup
  await fetch(`${sbUrl}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: { apikey: service, Authorization: `Bearer ${service}` } });

  console.log(`\n=== ${failures === 0 ? "SEMUA LOLOS" : failures + " GAGAL"} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
