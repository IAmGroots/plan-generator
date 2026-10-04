import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Klien Supabase dengan service role key — HANYA untuk server (endpoint agent).
 * Endpoint agent tidak memakai sesi cookie user, jadi RLS tidak bisa memakai
 * auth.uid(). Keamanan ditegakkan lewat token per proyek di layer endpoint,
 * lalu query disaring memakai project_id.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib untuk endpoint agent.",
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
