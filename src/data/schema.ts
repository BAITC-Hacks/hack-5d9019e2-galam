import { z } from "zod";

export const indicatorIdSchema = z.enum(["T1", "T2", "E1", "E2", "S1", "S2", "B1", "B2", "C1", "C2"]);
export const districtIdSchema = z.enum(["esil", "almaty", "saryarka", "baikonur", "nura"]);
export const actionIdSchema = z.enum(["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12", "M13", "M14"]);
export const domainSchema = z.enum(["transport", "ecology", "social", "safety", "services"]);
const finite = z.number().finite();
const positiveInteger = finite.int().positive();
const text = z.string().min(1);
const effectSchema = z.partialRecord(indicatorIdSchema, finite).refine((effects) => Object.keys(effects).length > 0, "An effect must contain at least one indicator");
const pairSchema = z.tuple([actionIdSchema, actionIdSchema]).refine(([a, b]) => a !== b, "Rule actions must differ");

// Only this declarative formula grammar is accepted. Never execute dataset text.
const finalFormulaPattern = /^Score = (\d+(?:\.\d+)?) \* D_avg \+ (\d+(?:\.\d+)?) \* min\(D_d\) - (\d+(?:\.\d+)?) \* N_crit$/;
export function parseFinalFormula(formula: string) {
  const match = finalFormulaPattern.exec(formula);
  if (!match) throw new Error("Unsupported final scoring formula");
  const cityWeight = Number(match[1]);
  const weakestWeight = Number(match[2]);
  const criticalPenalty = Number(match[3]);
  if (![cityWeight, weakestWeight, criticalPenalty].every(Number.isFinite)) {
    throw new Error("Non-finite scoring coefficients");
  }
  return { cityWeight, weakestWeight, criticalPenalty };
}

export const datasetSchema = z.strictObject({
  meta: z.strictObject({
    name: text, horizon_quarters: positiveInteger, budget: finite.positive(),
    required_decisions: positiveInteger, base_score: finite, notes: z.array(text),
  }),
  indicators: z.record(indicatorIdSchema, z.strictObject({ domain: domainSchema, name_ru: text, weight: finite.nonnegative() })),
  domain_weights: z.record(domainSchema, finite.nonnegative()),
  districts: z.array(z.strictObject({
    id: districtIdSchema, name_ru: text, population_share: finite.positive(),
    indicators: z.record(indicatorIdSchema, finite), baseline_d: finite, profile_ru: text,
  })).length(districtIdSchema.options.length),
  actions: z.array(z.strictObject({
    id: actionIdSchema, domain: domainSchema, name_ru: text, scope: z.enum(["district", "city"]),
    cost: finite.nonnegative(), lag: finite.int().nonnegative(), effects: effectSchema,
  })).length(actionIdSchema.options.length),
  synergies: z.array(z.strictObject({ actions: pairSchema, target_rule: text, bonus: effectSchema })),
  incompatibilities: z.array(z.strictObject({ actions: pairSchema, rule: z.enum(["global", "same_district"]), reason_ru: text })),
  rules: z.strictObject({
    exactly_n_decisions: positiveInteger, max_actions_per_domain: positiveInteger,
    no_repeated_action_id: z.literal(true), district_required_for_scope_district: z.literal(true),
    district_forbidden_for_scope_city: z.literal(true), budget_max: finite.positive(),
    order_irrelevant: z.literal(true), invalid_plan_has_no_score: z.literal(true),
  }),
  score: z.strictObject({
    district_score: z.literal("D_d = sum(weight_k * indicator'_dk)"),
    city_average: z.literal("D_avg = sum(population_share_d * D_d)"),
    critical_threshold_strictly_below: finite, critical_penalty_each: finite.nonnegative(),
    final: z.string().regex(finalFormulaPattern), clip_indicators_to: z.tuple([finite, finite]),
  }),
  reference_plan_from_source: z.strictObject({
    plan: z.array(z.strictObject({ action_id: actionIdSchema, district: districtIdSchema.nullable() })),
    cost: finite.nonnegative(), expected_score_approx: finite, note: text,
  }),
}).superRefine((data, ctx) => {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
  const approximatelyEqual = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  const weights = Object.values(data.indicators);
  if (!approximatelyEqual(weights.reduce((sum, item) => sum + item.weight, 0), 1)) issue(["indicators"], "Indicator weights must sum to one");
  for (const domain of domainSchema.options) {
    if (!approximatelyEqual(weights.filter((item) => item.domain === domain).reduce((sum, item) => sum + item.weight, 0), data.domain_weights[domain])) issue(["domain_weights", domain], "Domain weight disagrees with indicator weights");
  }
  if (!approximatelyEqual(data.districts.reduce((sum, d) => sum + d.population_share, 0), 1)) issue(["districts"], "Population shares must sum to one");
  if (new Set(data.districts.map((d) => d.id)).size !== data.districts.length) issue(["districts"], "District IDs must be unique");
  if (new Set(data.actions.map((a) => a.id)).size !== data.actions.length) issue(["actions"], "Action IDs must be unique");
  if (data.meta.budget !== data.rules.budget_max) issue(["rules", "budget_max"], "Budget metadata disagrees with rules");
  if (data.meta.required_decisions !== data.rules.exactly_n_decisions) issue(["rules", "exactly_n_decisions"], "Decision count metadata disagrees with rules");
  const [minimum, maximum] = data.score.clip_indicators_to;
  if (minimum >= maximum) issue(["score", "clip_indicators_to"], "Clipping minimum must be below maximum");
  if (data.score.critical_threshold_strictly_below < minimum || data.score.critical_threshold_strictly_below > maximum) issue(["score", "critical_threshold_strictly_below"], "Critical threshold outside indicator bounds");
  data.districts.forEach((d, index) => {
    for (const [key, value] of Object.entries(d.indicators)) {
      if (value < minimum || value > maximum) issue(["districts", index, "indicators", key], "Indicator outside official bounds");
    }
  });
  data.actions.forEach((a, index) => {
    if (a.lag > data.meta.horizon_quarters) issue(["actions", index, "lag"], "Lag exceeds simulation horizon");
  });
  const byId = new Map(data.actions.map((a) => [a.id, a]));
  data.synergies.forEach((s, index) => {
    const target = s.target_rule.replace(/^district_of_/, "");
    const targetAction = data.actions.find((a) => a.id === target);
    if (s.target_rule !== `district_of_${target}` || !targetAction || !s.actions.includes(targetAction.id) || targetAction.scope !== "district") issue(["synergies", index, "target_rule"], "Synergy must target a participating district action");
    if (s.actions.some((id) => !byId.has(id))) issue(["synergies", index], "Unknown synergy action");
  });
  data.incompatibilities.forEach((rule, index) => {
    if (rule.actions.some((id) => !byId.has(id))) issue(["incompatibilities", index], "Unknown incompatibility action");
    if (rule.rule === "same_district" && rule.actions.some((id) => byId.get(id)?.scope !== "district")) issue(["incompatibilities", index], "Same-district incompatibilities require district actions");
  });
  if (finalFormulaPattern.test(data.score.final)) {
    const coefficients = parseFinalFormula(data.score.final);
    if (!approximatelyEqual(coefficients.cityWeight + coefficients.weakestWeight, 1)) issue(["score", "final"], "Final score weights must sum to one");
    if (coefficients.criticalPenalty !== data.score.critical_penalty_each) issue(["score", "final"], "Formula penalty disagrees with numeric penalty");
  }
});

export type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
export type OfficialDataset = DeepReadonly<z.infer<typeof datasetSchema>>;
