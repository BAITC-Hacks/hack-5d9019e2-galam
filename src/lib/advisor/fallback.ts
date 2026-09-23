import {
  actionName,
  districtName,
  format,
  indicatorName,
  signed,
  translate,
  type Locale,
} from "../../i18n";
import { officialDataset } from "../../data/dataset";
import { indicatorChanges } from "../planning/analytics";
import { previewPlan, suggestDecisions } from "../planning/preview";
import { referenceResult } from "../reference/cached";
import type { Decision } from "../simulation/types";

export type AdvisorTopic =
  "priority" | "why" | "risk" | "plan" | "compare" | "reference";
export function fallbackAnalysis(
  plan: readonly Decision[],
  locale: Locale,
  topic: AdvisorTopic = "priority",
) {
  const data = officialDataset;
  const projection = previewPlan(plan, data);
  if (!projection.available) throw new Error("Advisor requires a valid draft");
  const t = (
    key: Parameters<typeof translate>[1],
    values?: Record<string, string | number>,
  ) => translate(locale, key, values);
  const changes = indicatorChanges(projection.districtStates, data);
  const describe = (change: (typeof changes)[number]) =>
    `${districtName(locale, change.districtId)} · ${indicatorName(locale, change.indicatorId)}: ${format(change.before, 1)} → ${format(change.after, 1)} (${signed(change.delta, 1)})`;
  const recommendations = suggestDecisions(plan, data)
    .slice(0, 3)
    .map((candidate) => ({
      ...candidate,
      reason: `${t("projected")}: ${format(candidate.score)} (${signed(candidate.delta)})`,
    }));
  const critical = projection.criticalGaps.map(
    (gap) =>
      `${districtName(locale, gap.districtId)} · ${indicatorName(locale, gap.indicatorId)}: ${format(gap.value, 1)}`,
  );
  const comparison = t("advisor.gap", {
    reference: format(referenceResult.score),
    player: format(projection.score),
    delta: signed(referenceResult.score - projection.score),
  });
  const rationale = projection.criticalCount
    ? t("advisor.critical")
    : t("advisor.noCritical");
  return {
    mode: "fallback" as const,
    summary: t("advisor.summary", {
      district: districtName(locale, projection.weakestDistrictId),
      score: format(projection.districtScores[projection.weakestDistrictId]),
      count: projection.criticalCount,
      remaining: projection.remaining,
    }),
    answer:
      topic === "reference"
        ? `${comparison} ${t("reference.insight")}`
        : topic === "risk"
          ? `${critical.join("; ")} ${t("opportunity")}`
          : rationale,
    strengths: changes
      .filter((c) => c.delta > 0)
      .slice(0, 3)
      .map(describe),
    risks: critical,
    tradeoffs: changes.filter((c) => c.delta < 0).map(describe),
    synergies: projection.synergiesTriggered.map(
      (s) =>
        `${s.actionIds.map((id) => actionName(locale, id)).join(" + ")} → ${districtName(locale, s.districtId)}`,
    ),
    budgetNote: t("advisor.budgetNote", {
      spent: projection.spent,
      remaining: projection.remaining,
      count: plan.length,
    }),
    comparison,
    recommendations,
  };
}
