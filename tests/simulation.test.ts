import { describe, expect, it } from "vitest";
import rawData from "../official-dataset.json";
import { loadOfficialDataset, officialDataset as data } from "../src/data/dataset";
import { realizedFraction } from "../src/lib/simulation/effects";
import { getCriticalGaps, scoreState } from "../src/lib/simulation/score";
import { simulatePlan } from "../src/lib/simulation/simulate";
import type { Decision, DistrictId, IndicatorId, OfficialDataset } from "../src/lib/simulation/types";
import { examplePlan } from "./fixtures";

function run(plan: readonly Decision[], dataset: OfficialDataset = data) {
  const result = simulatePlan(plan, dataset);
  if (!result.valid) throw new Error(JSON.stringify(result.issues));
  return result;
}

describe("official scoring regressions", () => {
  it("reproduces every baseline district score, city average, gaps, and final score", () => {
    const result = scoreState(data.districts, data);
    const expected = { esil: 62.99, almaty: 57.06, saryarka: 54.65, baikonur: 56.63, nura: 49.18 };
    for (const district of data.districts) {
      expect(result.districtScores[district.id]).toBeCloseTo(expected[district.id], 10);
      expect(result.districtScores[district.id]).toBeCloseTo(district.baseline_d, 10);
    }
    expect(result.cityAverage).toBeCloseTo(56.8624, 10);
    expect(result.weakestDistrictId).toBe("nura");
    expect(result.criticalCount).toBe(2);
    expect(result.score).toBeCloseTo(52.55768, 10);
    expect(result.score).toBeCloseTo(data.meta.base_score, 2);
  });
  it("recalculates the official example without hardcoding its advertised score", () => {
    const result = run(examplePlan);
    // Independent arithmetic oracle using the published fixture, not engine helpers.
    const expectedDistricts = { esil: 63.4275, almaty: 57.4975, saryarka: 56.3, baikonur: 57.0675, nura: 52.9625 };
    for (const id of Object.keys(expectedDistricts) as DistrictId[]) expect(result.districtScores[id]).toBeCloseTo(expectedDistricts[id], 10);
    expect(result.spent).toBe(95);
    expect(result.cityAverage).toBeCloseTo(58.0776, 10);
    expect(result.criticalCount).toBe(0);
    expect(result.score).toBeCloseTo(56.54307, 10);
    expect(Math.abs(result.score - data.reference_plan_from_source.expected_score_approx)).toBeLessThan(0.05);
    expect(result.synergiesTriggered).toEqual([{ actionIds: ["M10", "M12"], districtId: "nura", bonus: { B1: 2 } }]);
  });
  it("counts values strictly below, not equal to, the critical threshold", () => {
    const states = data.districts.map((d) => ({ id: d.id, indicators: { ...d.indicators, S1: 40, S2: 40 } }));
    expect(getCriticalGaps(states, data)).toEqual([]);
    states[0]!.indicators.S1 = 39.999;
    expect(getCriticalGaps(states, data)).toEqual([{ districtId: "esil", indicatorId: "S1", value: 39.999 }]);
  });
  it("uses population weights and penalizes the weakest district", () => {
    const states = data.districts.map((d, index) => ({ id: d.id, indicators: Object.fromEntries(Object.keys(d.indicators).map((key) => [key, index === 0 ? 50 : 80])) as Record<IndicatorId, number> }));
    const result = scoreState(states, data);
    expect(result.cityAverage).toBeCloseTo(71.9, 10);
    expect(result.score).toBeCloseTo(65.33, 10);
    expect(result.weakestDistrictId).toBe("esil");
  });
  it("rejects incomplete, duplicate, non-finite or unclipped city states", () => {
    expect(() => scoreState([], data)).toThrow();
    expect(() => scoreState(data.districts.map(() => data.districts[0]!), data)).toThrow();
    for (const value of [NaN, Infinity, -1, 101]) {
      const states = data.districts.map((d) => ({ id: d.id, indicators: { ...d.indicators, T1: value } }));
      expect(() => scoreState(states, data)).toThrow();
    }
  });
});

