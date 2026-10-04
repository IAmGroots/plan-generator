"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogActions,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { createProject } from "./actions";

export function CreateProjectButton() {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createProject(formData);
    // createProject melakukan redirect saat sukses; error dikembalikan sebagai objek.
    if (result && "error" in result && result.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Proyek baru
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        labelledBy="create-project-title"
      >
        <DialogTitle id="create-project-title">Proyek baru</DialogTitle>
        <DialogDescription>
          Beri judul singkat dan tulis idemu apa adanya. Langkah berikutnya AI
          akan bertanya untuk memperjelas.
        </DialogDescription>

        <form action={onSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Judul proyek</Label>
            <Input
              id="title"
              name="title"
              placeholder="mis. Aplikasi kasir UMKM"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="idea">Ide awal</Label>
            <Textarea
              id="idea"
              name="idea"
              placeholder="Tulis ide atau masalah yang mau diselesaikan..."
              rows={5}
              required
            />
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          )}

          <DialogActions className="!mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Membuat..." : "Buat proyek"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
