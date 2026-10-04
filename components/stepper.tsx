"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { slug: "idea", n: "01", label: "Ide" },
  { slug: "clarify", n: "02", label: "Klarifikasi" },
  { slug: "prd", n: "03", label: "PRD" },
  { slug: "tasks", n: "04", label: "Task" },
  { slug: "export", n: "05", label: "Salin" },
] as const;

export function Stepper({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Langkah plan">
      <ol className="flex flex-row gap-1 overflow-x-auto md:flex-col md:gap-0 md:overflow-visible">
        {STEPS.map((step, i) => {
          const href = `/projects/${projectId}/${step.slug}`;
          const active = pathname?.endsWith(`/${step.slug}`);
          return (
            <li key={step.slug} className="md:relative">
              <Link
                href={href}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-[13px] transition-colors duration-ui",
                  "md:py-3",
                  active
                    ? "bg-white/[0.04] text-paper"
                    : "text-fog hover:text-mist",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-xs",
                    active ? "text-accent" : "text-ash",
                  )}
                >
                  {step.n}
                </span>
                {step.label}
              </Link>
              {/* Rail vertikal menghubungkan langkah, motif identitas yang diulang. */}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="ml-[22px] hidden h-3 w-px bg-slate md:block"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
