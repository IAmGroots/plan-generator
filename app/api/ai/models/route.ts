import { createClient } from "@/lib/supabase/server";
import { listModels } from "@/lib/ai/models";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const models = await listModels();
    return Response.json({ models });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Gagal memuat daftar model.";
    return Response.json({ error: message }, { status: 502 });
  }
}
