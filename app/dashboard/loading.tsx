export default function DashboardLoading() {
  return (
    <div className="py-12" aria-busy="true" aria-live="polite">
      <div className="h-7 w-40 rounded-md bg-white/[0.04]" />
      <div className="mt-3 h-4 w-64 rounded-md bg-white/[0.03]" />
      <div className="mt-8 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-carbon shadow-hairline"
          />
        ))}
      </div>
      <span className="sr-only">Memuat daftar proyek</span>
    </div>
  );
}
