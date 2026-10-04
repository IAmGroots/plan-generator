"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateAgentToken } from "@/lib/agents/token";

export interface AgentTokenState {
  token?: string;
  error?: string;
}

/**
 * Reset token agent proyek (keadaan darurat).
 *
 * Token sehari-hari SIFATNYA TETAP dan dibuat otomatis saat membuka halaman
 * export. Reset hanya dipakai bila token bocor — token baru dibuat dan agent
 * yang sedang berjalan akan segera kehilangan akses.
 */
export async function resetAgentTokenAction(
  projectId: string,
): Promise<AgentTokenState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tidak terautentikasi." };

  const token = generateAgentToken();

  // RLS memastikan hanya pemilik proyek yang bisa update.
  const { error } = await supabase
    .from("projects")
    .update({ agent_token: token })
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/export`);
  return { token };
}
