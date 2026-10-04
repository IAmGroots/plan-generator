"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Simpan jawaban user. Jawaban dikirim sebagai satu pesan dengan tiap jawaban
 * dipisah baris ganda, agar urutannya sejajar dengan daftar pertanyaan.
 * Pertanyaan yang dilewati dikirim sebagai string kosong.
 */
export async function saveAnswers(projectId: string, answers: string[]) {
  const cleaned = answers.map((a) => a.trim());
  if (cleaned.length === 0) {
    return { error: "Tidak ada jawaban untuk dikirim." };
  }
  // Pertanyaan yang dilewati mengirim string kosong; minimal satu harus terisi.
  if (cleaned.every((a) => a === "")) {
    return { error: "Isi minimal satu jawaban." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clarify_messages").insert({
    project_id: projectId,
    role: "user",
    content: cleaned.join("\n\n"),
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/clarify`);
  return { success: true };
}
