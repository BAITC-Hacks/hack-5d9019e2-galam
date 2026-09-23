import { officialDataset } from "../src/data/dataset";
import type { Decision } from "../src/lib/simulation/types";

export const examplePlan: readonly Decision[] = officialDataset.reference_plan_from_source.plan.map((decision) => ({
  actionId: decision.action_id,
  ...(decision.district === null ? {} : { districtId: decision.district }),
}));
