"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Prd, PrdFeature } from "@/lib/types";
import { emptyPrd, type PrdInput } from "./prd-schema";
import { savePrd } from "./actions";
import { PrdEditor } from "./prd-editor";

type Mode = "view" | "edit";

const PRIORITY_LABEL: Record<PrdFeature["priority"], string> = {
  must: "Wajib",
  should: "Sebaiknya",
  could: "Bisa nanti",
};

export function PrdView({
  projectId,
  initialPrd,
}: {
  projectId: string;
  initialPrd: Prd | null;
}) {
  const router = useRouter();
  const [prd, setPrd] = React.useState<Prd | null>(initialPrd);
  const [draft, setDraft] = React.useState<PrdInput | null>(null);
  const [mode, setMode] = React.useState<Mode>("view");
  const [busy, setBusy] = React.useState<"generate" | "save" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function generate() {
    setBusy("generate");
    setError(null);
    try {
      const res = await fetch("/api/ai/prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat PRD.");
      setPrd(toPrd(data));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(null);
    }
  }

  function startEdit() {
    setDraft(prd ? toInput(prd) : emptyPrd());
    setMode("edit");
  }

  async function submitEdit() {
    if (!draft) return;
    setBusy("save");
    setError(null);
    const result = await savePrd(projectId, draft);
    if (result && "error" in result && result.error) {
      setError(result.error);
      setBusy(null);
      return;
    }
    setPrd(toPrd(draft));
    setDraft(null);
    setMode("view");
    setBusy(null);
    router.refresh();
  }

  if (!prd && mode === "view") {
    return (
      <div className="mt-8">
        <div className="rounded-lg bg-carbon p-8 shadow-hairline">
          <p className="text-sm font-medium text-mist">PRD belum dibuat</p>
          <p className="mt-1 max-w-md text-sm text-fog">
            AI akan menyusun PRD dari ide dan jawaban klarifikasimu. Kamu bisa
            mengeditnya setelah jadi.
          </p>
          {error && (
            <p role="alert" className="mt-4 text-[13px] text-danger">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={generate}
              disabled={busy !== null}
            >
              {busy === "generate" ? "Menyusun PRD..." : "Buat PRD"}
            </Button>
            <Button
              variant="ghost"
              onClick={startEdit}
              disabled={busy !== null}
            >
              Tulis manual
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "edit" && draft) {
    return (
      <PrdEditor
        draft={draft}
        onChange={setDraft}
        onCancel={() => {
          setDraft(null);
          setMode("view");
        }}
        onSubmit={submitEdit}
        saving={busy === "save"}
        error={error}
      />
    );
  }

  if (!prd) return null;

  return (
    <article className="mt-8 flex flex-col gap-6">
      <header className="rounded-lg bg-carbon p-6 shadow-hairline">
        <h2 className="text-lg font-medium tracking-tight text-paper">
          {prd.title ?? "Tanpa judul"}
        </h2>
        {prd.one_liner && (
          <p className="mt-1.5 text-sm text-fog">{prd.one_liner}</p>
        )}
      </header>

      <PrdSection title="Masalah">
        <p className="text-sm leading-relaxed text-mist">{prd.problem}</p>
      </PrdSection>

      <PrdSection title="Tujuan">
        <ul className="flex flex-col gap-2">
          {prd.goals.map((g, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-mist">
              <span className="shrink-0 font-mono text-ash">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </PrdSection>

      <PrdSection title="Persona">
        <div className="flex flex-col gap-3">
          {prd.personas.map((p, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-mist">{p.name}</p>
              <p className="text-sm text-fog">{p.description}</p>
            </div>
          ))}
        </div>
      </PrdSection>

      <PrdSection title="Fitur">
        <ul className="flex flex-col gap-3">
          {prd.features.map((f, i) => (
            <li key={i} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-mist">{f.name}</p>
                <p className="text-[13px] text-fog">{f.description}</p>
              </div>
              <Badge variant={f.priority === "must" ? "accent" : "neutral"}>
                {PRIORITY_LABEL[f.priority]}
              </Badge>
            </li>
          ))}
        </ul>
      </PrdSection>

      <PrdSection title="Tech stack">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {prd.tech_stack.frontend && (
            <TechRow label="Frontend" value={prd.tech_stack.frontend} />
          )}
          {prd.tech_stack.backend && (
            <TechRow label="Backend" value={prd.tech_stack.backend} />
          )}
          {prd.tech_stack.database && (
            <TechRow label="Database" value={prd.tech_stack.database} />
          )}
          {prd.tech_stack.other?.map((o, i) => (
            <TechRow key={i} label="Lainnya" value={o} />
          ))}
        </dl>
      </PrdSection>

      <PrdSection title="Non-goal">
        <ul className="flex flex-col gap-2">
          {prd.non_goals.map((n, i) => (
            <li key={i} className="text-sm text-fog">
              {n}
            </li>
          ))}
        </ul>
      </PrdSection>

      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={startEdit}
          disabled={busy !== null}
        >
          Edit PRD
        </Button>
        <Button variant="ghost" onClick={generate} disabled={busy !== null}>
          {busy === "generate" ? "Menyusun ulang..." : "Buat ulang dengan AI"}
        </Button>
        <Button
          variant="primary"
          onClick={() => router.push(`/projects/${projectId}/tasks`)}
        >
          Lanjut ke task
        </Button>
      </div>
    </article>
  );
}

function PrdSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg bg-carbon p-6 shadow-hairline">
      <h3 className="mb-4 text-[13px] font-medium uppercase tracking-wide text-fog">
        {title}
      </h3>
      {children}
    </section>
  );
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-ash">{label}</dt>
      <dd className="text-sm text-mist">{value}</dd>
    </div>
  );
}

function toPrd(input: PrdInput): Prd {
  return {
    id: "",
    project_id: "",
    title: input.title,
    one_liner: input.one_liner,
    problem: input.problem,
    goals: input.goals,
    personas: input.personas,
    features: input.features,
    tech_stack: input.tech_stack,
    non_goals: input.non_goals,
    raw_markdown: null,
    created_at: new Date().toISOString(),
  };
}

function toInput(prd: Prd): PrdInput {
  return {
    title: prd.title ?? "",
    one_liner: prd.one_liner ?? "",
    problem: prd.problem ?? "",
    goals: prd.goals ?? [],
    personas: prd.personas ?? [],
    features: prd.features ?? [],
    tech_stack: {
      frontend: prd.tech_stack?.frontend ?? "",
      backend: prd.tech_stack?.backend ?? "",
      database: prd.tech_stack?.database ?? "",
      other: prd.tech_stack?.other ?? [],
    },
    non_goals: prd.non_goals ?? [],
  };
}
