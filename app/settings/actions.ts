"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidModel } from "@/lib/ai/models";

/**
 * Simpan model AI pilihan user (global per user). Model divalidasi terhadap
 * daftar 9Router agar tidak bisa diisi nilai sembarangan.
 */
export async function saveAiModel(model: string) {
  const value = model.trim();
  if (!value) {
    return { error: "Pilih model terlebih dahulu." };
  }

  const valid = await isValidModel(value);
  if (!valid) {
    return { error: "Model tidak ditemukan di 9Router. Pilih dari daftar." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };

  const { error } = await supabase
    .from("profiles")
    .update({ ai_model: value })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true, model: value };
}

/** Kosongkan pilihan sehingga kembali ke default AI_MODEL env. */
export async function resetAiModel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };

  const { error } = await supabase
    .from("profiles")
    .update({ ai_model: null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
