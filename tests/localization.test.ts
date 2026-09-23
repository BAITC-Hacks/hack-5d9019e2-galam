import { describe, expect, it } from "vitest";
import { dictionaries, translate } from "../src/i18n";

describe("essential UI translations", () => {
  it.each(["ru", "kk"] as const)(
    "%s covers every English key and placeholder",
    (locale) => {
      expect(Object.keys(dictionaries[locale]).sort()).toEqual(
        Object.keys(dictionaries.en).sort(),
      );
      for (const [key, value] of Object.entries(dictionaries.en)) {
        const translated =
          dictionaries[locale][key as keyof typeof dictionaries.en];
        expect(translated.length).toBeGreaterThan(0);
        expect(translated.match(/\{\w+\}/g)?.sort() ?? []).toEqual(
          value.match(/\{\w+\}/g)?.sort() ?? [],
        );
      }
    },
  );
  it("interpolates values without translating official IDs", () =>
    expect(translate("en", "plan.slots", { n: 3 })).toBe("3 decisions left"));
});
