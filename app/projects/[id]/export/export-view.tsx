"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface PhaseExport {
  title: string;
  index: number;
  markdown: string;
}

export function ExportView({
  markdown,
  phases,
}: {
  markdown: string;
  phases: PhaseExport[];
}) {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function copy(label: string, text: string) {
    setError(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Gagal menyalin. Salin manual dari kotak di bawah.");
    }
  }

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PLAN.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => copy("all", markdown)}>
          {copied === "all" ? "Tersalin" : "Salin semua"}
        </Button>
        <Button variant="secondary" onClick={download}>
          Unduh PLAN.md
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}

      <section className="rounded-lg bg-carbon shadow-hairline">
        <header className="flex items-center justify-between gap-3 border-b border-slate px-4 py-3">
          <span className="font-mono text-xs text-ash">pratinjau markdown</span>
          <span className="font-mono text-xs text-ash">
            {markdown.length} karakter
          </span>
        </header>
        <pre className="max-h-[60vh] overflow-auto p-4 text-[13px] leading-relaxed text-mist">
          <code className="font-mono whitespace-pre-wrap">{markdown}</code>
        </pre>
      </section>

      {phases.length > 0 && (
        <section>
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-fog">
            Salin per fase
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {phases.map((p) => (
              <li
                key={p.index}
                className="flex items-center justify-between gap-3 rounded-md bg-carbon px-4 py-3 shadow-hairline"
              >
                <span className="truncate text-sm text-mist flex gap-3 items-center">
                  <span className="font-mono text-xs text-ash">
                    Fase {String(p.index + 1).padStart(2, "0")}
                  </span>{" "}
                  {p.title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copy(`${p.index}`, p.markdown)}
                >
                  {copied === `${p.index}` ? "Tersalin" : "Salin"}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[13px] text-ash">
        Tip: tempel blok penuh ke agent agar ia paham konteks, tech stack, dan
        urutan kerja sekaligus.
      </p>

      <div className="flex">
        <Button
          variant="secondary"
          onClick={() => {
            window.location.href = `/dashboard`;
          }}
        >
          Kembali ke daftar proyek
        </Button>
      </div>
    </div>
  );
}
