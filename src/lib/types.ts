import type { Locale } from "./i18n/locales";
import type { MessageKey } from "./i18n/t";

export type MascotKind = "BEAR" | "PENGUIN";
export type InvitationStatus = "PENDING" | "ANSWERED";

/** Mascot moods the SVG mascots know how to render. */
export type MascotMood = "idle" | "blush" | "wave" | "cheer";

/** A question while it is still being edited in the builder. */
export type DraftQuestion = {
  id: string;
  text: string;
  options: string[];
};

/** Everything the builder collects before an invitation exists in the DB. */
export type Draft = {
  recipientName: string;
  /** Where the "invitation created" / "invitation answered" emails go. */
  creatorEmail: string;
  mascot: MascotKind | null;
  gateQuestion: string;
  questions: DraftQuestion[];
  /** The language the creator is authoring in — stored on the invitation. */
  locale: Locale;
};

/**
 * Validation failures travel as codes, not sentences — `src/lib/` has no locale,
 * so the message is resolved wherever it is rendered.
 */
export type FieldError = {
  code: MessageKey;
  params?: Record<string, string | number>;
};

export type QuestionFieldErrors = {
  text?: FieldError;
  options?: FieldError;
};

export type DraftErrors = {
  recipientName?: FieldError;
  creatorEmail?: FieldError;
  mascot?: FieldError;
  gateQuestion?: FieldError;
  /** Problem with the question list as a whole (e.g. there are none). */
  questions?: FieldError;
  byQuestion: Record<string, QuestionFieldErrors>;
};

/** One line of the recap card: what was asked, what she picked. */
export type RecapItem = {
  question: string;
  answer: string;
};

/** Shape handed to the recipient flow. */
export type InviteView = {
  token: string;
  /** The invitation's own locale; the recipient's chrome follows it. */
  locale: Locale;
  recipientName: string;
  mascot: MascotKind;
  gateQuestion: string;
  questions: {
    id: string;
    text: string;
    options: { id: string; label: string }[];
  }[];
};

export type AnswerSubmission = {
  questionId: string;
  selectedOptionId: string;
};
