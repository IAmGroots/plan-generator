import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Alur 5 langkah adalah motif identitas PlanForge: diulang di landing dan di dalam app.
const STEPS = [
  { n: "01", title: "Tulis ide", desc: "Satu paragraf bebas. Belum perlu rapi." },
  { n: "02", title: "Jawab pertanyaan", desc: "AI menanyakan hal yang mengubah keputusan teknis." },
  { n: "03", title: "PRD siap", desc: "Masalah, tujuan, persona, fitur, tech stack, non-goal." },
  { n: "04", title: "Fase dan task", desc: "Rencana kerja bertahap yang bisa dicentang." },
  { n: "05", title: "Salin ke agent", desc: "Satu blok Markdown untuk ditempel ke AI coding agent." },
];

export default async function HomePage() {
  // Landing membaca sesi agar tidak menyuruh user yang sudah login untuk masuk
  // lagi. Konsekuensinya halaman ini dirender dinamis, bukan static.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);

  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-6">
      <header className="flex h-16 items-center justify-between border-b border-slate">
        <span className="font-medium tracking-tight text-paper">
          Plan<span className="text-accent">Forge</span>
        </span>
        <Link
          href={isLoggedIn ? "/dashboard" : "/login"}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          {isLoggedIn ? "Dashboard" : "Masuk"}
        </Link>
      </header>

      <section className="grid flex-1 grid-cols-1 items-center gap-16 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
        <div>
          <h1 className="max-w-xl text-balance text-4xl font-medium leading-[1.05] tracking-display text-paper sm:text-5xl md:text-[56px]">
            Dari ide mentah ke rencana kerja yang bisa dieksekusi
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-fog">
            PlanForge menanyai idemu sampai cukup jelas, menyusun PRD, lalu
            memecahnya jadi fase dan task. Hasilnya satu blok teks yang siap
            ditempel ke AI coding agent.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
            >
              Buat plan pertama
            </Link>
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
            >
              {isLoggedIn ? "Buka dashboard" : "Masuk ke akun"}
            </Link>
          </div>
        </div>

        <ol className="flex flex-col">
          {STEPS.map((step, i) => (
            <li
              key={step.n}
              className="relative flex gap-4 border-l border-slate pb-6 pl-6 last:pb-0"
            >
              <span
                className={
                  "absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-pill " +
                  (i === 0 ? "bg-accent" : "bg-slate")
                }
                aria-hidden="true"
              />
              <span className="w-7 shrink-0 pt-0.5 font-mono text-xs text-ash">
                {step.n}
              </span>
              <div>
                <p className="text-sm font-medium text-mist">{step.title}</p>
                <p className="mt-0.5 text-sm text-fog">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
