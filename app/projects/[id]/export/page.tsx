import {
  getProject,
  getPrd,
  getPhasesWithTasks,
  ensureProjectAgentToken,
} from "@/lib/db/queries";
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

  const [prd, phases, agentToken] = await Promise.all([
    getPrd(id),
    getPhasesWithTasks(id),
    ensureProjectAgentToken(id),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  const markdown = buildExportMarkdown({
    project,
    prd,
    phases,
    siteUrl,
    agentToken,
  });

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
        projectId={id}
        agentToken={agentToken}
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
