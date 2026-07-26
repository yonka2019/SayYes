import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  DIR,
  LOCALES,
  isLocale,
  localeFromPath,
  negotiate,
  resolveLocale,
  swapLocale,
} from "@/lib/i18n/locales";
import { he } from "@/lib/i18n/dictionaries/he";
import { ru } from "@/lib/i18n/dictionaries/ru";
import { en } from "@/lib/i18n/dictionaries/en";
import { format, getDictionary, t } from "@/lib/i18n/t";
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  defaultGateQuestion,
  defaultQuestions,
} from "@/lib/defaults";
import { validateDraft } from "@/lib/validation";

describe("isLocale", () => {
  it("accepts the three shipped locales", () => {
    expect(isLocale("he")).toBe(true);
    expect(isLocale("ru")).toBe(true);
    expect(isLocale("en")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isLocale("de")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(7)).toBe(false);
  });
});

describe("localeFromPath", () => {
  it("splits a prefixed path into locale and remainder", () => {
    expect(localeFromPath("/ru/new")).toEqual({ locale: "ru", rest: "/new" });
    expect(localeFromPath("/he/invite/abc123")).toEqual({
      locale: "he",
      rest: "/invite/abc123",
    });
  });

  it("treats a bare locale as the root of that locale", () => {
    expect(localeFromPath("/en")).toEqual({ locale: "en", rest: "/" });
    expect(localeFromPath("/en/")).toEqual({ locale: "en", rest: "/" });
  });

  it("reports no locale for an unprefixed path", () => {
    expect(localeFromPath("/")).toEqual({ locale: null, rest: "/" });
    expect(localeFromPath("/new")).toEqual({ locale: null, rest: "/new" });
    expect(localeFromPath("/de/new")).toEqual({ locale: null, rest: "/de/new" });
  });
});

describe("swapLocale", () => {
  it("replaces an existing prefix", () => {
    expect(swapLocale("/he/new", "ru")).toBe("/ru/new");
    expect(swapLocale("/he", "en")).toBe("/en");
  });

  it("adds a prefix when there is none", () => {
    expect(swapLocale("/new", "he")).toBe("/he/new");
    expect(swapLocale("/", "ru")).toBe("/ru");
  });

  it("round-trips", () => {
    expect(swapLocale(swapLocale("/he/invite/x", "en"), "he")).toBe("/he/invite/x");
  });
});

describe("negotiate", () => {
  it("matches on the base subtag", () => {
    expect(negotiate("ru-RU")).toBe("ru");
    expect(negotiate("he-IL")).toBe("he");
    expect(negotiate("en-GB")).toBe("en");
  });

  it("maps the legacy Hebrew tag iw to he", () => {
    expect(negotiate("iw-IL")).toBe("he");
    expect(negotiate("iw")).toBe("he");
  });

  it("honours q-weights rather than list order", () => {
    expect(negotiate("de;q=1.0, ru;q=0.9, en;q=0.8")).toBe("ru");
    expect(negotiate("en;q=0.4, he;q=0.9")).toBe("he");
  });

  it("defaults a missing q to 1", () => {
    expect(negotiate("en, ru;q=0.9")).toBe("en");
  });

  it("skips languages it does not ship and keeps looking", () => {
    expect(negotiate("fr-FR, de-DE, en-US")).toBe("en");
  });

  it("returns null when nothing matches or the header is unusable", () => {
    expect(negotiate("fr,de")).toBeNull();
    expect(negotiate("")).toBeNull();
    expect(negotiate(null)).toBeNull();
    expect(negotiate(";;;q=")).toBeNull();
  });

  it("ignores the wildcard rather than treating it as a match", () => {
    expect(negotiate("*")).toBeNull();
  });
});

