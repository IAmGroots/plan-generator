"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { resetAgentTokenAction } from "./actions";

interface PhaseExport {
  title: string;
  index: number;
  markdown: string;
}

export function ExportView({
  projectId,
  agentToken,
  markdown,
  phases,
}: {
  projectId: string;
  agentToken: string | null;
  markdown: string;
  phases: PhaseExport[];
}) {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  // Token tetap dari server; token di state hanya berubah setelah Reset.
  const [token, setToken] = React.useState<string | null>(agentToken);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setToken(agentToken);
  }, [agentToken]);

  // Setelah Reset, markdown dari server masih memuat token lama. Ganti token
  // lama dengan yang baru agar pratinjau & salin tetap konsisten.
  const displayMarkdown = React.useMemo(() => {
    if (!agentToken || !token || agentToken === token) return markdown;
    return markdown.split(agentToken).join(token);
  }, [markdown, agentToken, token]);

  async function handleReset() {
    const confirmed = window.confirm(
      "Reset token? Agent yang sedang berjalan akan langsung kehilangan akses " +
        "dan blok Markdown perlu disalin ulang.",
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    const result = await resetAgentTokenAction(projectId);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.token) setToken(result.token);
  }

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
    const blob = new Blob([displayMarkdown], {
      type: "text/markdown;charset=utf-8",
    });
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
        <Button variant="primary" onClick={() => copy("all", displayMarkdown)}>
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

      <section className="rounded-lg bg-carbon p-5 shadow-hairline">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium text-mist">Token agent</h2>
            <p className="mt-0.5 text-[13px] text-fog">
              Dipakai AI coding agent untuk melaporkan task selesai ke PlanForge
              secara otomatis. Token ini tetap dan sudah tertanam di Markdown.
            </p>
          </div>
          <span className="font-mono text-xs text-accent">tetap</span>
        </header>

        {token ? (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-white/[0.03] px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-paper">
              {token}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copy("token", token)}
            >
              {copied === "token" ? "Tersalin" : "Salin"}
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-fog">
            Token belum tersedia. Muat ulang halaman untuk membuatnya otomatis.
          </p>
        )}

        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={busy}
          >
            {busy ? "Memproses..." : "Reset token (darurat)"}
          </Button>
          <p className="mt-2 text-[13px] text-ash">
            Reset hanya bila token bocor. Agent yang sedang berjalan akan
            kehilangan akses.
          </p>
        </div>
      </section>

      <section className="rounded-lg bg-carbon shadow-hairline">
        <header className="flex items-center justify-between gap-3 border-b border-slate px-4 py-3">
          <span className="font-mono text-xs text-ash">pratinjau markdown</span>
          <span className="font-mono text-xs text-ash">
            {displayMarkdown.length} karakter
          </span>
        </header>
        <pre className="max-h-[60vh] overflow-auto p-4 text-[13px] leading-relaxed text-mist">
          <code className="font-mono whitespace-pre-wrap">{displayMarkdown}</code>
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
