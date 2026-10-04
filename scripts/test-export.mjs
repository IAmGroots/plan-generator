/**
 * Uji generator Markdown export dengan data contoh.
 * Usage: node --experimental-strip-types scripts/test-export.mjs
 */
import { buildExportMarkdown, buildPhaseMarkdown } from "../lib/export.ts";

const project = {
  id: "p1", user_id: "u1", title: "Kasir UMKM",
  raw_idea: "Aplikasi kasir UMKM: cetak struk dan lacak stok.",
  status: "tasks_ready", created_at: "", updated_at: "",
};

const prd = {
  id: "prd1", project_id: "p1", title: "Kasir UMKM",
  one_liner: "Kasir web ringan untuk warung.",
  problem: "Pencatatan manual rawan salah.",
  goals: ["Catat transaksi < 10 detik", "Pantau stok real-time"],
  personas: [{ name: "Pemilik warung", description: "Usaha kecil" }],
  features: [
    { name: "Transaksi", description: "Input dan bayar", priority: "must" },
    { name: "Laporan", description: "Rekap harian", priority: "should" },
  ],
  tech_stack: { frontend: "Next.js", backend: "Supabase", database: "Postgres", other: ["Docker"] },
  non_goals: ["Mobile native"],
  raw_markdown: null, created_at: "",
};

const phases = [
  {
    id: "ph1", project_id: "p1", order_index: 0, title: "Setup", description: "Fondasi.",
    created_at: "",
    tasks: [
      { id: "t1", phase_id: "ph1", order_index: 0, title: "Init project", detail: "Next.js + TS", is_done: true, created_at: "" },
      { id: "t2", phase_id: "ph1", order_index: 1, title: "Setup DB", detail: null, is_done: false, created_at: "" },
    ],
  },
];

const md = buildExportMarkdown({ project, prd, phases });
console.log("=== MARKDOWN ===");
console.log(md);
console.log("\n=== PER FASE ===");
console.log(buildPhaseMarkdown(phases[0], 0));

const checks = {
  "ada judul": md.includes("# Kasir UMKM"),
  "ada ide": md.includes("## Ide awal"),
  "ada PRD": md.includes("## PRD"),
  "ada tech stack": md.includes("### Tech stack"),
  "task done [x]": md.includes("- [x] Init project"),
  "task belum [ ]": md.includes("- [ ] Setup DB"),
  "fase bernomor": md.includes("### Fase 1: Setup"),
  "non-goal": md.includes("Mobile native"),
  "tanpa em dash": !md.includes("\u2014"),
};
console.log("\n=== CHECKS ===");
Object.entries(checks).forEach(([k, v]) => console.log(`${v ? "OK " : "X  "} ${k}`));
console.log("\nsemua lolos:", Object.values(checks).every(Boolean));
