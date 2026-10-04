/**
 * Terpusat untuk membaca env. Dipakai oleh server & client.
 * Jangan import file ini dari komponen client jika berisi secret —
 * gunakan helper khusus di bawah agar aman.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

/** Variabel yang aman dipakai di browser (prefix NEXT_PUBLIC_). */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export function assertPublicEnv() {
  required("NEXT_PUBLIC_SUPABASE_URL", publicEnv.supabaseUrl);
  required("NEXT_PUBLIC_SUPABASE_ANON_KEY", publicEnv.supabaseAnonKey);
}

/**
 * Konfigurasi AI (9Router). HANYA boleh dipakai di server.
 * `modelOverride` (pilihan user) menang atas AI_MODEL env.
 */
export function getAiConfig(modelOverride?: string | null) {
  return {
    baseURL: required("AI_BASE_URL", process.env.AI_BASE_URL),
    apiKey: required("AI_API_KEY", process.env.AI_API_KEY),
    model:
      modelOverride && modelOverride.trim()
        ? modelOverride.trim()
        : required("AI_MODEL", process.env.AI_MODEL),
  };
}
