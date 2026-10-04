"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PrdSchema } from "@/lib/ai/schemas";

/**
 * Simpan hasil edit manual PRD. Bentuk masukan mengikuti PrdSchema
 * agar data yang tersimpan tetap konsisten dengan hasil AI.
 */
export async function savePrd(projectId: string, input: unknown) {
  const parsed = PrdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Data PRD tidak lengkap." };
  }
  const prd = parsed.data;

  const supabase = await createClient();
  await supabase.from("prds").delete().eq("project_id", projectId);
  const { error } = await supabase.from("prds").insert({
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

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/prd`);
  return { success: true };
}

export async function deletePrd(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prds")
    .delete()
    .eq("project_id", projectId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/prd`);
  return { success: true };
}
