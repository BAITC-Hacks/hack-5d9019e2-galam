import type { DistrictId, OfficialDataset, ValidatedDecision, ValidationIssue, ValidationResult } from "./types";

/** Accept unknown at the public boundary, including values from future saved plans. */
export function validatePlan(plan: unknown, dataset: OfficialDataset): ValidationResult {
  const issues: ValidationIssue[] = [];
  const decisions: ValidatedDecision[] = [];
  const add = (code: ValidationIssue["code"], details: Omit<ValidationIssue, "code" | "messageKey"> = {}) => issues.push({ code, messageKey: `validation.${code.toLowerCase()}`, ...details });
  let spent = 0;
  if (!Array.isArray(plan)) {
    add("INVALID_PLAN");
    return { valid: false, issues, spent, remaining: dataset.rules.budget_max, decisions };
  }
  if (plan.length !== dataset.rules.exactly_n_decisions) add("WRONG_DECISION_COUNT");
  const seen = new Set<string>();
  const domains = new Map<string, string[]>();
  for (const entry of plan) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.actionId !== "string") {
      add("INVALID_DECISION");
      continue;
    }
    if (Object.keys(entry).some((key) => key !== "actionId" && key !== "districtId")) add("INVALID_DECISION", { actionIds: [entry.actionId] });
    const id: string = entry.actionId;
    if (seen.has(id)) add("DUPLICATE_ACTION", { actionIds: [id] });
    seen.add(id);
    const action = dataset.actions.find((candidate) => candidate.id === id);
    if (!action) {
      add("UNKNOWN_ACTION", { actionIds: [id] });
      continue;
    }
    spent += action.cost;
    domains.set(action.domain, [...(domains.get(action.domain) ?? []), id]);
    const district = dataset.districts.find((candidate) => candidate.id === entry.districtId);
    if (action.scope === "city") {
      if (Object.hasOwn(entry, "districtId")) add("UNEXPECTED_DISTRICT", { actionIds: [id] });
      decisions.push({ action });
    } else if (entry.districtId === undefined || entry.districtId === null || entry.districtId === "") {
      add("MISSING_DISTRICT", { actionIds: [id] });
    } else if (!district) {
      add("UNKNOWN_DISTRICT", { actionIds: [id], ...(typeof entry.districtId === "string" ? { districtId: entry.districtId } : {}) });
    } else {
      decisions.push({ action, districtId: district.id });
    }
  }
  if (spent > dataset.rules.budget_max) add("BUDGET_EXCEEDED");
  for (const actionIds of domains.values()) {
    if (actionIds.length > dataset.rules.max_actions_per_domain) add("DOMAIN_LIMIT", { actionIds });
  }
  for (const incompatibility of dataset.incompatibilities) {
    const [a, b] = incompatibility.actions;
    if (!seen.has(a) || !seen.has(b)) continue;
    if (incompatibility.rule === "global") {
      add("INCOMPATIBILITY", { actionIds: [a, b] });
    } else {
      const firstTargets = decisions.filter((d) => d.action.id === a).map((d) => d.districtId);
      const conflicts = new Set(decisions.filter((d) => d.action.id === b && d.districtId && firstTargets.includes(d.districtId)).map((d) => d.districtId as DistrictId));
      for (const districtId of conflicts) add("INCOMPATIBILITY", { actionIds: [a, b], districtId });
    }
  }
  // Dataset order, not player order, determines floating point accumulation.
  decisions.sort((a, b) => dataset.actions.indexOf(a.action) - dataset.actions.indexOf(b.action));
  return { valid: issues.length === 0, issues, spent, remaining: dataset.rules.budget_max - spent, decisions };
}
