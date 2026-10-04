import {
  DEFAULT_USER_STORY_QUESTION,
  type ClarifyQuestion,
  type ClarifyResult,
} from "@/lib/ai/schemas";

export interface QaPair {
  question: string;
  answer: string;
}

/** Ambil daftar pertanyaan dari satu pesan assistant (JSON). */
export function parseAssistantQuestions(content: string): ClarifyQuestion[] {
  try {
    const parsed = JSON.parse(content) as { questions?: ClarifyQuestion[] };
    return parsed.questions ?? [];
  } catch {
    return [];
  }
}

/**
 * Hitung berapa putaran pertanyaan yang sudah ditanyakan: jumlah pesan
 * assistant yang berisi pertanyaan DAN sudah diikuti minimal satu pesan user.
 *
 * Dihitung dari pesan mentah (bukan dari isi jawaban), sehingga pertanyaan
 * yang dilewati tetap terhitung sebagai putaran yang sudah berjalan.
 */
export function countAssistantRounds(
  messages: { role: "assistant" | "user"; content: string }[],
): number {
  let rounds = 0;
  let pending = false;

  for (const msg of messages) {
    if (msg.role === "assistant") {
      const questions = parseAssistantQuestions(msg.content);
      pending = questions.length > 0;
    } else if (pending) {
      rounds++;
      pending = false;
    }
  }

  return rounds;
}

/**
 * Mengubah riwayat pesan klarifikasi menjadi pasangan tanya-jawab.
 * Pesan assistant berisi JSON berisi daftar pertanyaan, pesan user berisi
 * jawaban; tiap jawaban dipisah baris ganda, berurutan sesuai pertanyaan.
 */
export function buildQaFromMessages(
  messages: { role: "assistant" | "user"; content: string }[],
): QaPair[] {
  const pairs: QaPair[] = [];
  let pendingStart = -1;

  for (const msg of messages) {
    if (msg.role === "assistant") {
      const questions = parseAssistantQuestions(msg.content);
      pendingStart = pairs.length;
      questions.forEach((q) => pairs.push({ question: q.prompt, answer: "" }));
    } else if (pendingStart !== -1) {
      const answers = msg.content.split("\n\n");
      for (
        let i = pendingStart, a = 0;
        i < pairs.length && a < answers.length;
        i++, a++
      ) {
        pairs[i].answer = answers[a].trim();
      }
      pendingStart = -1;
    }
  }

  return pairs.filter((p) => p.answer !== "");
}

/**
 * Jamin kontrak produk: pada putaran pertama pertanyaan #1 selalu User Story.
 *
 * Ini fail-safe, bukan fail-hard: model apa pun yang dipilih user tetap
 * menghasilkan pertanyaan user story walau AI mengabaikan instruksi prompt.
 * - Jika sudah ada user_story di posisi pertama, biarkan apa adanya.
 * - Jika user_story ada tapi bukan di posisi pertama, pindahkan ke depan.
 * - Jika tidak ada sama sekali, selipkan pertanyaan default di depan.
 * - Hapus duplikat user_story (sisakan satu).
 */
export function normalizeUserStoryFirst(
  result: ClarifyResult,
  isFirstRound: boolean,
): ClarifyResult {
  if (!isFirstRound) return result;

  const questions = [...result.questions];
  const storyIndex = questions.findIndex((q) => q.inputType === "user_story");

  if (storyIndex === -1) {
    return {
      ...result,
      questions: [DEFAULT_USER_STORY_QUESTION, ...questions].slice(0, 6),
    };
  }

  const story = questions[storyIndex];
  const rest = questions.filter(
    (q, i) => i !== storyIndex && q.inputType !== "user_story",
  );

  return { ...result, questions: [story, ...rest] };
}
