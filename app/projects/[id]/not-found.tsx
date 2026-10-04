export default function ProjectNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs text-ash">404</p>
      <h1 className="mt-3 text-xl font-medium tracking-tight text-paper">
        Proyek tidak ditemukan
      </h1>
      <p className="mt-2 max-w-sm text-sm text-fog">
        Proyek ini mungkin sudah dihapus atau bukan milikmu.
      </p>
      <a
        href="/dashboard"
        className="mt-6 inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors duration-ui hover:bg-accent-strong"
      >
        Kembali ke daftar proyek
      </a>
    </main>
  );
}
