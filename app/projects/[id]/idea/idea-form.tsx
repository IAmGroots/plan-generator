"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveIdea } from "@/app/dashboard/actions";

export function IdeaForm({
  projectId,
  title,
  idea,
}: {
  projectId: string;
  title: string;
  idea: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function persist(formData: FormData) {
    const result = await saveIdea(projectId, formData);
    if (result && "error" in result && result.error) return result.error;
    return null;
  }

  async function onSave(formData: FormData) {
    setPending(true);
    setError(null);
    setSaved(false);
    const err = await persist(formData);
    if (err) setError(err);
    else setSaved(true);
    setPending(false);
  }

  async function onContinue(formData: FormData) {
    setPending(true);
    setError(null);
    const err = await persist(formData);
    if (err) {
      setError(err);
      setPending(false);
      return;
    }
    router.push(`/projects/${projectId}/clarify`);
  }

  return (
    <form action={onSave} className="mt-8 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Judul proyek</Label>
        <Input id="title" name="title" defaultValue={title} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="idea">Ide awal</Label>
        <Textarea
          id="idea"
          name="idea"
          defaultValue={idea}
          rows={10}
          placeholder="Tulis ide, masalah, dan siapa penggunanya..."
          required
        />
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-[13px] text-success">
          Ide tersimpan.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={pending}
          onClick={(e) => {
            const form = e.currentTarget.closest("form");
            if (form) onContinue(new FormData(form));
          }}
        >
          Lanjut ke klarifikasi
        </Button>
      </div>
    </form>
  );
}
