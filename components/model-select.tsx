"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Combobox, type ComboboxItem } from "@/components/ui/combobox";
import { saveAiModel, resetAiModel } from "@/app/settings/actions";

interface AiModel {
  id: string;
  owned_by: string;
  reasoning: boolean;
}

export function ModelSelect({
  models,
  current,
  defaultModel,
}: {
  models: AiModel[] | null;
  current: string | null;
  defaultModel: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState(current ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState<string | null>(null);

  const activeModel = current ?? defaultModel;

  // Siapkan item combobox, dikelompokkan per provider, dengan opsi default.
  const items = React.useMemo<ComboboxItem[]>(() => {
    if (!models) return [];
    const list: ComboboxItem[] = [
      {
        value: defaultModel,
        label: defaultModel,
        group: "Default",
      },
    ];
    const sorted = [...models].sort(
      (a, b) =>
        a.owned_by.localeCompare(b.owned_by) || a.id.localeCompare(b.id),
    );
    for (const m of sorted) {
      list.push({
        value: m.id,
        label: m.reasoning ? `${m.id}  [reasoning]` : m.id,
        group: m.owned_by === "combo" ? "combo (sebagian tanpa JSON)" : m.owned_by,
      });
    }
    return list;
  }, [models, defaultModel]);

  async function onSave() {
    setBusy(true);
    setError(null);
    setSaved(null);
    const result = await saveAiModel(selected);
    if (result && "error" in result && result.error) {
      setError(result.error);
    } else {
      setSaved(selected);
      router.refresh();
    }
    setBusy(false);
  }

  async function onReset() {
    setBusy(true);
    setError(null);
    setSaved(null);
    const result = await resetAiModel();
    if (result && "error" in result && result.error) {
      setError(result.error);
    } else {
      setSelected("");
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <section className="rounded-lg bg-carbon p-6 shadow-hairline">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-fog">Model aktif</span>
        <Badge variant="accent">{activeModel || "tidak ada"}</Badge>
        {!current && (
          <span className="text-[13px] text-ash">
            (default dari env AI_MODEL)
          </span>
        )}
      </div>

      {!models && (
        <p className="mt-6 text-[13px] text-danger">
          Gagal memuat daftar model dari 9Router. Pastikan 9Router aktif lalu
          muat ulang halaman.
        </p>
      )}

      {models && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="model-select">Pilih model</Label>
            <Combobox
              id="model-select"
              items={items}
              value={selected}
              onChange={setSelected}
              placeholder="Gunakan default"
            />
            <p className="text-[13px] text-ash">
              Ketik untuk mencari (mis. nama provider atau model). Model
              bertanda [reasoning] boros token. Model di grup combo bisa gagal
              karena tidak semua mendukung mode JSON, jika itu terjadi ganti ke
              model lain.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="text-[13px] text-success">
              Model disimpan: {saved}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={onSave} disabled={busy}>
              {busy ? "Menyimpan..." : "Simpan model"}
            </Button>
            <Button variant="ghost" onClick={onReset} disabled={busy}>
              Pakai default
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
