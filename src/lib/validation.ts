import {
  MAX_NAME_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_OPTIONS,
  MAX_TEXT_LENGTH,
  MIN_OPTIONS,
} from "./defaults";
import type { Draft, DraftErrors, QuestionFieldErrors } from "./types";

const MASCOTS = ["BEAR", "PENGUIN"] as const;

function validateQuestionOptions(options: string[]): string | undefined {
  const labels = options.map((option) => option.trim());

  if (labels.length < MIN_OPTIONS || labels.length > MAX_OPTIONS) {
    return `צריך בין ${MIN_OPTIONS} ל-${MAX_OPTIONS} תשובות`;
  }
  if (labels.some((label) => label.length === 0)) {
    return "יש תשובה ריקה";
  }
  if (labels.some((label) => label.length > MAX_OPTION_LENGTH)) {
    return `תשובה ארוכה מדי (עד ${MAX_OPTION_LENGTH} תווים)`;
  }
  if (new Set(labels).size !== labels.length) {
    return "יש תשובות זהות";
  }
  return undefined;
}

/**
 * The single source of truth for builder validity — used by the form for inline
 * errors and re-run on the server before anything is written to the DB.
 */
export function validateDraft(draft: Draft): { valid: boolean; errors: DraftErrors } {
  const errors: DraftErrors = { byQuestion: {} };

  const name = draft.recipientName.trim();
  if (name.length === 0) {
    errors.recipientName = "צריך למלא שם";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.recipientName = `שם ארוך מדי (עד ${MAX_NAME_LENGTH} תווים)`;
  }

  if (draft.mascot === null || !MASCOTS.includes(draft.mascot)) {
    errors.mascot = "צריך לבחור קמע";
  }

  const gate = draft.gateQuestion.trim();
  if (gate.length === 0) {
    errors.gateQuestion = "צריך שאלת פתיחה";
  } else if (gate.length > MAX_TEXT_LENGTH) {
    errors.gateQuestion = `שאלה ארוכה מדי (עד ${MAX_TEXT_LENGTH} תווים)`;
  }

  if (draft.questions.length === 0) {
    errors.questions = "צריך לפחות שאלה אחת";
  }

  for (const question of draft.questions) {
    const questionErrors: QuestionFieldErrors = {};

    const text = question.text.trim();
    if (text.length === 0) {
      questionErrors.text = "צריך למלא את השאלה";
    } else if (text.length > MAX_TEXT_LENGTH) {
      questionErrors.text = `שאלה ארוכה מדי (עד ${MAX_TEXT_LENGTH} תווים)`;
    }

    const optionsError = validateQuestionOptions(question.options);
    if (optionsError) questionErrors.options = optionsError;

    if (Object.keys(questionErrors).length > 0) {
      errors.byQuestion[question.id] = questionErrors;
    }
  }

  const valid =
    !errors.recipientName &&
    !errors.mascot &&
    !errors.gateQuestion &&
    !errors.questions &&
    Object.keys(errors.byQuestion).length === 0;

  return { valid, errors };
}
