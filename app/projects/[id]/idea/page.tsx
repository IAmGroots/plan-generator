import { notFound } from "next/navigation";
import { getProject } from "@/lib/db/queries";
import { IdeaForm } from "./idea-form";

export default async function IdeaStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-medium tracking-tight text-paper">
        Langkah 1 - Tulis idemu
      </h1>
      <p className="mt-1.5 text-sm text-fog">
        Deskripsikan idemu apa adanya. Semakin jelas masalah dan targetnya,
        semakin sedikit pertanyaan lanjutan dari AI.
      </p>
      <IdeaForm
        projectId={project.id}
        title={project.title}
        idea={project.raw_idea ?? ""}
      />
    </div>
  );
}
