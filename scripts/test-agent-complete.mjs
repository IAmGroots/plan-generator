/**
 * Uji endpoint agent: user + proyek + fase + task, pasang token plaintext,
 * lalu panggil /api/agent/tasks/<shortId>/complete dan pastikan task tercentang.
 * Usage: node --env-file=.env.local scripts/test-agent-complete.mjs
 */
import { randomBytes } from "node:crypto";

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
const email = `pf-agent-${Date.now()}@example.com`;
const password = "test-password-123";

async function main() {
  // Buat user.
  const u = await (
    await fetch(`${sbUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    })
  ).json();

  // Login untuk dapat token (agar RLS mengizinkan insert).
  const s = await (
    await fetch(`${sbUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  ).json();

  const H = {
    apikey: anon,
    Authorization: `Bearer ${s.access_token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  // Buat proyek + token agent.
  const token = "pf_" + randomBytes(32).toString("hex");
  const p = await (
    await fetch(`${sbUrl}/rest/v1/projects`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({
        user_id: u.id,
        title: "Kasir UMKM",
        status: "tasks_ready",
        agent_token: token,
      }),
    })
  ).json();
  const projectId = p[0].id;

  // Fase + task dengan short_id.
  const ph = await (
    await fetch(`${sbUrl}/rest/v1/phases`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({
        project_id: projectId,
        order_index: 0,
        title: "Setup",
      }),
    })
  ).json();
  const phaseId = ph[0].id;

  const tk = await (
    await fetch(`${sbUrl}/rest/v1/tasks`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({
        phase_id: phaseId,
        order_index: 0,
        title: "Inisialisasi repo",
        short_id: "T-1-1",
      }),
    })
  ).json();
  const taskId = tk[0].id;

  console.log(`proyek: ${projectId}, task: T-1-1 (${taskId})`);

  // --- 1. Tanpa token: harus 401 ---
  const noToken = await fetch(`${appUrl}/api/agent/tasks/T-1-1/complete`, {
    method: "POST",
    headers: { "X-Project-Id": projectId },
  });
  console.log(`tanpa token -> ${noToken.status} (harap 401)`);

  // --- 2. Token salah: harus 403 ---
  const badToken = await fetch(`${appUrl}/api/agent/tasks/T-1-1/complete`, {
    method: "POST",
    headers: {
      Authorization: "Bearer pf_salah",
      "X-Project-Id": projectId,
    },
  });
  console.log(`token salah -> ${badToken.status} (harap 403)`);

  // --- 3. Token benar: harus 200 ---
  const ok = await fetch(`${appUrl}/api/agent/tasks/T-1-1/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Project-Id": projectId,
    },
  });
  console.log(`token benar -> ${ok.status} (harap 200)`);
  console.log("  body:", JSON.stringify(await ok.json()));

  // --- 4. Idempotent: panggil ulang -> tetap 200 ---
  const again = await fetch(`${appUrl}/api/agent/tasks/T-1-1/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Project-Id": projectId,
    },
  });
  console.log(`idempotent -> ${again.status} (harap 200)`);

  // --- 5. Cek DB: is_done & completed_at terisi ---
  const check = await (
    await fetch(
      `${sbUrl}/rest/v1/tasks?select=is_done,completed_at,short_id&id=eq.${taskId}`,
      { headers: H },
    )
  ).json();
  console.log("DB task:", JSON.stringify(check[0]));

  // --- 6. short_id salah -> 404 ---
  const notFound = await fetch(`${appUrl}/api/agent/tasks/T-9-9/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Project-Id": projectId,
    },
  });
  console.log(`short-id tak ada -> ${notFound.status} (harap 404)`);

  // Cleanup.
  await fetch(`${sbUrl}/auth/v1/admin/users/${u.id}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  console.log("cleanup: selesai");
}

main().catch((e) => console.error("ERROR:", e.message));