describe("resolveLocale", () => {
  it("prefers an explicit path prefix over everything", () => {
    expect(
      resolveLocale({ pathname: "/en/new", cookie: "ru", acceptLanguage: "he-IL" })
    ).toBe("en");
  });

  it("falls back to the cookie when the path has no prefix", () => {
    expect(
      resolveLocale({ pathname: "/new", cookie: "ru", acceptLanguage: "he-IL" })
    ).toBe("ru");
  });

  it("ignores a cookie that is not a shipped locale", () => {
    expect(
      resolveLocale({ pathname: "/new", cookie: "de", acceptLanguage: "he-IL" })
    ).toBe("he");
  });

  it("falls back to the header when there is no cookie", () => {
    expect(
      resolveLocale({ pathname: "/", cookie: null, acceptLanguage: "ru-RU,ru;q=0.9" })
    ).toBe("ru");
  });

  it("falls back to Hebrew when nothing is usable", () => {
    expect(resolveLocale({ pathname: "/" })).toBe(DEFAULT_LOCALE);
    expect(resolveLocale({ pathname: "/", cookie: null, acceptLanguage: "fr" })).toBe("he");
  });
});

describe("DIR", () => {
  it("only Hebrew is right-to-left", () => {
    expect(DIR).toEqual({ he: "rtl", ru: "ltr", en: "ltr" });
  });
});

const placeholders = (value: string) =>
  [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe("dictionary integrity", () => {
  const others = { ru, en } as const;

  it("every locale has a dictionary", () => {
    for (const locale of LOCALES) {
      expect(Object.keys(getDictionary(locale)).length).toBeGreaterThan(0);
    }
  });

  it("translations have exactly the Hebrew key set", () => {
    const expected = Object.keys(he).sort();
    for (const [name, dict] of Object.entries(others)) {
      expect(Object.keys(dict).sort(), name).toEqual(expected);
    }
  });

  it("has no empty strings anywhere", () => {
    for (const [name, dict] of Object.entries({ he, ...others })) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim().length, `${name}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the same placeholders in every translation", () => {
    for (const [name, dict] of Object.entries(others)) {
      for (const key of Object.keys(he) as (keyof typeof he)[]) {
        expect(placeholders(dict[key]), `${name}:${key}`).toEqual(
          placeholders(he[key])
        );
      }
    }
  });
});

describe("format", () => {
  it("substitutes named placeholders", () => {
    expect(format("Hey {name}!", { name: "Maya" })).toBe("Hey Maya!");
  });

  it("substitutes numbers and repeats", () => {
    expect(format("{a} and {a} and {b}", { a: 1, b: 2 })).toBe("1 and 1 and 2");
  });

  it("leaves unknown placeholders alone rather than printing undefined", () => {
    expect(format("Hey {name}!", { other: "x" })).toBe("Hey {name}!");
    expect(format("Hey {name}!")).toBe("Hey {name}!");
  });
});

describe("t", () => {
  it("resolves a key in the requested locale", () => {
    expect(t(getDictionary("en"), "invite.yes")).toBe("Yes");
    expect(t(getDictionary("ru"), "invite.yes")).toBe("Да");
    expect(t(getDictionary("he"), "invite.yes")).toBe("כן");
  });

  it("interpolates", () => {
    expect(t(getDictionary("en"), "invite.gate.intro", { name: "Maya" })).toBe(
      "Hey Maya, I've got something to ask..."
    );
  });
});

describe("builder seeds", () => {
  it("seeds a valid draft in every locale", () => {
    for (const locale of LOCALES) {
      const { valid } = validateDraft({
        recipientName: "Maya",
        mascot: "BEAR",
        gateQuestion: defaultGateQuestion(locale),
        questions: defaultQuestions(locale),
        locale,
      });
      expect(valid, locale).toBe(true);
    }
  });

  it("seeds three questions with legal option counts", () => {
    for (const locale of LOCALES) {
      const questions = defaultQuestions(locale);
      expect(questions).toHaveLength(3);
      for (const question of questions) {
        expect(question.options.length).toBeGreaterThanOrEqual(MIN_OPTIONS);
        expect(question.options.length).toBeLessThanOrEqual(MAX_OPTIONS);
      }
    }
  });

  it("seeds different text per locale", () => {
    expect(defaultGateQuestion("he")).not.toBe(defaultGateQuestion("en"));
    expect(defaultGateQuestion("ru")).not.toBe(defaultGateQuestion("en"));
  });
});
