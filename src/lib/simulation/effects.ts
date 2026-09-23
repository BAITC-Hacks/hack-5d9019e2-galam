import type { ActionContribution, DistrictState, IndicatorId, OfficialDataset, SynergyResult, ValidatedDecision } from "./types";

export function realizedFraction(lag: number, horizon: number): number {
  if (!Number.isFinite(lag) || !Number.isFinite(horizon) || horizon <= 0 || lag < 0 || lag > horizon) throw new RangeError("Lag must fall within a positive finite horizon");
  return (horizon - lag) / horizon;
}

/** Internal effects stage. The public simulator validates the complete plan first. */
export function applyEffects(decisions: readonly ValidatedDecision[], dataset: OfficialDataset) {
  const states = dataset.districts.map((d) => ({ id: d.id, indicators: { ...d.indicators } }));
  const actionContributions: ActionContribution[] = [];
  const synergiesTriggered: SynergyResult[] = [];
  for (const { action, districtId } of decisions) {
    const fraction = realizedFraction(action.lag, dataset.meta.horizon_quarters);
    const targets = states.filter((d) => action.scope === "city" || d.id === districtId);
    const effects: Partial<Record<IndicatorId, number>> = {};
    for (const key of Object.keys(action.effects) as IndicatorId[]) {
      const delta = action.effects[key]! * fraction;
      effects[key] = delta;
      for (const target of targets) target.indicators[key] += delta;
    }
    actionContributions.push({ actionId: action.id, districtIds: targets.map((d) => d.id), realizedFraction: fraction, effects });
  }
  for (const synergy of dataset.synergies) {
    if (!synergy.actions.every((id) => decisions.some((d) => d.action.id === id))) continue;
    const targetActionId = synergy.target_rule.slice("district_of_".length);
    const districtId = decisions.find((d) => d.action.id === targetActionId)?.districtId;
    const target = states.find((d) => d.id === districtId);
    if (!target) throw new Error("Validated synergy target is missing");
    for (const key of Object.keys(synergy.bonus) as IndicatorId[]) target.indicators[key] += synergy.bonus[key]!;
    synergiesTriggered.push({ actionIds: [...synergy.actions], districtId: target.id, bonus: { ...synergy.bonus } });
  }
  const [minimum, maximum] = dataset.score.clip_indicators_to;
  for (const state of states) {
    for (const key of Object.keys(state.indicators) as IndicatorId[]) state.indicators[key] = Math.min(maximum, Math.max(minimum, state.indicators[key]));
  }
  return { districtStates: states satisfies DistrictState[], actionContributions, synergiesTriggered };
}
