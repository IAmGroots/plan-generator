import { createClient } from "@/lib/supabase/server";
import { generateAgentToken } from "@/lib/agents/token";
import type {
  ClarifyMessage,
  Phase,
  Prd,
  Project,
  Task,
} from "@/lib/types";

/** Model AI pilihan user, atau null bila belum diatur (pakai default env). */
export async function getUserAiModel(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("ai_model")
    .eq("id", user.id)
    .maybeSingle();

  return (data?.ai_model as string | null) ?? null;
}

/** Ambil semua proyek milik user yang sedang login. RLS memfilter otomatis. */
export async function listProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Project) ?? null;
}

/**
 * Ambil token agent proyek; bila belum ada, buat otomatis sekali lalu simpan.
 *
 * Karena "satu proyek = satu token tetap", pemanggilan berikutnya selalu
 * mengembalikan token yang sama (tidak berubah-ubah).
 */
export async function ensureProjectAgentToken(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("agent_token")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const existing = (data as { agent_token: string | null }).agent_token;
  if (existing) return existing;

  const token = generateAgentToken();
  const { error: updateErr } = await supabase
    .from("projects")
    .update({ agent_token: token })
    .eq("id", id);

  if (updateErr) throw new Error(updateErr.message);
  return token;
}

export async function getClarifyMessages(
  projectId: string,
): Promise<ClarifyMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clarify_messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ClarifyMessage[];
}

export async function getPrd(projectId: string): Promise<Prd | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prds")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Prd) ?? null;
}

export interface PhaseWithTasks extends Phase {
  tasks: Task[];
}

export async function getPhasesWithTasks(
  projectId: string,
): Promise<PhaseWithTasks[]> {
  const supabase = await createClient();
  const { data: phases, error: phaseErr } = await supabase
    .from("phases")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (phaseErr) throw new Error(phaseErr.message);
  if (!phases?.length) return [];

  const phaseIds = phases.map((p) => p.id);
  const { data: tasks, error: taskErr } = await supabase
    .from("tasks")
    .select("*")
    .in("phase_id", phaseIds)
    .order("order_index", { ascending: true });

  if (taskErr) throw new Error(taskErr.message);

  return phases.map((phase) => ({
    ...(phase as Phase),
    tasks: ((tasks ?? []) as Task[]).filter((t) => t.phase_id === phase.id),
  }));
}
