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
  mascot: MascotKind | null;
  gateQuestion: string;
  questions: DraftQuestion[];
};

export type QuestionFieldErrors = {
  text?: string;
  options?: string;
};

export type DraftErrors = {
  recipientName?: string;
  mascot?: string;
  gateQuestion?: string;
  /** Problem with the question list as a whole (e.g. there are none). */
  questions?: string;
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
