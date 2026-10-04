import { createClient } from "@/lib/supabase/server";
import { PrdSchema } from "@/lib/ai/schemas";
import { PRD_SYSTEM, buildPrdUser } from "@/lib/ai/prompts";
import { chatJson } from "@/lib/ai/client";
import { getProject, getClarifyMessages, getUserAiModel } from "@/lib/db/queries";
import { buildQaFromMessages } from "@/lib/clarify";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = await enforceRateLimit();
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  let body: { projectId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const projectId = body.projectId;
  if (!projectId) {
    return Response.json({ error: "projectId wajib." }, { status: 400 });
  }

  const project = await getProject(projectId);
  if (!project) {
    return Response.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }
  if (!project.raw_idea?.trim()) {
    return Response.json({ error: "Isi ide dulu di Langkah 1." }, { status: 400 });
  }

  const messages = await getClarifyMessages(projectId);
  const qa = buildQaFromMessages(
    messages.map((m) => ({ role: m.role, content: m.content })),
  );

  try {
    const model = await getUserAiModel();
    const result = await chatJson({
      system: PRD_SYSTEM,
      user: buildPrdUser({ idea: project.raw_idea, qa }),
      temperature: 0.4,
      maxTokens: 4000,
      model,
    });

    const parsed = PrdSchema.safeParse(result);
    if (!parsed.success) {
      return Response.json(
        { error: "Jawaban AI tidak sesuai format PRD. Coba lagi." },
        { status: 502 },
      );
    }

    const prd = parsed.data;

    // Simpan PRD (satu per proyek; hapus yang lama agar tidak menumpuk).
    await supabase.from("prds").delete().eq("project_id", projectId);
    const { error: insertErr } = await supabase.from("prds").insert({
      project_id: projectId,
      title: prd.title,
      one_liner: prd.one_liner,
      problem: prd.problem,
      goals: prd.goals,
      personas: prd.personas,
      features: prd.features,
      tech_stack: prd.tech_stack,
      non_goals: prd.non_goals,
    });

    if (insertErr) {
      return Response.json({ error: insertErr.message }, { status: 500 });
    }

    await supabase
      .from("projects")
      .update({ status: "prd_ready" })
      .eq("id", projectId);

    return Response.json(prd);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menghubungi AI.";
    return Response.json({ error: message }, { status: 502 });
  }
}
