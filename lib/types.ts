export type ProjectStatus =
  | "draft"
  | "clarifying"
  | "clarified"
  | "prd_ready"
  | "tasks_ready";

export interface Project {
  id: string;
  user_id: string;
  title: string;
  raw_idea: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface PrdFeature {
  name: string;
  description: string;
  priority: "must" | "should" | "could";
}

export interface PrdPersona {
  name: string;
  description: string;
}

export interface PrdTechStack {
  frontend?: string;
  backend?: string;
  database?: string;
  other?: string[];
}

export interface Prd {
  id: string;
  project_id: string;
  title: string | null;
  one_liner: string | null;
  problem: string | null;
  goals: string[];
  personas: PrdPersona[];
  features: PrdFeature[];
  tech_stack: PrdTechStack;
  non_goals: string[];
  raw_markdown: string | null;
  created_at: string;
}

export interface ClarifyMessage {
  id: string;
  project_id: string;
  role: "assistant" | "user";
  content: string;
  created_at: string;
}

export interface Phase {
  id: string;
  project_id: string;
  order_index: number;
  title: string;
  description: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  phase_id: string;
  order_index: number;
  title: string;
  detail: string | null;
  is_done: boolean;
  /** Kode human-readable, mis. "T-3-2" (fase 3, task 2). Dipakai agent. */
  short_id: string | null;
  /** Waktu task ditandai selesai (biner: ada isi = selesai). */
  completed_at: string | null;
  created_at: string;
}

/**
 * Label badge di Dashboard. Ini merepresentasikan NEXT ACTION yang perlu
 * dilakukan user pada step tersebut, bukan sekadar nama statusnya.
 */
export const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "Kembangkan Ide",
  clarifying: "Butuh Klarifikasi",
  clarified: "Buat PRD",
  prd_ready: "Susun Task",
  tasks_ready: "Mulai Eksekusi",
};

/** Teks ajakan pada tombol card Dashboard, sejalan dengan next action. */
export const NEXT_ACTION_CTA: Record<ProjectStatus, string> = {
  draft: "Kembangkan ide",
  clarifying: "Butuh klarifikasi",
  clarified: "Buat PRD",
  prd_ready: "Susun task",
  tasks_ready: "Mulai eksekusi",
};
