"use client";

import { useState } from "react";
import { officialDataset as data } from "../data/dataset";
import {
  domainName,
  districtName,
  format,
  indicatorName,
  signed,
  translate,
  type Locale,
} from "../i18n";
import { domainSummaries, indicatorChanges } from "../lib/planning/analytics";
import { scoreState } from "../lib/simulation/score";
import type {
  DistrictId,
  DistrictState,
  IndicatorId,
  ScoreResult,
  SynergyResult,
} from "../lib/simulation/types";
import { Icon } from "./Icon";

export function AnalyticsPanel({
  states,
  scores,
  synergies,
  locale,
}: {
  states: readonly DistrictState[];
  scores: ScoreResult;
  synergies: readonly SynergyResult[];
  locale: Locale;
}) {
  const [detailDistrict, setDetailDistrict] = useState<DistrictId>(
    scores.weakestDistrictId,
  );
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const baseline = scoreState(data.districts, data);
  const changes = indicatorChanges(states, data);
  const before = domainSummaries(data.districts, data);
  return (
    <div className="analytics-content">
      <div className="section-heading">
        <span className="eyebrow">{t("analytics")}</span>
        <h2>{t("analytics.title")}</h2>
      </div>
      <div className="mini-stats">
        <div>
          <small>{t("cityAverage")}</small>
          <strong>{format(scores.cityAverage)}</strong>
        </div>
        <div>
          <small>{t("weakest")}</small>
          <strong>{districtName(locale, scores.weakestDistrictId)}</strong>
        </div>
        <div>
          <small>{t("critical")}</small>
          <strong>
            {baseline.criticalCount} <span>→</span> {scores.criticalCount}
          </strong>
        </div>
      </div>
      <h3>{t("domains")}</h3>
      <div className="domain-bars">
        {domainSummaries(states, data).map((d) => (
          <div className={`domain-row ${d.domain}`} key={d.domain}>
            <span className="domain-icon">
              <Icon name={d.domain} size={17} />
            </span>
            <span>{domainName(locale, d.domain)}</span>
            <div className="meter">
              <i style={{ width: `${d.value}%` }} />
              <b
                style={{
                  left: `${before.find((item) => item.domain === d.domain)!.value}%`,
                }}
              />
            </div>
            <strong>{format(d.value, 1)}</strong>
          </div>
        ))}
      </div>
      <h3>{t("districtComparison")}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("district")}</th>
              <th>{t("before")}</th>
              <th>{t("after")}</th>
              <th>{t("change")}</th>
            </tr>
          </thead>
          <tbody>
            {data.districts.map((d) => (
              <tr key={d.id}>
                <td>
                  {districtName(locale, d.id)}
                  {d.id === scores.weakestDistrictId && (
                    <span className="table-dot" title={t("weakest")} />
                  )}
                </td>
                <td>{format(baseline.districtScores[d.id])}</td>
                <td>{format(scores.districtScores[d.id])}</td>
                <td className="positive">
                  {signed(
                    scores.districtScores[d.id] - baseline.districtScores[d.id],
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="indicator-comparison">
        <summary>
          {t("district.indicators")} · {t("before")} / {t("after")}
        </summary>
        <label>
          {t("district")}
          <select
            value={detailDistrict}
            onChange={(event) =>
              setDetailDistrict(event.target.value as DistrictId)
            }
          >
            {data.districts.map((d) => (
              <option key={d.id} value={d.id}>
                {districtName(locale, d.id)}
              </option>
            ))}
          </select>
        </label>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("district.indicators")}</th>
                <th>{t("before")}</th>
                <th>{t("after")}</th>
                <th>{t("change")}</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(data.indicators) as IndicatorId[]).map((id) => {
                const original = data.districts.find(
                  (d) => d.id === detailDistrict,
                )!.indicators[id];
                const value = states.find((d) => d.id === detailDistrict)!
                  .indicators[id];
                return (
                  <tr key={id}>
                    <td>
                      {id} · {indicatorName(locale, id)}
                    </td>
                    <td>{format(original, 1)}</td>
                    <td>{format(value, 1)}</td>
                    <td className={value < original ? "negative" : "positive"}>
                      {signed(value - original, 1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
      {scores.criticalGaps.length > 0 && (
        <div className="critical-list">
          <h3>{t("critical")}</h3>
          <p className="small-note">
            {translate(locale, "critical.note", {
              n: data.score.critical_threshold_strictly_below,
            })}
          </p>
          {scores.criticalGaps.map((gap) => (
            <p key={`${gap.districtId}:${gap.indicatorId}`}>
              {districtName(locale, gap.districtId)} ·{" "}
              {indicatorName(locale, gap.indicatorId)}{" "}
              <strong>{format(gap.value, 1)}</strong>
            </p>
          ))}
        </div>
      )}
      <div className="insight-columns">
        <div>
          <h3>
            <Icon name="arrow" size={16} />
            {t("improvements")}
          </h3>
          {changes
            .filter((c) => c.delta > 0)
            .slice(0, 4)
            .map((c) => (
              <p
                className="change-line"
                key={`${c.districtId}${c.indicatorId}`}
              >
                <span>
                  {districtName(locale, c.districtId)}
                  <small>{indicatorName(locale, c.indicatorId)}</small>
                </span>
                <strong className="positive">{signed(c.delta, 1)}</strong>
              </p>
            ))}
          {!changes.length && <p className="muted">{t("noChanges")}</p>}
        </div>
        <div>
          <h3>{t("tradeoffs")}</h3>
          {changes
            .filter((c) => c.delta < 0)
            .map((c) => (
              <p
                className="change-line"
                key={`${c.districtId}${c.indicatorId}`}
              >
                <span>
                  {districtName(locale, c.districtId)}
                  <small>{indicatorName(locale, c.indicatorId)}</small>
                </span>
                <strong className="negative">{signed(c.delta, 1)}</strong>
              </p>
            ))}
          {!changes.some((c) => c.delta < 0) && (
            <p className="muted">{t("noNegative")}</p>
          )}
          <p className="small-note">{t("opportunity")}</p>
        </div>
      </div>
      <div className="synergy-box">
        <h3>
          <Icon name="spark" size={17} />
          {t("synergies")}
        </h3>
        {synergies.length ? (
          synergies.map((s) => (
            <p key={s.actionIds.join()}>
              <strong>
                {s.actionIds.join(" + ")} → {districtName(locale, s.districtId)}
              </strong>
              <span>
                {Object.entries(s.bonus)
                  .map(([id, value]) => `${id} +${value}`)
                  .join(" · ")}{" "}
                · {t("synergy.fixed")}
              </span>
            </p>
          ))
        ) : (
          <p>{t("synergy.none")}</p>
        )}
      </div>
      <details className="formula-box">
        <summary>{t("formula")}</summary>
        <code>{data.score.final}</code>
        <p>{t("formula.explain")}</p>
      </details>
    </div>
  );
}
