import { applyEffects } from "./effects";
import { scoreState } from "./score";
import type { OfficialDataset, SimulationResult } from "./types";
import { validatePlan } from "./validate";

export function simulatePlan(plan: unknown, dataset: OfficialDataset): SimulationResult {
  const validation = validatePlan(plan, dataset);
  const budget = { spent: validation.spent, remaining: validation.remaining };
  if (!validation.valid) {
    return { ...budget, valid: false, issues: validation.issues, score: null, districtStates: [], actionContributions: [], synergiesTriggered: [] };
  }
  const effects = applyEffects(validation.decisions, dataset);
  return { ...budget, ...effects, ...scoreState(effects.districtStates, dataset), valid: true, issues: [] };
}
