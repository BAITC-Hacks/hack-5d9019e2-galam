import type { z } from "zod";
import type { actionIdSchema, districtIdSchema, domainSchema, indicatorIdSchema, OfficialDataset } from "../../data/schema";

export type { OfficialDataset };
export type ActionId = z.infer<typeof actionIdSchema>;
export type DistrictId = z.infer<typeof districtIdSchema>;
export type IndicatorId = z.infer<typeof indicatorIdSchema>;
export type Domain = z.infer<typeof domainSchema>;
export type Scope = "district" | "city";
export type Indicators = Readonly<Record<IndicatorId, number>>;
export type Effects = Readonly<Partial<Record<IndicatorId, number>>>;
export type Decision = { readonly actionId: ActionId; readonly districtId?: DistrictId };
export type DistrictState = { readonly id: DistrictId; readonly indicators: Indicators };
export type ValidationCode =
  | "BUDGET_EXCEEDED" | "WRONG_DECISION_COUNT" | "DUPLICATE_ACTION" | "DOMAIN_LIMIT"
  | "MISSING_DISTRICT" | "UNEXPECTED_DISTRICT" | "INCOMPATIBILITY"
  | "INVALID_PLAN" | "INVALID_DECISION" | "UNKNOWN_ACTION" | "UNKNOWN_DISTRICT";
export type ValidationIssue = {
  readonly code: ValidationCode;
  readonly messageKey: string;
  readonly actionIds?: readonly string[];
  readonly districtId?: string;
};
export type ValidatedDecision = {
  readonly action: OfficialDataset["actions"][number];
  readonly districtId?: DistrictId;
};
export type ValidationResult = {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly spent: number;
  readonly remaining: number;
  readonly decisions: readonly ValidatedDecision[];
};
export type ActionContribution = {
  readonly actionId: ActionId;
  readonly districtIds: readonly DistrictId[];
  readonly realizedFraction: number;
  readonly effects: Effects;
};
export type SynergyResult = {
  readonly actionIds: readonly ActionId[];
  readonly districtId: DistrictId;
  readonly bonus: Effects;
};
export type CriticalGap = { readonly districtId: DistrictId; readonly indicatorId: IndicatorId; readonly value: number };
export type ScoreResult = {
  readonly districtScores: Readonly<Record<DistrictId, number>>;
  readonly cityAverage: number;
  readonly weakestDistrictId: DistrictId;
  readonly criticalCount: number;
  readonly criticalGaps: readonly CriticalGap[];
  readonly score: number;
};
type SimulationDetails = {
  readonly spent: number;
  readonly remaining: number;
  readonly districtStates: readonly DistrictState[];
  readonly actionContributions: readonly ActionContribution[];
  readonly synergiesTriggered: readonly SynergyResult[];
};
export type SimulationResult =
  | (SimulationDetails & ScoreResult & { readonly valid: true; readonly issues: readonly [] })
  | (SimulationDetails & { readonly valid: false; readonly issues: readonly ValidationIssue[]; readonly score: null });
