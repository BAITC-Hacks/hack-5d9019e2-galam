import { simulatePlan } from "../simulation/simulate";
import { validatePlan } from "../simulation/validate";
import type { ActionId, Decision, OfficialDataset } from "../simulation/types";

export type ReferenceStrategy = ReturnType<typeof searchReference>;

/** Enumerates each action combination and every target assignment once.
 * Only monotone budget/domain violations are pruned. Every leaf is officially
 * validated and every valid leaf is scored by the unchanged simulation engine.
 */
export function searchReference(
  dataset: OfficialDataset,
  options: {
    allowedActionIds?: readonly ActionId[];
    candidateLimit?: number;
  } = {},
) {
  const actions = dataset.actions.filter(
    (action) =>
      !options.allowedActionIds || options.allowedActionIds.includes(action.id),
  );
  let evaluated = 0;
  let validCandidates = 0;
  let complete = true;
  let best: { plan: Decision[]; score: number; spent: number } | undefined;
  const plan: Decision[] = [];
  const domains = new Map<string, number>();
  function visit(start: number, spent: number) {
    if (!complete) return;
    if (plan.length === dataset.rules.exactly_n_decisions) {
      if (
        options.candidateLimit !== undefined &&
        evaluated >= options.candidateLimit
      ) {
        complete = false;
        return;
      }
      evaluated++;
      if (!validatePlan(plan, dataset).valid) return;
      const result = simulatePlan(plan, dataset);
      if (!result.valid)
        throw new Error("Official validator/simulator disagreement");
      validCandidates++;
      if (
        !best ||
        result.score > best.score ||
        (result.score === best.score && result.spent < best.spent)
      )
        best = {
          plan: plan.map((d) => ({ ...d })),
          score: result.score,
          spent: result.spent,
        };
      return;
    }
    const remaining = dataset.rules.exactly_n_decisions - plan.length;
    for (let index = start; index <= actions.length - remaining; index++) {
      const action = actions[index]!;
      const count = domains.get(action.domain) ?? 0;
      if (
        spent + action.cost > dataset.rules.budget_max ||
        count >= dataset.rules.max_actions_per_domain
      )
        continue;
      domains.set(action.domain, count + 1);
      const targets =
        action.scope === "city"
          ? [undefined]
          : dataset.districts.map((d) => d.id);
      for (const districtId of targets) {
        plan.push({
          actionId: action.id,
          ...(districtId ? { districtId } : {}),
        });
        visit(index + 1, spent + action.cost);
        plan.pop();
        if (!complete) break;
      }
      domains.set(action.domain, count);
      if (!complete) break;
    }
  }
  visit(0, 0);
  if (!best) throw new Error("No valid reference plan found in search space");
  return {
    ...best,
    method: complete ? ("exhaustive" as const) : ("bounded" as const),
    complete,
    evaluated,
    validCandidates,
  };
}
