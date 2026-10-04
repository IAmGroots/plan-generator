import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ProjectActions } from "@/components/project-actions";
import {
  NEXT_ACTION_CTA,
  STATUS_LABEL,
  type Project,
  type ProjectStatus,
} from "@/lib/types";

const STATUS_VARIANT: Record<
  ProjectStatus,
  "neutral" | "accent" | "success"
> = {
  draft: "neutral",
  clarifying: "accent",
  clarified: "accent",
  prd_ready: "accent",
  tasks_ready: "success",
};

export function ProjectList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <Card className="flex flex-col items-start gap-3 p-8">
        <p className="text-sm font-medium text-mist">
          Belum ada proyek
        </p>

        <p className="max-w-md text-sm text-fog">
          Mulai dari satu ide. Tekan tombol Proyek baru di atas
          untuk menulisnya.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        const href =
          project.status === "draft"
            ? `/projects/${project.id}/idea`
            : `/projects/${project.id}/${nextStep(project.status)}`;

        return (
          <Card
            key={project.id}
            className="group relative flex flex-col overflow-hidden bg-carbon p-4 transition-colors duration-ui hover:bg-obsidian"
          >
            {/* Konten yang bisa diklik menuju proyek. Tombol Hapus sengaja
                diletakkan di luar Link agar kliknya tidak memicu navigasi. */}
            <Link
              href={href}
              className="flex flex-1 flex-col"
            >
              {/* Status + updated date */}
              <div className="flex items-center justify-between gap-3">
                <Badge variant={STATUS_VARIANT[project.status]}>
                  {STATUS_LABEL[project.status]}
                </Badge>

                <span className="shrink-0 font-mono text-xs text-ash">
                  {formatDate(project.updated_at)}
                </span>
              </div>

              {/* Title */}
              <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-paper">
                {project.title}
              </h3>

              {/* Description */}
              <p className="mt-2 min-h-[100px] line-clamp-5 text-[13px] leading-5 text-fog">
                {project.raw_idea || "Belum ada ide."}
              </p>
            </Link>

            {/* Bottom action: CTA (link) di kiri, Hapus (di luar link) di kanan */}
            <div className="mt-2 flex items-center justify-between gap-3">
              <Link
                href={href}
                className="text-xs font-medium text-ash transition-colors group-hover:text-paper"
              >
                {NEXT_ACTION_CTA[project.status]} →
              </Link>
              {/* Delete action */}
              <ProjectActions projectId={project.id} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Menentukan halaman berikutnya berdasarkan next action proyek.
 */
function nextStep(status: ProjectStatus): string {
  switch (status) {
    case "clarifying":
      return "clarify";

    case "clarified":
      return "prd";

    case "prd_ready":
      return "tasks";

    case "tasks_ready":
      return "export";

    default:
      return "idea";
  }
}
