"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogActions,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteProject } from "@/app/dashboard/actions";

export function ProjectActions({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onConfirm() {
    setPending(true);
    setError(null);

    const result = await deleteProject(projectId);

    if (result && "error" in result && result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.push("/dashboard");
  }

  function onOpenChange(value: boolean) {
    if (pending) return;

    setOpen(value);

    if (!value) {
      setError(null);
    }
  }

  return (
    <>
      {/* Delete action */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Hapus proyek"
        onClick={() => setOpen(true)}
        className="
          h-auto
          px-2
          py-1
          text-xs
          font-medium
          text-ash
          transition-colors
          hover:bg-danger/10
          hover:text-danger
        "
      >
        Hapus
      </Button>

      {/* Confirmation dialog */}
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        labelledBy="delete-project-title"
      >
        <DialogTitle id="delete-project-title">
          Hapus proyek ini?
        </DialogTitle>

        <DialogDescription>
          Ide, PRD, dan semua task di dalamnya ikut terhapus.
          Tindakan ini tidak bisa dibatalkan.
        </DialogDescription>

        {error && (
          <p
            role="alert"
            className="mt-4 text-[13px] text-danger"
          >
            {error}
          </p>
        )}

        <DialogActions>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Batal
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Menghapus..." : "Hapus permanen"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
