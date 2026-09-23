"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { officialDataset as data } from "../data/dataset";
import {
  actionName,
  districtName,
  domainName,
  format,
  indicatorName,
  issueText,
  signed,
  translate,
  type Locale,
} from "../i18n";
import { previewPlan } from "../lib/planning/preview";
import {
  referenceMetadata,
  referencePlan,
  referenceResult,
} from "../lib/reference/cached";
import { realizedFraction } from "../lib/simulation/effects";
import { scoreState } from "../lib/simulation/score";
import { simulatePlan } from "../lib/simulation/simulate";
import type {
  Decision,
  DistrictId,
  Domain,
  IndicatorId,
} from "../lib/simulation/types";
import { AdvisorPanel } from "./AdvisorPanel";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { CityMap } from "./CityMap";
import { Icon, type IconName } from "./Icon";

const baseline = scoreState(data.districts, data);
const domains = Object.keys(data.domain_weights) as Domain[];
const tabs = [
  { id: "district", icon: "city" },
  { id: "initiatives", icon: "plus" },
  { id: "analytics", icon: "chart" },
  { id: "advisor", icon: "spark" },
] as const;
type Tab = (typeof tabs)[number]["id"];

export default function Dashboard() {
  const [locale, setLocale] = useState<Locale>("en");
  const [plan, setPlan] = useState<Decision[]>([]);
  const [selected, setSelected] = useState<DistrictId>("nura");
  const [tab, setTab] = useState<Tab>("district");
  const [filter, setFilter] = useState<Domain | "all">("all");
  const [finished, setFinished] = useState(false);
  const [compare, setCompare] = useState(false);
  const [beforeMap, setBeforeMap] = useState(false);
  const [notice, setNotice] = useState("");
  const t = (
    key: Parameters<typeof translate>[1],
    values?: Record<string, string | number>,
  ) => translate(locale, key, values);
  const projected = useMemo(() => previewPlan(plan, data), [plan]);
  const official = useMemo(() => simulatePlan(plan, data), [plan]);
  if (!projected.available)
    throw new Error("Only validated drafts enter the dashboard state");
  const district = data.districts.find((d) => d.id === selected)!;
  const state = projected.districtStates.find((d) => d.id === selected)!;
  const remainingDecisions = data.rules.exactly_n_decisions - plan.length;
  const journeyStep = finished
    ? 3
    : tab === "district"
      ? 1
      : tab === "initiatives"
        ? 2
        : 3;
  const weakestIndicators = (Object.keys(state.indicators) as IndicatorId[])
    .sort((a, b) => state.indicators[a] - state.indicators[b])
    .slice(0, 2);

  function add(decision: Decision) {
    const next = [...plan, decision];
    const checked = previewPlan(next, data);
    if (!checked.available) {
      setNotice(
        checked.issues.map((issue) => issueText(locale, issue)).join(" · "),
      );
      return;
    }
    setPlan(next);
    setNotice("");
  }
  function chooseDistrict(id: DistrictId) {
    setSelected(id);
    if (tab !== "initiatives") setTab("district");
  }
  function loadExample() {
    setPlan(
      data.reference_plan_from_source.plan.map((d) => ({
        actionId: d.action_id,
        ...(d.district ? { districtId: d.district } : {}),
      })),
    );
    setSelected("nura");
    setTab("analytics");
    setFinished(false);
    setCompare(false);
    setNotice("");
  }
  function finish() {
    const result = simulatePlan(plan, data);
    if (!result.valid) {
      setNotice(
        result.issues.map((issue) => issueText(locale, issue)).join(" · "),
      );
      return;
    }
    setFinished(true);
    setCompare(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function reset() {
    setPlan([]);
    setFinished(false);
    setCompare(false);
    setTab("district");
    setNotice("");
  }
  function planList(decisions: readonly Decision[]) {
    return (
      <ol className="comparison-plan">
        {decisions.map((d) => (
          <li key={d.actionId}>
            <span>{d.actionId}</span>
            <div>
              {actionName(locale, d.actionId)}
              <small>
                {d.districtId ? districtName(locale, d.districtId) : t("city")}
              </small>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="app-shell" lang={locale}>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="AKIM: 5 HOURS">
          <span className="brand-mark">
            <Icon name="city" size={27} />
          </span>
          <span>
            <b>
              AKIM<span className="brand-accent">: 5 HOURS</span>
            </b>
            <small>{t("app.subtitle")}</small>
          </span>
        </Link>
        <div className="header-right">
          <span className="mode-chip">
            <span />
            {t("mode")}
          </span>
          <nav className="language-switch" aria-label="Language / Язык / Тіл">
            {(["en", "ru", "kk"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={locale === value}
                onClick={() => {
                  setLocale(value);
                  setNotice("");
                }}
                className={locale === value ? "active" : ""}
              >
                {value === "kk" ? "KZ" : value.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main>
        {!finished ? (
          <>
            <section className="hero">
              <div>
                <span className="eyebrow">{t("hero.eyebrow")}</span>
                <h1>{t("hero.title")}</h1>
                <p>{t("hero.description")}</p>
              </div>
              <div className="hero-aside">
                <span className="horizon-badge">
                  <span className="quarter-symbol">◷</span>
                  {t("horizon", { n: data.meta.horizon_quarters })}
                </span>
                <details className="rules-popover">
                  <summary>
                    {t("officialRules")} <span>↗</span>
                  </summary>
                  <p>
                    {t("rules.summary", {
                      count: data.rules.exactly_n_decisions,
                      budget: data.rules.budget_max,
                      cap: data.rules.max_actions_per_domain,
                    })}
                  </p>
                  <p>
                    M1 + M3 · {t("unavailable")}
                    <br />
                    M4 + M7 / M5 + M13 · {t("district")}
                  </p>
                </details>
              </div>
            </section>
            <section className="journey-guide" aria-label={t("flow.title")}>
              <p className="journey-objective">
                {t("objective", {
                  budget: data.rules.budget_max,
                  count: data.rules.exactly_n_decisions,
                })}
              </p>
              <ol className="journey-steps">
                {[t("flow.district"), t("flow.initiatives"), t("flow.compare")].map(
                  (label, index) => (
                    <li
                      key={label}
                      className={journeyStep === index + 1 ? "active" : ""}
                    >
                      <b>0{index + 1}</b>
                      <span>{label}</span>
                    </li>
                  ),
                )}
              </ol>
              <p className="journey-hint">{t("flow.hint")}</p>
            </section>
            <section className="scoreboard" aria-label={t("analytics")}>
              <div className="score-block">
                <span className="metric-icon">
                  <Icon name="chart" />
                </span>
                <div>
                  <small>{t("baseline")}</small>
                  <strong>
                    {format(baseline.score)}
                    <span>/ {data.score.clip_indicators_to[1]}</span>
                  </strong>
                </div>
              </div>
              <div className="score-block projected">
                <div>
                  <small>{t("projected")}</small>
                  <strong data-testid="projected-score">
                    {format(projected.score)}
                  </strong>
                </div>
                <span className="delta-badge">
                  {signed(projected.score - baseline.score)}
                </span>
              </div>
              <div className="score-block budget-block">
                <div>
                  <small>
                    {t("budget")} · {data.rules.budget_max}
                  </small>
                  <strong>
                    {projected.remaining}
                    <span>{t("remaining")}</span>
                  </strong>
                  <div className="budget-meter">
                    <i
                      style={{
                        width: `${(projected.remaining / data.rules.budget_max) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <small>
                  {projected.spent} {t("spent")}
                </small>
              </div>
              <div className="score-block decision-block">
                <div>
                  <small>{t("decisions")}</small>
                  <strong data-testid="decision-count">
                    {plan.length}
                    <span>/ {data.rules.exactly_n_decisions}</span>
                  </strong>
                </div>
                <div className="decision-dots">
                  {Array.from(
                    { length: data.rules.exactly_n_decisions },
                    (_, index) => (
                      <i
                        key={index}
                        className={index < plan.length ? "filled" : ""}
                      >
                        {index < plan.length && <Icon name="check" size={12} />}
                      </i>
                    ),
                  )}
                </div>
              </div>
            </section>
            <div className="game-layout">
              <section className="city-panel">
                <div className="city-panel-heading">
                  <div>
                    <span className="eyebrow">ASTANA</span>
                    <h2>{t("districts")}</h2>
                  </div>
                  <span className="live-indicator">
                    <i />
                    {t("live")}
                  </span>
                </div>
                <div className="map-toolbar">
                  <span>{t("map.caption")}</span>
                  <div className="segmented-control">
                    <button
                      className={beforeMap ? "active" : ""}
                      onClick={() => setBeforeMap(true)}
                    >
                      {t("before")}
                    </button>
                    <button
                      className={!beforeMap ? "active" : ""}
                      onClick={() => setBeforeMap(false)}
                    >
                      {t("after")}
                    </button>
                  </div>
                </div>
                <CityMap
                  selected={selected}
                  onSelect={chooseDistrict}
                  plan={beforeMap ? [] : plan}
                  scores={
                    beforeMap
                      ? baseline.districtScores
                      : projected.districtScores
                  }
                  locale={locale}
                />
                <p className="map-disclaimer">{t("map.note")}</p>
                <div className="city-watch">
                  <span className="watch-icon">!</span>
                  <div>
                    <small>{t("weakest")}</small>
                    <strong>
                      {districtName(locale, projected.weakestDistrictId)}{" "}
                      <span>
                        {format(
                          projected.districtScores[projected.weakestDistrictId],
                        )}
                      </span>
                    </strong>
                  </div>
                  <div>
                    <small>{t("critical")}</small>
                    <strong>
                      {projected.criticalCount}
                      <span>
                        {" "}
                        /{" "}
                        {data.districts.length *
                          Object.keys(data.indicators).length}
                      </span>
                    </strong>
                  </div>
                </div>
              </section>
              <section className="command-panel">
                <nav className="tabs" aria-label={t("mode")}>
                  {tabs.map((item) => (
                    <button
                      key={item.id}
                      aria-pressed={tab === item.id}
                      className={tab === item.id ? "active" : ""}
                      onClick={() => setTab(item.id)}
                    >
                      <Icon name={item.icon as IconName} size={17} />
                      <span>{t(item.id)}</span>
                    </button>
                  ))}
                </nav>
                <div className="tab-content">
                  {tab === "district" && (
                    <div className="district-content">
                      <div className="district-heading">
                        <div>
                          <span className="eyebrow">{t("district")}</span>
                          <h2>
                            {districtName(locale, selected)}
                            <span className="district-number">
                              0
                              {data.districts.findIndex(
                                (d) => d.id === selected,
                              ) + 1}
                            </span>
                          </h2>
                        </div>
                        <select
                          aria-label={t("district")}
                          value={selected}
                          onChange={(event) =>
                            setSelected(event.target.value as DistrictId)
                          }
                        >
                          {data.districts.map((d) => (
                            <option key={d.id} value={d.id}>
                              {districtName(locale, d.id)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="district-profile">
                        {t(`profile.${selected}`)}
                      </p>
                      <div className="district-stats">
                        <div>
                          <small>{t("districtScore")}</small>
                          <strong>
                            {format(projected.districtScores[selected])}
                            <span className="positive">
                              {signed(
                                projected.districtScores[selected] -
                                  baseline.districtScores[selected],
                              )}
                            </span>
                          </strong>
                        </div>
                        <div>
                          <small>{t("population")}</small>
                          <strong>
                            {Math.round(district.population_share * 100)}
                            <span>%</span>
                          </strong>
                        </div>
                      </div>
                      <div className="needs-box">
                        <span>↗</span>
                        <div>
                          <h3>{t("district.needs")}</h3>
                          <p>
                            {weakestIndicators
                              .map(
                                (id) =>
                                  `${indicatorName(locale, id)} (${format(state.indicators[id], 1)})`,
                              )
                              .join(" · ")}
                          </p>
                        </div>
                      </div>
                      <div className="indicator-heading">
                        <h3>{t("district.indicators")}</h3>
                        <span>{data.score.clip_indicators_to.join("—")}</span>
                      </div>
                      <div className="indicator-grid">
                        {(Object.keys(data.indicators) as IndicatorId[]).map(
                          (id) => {
                            const value = state.indicators[id];
                            const delta = value - district.indicators[id];
                            return (
                              <div
                                className={`indicator-item ${value < data.score.critical_threshold_strictly_below ? "critical" : ""}`}
                                key={id}
                              >
                                <div>
                                  <small>{id}</small>
                                  <span>{indicatorName(locale, id)}</span>
                                  <strong>
                                    {format(value, 1)}
                                    {value <
                                      data.score
                                        .critical_threshold_strictly_below && (
                                      <b title={t("critical")}>!</b>
                                    )}
                                  </strong>
                                </div>
                                <div className="meter">
                                  <i style={{ width: `${value}%` }} />
                                  <b
                                    style={{
                                      left: `${district.indicators[id]}%`,
                                    }}
                                  />
                                </div>
                                {delta !== 0 && (
                                  <em
                                    className={
                                      delta > 0 ? "positive" : "negative"
                                    }
                                  >
                                    {signed(delta, 1)}
                                  </em>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                      <p className="small-note">{t("district.hint")}</p>
                      <button
                        className="primary-button wide"
                        onClick={() => setTab("initiatives")}
                      >
                        {t("district.explore", {
                          district: districtName(locale, selected),
                        })}
                        <Icon name="arrow" size={17} />
                      </button>
                    </div>
                  )}
                  {tab === "initiatives" && (
                    <div className="initiatives-content">
                      <div className="section-heading">
                        <span className="eyebrow">
                          {data.actions.length} · {t("initiatives")}
                        </span>
                        <h2>{t("initiative.title")}</h2>
                        <p>{t("initiative.description")}</p>
                      </div>
                      <div className="target-selector">
                        <Icon name="pin" size={18} />
                        <label htmlFor="target-district">{t("target")}</label>
                        <select
                          id="target-district"
                          value={selected}
                          onChange={(e) =>
                            setSelected(e.target.value as DistrictId)
                          }
                        >
                          {data.districts.map((d) => (
                            <option key={d.id} value={d.id}>
                              {districtName(locale, d.id)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="filter-chips">
                        <button
                          className={filter === "all" ? "active" : ""}
                          onClick={() => setFilter("all")}
                        >
                          {t("all")}
                        </button>
                        {domains.map((domain) => (
                          <button
                            key={domain}
                            className={filter === domain ? "active" : ""}
                            onClick={() => setFilter(domain)}
                          >
                            {domainName(locale, domain)}
                          </button>
                        ))}
                      </div>
                      <div className="initiative-list">
                        {data.actions
                          .filter(
                            (a) => filter === "all" || a.domain === filter,
                          )
                          .map((action) => {
                            const decision: Decision = {
                              actionId: action.id,
                              ...(action.scope === "district"
                                ? { districtId: selected }
                                : {}),
                            };
                            const chosen = plan.find(
                              (d) => d.actionId === action.id,
                            );
                            const candidate = previewPlan(
                              [...plan, decision],
                              data,
                            );
                            const blocked = !chosen && !candidate.available;
                            return (
                              <article
                                key={action.id}
                                data-action-id={action.id}
                                className={`initiative-card ${chosen ? "chosen" : ""} ${blocked ? "blocked" : ""}`}
                              >
                                <div className="initiative-top">
                                  <span
                                    className={`action-icon ${action.domain}`}
                                  >
                                    <Icon name={action.domain} />
                                  </span>
                                  <div>
                                    <small>
                                      {action.id} ·{" "}
                                      {domainName(locale, action.domain)}
                                    </small>
                                    <h3>{actionName(locale, action.id)}</h3>
                                  </div>
                                  <span className="action-cost">
                                    {action.cost}
                                    <small>{t("cost")}</small>
                                  </span>
                                </div>
                                <div className="action-meta">
                                  <span>
                                    <Icon
                                      name={
                                        action.scope === "city" ? "city" : "pin"
                                      }
                                      size={13}
                                    />
                                    {action.scope === "city"
                                      ? t("city")
                                      : districtName(
                                          locale,
                                          chosen?.districtId ?? selected,
                                        )}
                                  </span>
                                  <span>
                                    ◷ {t("quarters", { n: action.lag })}
                                  </span>
                                </div>
                                <div className="action-effects">
                                  <small>{t("effects")}</small>
                                  <div>
                                    {Object.entries(action.effects).map(
                                      ([key, value]) => (
                                        <span
                                          key={key}
                                          className={
                                            value < 0 ? "negative" : ""
                                          }
                                          title={indicatorName(
                                            locale,
                                            key as IndicatorId,
                                          )}
                                        >
                                          {key}{" "}
                                          <b>
                                            {signed(value, 0)} →{" "}
                                            {signed(
                                              value *
                                                realizedFraction(
                                                  action.lag,
                                                  data.meta.horizon_quarters,
                                                ),
                                              2,
                                            )}
                                          </b>
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                                {blocked && !candidate.available && (
                                  <p className="blocked-reason">
                                    {candidate.issues
                                      .map((issue) => issueText(locale, issue))
                                      .join(" · ")}
                                  </p>
                                )}
                                <button
                                  className={
                                    chosen ? "selected-button" : "add-button"
                                  }
                                  disabled={blocked}
                                  onClick={() =>
                                    chosen
                                      ? setPlan(
                                          plan.filter(
                                            (d) => d.actionId !== action.id,
                                          ),
                                        )
                                      : add(decision)
                                  }
                                  aria-label={`${chosen ? t("remove") : t("add")} ${action.id}`}
                                >
                                  <Icon
                                    name={chosen ? "check" : "plus"}
                                    size={15}
                                  />
                                  {chosen
                                    ? `${t("selected")} · ${t("remove")}`
                                    : blocked
                                      ? t("unavailable")
                                      : t("add")}
                                </button>
                              </article>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  {tab === "analytics" && (
                    <AnalyticsPanel
                      states={projected.districtStates}
                      scores={projected}
                      synergies={projected.synergiesTriggered}
                      locale={locale}
                    />
                  )}
                  {tab === "advisor" && (
                    <AdvisorPanel
                      key={`${locale}:${JSON.stringify(plan)}:${selected}`}
                      plan={plan}
                      locale={locale}
                      selected={selected}
                      onAdd={add}
                    />
                  )}
                </div>
              </section>
            </div>
            <section className="agenda">
              <div className="agenda-heading">
                <div>
                  <span className="eyebrow">{t("plan.title")}</span>
                  <h2>
                    {remainingDecisions
                      ? t("plan.slots", { n: remainingDecisions })
                      : t("plan.ready")}
                  </h2>
                </div>
                <div className="agenda-tools">
                  <button onClick={loadExample}>{t("plan.example")}</button>
                  <button onClick={reset}>
                    <Icon name="reset" size={14} />
                    {t("plan.reset")}
                  </button>
                </div>
              </div>
              <div className="agenda-slots">
                {Array.from(
                  { length: data.rules.exactly_n_decisions },
                  (_, index) => {
                    const d = plan[index];
                    return (
                      <div
                        key={index}
                        className={`agenda-slot ${d ? "occupied" : ""}`}
                      >
                        <span className="slot-number">0{index + 1}</span>
                        {d ? (
                          <>
                            <div>
                              <strong>{actionName(locale, d.actionId)}</strong>
                              <small>
                                {d.actionId} ·{" "}
                                {d.districtId
                                  ? districtName(locale, d.districtId)
                                  : t("city")}
                              </small>
                            </div>
                            <button
                              aria-label={`${t("remove")} ${d.actionId}`}
                              onClick={() =>
                                setPlan(
                                  plan.filter(
                                    (item) => item.actionId !== d.actionId,
                                  ),
                                )
                              }
                            >
                              <Icon name="close" size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="empty-slot"
                            onClick={() => setTab("initiatives")}
                            aria-label={t("add")}
                          >
                            <Icon name="plus" size={20} />
                          </button>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
              {!plan.length && (
                <p className="empty-plan-note">
                  {t("plan.empty")} {t("plan.emptyHint")}
                </p>
              )}
              <div className="agenda-footer">
                <div>
                  <p className={official.valid ? "positive" : "small-note"}>
                    {official.valid ? `✓ ${t("plan.valid")}` : t("plan.draft")}
                  </p>
                  {projected.synergiesTriggered.length > 0 && (
                    <p className="synergy-inline">
                      <Icon name="spark" size={14} />
                      {t("synergies")}:{" "}
                      {projected.synergiesTriggered
                        .map((s) => s.actionIds.join(" + "))
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <button
                  className="primary-button confirm-button"
                  disabled={!official.valid}
                  onClick={finish}
                >
                  {official.valid
                    ? t("plan.confirm")
                    : t("plan.continue", { n: remainingDecisions })}
                  <Icon name="arrow" size={18} />
                </button>
              </div>
              {notice && (
                <p className="notice" role="alert">
                  {notice}
                </p>
              )}
            </section>
          </>
        ) : (
          official.valid && (
            <section className="results-page">
              <div className="result-heading">
                <span className="eyebrow">{t("result.eyebrow")}</span>
                <h1>{t("result.title")}</h1>
                <p>{t("result.subtitle")}</p>
              </div>
              <div className="result-score-card">
                <div>
                  <small>{t("before")}</small>
                  <strong>{format(baseline.score)}</strong>
                </div>
                <span className="result-arrow">→</span>
                <div className="final-score">
                  <small>{t("after")}</small>
                  <strong data-testid="final-score">
                    {format(official.score)}
                  </strong>
                </div>
                <div className="result-delta">
                  <Icon name="chart" size={24} />
                  <strong>{signed(official.score - baseline.score)}</strong>
                  <small>{t("change")}</small>
                </div>
              </div>
              <div className="result-budget">
                <span>
                  {t("spent")}: <b>{official.spent}</b>
                </span>
                <span>
                  {t("remaining")}: <b>{official.remaining}</b>
                </span>
                <span>
                  {t("decisions")}:{" "}
                  <b>
                    {plan.length} / {data.rules.exactly_n_decisions}
                  </b>
                </span>
                <span className="positive">✓ {t("plan.valid")}</span>
              </div>
              <div className="result-actions">
                <button
                  className="secondary-button"
                  onClick={() => setFinished(false)}
                >
                  {t("result.back")}
                </button>
                <button
                  className="primary-button"
                  onClick={() => setCompare(!compare)}
                >
                  <Icon name="spark" size={17} />
                  {t("result.compare")}
                </button>
              </div>
              {compare && (
                <div className="reference-section">
                  <div className="section-heading">
                    <span className="eyebrow">{t("reference")}</span>
                    <h2>{t("reference.method")}</h2>
                    <p>
                      {t("reference.detail", {
                        n: referenceMetadata.validCandidates.toLocaleString(
                          locale,
                        ),
                      })}
                    </p>
                  </div>
                  <div className="comparison-grid">
                    {[
                      { label: t("player"), result: official, decisions: plan },
                      {
                        label: t("reference"),
                        result: referenceResult,
                        decisions: referencePlan,
                      },
                    ].map((side, i) => (
                      <div
                        className={`comparison-card ${i === 1 ? "reference-card" : ""}`}
                        key={i}
                      >
                        <h3>{side.label}</h3>
                        <strong className="comparison-score">
                          {format(side.result.score)}
                        </strong>
                        <div className="comparison-facts">
                          <span>
                            {t("spent")}
                            <b>{side.result.spent}</b>
                          </span>
                          <span>
                            {t("weakest")}
                            <b>
                              {districtName(
                                locale,
                                side.result.weakestDistrictId,
                              )}
                            </b>
                          </span>
                          <span>
                            {t("critical")}
                            <b>{side.result.criticalCount}</b>
                          </span>
                        </div>
                        {planList(side.decisions)}
                      </div>
                    ))}
                  </div>
                  <div className="reference-insight">
                    <Icon name="spark" />
                    <div>
                      <h3>{t("reference.explain")}</h3>
                      <p>{t("reference.insight")}</p>
                      <p>
                        {t("advisor.gap", {
                          reference: format(referenceResult.score),
                          player: format(official.score),
                          delta: signed(referenceResult.score - official.score),
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="result-detail-grid">
                <div className="result-analytics">
                  <AnalyticsPanel
                    states={official.districtStates}
                    scores={official}
                    synergies={official.synergiesTriggered}
                    locale={locale}
                  />
                </div>
                <aside className="result-sidebar">
                  <h3>{t("plan.title")}</h3>
                  {planList(plan)}
                  <AdvisorPanel
                    key={`${locale}:result`}
                    plan={plan}
                    locale={locale}
                    selected={selected}
                    onAdd={() => {}}
                  />
                </aside>
              </div>
              <button
                className="secondary-button restart-button"
                onClick={reset}
              >
                <Icon name="reset" size={17} />
                {t("plan.reset")}
              </button>
            </section>
          )
        )}
      </main>
      <footer className="footer">
        <span>{t("footer")}</span>
        <span>{t("advisor.safety")}</span>
      </footer>
    </div>
  );
}
