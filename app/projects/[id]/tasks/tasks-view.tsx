"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useTasksRealtime } from "@/components/use-tasks-realtime";
import type { PhaseWithTasks } from "@/lib/db/queries";
import {
  addTask,
  deleteTask,
  toggleTask,
  updateTask,
} from "./actions";

export function TasksView({
  projectId,
  initialPhases,
}: {
  projectId: string;
  initialPhases: PhaseWithTasks[];
}) {
  const router = useRouter();
  const [phases, setPhases] = React.useState(initialPhases);
  const [busy, setBusy] = React.useState<"generate" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPhases(initialPhases);
  }, [initialPhases]);

  // Perubahan dari agent (atau tab lain) langsung menyegarkan checkbox.
  useTasksRealtime(projectId, (change) => {
    setPhases((prev) =>
      prev.map((p) => ({
        ...p,
        tasks: p.tasks.map((t) =>
          t.id === change.id
            ? { ...t, is_done: change.is_done, completed_at: change.completed_at }
            : t,
        ),
      })),
    );
  });

  async function generate() {
    setBusy("generate");
    setError(null);
    try {
      const res = await fetch("/api/ai/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat task.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(null);
    }
  }

  async function onToggle(taskId: string, checked: boolean) {
    // Optimistis dulu, lalu simpan.
    setPhases((prev) =>
      prev.map((p) => ({
        ...p,
        tasks: p.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                is_done: checked,
                completed_at: checked ? new Date().toISOString() : null,
              }
            : t,
        ),
      })),
    );
    const result = await toggleTask(taskId, checked);
    if (result && "error" in result && result.error) {
      setError(result.error);
      router.refresh();
    }
  }

  if (phases.length === 0) {
    return (
      <div className="mt-8">
        <div className="rounded-lg bg-carbon p-8 shadow-hairline">
          <p className="text-sm font-medium text-mist">Task belum dibuat</p>
          <p className="mt-1 max-w-md text-sm text-fog">
            AI akan memecah PRD menjadi beberapa fase, tiap fase berisi task
            yang bisa dicentang.
          </p>
          {error && (
            <p role="alert" className="mt-4 text-[13px] text-danger">
              {error}
            </p>
          )}
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={generate}
              disabled={busy !== null}
            >
              {busy === "generate" ? "Menyusun task..." : "Buat task dari PRD"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
  const doneTasks = phases.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.is_done).length,
    0,
  );

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs text-ash">
          {doneTasks}/{totalTasks} task selesai
        </span>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={generate} disabled={busy !== null}>
            {busy === "generate" ? "Menyusun ulang..." : "Buat ulang dengan AI"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/export`)}
          >
            Lanjut ke salin
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}

      {phases.map((phase, pi) => (
        <PhaseBlock
          key={phase.id}
          phase={phase}
          phaseNumber={pi + 1}
          onToggle={onToggle}
          onChanged={() => router.refresh()}
          onError={setError}
        />
      ))}
    </div>
  );
}

function PhaseBlock({
  phase,
  phaseNumber,
  onToggle,
  onChanged,
  onError,
}: {
  phase: PhaseWithTasks;
  phaseNumber: number;
  onToggle: (taskId: string, checked: boolean) => void;
  onChanged: () => void;
  onError: (msg: string) => void;
}) {
  const [editing, setEditing] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");

  return (
    <section className="rounded-lg bg-carbon p-6 shadow-hairline">
      <header className="flex items-start gap-3">
        {/*<span className="mt-0.5 font-mono text-xs text-accent">
          FASE {String(phaseNumber).padStart(2, "0")}
        </span>*/}
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-accent">{phase.title}</h2>
          {phase.description && (
            <p className="mt-0.5 text-[13px] text-fog">{phase.description}</p>
          )}
        </div>
      </header>

      <ul className="mt-5 flex flex-col gap-1">
        {phase.tasks.map((task) =>
          editing === task.id ? (
            <TaskEditor
              key={task.id}
              title={task.title}
              detail={task.detail ?? ""}
              onCancel={() => setEditing(null)}
              onSave={async (t, d) => {
                const result = await updateTask(task.id, t, d);
                if (result && "error" in result && result.error) {
                  onError(result.error);
                  return;
                }
                setEditing(null);
                onChanged();
              }}
            />
          ) : (
            <li
              key={task.id}
              className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors duration-ui hover:bg-white/[0.02]"
            >
              <Checkbox
                checked={task.is_done}
                onCheckedChange={(checked) => onToggle(task.id, checked)}
                aria-label={`Tandai selesai: ${task.title}`}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={
                    "text-sm " +
                    (task.is_done
                      ? "text-ash line-through"
                      : "text-mist")
                  }
                >
                  {task.short_id && (
                    <span className="mr-2 font-mono text-xs text-accent">
                      {task.short_id}
                    </span>
                  )}
                  {task.title}
                </p>
                {task.detail && (
                  <p className="mt-0.5 text-[13px] text-fog">{task.detail}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity duration-ui group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => setEditing(task.id)}
                  className="rounded-sm px-2 py-1 text-xs text-fog hover:text-mist"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const result = await deleteTask(task.id);
                    if (result && "error" in result && result.error) {
                      onError(result.error);
                      return;
                    }
                    onChanged();
                  }}
                  className="rounded-sm px-2 py-1 text-xs text-fog hover:text-danger"
                >
                  Hapus
                </button>
              </div>
            </li>
          ),
        )}
      </ul>

      {adding ? (
        <div className="mt-4 flex items-center gap-2">
          <Input
            value={newTitle}
            autoFocus
            placeholder="Judul task baru"
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && newTitle.trim()) {
                const result = await addTask(phase.id, newTitle);
                if (result && "error" in result && result.error) {
                  onError(result.error);
                  return;
                }
                setNewTitle("");
                setAdding(false);
                onChanged();
              }
              if (e.key === "Escape") {
                setAdding(false);
                setNewTitle("");
              }
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (!newTitle.trim()) return;
              const result = await addTask(phase.id, newTitle);
              if (result && "error" in result && result.error) {
                onError(result.error);
                return;
              }
              setNewTitle("");
              setAdding(false);
              onChanged();
            }}
          >
            Tambah
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAdding(false);
              setNewTitle("");
            }}
          >
            Batal
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
          >
            Tambah task
          </Button>
        </div>
      )}
    </section>
  );
}

function TaskEditor({
  title,
  detail,
  onCancel,
  onSave,
}: {
  title: string;
  detail: string;
  onCancel: () => void;
  onSave: (title: string, detail: string) => void;
}) {
  const [t, setT] = React.useState(title);
  const [d, setD] = React.useState(detail);
  return (
    <li className="flex flex-col gap-2 rounded-md bg-white/[0.02] p-3">
      <Input value={t} onChange={(e) => setT(e.target.value)} />
      <Textarea value={d} rows={2} onChange={(e) => setD(e.target.value)} />
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={() => onSave(t, d)}>
          Simpan
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </li>
  );
}
