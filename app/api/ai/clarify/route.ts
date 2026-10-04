import { createClient } from "@/lib/supabase/server";
import { ClarifySchema } from "@/lib/ai/schemas";
import { CLARIFY_SYSTEM, buildClarifyUser } from "@/lib/ai/prompts";
import { chatJson } from "@/lib/ai/client";
import { getProject, getClarifyMessages, getUserAiModel } from "@/lib/db/queries";
import {
  buildQaFromMessages,
  countAssistantRounds,
  normalizeUserStoryFirst,
} from "@/lib/clarify";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { ProjectStatus } from "@/lib/types";

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

  let body: { projectId?: string; more?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const projectId = body.projectId;
  if (!projectId) {
    return Response.json({ error: "projectId wajib." }, { status: 400 });
  }
  // User menekan "Tanya lagi": minta 3 pertanyaan lanjutan di luar kerangka.
  const more = body.more === true;

  const project = await getProject(projectId);
  if (!project) {
    return Response.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }
  if (!project.raw_idea?.trim()) {
    return Response.json(
      { error: "Isi ide dulu di Langkah 1." },
      { status: 400 },
    );
  }

  const messages = await getClarifyMessages(projectId);
  const qa = buildQaFromMessages(
    messages.map((m) => ({ role: m.role, content: m.content })),
  );

  // Sudah berapa putaran pertanyaan yang ditanyakan (termasuk yang dilewati).
  // Setelah 2 putaran (q1, lalu q2-q6), klarifikasi dianggap cukup.
  const roundsDone = countAssistantRounds(
    messages.map((m) => ({ role: m.role, content: m.content })),
  );
  const isCompleteByRounds = roundsDone >= 2;

  try {
    const model = await getUserAiModel();
    const result = await chatJson({
      system: CLARIFY_SYSTEM,
      user: buildClarifyUser({ idea: project.raw_idea, qa, more }),
      temperature: 0.5,
      maxTokens: 3000,
      model,
    });

    const parsed = ClarifySchema.safeParse(result);
    if (!parsed.success) {
      return Response.json(
        { error: "Jawaban AI tidak sesuai format. Coba lagi." },
        { status: 502 },
      );
    }

    // Putaran pertama selalu diawali pertanyaan User Story; ini jaminan produk,
    // bukan sekadar mengandalkan kepatuhan model.
    let data = normalizeUserStoryFirst(parsed.data, qa.length === 0);

    // Jaring pengaman deterministik: setelah 2 putaran, paksa selesai apa pun
    // jawaban model, agar tombol "Lanjut buat PRD" pasti muncul. Pertanyaan
    // tambahan yang diminta user (more=true) tetap dipertahankan.
    if (isCompleteByRounds) {
      data = { ...data, isComplete: true };
    }

    // Simpan pertanyaan sebagai pesan assistant (JSON).
    const { error: insertErr } = await supabase
      .from("clarify_messages")
      .insert({
        project_id: projectId,
        role: "assistant",
        content: JSON.stringify(data),
      });

    if (insertErr) {
      return Response.json({ error: insertErr.message }, { status: 500 });
    }

    // Klarifikasi cukup -> status "clarified" (next action: buat PRD).
    // Jika masih berjalan -> "clarifying". Jangan turunkan status yang sudah
    // lebih maju (prd_ready/tasks_ready) bila user sekadar menambah pertanyaan.
    const projectAdvance: ProjectStatus[] = ["prd_ready", "tasks_ready"];
    if (!projectAdvance.includes(project.status)) {
      await supabase
        .from("projects")
        .update({ status: data.isComplete ? "clarified" : "clarifying" })
        .eq("id", projectId);
    }

    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menghubungi AI.";
    return Response.json({ error: message }, { status: 502 });
  }
}
