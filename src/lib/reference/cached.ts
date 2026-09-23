import { z } from "zod";
import cache from "../../data/reference-cache.json";
import { officialDataset } from "../../data/dataset";
import { actionIdSchema, districtIdSchema } from "../../data/schema";
import { simulatePlan } from "../simulation/simulate";

const cachedSchema = z.object({
  plan: z.array(
    z.object({
      actionId: actionIdSchema,
      districtId: districtIdSchema.optional(),
    }),
  ),
  score: z.number(),
  spent: z.number(),
  method: z.literal("exhaustive"),
  complete: z.literal(true),
  evaluated: z.number().int().positive(),
  validCandidates: z.number().int().positive(),
  elapsedMs: z.number().positive(),
  datasetSha256: z.string(),
});
const parsed = cachedSchema.parse(cache);
export const referencePlan = parsed.plan.map((d) => ({
  actionId: d.actionId,
  ...(d.districtId ? { districtId: d.districtId } : {}),
}));
const result = simulatePlan(referencePlan, officialDataset);
if (
  !result.valid ||
  Math.abs(result.score - parsed.score) > 1e-9 ||
  result.spent !== parsed.spent
)
  throw new Error("Reference cache is stale; run reference:build");
export const referenceResult = result;
export const referenceMetadata = parsed;
