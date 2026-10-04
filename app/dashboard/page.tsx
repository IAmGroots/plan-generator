import { listProjects } from "@/lib/db/queries";
import { ProjectList } from "./project-list";
import { CreateProjectButton } from "./create-project-button";

export default async function DashboardPage() {
  const projects = await listProjects();

  return (
    <div className="py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-paper">
            Proyek kamu
          </h1>
          <p className="mt-1.5 text-sm text-fog">
            Setiap proyek bergerak dari ide, PRD, sampai daftar task.
          </p>
        </div>
        <CreateProjectButton />
      </div>

      <div className="mt-8">
        <ProjectList projects={projects} />
      </div>
    </div>
  );
}
