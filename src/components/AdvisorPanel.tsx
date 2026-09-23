"use client";

import { useMemo, useState } from "react";
import { officialDataset as data } from "../data/dataset";
import {
  actionName,
  districtName,
  format,
  issueText,
  signed,
  translate,
  type Locale,
} from "../i18n";
import { fallbackAnalysis, type AdvisorTopic } from "../lib/advisor/fallback";
import { previewPlan } from "../lib/planning/preview";
import type { ActionId, Decision, DistrictId } from "../lib/simulation/types";
import { Icon } from "./Icon";

type RemoteAdvice = {
  mode: "openai" | "fallback";
  summary: string;
  answer: string;
};
export function AdvisorPanel({
  plan,
  locale,
  selected,
  onAdd,
}: {
  plan: readonly Decision[];
  locale: Locale;
  selected: DistrictId;
  onAdd: (decision: Decision) => void;
}) {
  const [topic, setTopic] = useState<AdvisorTopic>("priority");
  const [question, setQuestion] = useState("");
  const [remote, setRemote] = useState<RemoteAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [first, setFirst] = useState<ActionId>("M7");
  const [second, setSecond] = useState<ActionId>("M4");
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const analysis = useMemo(
    () => fallbackAnalysis(plan, locale, topic),
    [plan, locale, topic],
  );
  // Parent remounts this panel when the plan or locale changes, preventing stale advice.
  async function ask() {
    if (loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          locale,
          topic,
          question,
          alternatives: [first, second],
          districtId: selected,
        }),
        signal: AbortSignal.timeout(35_000),
      });
      if (!response.ok) throw new Error("Advisor unavailable");
      const answer: unknown = await response.json();
      if (
        !answer ||
        typeof answer !== "object" ||
        !("summary" in answer) ||
        !("answer" in answer) ||
        !("mode" in answer) ||
        typeof answer.summary !== "string" ||
        typeof answer.answer !== "string" ||
        (answer.mode !== "openai" && answer.mode !== "fallback")
      )
        throw new Error("Invalid advisor response");
      setRemote({
        summary: answer.summary,
        answer: answer.answer,
        mode: answer.mode,
      });
    } catch {
      setFailed(true);
      setRemote(null);
    } finally {
      setLoading(false);
    }
  }
  const comparison = [first, second].map((id) => {
    const action = data.actions.find((a) => a.id === id)!;
    return {
      id,
      result: previewPlan(
        [
          ...plan,
          {
            actionId: id,
            ...(action.scope === "district" ? { districtId: selected } : {}),
          },
        ],
        data,
      ),
    };
  });
  return (
    <div className="advisor-content">
      <div className="advisor-intro">
        <span className="advisor-avatar">
          <Icon name="spark" size={26} />
        </span>
        <div>
          <span className="eyebrow">{t("advisor")}</span>
          <h2>{t("advisor.title")}</h2>
        </div>
      </div>
      <p className="muted">{t("advisor.intro")}</p>
      <div className="prompt-chips">
        {(
          ["priority", "why", "risk", "plan", "compare", "reference"] as const
        ).map((item) => (
          <button
            key={item}
            className={topic === item ? "active" : ""}
            disabled={loading}
            onClick={() => {
              setTopic(item);
              setRemote(null);
            }}
          >
            {t(`advisor.${item}`)}
          </button>
        ))}
      </div>
      <div className="advice-card" aria-live="polite">
        <span className="status-dot" />
        <span className="eyebrow">
          {t(remote?.mode === "openai" ? "advisor.openai" : "advisor.local")}
        </span>
        <h3>{remote?.summary ?? analysis.summary}</h3>
        <p>{remote?.answer ?? analysis.answer}</p>
        <small>{analysis.budgetNote}</small>
      </div>
      {topic === "compare" && (
        <div className="alternative-box">
          <h3>{t("advisor.compare")}</h3>
          <p className="small-note">{t("compare.hint")}</p>
          <div className="alternative-grid">
            {comparison.map((item, index) => (
              <div key={index}>
                <label>
                  {t(index === 0 ? "compare.first" : "compare.second")}
                  <select
                    value={item.id}
                    onChange={(event) =>
                      (index === 0 ? setFirst : setSecond)(
                        event.target.value as ActionId,
                      )
                    }
                  >
                    {data.actions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.id} · {actionName(locale, a.id)}
                      </option>
                    ))}
                  </select>
                </label>
                <small>
                  {data.actions.find((a) => a.id === item.id)!.scope === "city"
                    ? t("city")
                    : districtName(locale, selected)}{" "}
                  · {t("cost")}:{" "}
                  {data.actions.find((a) => a.id === item.id)!.cost}
                </small>
                <strong>
                  {item.result.available
                    ? format(item.result.score)
                    : t("unavailable")}
                </strong>
                {item.result.available ? (
                  <small>
                    {t("critical")}: {item.result.criticalCount} ·{" "}
                    {t("remaining")}: {item.result.remaining}
                  </small>
                ) : (
                  <p className="blocked-reason">
                    {item.result.issues
                      .map((issue) => issueText(locale, issue))
                      .join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {analysis.recommendations.length > 0 && (
        <>
          <h3>{t("advisor.next")}</h3>
          <p className="small-note">{t("advisor.suggestionNote")}</p>
          <div className="suggestions">
            {analysis.recommendations.map((s) => (
              <button
                key={`${s.decision.actionId}:${s.decision.districtId}`}
                onClick={() => onAdd(s.decision)}
              >
                <span className="suggestion-code">{s.decision.actionId}</span>
                <span>
                  <strong>{actionName(locale, s.decision.actionId)}</strong>
                  <small>
                    {s.decision.districtId
                      ? districtName(locale, s.decision.districtId)
                      : t("city")}{" "}
                    · {s.cost} · {s.reason}
                  </small>
                </span>
                <b>{signed(s.delta)}</b>
                <Icon name="plus" size={17} />
              </button>
            ))}
          </div>
        </>
      )}
      {analysis.strengths.length > 0 && (
        <div className="advisor-evidence">
          <h3>{t("improvements")}</h3>
          {analysis.strengths.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
      {analysis.risks.length > 0 && (
        <div className="advisor-evidence warning">
          <h3>{t("critical")}</h3>
          {analysis.risks.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
      <div className="ask-box">
        <label htmlFor="advisor-question">{t("advisor.request")}</label>
        <textarea
          id="advisor-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={500}
          placeholder={t("advisor.question")}
          rows={2}
        />
        <button className="primary-button" onClick={ask} disabled={loading}>
          <Icon name="spark" size={17} />
          {t(loading ? "advisor.loading" : "advisor.send")}
        </button>
        <p className="small-note">
          {failed ? t("advisor.error") : t("advisor.fallback")}
        </p>
      </div>
      <p className="advisor-signoff">{t("advisor.safety")}</p>
    </div>
  );
}
