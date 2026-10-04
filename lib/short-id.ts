/**
 * Short-ID untuk task, format: T-<fase>-<task> (berbasis 1).
 * Contoh: "T-3-2" = fase ke-3, task ke-2.
 *
 * Dipakai di export markdown supaya AI coding agent (dan manusia) bisa
 * merujuk satu task dengan kode yang pendek dan stabil.
 */

const SHORT_ID_RE = /^T-(\d+)-(\d+)$/;

/** Bangun short-id dari indeks berbasis 0. */
export function formatShortId(phaseIndex: number, taskIndex: number): string {
  return `T-${phaseIndex + 1}-${taskIndex + 1}`;
}

/** Parse short-id menjadi indeks berbasis 1, atau null bila tidak valid. */
export function parseShortId(
  value: string,
): { phase: number; task: number } | null {
  const match = SHORT_ID_RE.exec(value.trim());
  if (!match) return null;
  const phase = Number(match[1]);
  const task = Number(match[2]);
  if (!Number.isInteger(phase) || !Number.isInteger(task)) return null;
  if (phase < 1 || task < 1) return null;
  return { phase, task };
}

/** Normalisasi input user/agent: "t-3-2" -> "T-3-2" (tetap validasi). */
export function normalizeShortId(value: string): string | null {
  const parsed = parseShortId(value);
  if (!parsed) return null;
  return `T-${parsed.phase}-${parsed.task}`;
}
