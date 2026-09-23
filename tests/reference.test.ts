import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { officialDataset as data } from "../src/data/dataset";
import {
  referenceMetadata,
  referencePlan,
  referenceResult,
} from "../src/lib/reference/cached";
import { searchReference } from "../src/lib/reference/search";
import { simulatePlan } from "../src/lib/simulation/simulate";
import { validatePlan } from "../src/lib/simulation/validate";
import type { Decision } from "../src/lib/simulation/types";
import { examplePlan } from "./fixtures";

describe("deterministic reference strategy", () => {
  it("has five valid decisions within budget and matches the engine", () => {
    expect(referencePlan).toHaveLength(data.rules.exactly_n_decisions);
    expect(validatePlan(referencePlan, data).issues).toEqual([]);
    expect(referenceResult.spent).toBeLessThanOrEqual(data.rules.budget_max);
    expect(referenceResult.score).toBe(simulatePlan(referencePlan, data).score);
    expect(referenceResult.score).toBeGreaterThanOrEqual(
      simulatePlan(examplePlan, data).score!,
    );
  });
  it("cache belongs to the unchanged official dataset and completed search", () => {
    expect(
      createHash("sha256")
        .update(readFileSync("official-dataset.json"))
        .digest("hex"),
    ).toBe(referenceMetadata.datasetSha256);
    expect(referenceMetadata.complete).toBe(true);
    expect(referenceMetadata.method).toBe("exhaustive");
    expect(referenceMetadata.validCandidates).toBeLessThanOrEqual(
      referenceMetadata.evaluated,
    );
  });
  it("exhaustive enumeration agrees with an independent Cartesian search", () => {
    const ids = ["M2", "M3", "M8", "M9", "M14"] as const;
    let bestScore = -Infinity;
    let valid = 0;
    for (const a of data.districts)
      for (const b of data.districts)
        for (const c of data.districts) {
          const plan: Decision[] = [
            { actionId: "M2" },
            { actionId: "M3", districtId: a.id },
            { actionId: "M8", districtId: b.id },
            { actionId: "M9", districtId: c.id },
            { actionId: "M14" },
          ];
          const result = simulatePlan(plan, data);
          if (result.valid) {
            valid++;
            bestScore = Math.max(bestScore, result.score);
          }
        }
    const result = searchReference(data, { allowedActionIds: ids });
    expect(result.complete).toBe(true);
    expect(result.score).toBe(bestScore);
    expect(result.validCandidates).toBe(valid);
    expect(searchReference(data, { allowedActionIds: ids })).toEqual(result);
  });
  it("does not claim exhaustive completion when limited", () => {
    const result = searchReference(data, {
      allowedActionIds: ["M2", "M3", "M8", "M9", "M14"],
      candidateLimit: 10,
    });
    expect(result.complete).toBe(false);
    expect(result.method).toBe("bounded");
  });
});
