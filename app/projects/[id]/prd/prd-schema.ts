import { z } from "zod";
import { PrdSchema } from "@/lib/ai/schemas";

/** Bentuk data PRD untuk form edit; diturunkan dari skema AI agar konsisten. */
export const PrdInputSchema = PrdSchema;
export type PrdInput = z.infer<typeof PrdInputSchema>;

export function emptyPrd(): PrdInput {
  return {
    title: "",
    one_liner: "",
    problem: "",
    goals: [""],
    personas: [{ name: "", description: "" }],
    features: [{ name: "", description: "", priority: "must" }],
    tech_stack: { frontend: "", backend: "", database: "", other: [] },
    non_goals: [""],
  };
}
