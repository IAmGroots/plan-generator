"use client";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md py-16">
      <h1 className="text-lg font-medium tracking-tight text-paper">
        Terjadi kesalahan
      </h1>
      <p className="mt-2 text-sm text-fog">
        Halaman ini gagal dimuat. Coba muat ulang. Jika terus berulang, kembali
        ke daftar proyek.
      </p>
      <p className="mt-3 font-mono text-xs text-ash">
        {error.message || "Kesalahan tidak diketahui"}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors duration-ui hover:bg-accent-strong"
        >
          Coba lagi
        </button>
        <a
          href="/dashboard"
          className="inline-flex h-11 items-center rounded-md px-4 text-sm text-fog shadow-hairline transition-colors duration-ui hover:text-mist"
        >
          Ke daftar proyek
        </a>
      </div>
    </div>
  );
}
