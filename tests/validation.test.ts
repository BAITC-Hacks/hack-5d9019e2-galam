import { describe, expect, it } from "vitest";
import { officialDataset as data } from "../src/data/dataset";
import { simulatePlan } from "../src/lib/simulation/simulate";
import { validatePlan } from "../src/lib/simulation/validate";
import type { Decision, ValidationCode } from "../src/lib/simulation/types";
import { examplePlan } from "./fixtures";

function rejects(plan: unknown, code: ValidationCode) {
  const validation = validatePlan(plan, data);
  expect(validation.valid).toBe(false);
  expect(validation.issues.map((issue) => issue.code)).toContain(code);
  expect(validation.issues.every((issue) => issue.messageKey.length > 0)).toBe(true);
  const result = simulatePlan(plan, data);
  expect(result.valid).toBe(false);
  expect(result.score).toBeNull();
  expect(result.actionContributions).toEqual([]);
  expect(result.districtStates).toEqual([]);
}

describe("Governance Challenge", () => {
  it("accepts the official example and its source cost", () => {
    const result = validatePlan(examplePlan, data);
    expect(result.valid).toBe(true);
    expect(result.spent).toBe(95);
    expect(result.spent).toBe(data.reference_plan_from_source.cost);
    expect(result.remaining).toBe(5);
  });
  it("rejects costs over budget", () => rejects([
    { actionId: "M3", districtId: "esil" }, { actionId: "M5", districtId: "saryarka" },
    { actionId: "M7", districtId: "nura" }, { actionId: "M13", districtId: "almaty" }, { actionId: "M10", districtId: "nura" },
  ], "BUDGET_EXCEEDED"));
  it("accepts an exact-budget plan", () => {
    const result = validatePlan([
      { actionId: "M3", districtId: "esil" }, { actionId: "M4", districtId: "almaty" },
      { actionId: "M5", districtId: "saryarka" }, { actionId: "M9", districtId: "nura" }, { actionId: "M8", districtId: "nura" },
    ], data);
    expect(result.valid).toBe(true);
    expect(result.spent).toBe(data.rules.budget_max);
    expect(result.remaining).toBe(0);
  });
  it.each([0, 4, 6])("rejects %i decisions", (count) => rejects(
    count === 6 ? [...examplePlan, { actionId: "M11", districtId: "esil" }] : examplePlan.slice(0, count), "WRONG_DECISION_COUNT",
  ));
  it("rejects duplicate IDs even across different districts", () => rejects([
    ...examplePlan.slice(0, 4), { actionId: "M7", districtId: "esil" },
  ], "DUPLICATE_ACTION"));
  it("rejects more than two actions in one domain", () => rejects([
    ...examplePlan.slice(0, 4), { actionId: "M9", districtId: "esil" },
  ], "DOMAIN_LIMIT"));
  it.each(["esil", "nura"])("rejects M1 + M3 globally (M3 in %s)", (districtId) => rejects([
    { actionId: "M1", districtId: "esil" }, { actionId: "M3", districtId },
    { actionId: "M9", districtId: "nura" }, { actionId: "M10", districtId: "nura" }, { actionId: "M12" },
  ], "INCOMPATIBILITY"));
  it.each([
    ["M4", "M7", "M12"], ["M5", "M13", "M9"],
  ] as const)("enforces %s + %s only in the same district", (a, b, filler) => {
    const plan: Decision[] = [
      { actionId: a, districtId: "esil" }, { actionId: b, districtId: "esil" },
      { actionId: filler, ...(filler === "M12" ? {} : { districtId: "nura" as const }) },
      { actionId: "M10", districtId: "nura" }, { actionId: "M11", districtId: "nura" },
    ];
    rejects(plan, "INCOMPATIBILITY");
    expect(validatePlan(plan, data).issues).toContainEqual({ code: "INCOMPATIBILITY", messageKey: "validation.incompatibility", actionIds: [a, b], districtId: "esil" });
    plan[1] = { actionId: b, districtId: "almaty" };
    expect(validatePlan(plan, data).valid).toBe(true);
  });
  it.each([undefined, null, ""])("rejects a missing district (%s)", (districtId) => rejects([
    { actionId: "M7", districtId }, ...examplePlan.slice(1),
  ], "MISSING_DISTRICT"));
  it.each(["esil", null, undefined])("rejects any district field on a city action (%s)", (districtId) => rejects(
    examplePlan.map((decision) => decision.actionId === "M12" ? { ...decision, districtId } : decision), "UNEXPECTED_DISTRICT",
  ));
  it("rejects unknown districts", () => rejects([{ actionId: "M7", districtId: "unknown" }, ...examplePlan.slice(1)], "UNKNOWN_DISTRICT"));
  it("rejects unknown actions", () => rejects([{ actionId: "M999" }, ...examplePlan.slice(1)], "UNKNOWN_ACTION"));
  it.each([null, {}, "M1"])("rejects a malformed plan (%s)", (plan) => rejects(plan, "INVALID_PLAN"));
  it.each([null, [], 7, { actionId: 1 }, { actionId: "M7", districtId: "nura", cost: 0 }])("rejects malformed decisions (%s)", (decision) => rejects([decision, ...examplePlan.slice(1)], "INVALID_DECISION"));
});
