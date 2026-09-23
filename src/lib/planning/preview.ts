import { applyEffects } from "../simulation/effects";
import { scoreState } from "../simulation/score";
import { validatePlan } from "../simulation/validate";
import type { Decision, OfficialDataset } from "../simulation/types";

/** A labelled draft projection, never an official final result or a relaxed game mode. */
export function previewPlan(
  plan: readonly Decision[],
  dataset: OfficialDataset,
) {
  const validation = validatePlan(plan, dataset);
  const issues = validation.issues.filter(
    (issue) =>
      issue.code !== "WRONG_DECISION_COUNT" ||
      plan.length > dataset.rules.exactly_n_decisions,
  );
  if (issues.length) return { available: false as const, issues };
  const effects = applyEffects(validation.decisions, dataset);
  return {
    available: true as const,
    complete: validation.valid,
    ...effects,
    ...scoreState(effects.districtStates, dataset),
    spent: validation.spent,
    remaining: validation.remaining,
  };
}

export function availableDecisions(
  plan: readonly Decision[],
  dataset: OfficialDataset,
) {
  if (plan.length >= dataset.rules.exactly_n_decisions) return [];
  return dataset.actions
    .flatMap((action): Decision[] =>
      action.scope === "city"
        ? [{ actionId: action.id }]
        : dataset.districts.map((district) => ({
            actionId: action.id,
            districtId: district.id,
          })),
    )
    .filter((decision) => previewPlan([...plan, decision], dataset).available);
}

export function suggestDecisions(
  plan: readonly Decision[],
  dataset: OfficialDataset,
) {
  const current = previewPlan(plan, dataset);
  if (!current.available) return [];
  return availableDecisions(plan, dataset)
    .map((decision) => {
      const projection = previewPlan([...plan, decision], dataset);
      if (!projection.available)
        throw new Error("Candidate was validated before projection");
      return {
        decision,
        score: projection.score,
        delta: projection.score - current.score,
        criticalCount: projection.criticalCount,
        cost: dataset.actions.find((action) => action.id === decision.actionId)!
          .cost,
      };
    })
    .sort((a, b) => b.delta - a.delta || a.cost - b.cost);
}
