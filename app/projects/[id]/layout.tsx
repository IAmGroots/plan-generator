import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject } from "@/lib/db/queries";
import { Stepper } from "@/components/stepper";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="shrink-0 text-[13px] text-fog transition-colors duration-ui hover:text-mist"
            >
              Proyek
            </Link>
            <span className="text-ash" aria-hidden="true">
              /
            </span>
            <span className="truncate text-[13px] font-medium text-paper">
              {project.title}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 py-8 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <Stepper projectId={project.id} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
