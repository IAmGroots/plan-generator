export default function ProjectLoading() {
  return (
    <div className="max-w-3xl py-2" aria-busy="true" aria-live="polite">
      <div className="h-6 w-56 rounded-md bg-white/[0.04]" />
      <div className="mt-3 h-4 w-80 rounded-md bg-white/[0.03]" />
      <div className="mt-8 flex flex-col gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-40 rounded-lg bg-carbon shadow-hairline" />
        ))}
      </div>
      <span className="sr-only">Memuat langkah proyek</span>
    </div>
  );
}
