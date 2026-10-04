import { getProject, getPrd, getPhasesWithTasks } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { buildExportMarkdown, buildPhaseMarkdown } from "@/lib/export";
import { ExportView } from "./export-view";

export default async function ExportStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [prd, phases] = await Promise.all([
    getPrd(id),
    getPhasesWithTasks(id),
  ]);

  const markdown = buildExportMarkdown({ project, prd, phases });

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium tracking-tight text-paper">
        Langkah 5 - Salin ke agent
      </h1>
      <p className="mt-1.5 text-sm text-fog">
        Satu blok Markdown berisi konteks proyek, PRD, dan seluruh task. Tempel
        ke AI coding agent favoritmu.
      </p>
      <ExportView
        markdown={markdown}
        phases={phases.map((p, i) => ({
          title: p.title,
          index: i,
          markdown: buildPhaseMarkdown(p, i),
        }))}
      />
    </div>
  );
}
