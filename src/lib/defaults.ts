import type { DraftQuestion } from "./types";

export const DEFAULT_GATE_QUESTION = "תרצי לצאת איתי לדייט?";

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;

export const MAX_NAME_LENGTH = 40;
export const MAX_TEXT_LENGTH = 120;
export const MAX_OPTION_LENGTH = 40;

/** The three logistics questions pre-loaded into a fresh builder. */
export function defaultQuestions(): DraftQuestion[] {
  return [
    { id: "default-food", text: "מה בא לך לאכול?", options: ["סושי", "פיצה", "המבורגר"] },
    { id: "default-place", text: "לאן נלך אחר כך?", options: ["טיילת", "בית קפה", "קולנוע"] },
    { id: "default-when", text: "מתי מסתדר לך?", options: ["יום חמישי", "שישי בערב", "מוצאי שבת"] },
  ];
}

/** A blank question for the "הוספת שאלה" button. */
export function emptyQuestion(id: string): DraftQuestion {
  return { id, text: "", options: ["", ""] };
}
