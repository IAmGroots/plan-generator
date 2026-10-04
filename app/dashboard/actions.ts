"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const idea = String(formData.get("idea") ?? "").trim();

  if (!title) {
    return { error: "Judul proyek wajib diisi." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, title, raw_idea: idea })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect(`/projects/${data.id}/idea`);
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function saveIdea(projectId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const idea = String(formData.get("idea") ?? "").trim();

  if (!title || !idea) {
    return { error: "Judul dan ide wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ title, raw_idea: idea })
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/idea`);
  return { success: true };
}
