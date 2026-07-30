import type { Locale } from "./i18n/locales";
import { getDictionary, t, tg, type RecipientGender } from "./i18n/t";
import type { DraftQuestion } from "./types";

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;

export const MAX_NAME_LENGTH = 40;
export const MAX_TEXT_LENGTH = 120;
export const MAX_OPTION_LENGTH = 40;

/** The pre-filled gate question, in the creator's language, gendered (Hebrew verbs). */
export function defaultGateQuestion(locale: Locale, gender: RecipientGender = "SHE"): string {
  return tg(getDictionary(locale), "seed.gate", gender);
}

/**
 * The three logistics questions pre-loaded into a fresh builder, in the
 * creator's language. These are seeds, not chrome — the creator edits them and
 * whatever they end up as is stored verbatim and never translated again.
 */
export function defaultQuestions(locale: Locale): DraftQuestion[] {
  const dict = getDictionary(locale);
  return [
    {
      id: "default-food",
      text: t(dict, "seed.food.q"),
      options: [t(dict, "seed.food.a1"), t(dict, "seed.food.a2"), t(dict, "seed.food.a3")],
    },
    {
      id: "default-place",
      text: t(dict, "seed.place.q"),
      options: [t(dict, "seed.place.a1"), t(dict, "seed.place.a2"), t(dict, "seed.place.a3")],
    },
    {
      id: "default-when",
      text: t(dict, "seed.when.q"),
      options: [t(dict, "seed.when.a1"), t(dict, "seed.when.a2"), t(dict, "seed.when.a3")],
    },
  ];
}

/** A blank question for the "add question" button. */
export function emptyQuestion(id: string): DraftQuestion {
  return { id, text: "", options: ["", ""] };
}
