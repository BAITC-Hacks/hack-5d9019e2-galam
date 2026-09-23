import en from "./en.json";
import ru from "./ru.json";
import kk from "./kk.json";
import type {
  ActionId,
  DistrictId,
  Domain,
  IndicatorId,
  ValidationIssue,
} from "../lib/simulation/types";

export type Locale = "en" | "ru" | "kk";
export type TranslationKey = keyof typeof en;
export const dictionaries = { en, ru, kk } satisfies Record<
  Locale,
  Record<TranslationKey, string>
>;
export function translate(
  locale: Locale,
  key: TranslationKey,
  values: Record<string, string | number> = {},
) {
  return dictionaries[locale][key].replace(
    /\{(\w+)\}/g,
    (_match, name: string) => String(values[name] ?? `{${name}}`),
  );
}
export const actionName = (locale: Locale, id: ActionId) =>
  translate(locale, `action.${id}`);
export const districtName = (locale: Locale, id: DistrictId) =>
  translate(locale, `district.${id}`);
export const domainName = (locale: Locale, id: Domain) =>
  translate(locale, `domain.${id}`);
export const indicatorName = (locale: Locale, id: IndicatorId) =>
  translate(locale, `indicator.${id}`);
export function issueText(locale: Locale, issue: ValidationIssue) {
  const label = translate(locale, issue.messageKey as TranslationKey);
  return `${label}${issue.actionIds?.length ? ` · ${issue.actionIds.join(" + ")}` : ""}${issue.districtId ? ` · ${districtName(locale, issue.districtId as DistrictId)}` : ""}`;
}
export const format = (value: number, digits = 2) => value.toFixed(digits);
export const signed = (value: number, digits = 2) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
