import { createServiceClient } from "@/lib/supabase/service";
import { normalizeShortId } from "@/lib/short-id";
import { verifyAgentToken } from "@/lib/agents/token";

/**
 * Endpoint laporan agent: tandai satu task selesai.
 *
 * Agent coding tidak punya sesi cookie user, jadi autentikasi lewat token
 * per proyek (header Authorization: Bearer <token>) dan project id
 * (header X-Project-Id atau query ?projectId=).
 *
 * Contoh:
 *   curl -X POST \
 *     https://app/api/agent/tasks/T-3-2/complete \
 *     -H "Authorization: Bearer pf_xxx" \
 *     -H "X-Project-Id: <uuid>"
 *
 * Idempotent: memanggil ulang task yang sudah selesai tetap mengembalikan 200.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shortId: string }> },
) {
  const { shortId: rawShortId } = await params;

  const shortId = normalizeShortId(rawShortId);
  if (!shortId) {
    return Response.json(
      { error: "Short-id tidak valid. Format: T-<fase>-<task>, mis. T-3-2." },
      { status: 400 },
    );
  }

  // Token: "Authorization: Bearer <token>" atau header "X-Agent-Token".
  const authHeader = request.headers.get("authorization") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const token = bearer || (request.headers.get("x-agent-token") ?? "").trim();
  if (!token) {
    return Response.json(
      { error: "Token agent wajib (Authorization: Bearer <token>)." },
      { status: 401 },
    );
  }

  // Project id: header X-Project-Id atau query ?projectId=.
  const url = new URL(request.url);
  const projectId = (
    request.headers.get("x-project-id") ??
    url.searchParams.get("projectId") ??
    ""
  ).trim();
  if (!projectId) {
    return Response.json(
      { error: "projectId wajib (header X-Project-Id atau query ?projectId=)." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  // Verifikasi token terhadap proyek.
  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .select("id, agent_token")
    .eq("id", projectId)
    .maybeSingle();

  if (projectErr) {
    return Response.json({ error: projectErr.message }, { status: 500 });
  }
  if (!project) {
    return Response.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }

  const ok = verifyAgentToken(token, project.agent_token);
  if (!ok) {
    return Response.json({ error: "Token tidak valid." }, { status: 403 });
  }

  // Cari task berdasarkan short_id di dalam proyek ini.
  const { data: phases, error: phaseErr } = await supabase
    .from("phases")
    .select("id")
    .eq("project_id", projectId);

  if (phaseErr) {
    return Response.json({ error: phaseErr.message }, { status: 500 });
  }
  const phaseIds = (phases ?? []).map((p) => p.id);
  if (phaseIds.length === 0) {
    return Response.json({ error: "Task tidak ditemukan." }, { status: 404 });
  }

  const { data: task, error: taskErr } = await supabase
    .from("tasks")
    .select("id, is_done, title")
    .in("phase_id", phaseIds)
    .eq("short_id", shortId)
    .maybeSingle();

  if (taskErr) {
    return Response.json({ error: taskErr.message }, { status: 500 });
  }
  if (!task) {
    return Response.json(
      { error: `Task ${shortId} tidak ditemukan di proyek ini.` },
      { status: 404 },
    );
  }

  // Idempotent: kalau sudah selesai, tidak perlu tulis ulang.
  if (!task.is_done) {
    const { error: updateErr } = await supabase
      .from("tasks")
      .update({ is_done: true, completed_at: new Date().toISOString() })
      .eq("id", task.id);

    if (updateErr) {
      return Response.json({ error: updateErr.message }, { status: 500 });
    }
  }

  return Response.json({
    ok: true,
    task: { id: task.id, shortId, title: task.title, is_done: true },
  });
}
