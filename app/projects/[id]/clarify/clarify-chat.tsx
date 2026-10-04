"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClarifyQuestion } from "@/lib/ai/schemas";
import { saveAnswers } from "./actions";

interface AssistantTurn {
  role: "assistant";
  questions: ClarifyQuestion[];
  isComplete: boolean;
}

interface UserTurn {
  role: "user";
  answers: string[];
}

export type Turn = AssistantTurn | UserTurn;

/** Jawaban satu pertanyaan: teks bebas, daftar pilihan, atau dilewati. */
interface AnswerValue {
  text: string;
  selected: string[];
  skipped: boolean;
}

const EMPTY_ANSWER: AnswerValue = {
  text: "",
  selected: [],
  skipped: false,
};

/** Aturan jumlah pilihan: single = tepat 1; multi = minimal 1. */
function choiceRuleLabel(q: ClarifyQuestion): string {
  return q.inputType === "single"
    ? "Pilih 1"
    : "Boleh pilih lebih dari satu";
}

export function ClarifyChat({
  projectId,
  history,
  answeredCount,
}: {
  projectId: string;
  history: Turn[];
  answeredCount: number;
}) {
  const router = useRouter();

  const [answers, setAnswers] = React.useState<
    Record<string, AnswerValue>
  >({});

  const [customOptions, setCustomOptions] = React.useState<
    Record<string, string[]>
  >({});

  const [draftOption, setDraftOption] = React.useState<
    Record<string, string>
  >({});

  const [busy, setBusy] = React.useState<"ask" | "save" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string>
  >({});

  /*
   * Turn terakhir adalah pertanyaan yang sedang aktif.
   *
   * Jika turn terakhir adalah assistant:
   * - questions = pertanyaan yang perlu dijawab
   * - isComplete = apakah AI sudah merasa informasinya cukup
   *
   * Jika turn terakhir adalah user:
   * - berarti jawaban sudah diberikan
   * - belum ada pertanyaan baru.
   */
  const lastTurn = history[history.length - 1];

  const pendingQuestions =
    lastTurn && lastTurn.role === "assistant"
      ? lastTurn.questions
      : [];

  const isComplete =
    lastTurn && lastTurn.role === "assistant"
      ? lastTurn.isComplete
      : false;

  function patch(id: string, value: Partial<AnswerValue>) {
    setAnswers((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? EMPTY_ANSWER),
        ...value,
      },
    }));

    setFieldErrors((prev) => {
      if (!prev[id]) return prev;

      const next = { ...prev };
      delete next[id];

      return next;
    });
  }

  function toggleOption(
    q: ClarifyQuestion,
    option: string,
  ) {
    const current = answers[q.id] ?? EMPTY_ANSWER;

    const has = current.selected.includes(option);

    let selected: string[];

    if (has) {
      selected = current.selected.filter(
        (o) => o !== option,
      );
    } else if (q.inputType === "single") {
      selected = [option];
    } else {
      selected = [...current.selected, option];
    }

    patch(q.id, {
      selected,
      skipped: false,
    });
  }

  function addCustomOption(q: ClarifyQuestion) {
    const raw = (draftOption[q.id] ?? "").trim();

    if (!raw) return;

    setCustomOptions((prev) => {
      const list = prev[q.id] ?? [];

      if (list.includes(raw)) {
        return prev;
      }

      return {
        ...prev,
        [q.id]: [...list, raw],
      };
    });

    setDraftOption((prev) => ({
      ...prev,
      [q.id]: "",
    }));

    // Opsi baru langsung dipilih.
    toggleOption(q, raw);
  }

  function toggleSkip(q: ClarifyQuestion) {
    const current = answers[q.id] ?? EMPTY_ANSWER;

    patch(q.id, {
      skipped: !current.skipped,
      text: "",
      selected: [],
    });
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    for (const q of pendingQuestions) {
      const a = answers[q.id] ?? EMPTY_ANSWER;

      if (a.skipped) {
        continue;
      }

      if (q.inputType === "user_story") {
        if (!a.text.trim()) {
          errors[q.id] =
            "Tulis User Story-mu, atau lewati pertanyaan ini.";
        }
      } else if (q.inputType === "single") {
        if (a.selected.length !== 1) {
          errors[q.id] =
            "Pilih tepat 1 opsi, atau lewati pertanyaan ini.";
        }
      } else {
        if (a.selected.length < 1) {
          errors[q.id] =
            "Pilih minimal 1 opsi, atau lewati pertanyaan ini.";
        }
      }
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  /**
   * Gabung jawaban tiap pertanyaan menjadi satu string.
   */
  function toAnswerText(q: ClarifyQuestion): string {
    const a = answers[q.id] ?? EMPTY_ANSWER;

    if (a.skipped) {
      return "";
    }

    if (q.inputType === "user_story") {
      return a.text.trim();
    }

    return a.selected.join(", ");
  }

  async function askAi(more = false) {
    setBusy("ask");
    setError(null);

    try {
      const res = await fetch("/api/ai/clarify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          more,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ?? "Gagal meminta pertanyaan.",
        );
      }

      /*
       * Server yang menyimpan history.
       * Refresh supaya history datang dari satu sumber.
       */
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function submitAnswers() {
    setError(null);

    if (!validate()) {
      return;
    }

    setBusy("save");

    const payload = pendingQuestions.map(toAnswerText);

    const result = await saveAnswers(
      projectId,
      payload,
    );

    if (
      result &&
      "error" in result &&
      result.error
    ) {
      setError(result.error);
      setBusy(null);
      return;
    }

    setBusy(null);

    /*
     * Setelah jawaban tersimpan, minta AI membuat
     * pertanyaan berikutnya.
     */
    router.refresh();

    askAi();
  }

  const asking = busy === "ask";
  const saving = busy === "save";

  // Saat halaman dibuka dan belum ada pertanyaan sama sekali, langsung minta
  // pertanyaan pertama ke AI (tanpa tombol "Mulai tanya jawab"). Guard ref
  // mencegah pemanggilan ganda (mis. double-invoke React StrictMode).
  const autoStartedRef = React.useRef(false);
  const needsFirstQuestion = history.length === 0;
  React.useEffect(() => {
    if (needsFirstQuestion && !autoStartedRef.current) {
      autoStartedRef.current = true;
      askAi();
    }
    // Hanya dipicu oleh ada/tidaknya riwayat; askAi stabil per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsFirstQuestion]);

  const showRetry = needsFirstQuestion && error !== null && !asking;

  return (
    <div className="mt-8 flex flex-col gap-4">
      {/* =========================================================
          AUTO-LOADING: pertanyaan pertama sedang diminta ke AI.
      ========================================================= */}

      {needsFirstQuestion && asking && (
        <div className="rounded-lg bg-carbon p-6 shadow-hairline">
          <p className="text-sm text-fog">AI sedang membaca idemu...</p>
        </div>
      )}

      {/* =========================================================
          RIWAYAT:
          HANYA TAMPILKAN ASSISTANT TURN YANG SUDAH MEMILIKI
          USER TURN BERIKUTNYA.

          Jadi:

          Assistant
             ↓
          User

          = satu card.

          Assistant tanpa User
          = jangan tampilkan di sini karena akan tampil
            di bagian "Jawabanmu".
      ========================================================= */}

      {history.map((turn, i) => {
        if (turn.role !== "assistant") {
          return null;
        }

        const nextTurn = history[i + 1];

        const userTurn =
          nextTurn?.role === "user"
            ? nextTurn
            : null;

        /*
         * Ini bagian penting.
         *
         * Kalau assistant turn belum punya user turn,
         * jangan render sebagai card riwayat.
         *
         * Pertanyaan tersebut akan muncul di "Jawabanmu".
         */
        if (!userTurn) {
          return null;
        }

        return (
          <div
            key={i}
            className="rounded-lg bg-carbon p-6 shadow-hairline"
          >
            <div className="flex flex-col gap-5">
              {turn.questions.map((q, qi) => {
                const answer =
                  userTurn.answers[qi];

                return (
                  <div
                    key={q.id}
                    className="border-t border-slate pt-4 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-start gap-3">
                      {/* Number */}



                      <div className="min-w-0 flex-1">
                        {/* Question */}

                        <span className="font-mono text-xs">
                          {String(qi + 1).padStart(2, "0")}. {q.prompt}
                        </span>

                        {/* Answer label */}

                        <p className="mt-2 font-mono text-xs">
                          Jawabanmu:
                        </p>

                        {/* Answer */}

                        <div className="mt-2 rounded-md bg-white/[0.03] px-3 py-2">
                          <p className="font-mono text-xs">
                            {answer ||
                              "(dilewati)"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* =========================================================
          PERTANYAAN AKTIF

          Hanya pertanyaan dari AssistantTurn TERAKHIR.

          Tidak muncul sebagai card history karena di atas
          kita menggunakan:

          if (!userTurn) return null
      ========================================================= */}

      {pendingQuestions.length > 0 && (
          <div className="rounded-lg bg-carbon p-6 shadow-hairline">
            <p className="text-sm font-medium text-mist">
              Butuh Jawabanmu
            </p>

            <div className="mt-4 flex flex-col gap-6">
              {pendingQuestions.map((q, i) => {
                const a =
                  answers[q.id] ??
                  EMPTY_ANSWER;

                const err =
                  fieldErrors[q.id];

                const options = [
                  ...q.options,
                  ...(customOptions[q.id] ??
                    []),
                ];

                return (
                  <fieldset
                    key={q.id}
                    className={cn(
                      "flex flex-col border-t border-slate pt-5 first:border-t-0 first:pt-0",
                      a.skipped && "opacity-60",
                    )}
                  >
                    <div className="text-[13px] leading-5 text-fog">
                      <span className="font-mono text-xs text-ash">
                        {String(i + 1).padStart(2, "0")}{". "}
                      </span>

                      {q.prompt}
                    </div>
                    {err && (
                      <p
                        role="alert"
                        className="mt-2 text-xs text-danger"
                      >
                        {err}
                      </p>
                    )}

                    <div className="mt-3">
                      {q.inputType === "user_story" ? (
                        <Textarea
                          id={`answer-${q.id}`}
                          aria-label={q.prompt}
                          value={a.text}
                          disabled={a.skipped}
                          onChange={(e) =>
                            patch(q.id, {
                              text: e.target.value,
                            })
                          }
                          rows={4}
                          placeholder="Contoh: Sebagai pemilik warung, saya ingin mencatat penjualan harian lewat HP supaya tidak perlu buku tulis dan laporan langsung jadi."
                        />
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            {options.map((option) => {
                              const active =
                                a.selected.includes(option);

                              return (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={a.skipped}
                                  aria-pressed={active}
                                  onClick={() =>
                                    toggleOption(q, option)
                                  }
                                  className={cn(
                                    "rounded-md px-3 py-1.5 text-[13px] transition-colors duration-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-carbon disabled:pointer-events-none disabled:opacity-50",
                                    active
                                      ? "bg-accent-soft text-accent shadow-hairline"
                                      : "bg-white/[0.03] text-mist shadow-hairline hover:bg-white/[0.06]",
                                  )}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                              value={draftOption[q.id] ?? ""}
                              disabled={a.skipped}
                              aria-label={`Tambah opsi sendiri untuk pertanyaan ${
                                i + 1
                              }`}
                              placeholder="Tambah opsi sendiri..."
                              onChange={(e) =>
                                setDraftOption((prev) => ({
                                  ...prev,
                                  [q.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addCustomOption(q);
                                }
                              }}
                              className="h-9 sm:max-w-md"
                            />

                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={
                                a.skipped ||
                                !(draftOption[q.id] ?? "").trim()
                              }
                              onClick={() =>
                                addCustomOption(q)
                              }
                            >
                              Tambah opsi
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>



                    <div className="mt-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => toggleSkip(q)}
                        aria-pressed={a.skipped}
                        className="text-xs text-ash underline-offset-4 transition-colors duration-ui hover:text-fog hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-carbon"
                      >
                        {a.skipped
                          ? "Batalkan lewati"
                          : "Lewati pertanyaan ini"}
                      </button>
                    </div>


                  </fieldset>
                );
              })}
            </div>

            {/* Submit */}

            <div className="mt-6">
              <Button
                variant="primary"
                onClick={
                  submitAnswers
                }
                disabled={
                  busy !== null
                }
              >
                {saving
                  ? "Menyimpan..."
                  : "Kirim jawaban"}
              </Button>
            </div>
          </div>
        )}

      {/* =========================================================
          COMPLETE STATE
      ========================================================= */}

      {isComplete && (
        <div className="rounded-lg bg-carbon p-6 shadow-hairline">
          <p className="text-sm text-success">
            Informasi sudah cukup untuk menyusun PRD.
          </p>
        </div>
      )}

      {/* Error */}

      {error && (
        <p
          role="alert"
          className="text-[13px] text-danger"
        >
          {error}
        </p>
      )}

      {/* =========================================================
          ACTIONS
      ========================================================= */}

      <div className="flex flex-wrap items-center gap-3">
        {/* Coba lagi bila permintaan pertanyaan pertama gagal */}

        {showRetry && (
          <Button
            variant="primary"
            onClick={() => askAi()}
            disabled={busy !== null}
          >
            Coba lagi
          </Button>
        )}

        {/* Skip current questions */}

        {pendingQuestions.length > 0 &&
          !isComplete &&
          history.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => askAi()}
              disabled={busy !== null}
            >
              {asking
                ? "Memuat..."
                : "Lewati dan minta pertanyaan lain"}
            </Button>
          )}

        

        {/* Go to PRD */}

        {isComplete && (
          <Button
            variant="primary"
            onClick={() =>
              router.push(
                `/projects/${projectId}/prd`,
              )
            }
          >
            Lanjut buat PRD
          </Button>
        )}

        {/*
         * Setelah cukup, user tetap boleh menambah pertanyaan untuk
         * memperkaya informasi ke PRD. Tombol PRD tetap tersedia.
         */}

        {isComplete && (
          <Button
            variant="secondary"
            onClick={() => askAi(true)}
            disabled={busy !== null}
          >
            {asking
              ? "Memuat..."
              : "Tanya lagi"}
          </Button>
        )}

        {/* Answer count */}

        {answeredCount > 0 && (
          <span className="font-mono text-xs text-ash">
            {answeredCount} jawaban tersimpan
          </span>
        )}
      </div>
    </div>
  );
}
