import type { Prd, Project } from "@/lib/types";
import type { PhaseWithTasks } from "@/lib/db/queries";

const PRIORITY_LABEL: Record<string, string> = {
  must: "Wajib",
  should: "Sebaiknya",
  could: "Bisa nanti",
};

export interface ExportBundle {
  project: Project;
  prd: Prd | null;
  phases: PhaseWithTasks[];
  /** Base URL aplikasi, untuk menyusun perintah curl laporan agent. */
  siteUrl?: string;
  /** Token agent tetap proyek, disisipkan ke instruksi pelaporan. */
  agentToken?: string | null;
}

/** Baris task dengan short-id + penanda centang. */
function taskLine(task: { short_id: string | null; title: string; is_done: boolean }): string {
  const box = task.is_done ? "[x]" : "[ ]";
  const id = task.short_id ? `${task.short_id} ` : "";
  return `- ${box} ${id}${task.title}`;
}

/**
 * Menyusun satu blok Markdown yang siap ditempel ke AI coding agent: konteks
 * proyek, PRD, lalu daftar fase dan task (dengan penanda centang + short-id),
 * ditutup instruksi pelaporan otomatis via endpoint agent.
 */
export function buildExportMarkdown({
  project,
  prd,
  phases,
  siteUrl,
  agentToken,
}: ExportBundle): string {
  const lines: string[] = [];

  lines.push(`# ${project.title}`);
  lines.push("");

  if (project.raw_idea) {
    lines.push("## Ide awal");
    lines.push("");
    lines.push(project.raw_idea.trim());
    lines.push("");
  }

  if (prd) {
    lines.push("## PRD");
    lines.push("");
    if (prd.one_liner) {
      lines.push(`**Ringkasan:** ${prd.one_liner}`);
      lines.push("");
    }
    if (prd.problem) {
      lines.push("### Masalah");
      lines.push("");
      lines.push(prd.problem.trim());
      lines.push("");
    }
    if (prd.goals?.length) {
      lines.push("### Tujuan");
      lines.push("");
      prd.goals.forEach((g) => lines.push(`- ${g}`));
      lines.push("");
    }
    if (prd.personas?.length) {
      lines.push("### Persona");
      lines.push("");
      prd.personas.forEach((p) => lines.push(`- **${p.name}**: ${p.description}`));
      lines.push("");
    }
    if (prd.features?.length) {
      lines.push("### Fitur");
      lines.push("");
      prd.features.forEach((f) =>
        lines.push(
          `- **${f.name}** (${PRIORITY_LABEL[f.priority] ?? f.priority}): ${f.description}`,
        ),
      );
      lines.push("");
    }
    const tech = prd.tech_stack ?? {};
    const techLines = [
      tech.frontend ? `- Frontend: ${tech.frontend}` : null,
      tech.backend ? `- Backend: ${tech.backend}` : null,
      tech.database ? `- Database: ${tech.database}` : null,
      ...(tech.other ?? []).map((o) => `- ${o}`),
    ].filter(Boolean);
    if (techLines.length) {
      lines.push("### Tech stack");
      lines.push("");
      lines.push(...(techLines as string[]));
      lines.push("");
    }
    if (prd.non_goals?.length) {
      lines.push("### Non-goal");
      lines.push("");
      prd.non_goals.forEach((n) => lines.push(`- ${n}`));
      lines.push("");
    }
  }

  if (phases.length) {
    lines.push("## Rencana kerja");
    lines.push("");
    phases.forEach((phase, i) => {
      lines.push(`### Fase ${i + 1}: ${phase.title}`);
      lines.push("");
      if (phase.description) {
        lines.push(phase.description);
        lines.push("");
      }
      phase.tasks.forEach((task) => {
        lines.push(taskLine(task));
        if (task.detail) {
          lines.push(`      ${task.detail}`);
        }
      });
      lines.push("");
    });
  }

  // Instruksi pelaporan otomatis ke PlanForge.
  const base = (siteUrl ?? "").replace(/\/+$/, "");
  if (base && agentToken) {
    lines.push("## Pelaporan progres otomatis ke PlanForge");
    lines.push("");
    lines.push(
      "Setiap kali kamu menyelesaikan satu task di atas, tandai selesai di PlanForge dengan menjalankan perintah berikut (ganti `T-x-y` sesuai short-id task):",
    );
    lines.push("");
    lines.push("```bash");
    lines.push(`curl -X POST "${base}/api/agent/tasks/T-x-y/complete" \\`);
    lines.push(`  -H "Authorization: Bearer ${agentToken}" \\`);
    lines.push(`  -H "X-Project-Id: ${project.id}"`);
    lines.push("```");
    lines.push("");
    lines.push(
      "Respons `200 OK` menandakan task sudah tercentang di website PlanForge.",
    );
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(
    "_Dibuat dengan PlanForge. Centang task di atas saat selesai, dan tempel blok ini ke AI coding agent._",
  );

  return lines.join("\n");
}

/** Markdown untuk satu fase saja. */
export function buildPhaseMarkdown(
  phase: PhaseWithTasks,
  index: number,
): string {
  const lines: string[] = [];
  lines.push(`### Fase ${index + 1}: ${phase.title}`);
  lines.push("");
  if (phase.description) {
    lines.push(phase.description);
    lines.push("");
  }
  phase.tasks.forEach((task) => {
    lines.push(taskLine(task));
    if (task.detail) lines.push(`      ${task.detail}`);
  });
  return lines.join("\n");
}
