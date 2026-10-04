/**
 * Tes koneksi ke 9Router (OpenAI-compatible).
 * Usage:
 *   1. Isi .env.local (AI_BASE_URL, AI_API_KEY, AI_MODEL)
 *   2. node --env-file=.env.local scripts/test-ai.mjs
 */
const baseURL = process.env.AI_BASE_URL;
const apiKey = process.env.AI_API_KEY;
const model = process.env.AI_MODEL;

if (!baseURL || !apiKey || !model) {
  console.error(
    "Missing env. Pastikan AI_BASE_URL, AI_API_KEY, dan AI_MODEL terisi.",
  );
  process.exit(1);
}

console.log(`Model : ${model}`);
console.log(`Base  : ${baseURL}`);

try {
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Balas HANYA dengan JSON." },
        {
          role: "user",
          content:
            'Balas JSON: {"ok": true, "message": "koneksi berhasil"}',
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 100,
    }),
  });

  console.log(`Status: ${res.status}`);
  const body = await res.text();
  console.log(`Body  : ${body}`);
  process.exit(res.ok ? 0 : 1);
} catch (err) {
  console.error("Request error:", err);
  process.exit(1);
}
