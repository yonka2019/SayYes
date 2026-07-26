import {
  MAX_NAME_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_OPTIONS,
  MAX_TEXT_LENGTH,
  MIN_OPTIONS,
} from "./defaults";
import type { Draft, DraftErrors, FieldError, QuestionFieldErrors } from "./types";

const MASCOTS = ["BEAR", "PENGUIN"] as const;

function validateQuestionOptions(options: string[]): FieldError | undefined {
  const labels = options.map((option) => option.trim());

  if (labels.length < MIN_OPTIONS || labels.length > MAX_OPTIONS) {
    return { code: "error.options.count", params: { min: MIN_OPTIONS, max: MAX_OPTIONS } };
  }
  if (labels.some((label) => label.length === 0)) {
    return { code: "error.options.empty" };
  }
  if (labels.some((label) => label.length > MAX_OPTION_LENGTH)) {
    return { code: "error.options.tooLong", params: { max: MAX_OPTION_LENGTH } };
  }
  if (new Set(labels).size !== labels.length) {
    return { code: "error.options.duplicate" };
  }
  return undefined;
}

/**
 * The single source of truth for builder validity — used by the form for inline
 * errors and re-run on the server before anything is written to the DB.
 *
 * Returns error *codes*: this module has no locale, so the sentence is resolved
 * at the render site (or by the client, for the API's 400 body).
 */
export function validateDraft(draft: Draft): { valid: boolean; errors: DraftErrors } {
  const errors: DraftErrors = { byQuestion: {} };

  const name = draft.recipientName.trim();
  if (name.length === 0) {
    errors.recipientName = { code: "error.name.required" };
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.recipientName = { code: "error.name.tooLong", params: { max: MAX_NAME_LENGTH } };
  }

  if (draft.mascot === null || !MASCOTS.includes(draft.mascot)) {
    errors.mascot = { code: "error.mascot.required" };
  }

  const gate = draft.gateQuestion.trim();
  if (gate.length === 0) {
    errors.gateQuestion = { code: "error.gate.required" };
  } else if (gate.length > MAX_TEXT_LENGTH) {
    errors.gateQuestion = { code: "error.text.tooLong", params: { max: MAX_TEXT_LENGTH } };
  }

  if (draft.questions.length === 0) {
    errors.questions = { code: "error.questions.empty" };
  }

  for (const question of draft.questions) {
    const questionErrors: QuestionFieldErrors = {};

    const text = question.text.trim();
    if (text.length === 0) {
      questionErrors.text = { code: "error.question.required" };
    } else if (text.length > MAX_TEXT_LENGTH) {
      questionErrors.text = { code: "error.text.tooLong", params: { max: MAX_TEXT_LENGTH } };
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
