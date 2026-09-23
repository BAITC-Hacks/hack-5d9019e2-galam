import { describe, expect, it } from "vitest";
import { officialDataset as data } from "../src/data/dataset";
import { previewPlan, suggestDecisions } from "../src/lib/planning/preview";
import {
  indicatorChanges,
  domainSummaries,
} from "../src/lib/planning/analytics";
import { simulatePlan } from "../src/lib/simulation/simulate";
import { examplePlan } from "./fixtures";

describe("draft planning without weakening Governance Challenge", () => {
  it("labels incomplete drafts and keeps the official simulator strict", () => {
    expect(previewPlan(examplePlan.slice(0, 1), data)).toMatchObject({
      available: true,
      complete: false,
    });
    expect(simulatePlan(examplePlan.slice(0, 1), data)).toMatchObject({
      valid: false,
      score: null,
    });
  });
  it("matches the official result for a complete plan", () => {
    expect(previewPlan(examplePlan, data)).toMatchObject({
      available: true,
      complete: true,
      score: simulatePlan(examplePlan, data).score,
    });
  });
  it("still enforces conflicts, duplicates, scope, budget and maximum count", () => {
    for (const plan of [
      [
        { actionId: "M1", districtId: "nura" },
        { actionId: "M3", districtId: "esil" },
      ],
      [
        { actionId: "M1", districtId: "nura" },
        { actionId: "M1", districtId: "esil" },
      ],
      [{ actionId: "M2", districtId: "nura" }],
      [...examplePlan, { actionId: "M14" }],
    ] as const)
      expect(previewPlan(plan, data).available).toBe(false);
  });
  it("suggestions are real deterministic projections and stop at five", () => {
    const plan = examplePlan.slice(0, 4);
    const suggestions = suggestDecisions(plan, data);
    expect(suggestions.length).toBeGreaterThan(0);
    for (const suggestion of suggestions) {
      const result = simulatePlan([...plan, suggestion.decision], data);
      expect(result.valid).toBe(true);
      expect(result.score).toBe(suggestion.score);
    }
    expect(suggestDecisions(examplePlan, data)).toEqual([]);
  });
  it("derives changes and weighted domain summaries from the actual state", () => {
    const result = simulatePlan(examplePlan, data);
    expect(indicatorChanges(result.districtStates, data)[0]).toMatchObject({
      districtId: "nura",
      indicatorId: "B1",
      delta: 12.5,
    });
    expect(domainSummaries(result.districtStates, data)).toHaveLength(5);
    expect(
      domainSummaries(data.districts, data).every(
        (d) => d.value >= 0 && d.value <= 100,
      ),
    ).toBe(true);
  });
});
