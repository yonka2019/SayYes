import { describe, expect, it } from "vitest";
import { DEFAULT_GATE_QUESTION, defaultQuestions } from "../src/lib/defaults";
import { validateDraft } from "../src/lib/validation";
import type { Draft } from "../src/lib/types";

const draft = (over: Partial<Draft> = {}): Draft => ({
  recipientName: "נועה",
  mascot: "BEAR",
  gateQuestion: DEFAULT_GATE_QUESTION,
  questions: [{ id: "q1", text: "מה נאכל?", options: ["סושי", "פיצה"] }],
  ...over,
});

describe("validateDraft", () => {
  it("accepts a complete draft", () => {
    const { valid, errors } = validateDraft(draft());
    expect(valid).toBe(true);
    expect(errors.byQuestion).toEqual({});
  });

  it("accepts the pre-loaded defaults once a name and mascot are set", () => {
    expect(validateDraft(draft({ questions: defaultQuestions() })).valid).toBe(true);
  });

  it("rejects a blank recipient name", () => {
    const { valid, errors } = validateDraft(draft({ recipientName: "   " }));
    expect(valid).toBe(false);
    expect(errors.recipientName).toBeTruthy();
  });

  it("rejects a missing mascot", () => {
    const { valid, errors } = validateDraft(draft({ mascot: null }));
    expect(valid).toBe(false);
    expect(errors.mascot).toBeTruthy();
  });

  it("rejects a blank gate question", () => {
    const { valid, errors } = validateDraft(draft({ gateQuestion: "" }));
    expect(valid).toBe(false);
    expect(errors.gateQuestion).toBeTruthy();
  });

  it("rejects zero questions", () => {
    const { valid, errors } = validateDraft(draft({ questions: [] }));
    expect(valid).toBe(false);
    expect(errors.questions).toBeTruthy();
  });

  it("rejects a blank question text, keyed by question id", () => {
    const { valid, errors } = validateDraft(
      draft({ questions: [{ id: "q7", text: "  ", options: ["א", "ב"] }] })
    );
    expect(valid).toBe(false);
    expect(errors.byQuestion.q7?.text).toBeTruthy();
  });

  it("rejects fewer than 2 options", () => {
    const { valid, errors } = validateDraft(
      draft({ questions: [{ id: "q1", text: "מה נאכל?", options: ["סושי"] }] })
    );
    expect(valid).toBe(false);
    expect(errors.byQuestion.q1?.options).toBeTruthy();
  });

  it("rejects more than 4 options", () => {
    const { valid, errors } = validateDraft(
      draft({
        questions: [{ id: "q1", text: "מה נאכל?", options: ["א", "ב", "ג", "ד", "ה"] }],
      })
    );
    expect(valid).toBe(false);
    expect(errors.byQuestion.q1?.options).toBeTruthy();
  });

  it("rejects a blank option label", () => {
    const { valid, errors } = validateDraft(
      draft({ questions: [{ id: "q1", text: "מה נאכל?", options: ["סושי", "  "] }] })
    );
    expect(valid).toBe(false);
    expect(errors.byQuestion.q1?.options).toBeTruthy();
  });

  it("rejects duplicate option labels inside one question", () => {
    const { valid, errors } = validateDraft(
      draft({ questions: [{ id: "q1", text: "מה נאכל?", options: ["סושי", "סושי"] }] })
    );
    expect(valid).toBe(false);
    expect(errors.byQuestion.q1?.options).toBeTruthy();
  });

  it("reports only the broken question", () => {
    const { errors } = validateDraft(
      draft({
        questions: [
          { id: "ok", text: "איפה?", options: ["ים", "פארק"] },
          { id: "bad", text: "מתי?", options: ["מחר"] },
        ],
      })
    );
    expect(errors.byQuestion.ok).toBeUndefined();
    expect(errors.byQuestion.bad?.options).toBeTruthy();
  });
});
