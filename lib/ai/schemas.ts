import { z } from "zod";

/**
 * Step 2 — AI mengajukan pertanyaan klarifikasi.
 *
 * Tiap pertanyaan punya `inputType` yang menentukan cara user menjawab:
 * - `user_story`: textarea bebas (hanya di putaran pertama, memandu siapa /
 *   ingin apa / mengapa).
 * - `single`: pilih tepat 1 dari `options`.
 * - `multi`: pilih 1 atau lebih dari `options`.
 * User boleh menambah opsi sendiri untuk pertanyaan pilihan (ditangani di UI).
 */
export const ClarifyQuestionSchema = z.object({
  id: z.string().describe("Id stabil pertanyaan, mis. 'q1', 'q2'."),
  prompt: z.string().describe("Teks pertanyaan yang ditampilkan ke user."),
  inputType: z
    .enum(["user_story", "single", "multi"])
    .describe("Cara menjawab: textarea user story, pilih 1, atau pilih banyak."),
  options: z
    .array(z.string())
    .default([])
    .describe("Pilihan jawaban untuk single/multi. Kosong untuk user_story."),
});
export type ClarifyQuestion = z.infer<typeof ClarifyQuestionSchema>;

export const ClarifySchema = z.object({
  reasoning: z
    .string()
    .describe("Analisis singkat AI tentang informasi yang masih kurang."),
  questions: z
    .array(ClarifyQuestionSchema)
    .max(6)
    .describe(
      "Maksimal 6 pertanyaan: q1 user story di putaran 1, q2-q6 pendukung di putaran 2.",
    ),
  isComplete: z
    .boolean()
    .describe(
      "true jika informasi sudah cukup untuk menyusun PRD yang baik (tidak perlu tanya lagi).",
    ),
});
export type ClarifyResult = z.infer<typeof ClarifySchema>;

/** Pertanyaan user story default, dipakai bila AI lupa menaruhnya di putaran pertama. */
export const DEFAULT_USER_STORY_QUESTION: ClarifyQuestion = {
  id: "q1",
  prompt:
    "Seperti apa cerita atau kebutuhan utama dari user saat menggunakan aplikasi ini? Sebutkan siapa penggunanya, apa yang ingin mereka lakukan, dan mengapa mereka membutuhkannya.",
  inputType: "user_story",
  options: [],
};

/** Step 3 — PRD terstruktur. */
export const PrdSchema = z.object({
  title: z.string().describe("Nama produk/proyek yang ringkas dan jelas."),
  one_liner: z
    .string()
    .describe("Satu kalimat ringkas: produk ini apa dan untuk siapa."),
  problem: z
    .string()
    .describe("Masalah utama yang ingin diselesaikan, 2-4 kalimat."),
  goals: z.array(z.string()).describe("Tujuan terukur (3-6 poin)."),
  personas: z
    .array(
      z.object({
        name: z.string().describe("Nama persona, mis. 'Pemilik UMKM'."),
        description: z.string().describe("Deskripsi singkat persona."),
      }),
    )
    .describe("Target pengguna utama."),
  features: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        priority: z.enum(["must", "should", "could"]),
      }),
    )
    .describe("Fitur utama dengan prioritas MoSCoW."),
  tech_stack: z
    .object({
      frontend: z.string().optional(),
      backend: z.string().optional(),
      database: z.string().optional(),
      other: z.array(z.string()).default([]),
    })
    .describe("Rekomendasi teknologi."),
  non_goals: z
    .array(z.string())
    .describe("Hal yang sengaja TIDAK dikerjakan di versi pertama."),
});
export type PrdResult = z.infer<typeof PrdSchema>;

/** Step 4 — Fase + sub-task. */
export const TasksSchema = z.object({
  phases: z
    .array(
      z.object({
        title: z.string().describe("Judul fase, mis. 'Fase 1 — Autentikasi'."),
        description: z.string().describe("Tujuan fase, 1-2 kalimat."),
        tasks: z
          .array(
            z.object({
              title: z.string().describe("Task spesifik & actionable."),
              detail: z
                .string()
                .describe("Penjelasan teknis singkat / acceptance criteria."),
            }),
          )
          .min(2),
      }),
    )
    .min(3)
    .describe("Urutan fase pengerjaan, dari fondasi hingga polish."),
});
export type TasksResult = z.infer<typeof TasksSchema>;
