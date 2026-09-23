import { describe, expect, it } from "vitest";
import rawData from "../official-dataset.json";
import { loadOfficialDataset, officialDataset } from "../src/data/dataset";
import { parseFinalFormula } from "../src/data/schema";

describe("runtime dataset validation", () => {
  it("loads the root dataset without changing official values", () => expect(officialDataset).toEqual(rawData));
  it.each([
    ["missing indicator", (d) => { Reflect.deleteProperty(d.districts[0]!.indicators, "T1"); }],
    ["unknown indicator", (d) => { Object.assign(d.actions[0]!.effects, { X1: 2 }); }],
    ["non-finite cost", (d) => { d.actions[0]!.cost = Infinity; }],
    ["negative cost", (d) => { d.actions[0]!.cost = -1; }],
    ["invalid lag", (d) => { d.actions[0]!.lag = d.meta.horizon_quarters + 1; }],
    ["fractional lag", (d) => { d.actions[0]!.lag = 1.5; }],
    ["duplicate action", (d) => { d.actions[1]!.id = d.actions[0]!.id; }],
    ["duplicate district", (d) => { d.districts[1]!.id = d.districts[0]!.id; }],
    ["unknown action", (d) => { d.actions[0]!.id = "M99"; }],
    ["missing action", (d) => { d.actions.pop(); }],
    ["indicator out of range", (d) => { d.districts[0]!.indicators.T1 = 101; }],
    ["invalid population shares", (d) => { d.districts[0]!.population_share = 0.9; }],
    ["invalid weights", (d) => { d.indicators.T1.weight = 0.9; }],
    ["domain weights disagree", (d) => { d.domain_weights.transport = 0.9; }],
    ["metadata budget disagrees", (d) => { d.meta.budget += 1; }],
    ["metadata count disagrees", (d) => { d.meta.required_decisions += 1; }],
    ["unknown synergy target", (d) => { d.synergies[0]!.target_rule = "district_of_M99"; }],
    ["city synergy target", (d) => { d.synergies[0]!.target_rule = "district_of_M2"; }],
    ["nonparticipant synergy target", (d) => { d.synergies[0]!.target_rule = "district_of_M7"; }],
    ["repeated rule action", (d) => { d.synergies[0]!.actions = ["M1", "M1"]; }],
    ["unknown incompatibility", (d) => { d.incompatibilities[0]!.actions[0] = "M99"; }],
    ["same-district rule on a city action", (d) => { d.incompatibilities[1]!.actions[0] = "M2"; }],
    ["bad clip interval", (d) => { d.score.clip_indicators_to = [100, 0]; }],
    ["out of range threshold", (d) => { d.score.critical_threshold_strictly_below = 101; }],
    ["unsupported formula", (d) => { d.score.final = "process.exit()"; }],
    ["formula penalty disagrees", (d) => { d.score.critical_penalty_each = 2; }],
    ["formula weights do not sum to one", (d) => { d.score.final = "Score = 0.8 * D_avg + 0.3 * min(D_d) - 1.0 * N_crit"; }],
    ["extra fields", (d) => { Object.assign(d, { invented: true }); }],
  ] satisfies [string, (data: typeof rawData) => void][])("rejects %s", (_name, mutate) => {
    const input = structuredClone(rawData);
    mutate(input);
    expect(() => loadOfficialDataset(input)).toThrow();
  });
  it("rejects arbitrary formula text without executing it", () => expect(() => parseFinalFormula("globalThis.changed = true")).toThrow());
});
