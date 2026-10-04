import { getAiConfig } from "@/lib/env";

interface ChatResult {
  content: string;
  finishReason?: string;
}

const JSON_NUDGE =
  "PENTING: balas hanya objek JSON valid, tanpa markdown, tanpa penjelasan, tanpa emoji.";

async function callChat(opts: {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
  forceJsonNudge?: boolean;
  model?: string | null;
}): Promise<ChatResult> {
  const { baseURL, apiKey, model } = getAiConfig(opts.model);

  const messages = [
    { role: "system" as const, content: opts.system },
    { role: "user" as const, content: opts.user },
  ];
  if (opts.forceJsonNudge) {
    messages.push({ role: "user" as const, content: JSON_NUDGE });
  }

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI request gagal (${res.status}): ${text.slice(0, 300)}`);
  }

  const raw = await res.text();
  const content = extractContent(raw);
  if (!content) {
    throw new Error("AI mengembalikan respons kosong.");
  }
  return { content };
}

/**
 * 9Router bisa membalas dalam tiga bentuk: JSON biasa, SSE penuh
 * (`data: {...}\n\ndata: [DONE]`), atau JSON diikuti ekor SSE
 * (`{...}\n\ndata: [DONE]`). Semuanya dinormalisasi di sini.
 */
function extractContent(raw: string): string {
  const trimmed = raw.trim();

  // Bentuk SSE penuh: kumpulkan delta konten baris demi baris.
  if (trimmed.startsWith("data:")) {
    let full = "";
    for (const line of trimmed.split("\n")) {
      const l = line.trim();
      if (!l.startsWith("data:")) continue;
      const data = l.slice(5).trim();
      if (data === "[DONE]") break;
      try {
        const chunk = JSON.parse(data) as ChatShape;
        const piece =
          chunk.choices?.[0]?.delta?.content ??
          chunk.choices?.[0]?.message?.content ??
          "";
        if (piece) full += piece;
      } catch {
        // Lewati potongan SSE yang tidak bisa di-parse.
      }
    }
    return full;
  }

  // Bentuk JSON, mungkin punya ekor SSE setelah objek pertama.
  const end = trimmed.lastIndexOf("}");
  const candidate = end !== -1 ? trimmed.slice(0, end + 1) : trimmed;
  try {
    const json = JSON.parse(candidate) as ChatShape;
    return json.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

interface ChatShape {
  choices?: {
    message?: { content?: string };
    delta?: { content?: string };
    finish_reason?: string;
  }[];
}

/**
 * Memanggil 9Router dengan mode JSON terstruktur. Jika model mengabaikan
 * response_format dan mengembalikan teks, satu percobaan ulang dilakukan
 * dengan penegasan sebelum menyerah.
 */
export async function chatJson<T = unknown>(opts: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  model?: string | null;
}): Promise<T> {
  const temperature = opts.temperature ?? 0.4;
  const maxTokens = opts.maxTokens ?? 4000;

  const first = await callChat({ ...opts, temperature, maxTokens });
  try {
    return parseJsonLoose(first.content) as T;
  } catch {
    const second = await callChat({
      ...opts,
      temperature,
      maxTokens,
      forceJsonNudge: true,
    });
    try {
      return parseJsonLoose(second.content) as T;
    } catch {
      const used = opts.model?.trim()
        ? opts.model
        : process.env.AI_MODEL ?? "model aktif";
      throw new Error(
        `Model "${used}" tidak mengembalikan JSON yang bisa dibaca. ` +
          "Pilih model lain di Settings yang mendukung mode JSON.",
      );
    }
  }
}

/**
 * Menerima konten yang mungkin dibungkus ```json ... ``` atau diawali prosa,
 * lalu mengambil objek JSON pertama.
 */
function parseJsonLoose(content: string): unknown {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Tidak menemukan objek JSON pada respons.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}
