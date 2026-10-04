import { getAiConfig } from "@/lib/env";

export interface AiModel {
  id: string;
  owned_by: string;
  reasoning: boolean;
}

interface RawModel {
  id?: string;
  owned_by?: string;
  capabilities?: { reasoning?: boolean };
}

interface CacheEntry {
  models: AiModel[];
  expiresAt: number;
}

// Daftar model jarang berubah; cache singkat agar tidak memanggil 9Router
// setiap kali halaman settings dirender.
let cache: CacheEntry | null = null;
const CACHE_MS = 5 * 60_000;

/**
 * Ambil daftar model dari 9Router. Hanya boleh dipanggil di server karena
 * memakai API key.
 */
export async function listModels(): Promise<AiModel[]> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.models;
  }

  const { baseURL, apiKey } = getAiConfig();
  const res = await fetch(`${baseURL}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Gagal memuat daftar model (${res.status}).`);
  }

  const json = (await res.json()) as { data?: RawModel[] };
  const models = (json.data ?? [])
    .filter((m): m is RawModel & { id: string } => typeof m.id === "string")
    .map((m) => ({
      id: m.id,
      owned_by: m.owned_by ?? "lainnya",
      reasoning: m.capabilities?.reasoning === true,
    }));

  cache = { models, expiresAt: Date.now() + CACHE_MS };
  return models;
}

/** Cek apakah sebuah id model benar-benar ada di 9Router. */
export async function isValidModel(id: string): Promise<boolean> {
  try {
    const models = await listModels();
    return models.some((m) => m.id === id);
  } catch {
    return false;
  }
}
