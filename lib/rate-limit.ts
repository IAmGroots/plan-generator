import { createClient } from "@/lib/supabase/server";

interface Bucket {
  count: number;
  resetAt: number;
}

// Penyimpanan in-memory; cukup untuk melindungi key tunggal dari pemakaian
// berlebihan di satu instance. Bukan pengganti rate limit terdistribusi.
const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

/**
 * Membatasi jumlah permintaan AI per user. Mengembalikan null bila lolos,
 * atau Response 429 bila melewati batas.
 */
export async function enforceRateLimit(): Promise<Response | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const now = Date.now();
  const bucket = buckets.get(user.id);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(user.id, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  if (bucket.count >= MAX_PER_WINDOW) {
    const seconds = Math.ceil((bucket.resetAt - now) / 1000);
    return Response.json(
      { error: `Terlalu banyak permintaan. Coba lagi dalam ${seconds} detik.` },
      { status: 429, headers: { "Retry-After": String(seconds) } },
    );
  }

  bucket.count += 1;
  return null;
}
