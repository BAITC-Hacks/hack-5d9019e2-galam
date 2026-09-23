import { z } from "zod";
import { actionIdSchema, districtIdSchema } from "../../data/schema";
import { officialDataset } from "../../data/dataset";

export const advisorRequestSchema = z.strictObject({
  plan: z
    .array(
      z.strictObject({
        actionId: actionIdSchema,
        districtId: districtIdSchema.optional(),
      }),
    )
    .max(officialDataset.rules.exactly_n_decisions),
  locale: z.enum(["en", "ru", "kk"]),
  topic: z.enum(["priority", "why", "risk", "plan", "compare", "reference"]),
  question: z.string().max(500).default(""),
  alternatives: z.tuple([actionIdSchema, actionIdSchema]).optional(),
  districtId: districtIdSchema.optional(),
});
export type AdvisorRequest = z.infer<typeof advisorRequestSchema>;
export const explanationSchema = z.strictObject({
  summary: z.string().min(1).max(600),
  answer: z.string().min(1).max(1600),
  strengths: z.array(z.string().max(400)).max(4),
  risks: z.array(z.string().max(400)).max(4),
  tradeoffs: z.array(z.string().max(400)).max(4),
  recommendedNextActions: z
    .array(
      z.strictObject({
        actionId: z.string(),
        districtId: z.string().nullable(),
        reason: z.string().max(400),
      }),
    )
    .max(3),
});

/** Numeric evidence is rendered from the engine, never accepted as model prose. */
export function containsNumericClaim(text: string) {
  return /\p{N}/u.test(text.replace(/\b(?:M\d+|[TESBC][12])\b/g, ""));
}

export function containsUnknownIdentifier(text: string) {
  const known = new Set<string>([
    ...officialDataset.actions.map((action) => action.id),
    ...Object.keys(officialDataset.indicators),
  ]);
  return (text.match(/\b(?:M\d+|[TESBC]\d+)\b/g) ?? []).some(
    (id) => !known.has(id),
  );
}
