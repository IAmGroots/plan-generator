"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleTask(taskId: string, isDone: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ is_done: isDone })
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

  const { error } = await supabase.from("tasks").insert({
    phase_id: phaseId,
    order_index: count ?? 0,
    title: title.trim(),
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function revalidateTasks(projectId: string) {
  revalidatePath(`/projects/${projectId}/tasks`);
}
