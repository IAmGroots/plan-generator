"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatShortId } from "@/lib/short-id";

export async function toggleTask(taskId: string, isDone: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      is_done: isDone,
      completed_at: isDone ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateTask(taskId: string, title: string, detail: string) {
  if (!title.trim()) return { error: "Judul task wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ title: title.trim(), detail: detail.trim() })
    .eq("id", taskId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function addTask(phaseId: string, title: string) {
  if (!title.trim()) return { error: "Judul task wajib diisi." };

  const supabase = await createClient();
  // Taruh di urutan terakhir fase tersebut.
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("phase_id", phaseId);

  const orderIndex = count ?? 0;

  // Hitung short_id: T-<fase+1>-<task+1>. Fase dihitung dari urutan di proyek.
  const { data: phase } = await supabase
    .from("phases")
    .select("id, project_id, order_index")
    .eq("id", phaseId)
    .maybeSingle();

  let phaseIndex = 0;
  if (phase) {
    const { count: earlier } = await supabase
      .from("phases")
      .select("id", { count: "exact", head: true })
      .eq("project_id", phase.project_id)
      .lt("order_index", phase.order_index);
    phaseIndex = earlier ?? 0;
  }

  const { error } = await supabase.from("tasks").insert({
    phase_id: phaseId,
    order_index: orderIndex,
    title: title.trim(),
    short_id: formatShortId(phaseIndex, orderIndex),
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function revalidateTasks(projectId: string) {
  revalidatePath(`/projects/${projectId}/tasks`);
}
