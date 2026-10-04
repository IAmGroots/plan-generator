import { createClient } from "@/lib/supabase/server";
import { TasksSchema } from "@/lib/ai/schemas";
import { TASKS_SYSTEM, buildTasksUser } from "@/lib/ai/prompts";
import { chatJson } from "@/lib/ai/client";
import { getProject, getPrd, getUserAiModel } from "@/lib/db/queries";
import { enforceRateLimit } from "@/lib/rate-limit";
import { formatShortId } from "@/lib/short-id";

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

  const prd = await getPrd(projectId);
  if (!prd) {
    return Response.json(
      { error: "Buat PRD dulu di Langkah 3." },
      { status: 400 },
    );
  }

  // Ringkas PRD menjadi bentuk yang ringan untuk prompt task.
  const prdForPrompt = {
    title: prd.title ?? "",
    one_liner: prd.one_liner ?? "",
    problem: prd.problem ?? "",
    goals: prd.goals ?? [],
    features: prd.features ?? [],
    tech_stack: prd.tech_stack ?? {},
    non_goals: prd.non_goals ?? [],
  };

  try {
    const model = await getUserAiModel();
    const result = await chatJson({
      system: TASKS_SYSTEM,
      user: buildTasksUser({ idea: project.raw_idea ?? "", prd: prdForPrompt }),
      temperature: 0.4,
      maxTokens: 6000,
      model,
    });

    const parsed = TasksSchema.safeParse(result);
    if (!parsed.success) {
      return Response.json(
        { error: "Jawaban AI tidak sesuai format task. Coba lagi." },
        { status: 502 },
      );
    }

    // Ganti seluruh fase lama (cascade menghapus task di dalamnya).
    await supabase.from("phases").delete().eq("project_id", projectId);

    for (let i = 0; i < parsed.data.phases.length; i++) {
      const phase = parsed.data.phases[i];
      const { data: inserted, error: phaseErr } = await supabase
        .from("phases")
        .insert({
          project_id: projectId,
          order_index: i,
          title: phase.title,
          description: phase.description,
        })
        .select("id")
        .single();

      if (phaseErr || !inserted) {
        return Response.json(
          { error: phaseErr?.message ?? "Gagal menyimpan fase." },
          { status: 500 },
        );
      }

      const taskRows = phase.tasks.map((t, ti) => ({
        phase_id: inserted.id,
        order_index: ti,
        title: t.title,
        detail: t.detail,
        is_done: false,
        short_id: formatShortId(i, ti),
      }));

      const { error: taskErr } = await supabase.from("tasks").insert(taskRows);
      if (taskErr) {
        return Response.json({ error: taskErr.message }, { status: 500 });
      }
    }

    await supabase
      .from("projects")
      .update({ status: "tasks_ready" })
      .eq("id", projectId);

    return Response.json(parsed.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menghubungi AI.";
    return Response.json({ error: message }, { status: 502 });
  }
}
