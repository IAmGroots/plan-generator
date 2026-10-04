"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { PrdInput } from "./prd-schema";

export function PrdEditor({
  draft,
  onChange,
  onCancel,
  onSubmit,
  saving,
  error,
}: {
  draft: PrdInput;
  onChange: (next: PrdInput) => void;
  onCancel: () => void;
  onSubmit: () => void;
  saving: boolean;
  error: string | null;
}) {
  function set<K extends keyof PrdInput>(key: K, value: PrdInput[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <section className="rounded-lg bg-carbon p-6 shadow-hairline">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="prd-title">Judul</Label>
            <Input
              id="prd-title"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="prd-oneliner">Ringkasan satu kalimat</Label>
            <Input
              id="prd-oneliner"
              value={draft.one_liner}
              onChange={(e) => set("one_liner", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="prd-problem">Masalah</Label>
            <Textarea
              id="prd-problem"
              value={draft.problem}
              rows={4}
              onChange={(e) => set("problem", e.target.value)}
            />
          </div>
        </div>
      </section>

      <ListEditor
        title="Tujuan"
        items={draft.goals}
        onChange={(items) => set("goals", items)}
        placeholder="Tujuan terukur"
      />

      <section className="rounded-lg bg-carbon p-6 shadow-hairline">
        <h3 className="mb-4 text-[13px] font-medium uppercase tracking-wide text-fog">
          Persona
        </h3>
        <div className="flex flex-col gap-4">
          {draft.personas.map((p, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Input
                value={p.name}
                placeholder="Nama persona"
                onChange={(e) => {
                  const next = [...draft.personas];
                  next[i] = { ...next[i], name: e.target.value };
                  set("personas", next);
                }}
              />
              <Input
                value={p.description}
                placeholder="Deskripsi"
                onChange={(e) => {
                  const next = [...draft.personas];
                  next[i] = { ...next[i], description: e.target.value };
                  set("personas", next);
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-carbon p-6 shadow-hairline">
        <h3 className="mb-4 text-[13px] font-medium uppercase tracking-wide text-fog">
          Fitur
        </h3>
        <div className="flex flex-col gap-4">
          {draft.features.map((f, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Input
                value={f.name}
                placeholder="Nama fitur"
                onChange={(e) => {
                  const next = [...draft.features];
                  next[i] = { ...next[i], name: e.target.value };
                  set("features", next);
                }}
              />
              <Textarea
                value={f.description}
                rows={2}
                placeholder="Deskripsi"
                onChange={(e) => {
                  const next = [...draft.features];
                  next[i] = { ...next[i], description: e.target.value };
                  set("features", next);
                }}
              />
              <div className="flex gap-1">
                {(["must", "should", "could"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      const next = [...draft.features];
                      next[i] = { ...next[i], priority: p };
                      set("features", next);
                    }}
                    className={
                      "h-8 rounded-sm px-3 text-[13px] transition-colors duration-ui " +
                      (f.priority === p
                        ? "bg-accent-soft text-accent"
                        : "text-fog hover:text-mist")
                    }
                  >
                    {p === "must" ? "Wajib" : p === "should" ? "Sebaiknya" : "Bisa nanti"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-carbon p-6 shadow-hairline">
        <h3 className="mb-4 text-[13px] font-medium uppercase tracking-wide text-fog">
          Tech stack
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(["frontend", "backend", "database"] as const).map((key) => (
            <div key={key} className="flex flex-col gap-2">
              <Label htmlFor={`tech-${key}`} className="capitalize">
                {key}
              </Label>
              <Input
                id={`tech-${key}`}
                value={draft.tech_stack[key] ?? ""}
                onChange={(e) =>
                  set("tech_stack", { ...draft.tech_stack, [key]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
      </section>

      <ListEditor
        title="Non-goal"
        items={draft.non_goals}
        onChange={(items) => set("non_goals", items)}
        placeholder="Yang sengaja tidak dikerjakan"
      />

      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={onSubmit} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan PRD"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Batal
        </Button>
      </div>
    </div>
  );
}

function ListEditor({
  title,
  items,
  onChange,
  placeholder,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <section className="rounded-lg bg-carbon p-6 shadow-hairline">
      <h3 className="mb-4 text-[13px] font-medium uppercase tracking-wide text-fog">
        {title}
      </h3>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={item}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              aria-label={`Hapus ${title} ${i + 1}`}
            >
              Hapus
            </Button>
          </div>
        ))}
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onChange([...items, ""])}
          >
            Tambah
          </Button>
        </div>
      </div>
    </section>
  );
}
