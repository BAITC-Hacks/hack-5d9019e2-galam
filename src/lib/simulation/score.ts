import { parseFinalFormula } from "../../data/schema";
import type { CriticalGap, DistrictId, DistrictState, IndicatorId, Indicators, OfficialDataset, ScoreResult } from "./types";

export function districtScore(indicators: Indicators, dataset: OfficialDataset): number {
  return (Object.keys(dataset.indicators) as IndicatorId[]).reduce((sum, key) => sum + dataset.indicators[key].weight * indicators[key], 0);
}

export function getCriticalGaps(states: readonly DistrictState[], dataset: OfficialDataset): CriticalGap[] {
  return states.flatMap((state) => (Object.keys(dataset.indicators) as IndicatorId[])
    .filter((key) => state.indicators[key] < dataset.score.critical_threshold_strictly_below)
    .map((key) => ({ districtId: state.id, indicatorId: key, value: state.indicators[key] })));
}

/** Score a complete city state; an empty plan is not a valid Governance Challenge. */
export function scoreState(states: readonly DistrictState[], dataset: OfficialDataset): ScoreResult {
  if (states.length !== dataset.districts.length || new Set(states.map((d) => d.id)).size !== states.length) throw new Error("Scoring requires one state per official district");
  const districtScores = {} as Record<DistrictId, number>;
  let cityAverage = 0;
  let minimum = Infinity;
  let weakestDistrictId = dataset.districts[0]!.id;
  const ordered = dataset.districts.map((district) => {
    const state = states.find((candidate) => candidate.id === district.id);
    if (!state) throw new Error(`Missing district state: ${district.id}`);
    const [lower, upper] = dataset.score.clip_indicators_to;
    for (const key of Object.keys(dataset.indicators) as IndicatorId[]) {
      const value = state.indicators[key];
      if (!Number.isFinite(value) || value < lower || value > upper) throw new Error(`Invalid indicator: ${district.id}.${key}`);
    }
    const score = districtScore(state.indicators, dataset);
    districtScores[district.id] = score;
    cityAverage += district.population_share * score;
    if (score < minimum) { minimum = score; weakestDistrictId = district.id; }
    return state;
  });
  const criticalGaps = getCriticalGaps(ordered, dataset);
  const coefficients = parseFinalFormula(dataset.score.final);
  const score = coefficients.cityWeight * cityAverage + coefficients.weakestWeight * minimum - coefficients.criticalPenalty * criticalGaps.length;
  return { districtScores, cityAverage, weakestDistrictId, criticalCount: criticalGaps.length, criticalGaps, score };
}