describe("effects and deterministic simulation", () => {
  it("applies lagged city effects everywhere and district effects only at their target", () => {
    const result = run(examplePlan);
    for (const state of result.districtStates) {
      const original = data.districts.find((d) => d.id === state.id)!;
      expect(state.indicators.C2 - original.indicators.C2).toBe(4.375);
      expect(state.indicators.S1 - original.indicators.S1).toBe(state.id === "nura" ? 10 : 0);
      expect(state.indicators.E2 - original.indicators.E2).toBe(state.id === "saryarka" ? 8.75 : 0);
    }
    expect(result.actionContributions.find((a) => a.actionId === "M12")?.districtIds).toHaveLength(data.districts.length);
    expect(result.actionContributions.find((a) => a.actionId === "M7")?.realizedFraction).toBe(0.625);
  });
  it.each([
    { pair: ["M1", "M2"], target: "esil", indicator: "T1", expected: 54.5, plan: [{ actionId: "M1", districtId: "esil" }, { actionId: "M2" }, { actionId: "M9", districtId: "nura" }, { actionId: "M10", districtId: "nura" }, { actionId: "M14" }] },
    { pair: ["M10", "M12"], target: "nura", indicator: "B1", expected: 67.5, plan: examplePlan },
    { pair: ["M5", "M6"], target: "saryarka", indicator: "E2", expected: 52.25, plan: [{ actionId: "M5", districtId: "saryarka" }, { actionId: "M6" }, { actionId: "M9", districtId: "nura" }, { actionId: "M10", districtId: "nura" }, { actionId: "M14" }] },
  ] as const)("applies the fixed $pair bonus once at its target without lag scaling", ({ pair, target, indicator, expected, plan }) => {
    const result = run(plan);
    expect(result.synergiesTriggered).toEqual([{ actionIds: pair, districtId: target, bonus: { [indicator]: 2 } }]);
    expect(result.districtStates.find((d) => d.id === target)!.indicators[indicator]).toBe(expected);
    // Removing the partner suppresses the bonus; use another valid action.
    const replacement: Decision = { actionId: "M11", districtId: "baikonur" };
    const withoutPartner = run(plan.map((d) => d.actionId === pair[1] ? replacement : d));
    expect(withoutPartner.synergiesTriggered).toEqual([]);
  });
  it("preserves negative side effects", () => {
    const plan: Decision[] = [...examplePlan.slice(0, 4), { actionId: "M11", districtId: "esil" }];
    expect(run(plan).districtStates.find((d) => d.id === "esil")!.indicators.T1).toBe(43.25);
  });
  it("clips after summing direct effects and synergies, not after each action", () => {
    const fixture = structuredClone(rawData);
    fixture.districts[0]!.indicators.T1 = 99;
    fixture.districts[1]!.indicators.T1 = 0;
    fixture.districts[0]!.indicators.B1 = 99;
    const dataset = loadOfficialDataset(fixture);
    const plan: Decision[] = [{ actionId: "M1", districtId: "esil" }, { actionId: "M11", districtId: "esil" }, { actionId: "M10", districtId: "esil" }, { actionId: "M12" }, { actionId: "M9", districtId: "nura" }];
    const result = run(plan, dataset);
    expect(result.districtStates[0]!.indicators.T1).toBe(100);
    expect(result.districtStates[0]!.indicators.B1).toBe(100);
    const lower = run(plan.map((d) => d.actionId === "M11" ? { ...d, districtId: "almaty" } : d), dataset);
    expect(lower.districtStates[1]!.indicators.T1).toBe(0);
  });
  it("is repeatable, order-independent, and does not mutate inputs", () => {
    const before = JSON.stringify({ plan: examplePlan, data });
    const expected = run(examplePlan);
    function permutations<T>(items: readonly T[]): T[][] {
      if (!items.length) return [[]];
      return items.flatMap((item, index) => permutations(items.filter((_, i) => i !== index)).map((rest) => [item, ...rest]));
    }
    for (const permutation of permutations(examplePlan)) expect(run(permutation)).toEqual(expected);
    expect(run(examplePlan)).toEqual(expected);
    expect(JSON.stringify({ plan: examplePlan, data })).toBe(before);
    expect(Object.isFrozen(data.districts[0]!.indicators)).toBe(true);
  });
  it("changing a valid plan changes its score", () => {
    const moved = examplePlan.map((d) => d.actionId === "M7" ? { ...d, districtId: "esil" as const } : d);
    expect(run(moved).score).not.toBe(run(examplePlan).score);
  });
  it("uses changed dataset numbers instead of duplicated application constants", () => {
    const fixture = structuredClone(rawData);
    fixture.meta.horizon_quarters = 16;
    fixture.score.final = "Score = 0.6 * D_avg + 0.4 * min(D_d) - 1.0 * N_crit";
    fixture.actions.find((a) => a.id === "M7")!.effects.S1 = 20;
    const dataset = loadOfficialDataset(fixture);
    const result = run(examplePlan, dataset);
    expect(result.districtStates.find((d) => d.id === "nura")!.indicators.S1).toBe(54.25);
    expect(result.score).toBeCloseTo(0.6 * result.cityAverage + 0.4 * Math.min(...Object.values(result.districtScores)) - result.criticalCount, 12);
  });
  it("handles zero/full-horizon lag and rejects unsupported lags", () => {
    expect(realizedFraction(0, 8)).toBe(1);
    expect(realizedFraction(8, 8)).toBe(0);
    for (const [lag, horizon] of [[-1, 8], [9, 8], [0, 0], [NaN, 8], [0, Infinity]]) expect(() => realizedFraction(lag!, horizon!)).toThrow();
  });
});
