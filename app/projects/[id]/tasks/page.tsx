import { getPhasesWithTasks } from "@/lib/db/queries";
import { TasksView } from "./tasks-view";

export default async function TasksStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const phases = await getPhasesWithTasks(id);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium tracking-tight text-paper">
        Langkah 4 - Fase dan task
      </h1>
      <p className="mt-1.5 text-sm text-fog">
        {phases.length
          ? "Rencana kerja bertahap. Centang task saat selesai, atau ubah sesuai kebutuhan."
          : "Belum ada task. Pecah PRD jadi fase dan task yang bisa dicentang."}
      </p>
      <TasksView projectId={id} initialPhases={phases} />
    </div>
  );
}
