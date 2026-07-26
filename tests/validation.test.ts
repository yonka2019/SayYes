import { describe, expect, it } from "vitest";
import {
  MAX_NAME_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_OPTIONS,
  MAX_TEXT_LENGTH,
  MIN_OPTIONS,
  defaultGateQuestion,
  defaultQuestions,
} from "../src/lib/defaults";
import { validateDraft } from "../src/lib/validation";
import type { Draft } from "../src/lib/types";

const draft = (over: Partial<Draft> = {}): Draft => ({
  recipientName: "נועה",
  creatorEmail: "maya@example.com",
  mascot: "BEAR",
  gateQuestion: defaultGateQuestion("he"),
  questions: [{ id: "q1", text: "מה נאכל?", options: ["סושי", "פיצה"] }],
  locale: "he",
  ...over,
});

describe("validateDraft", () => {
  it("accepts a complete draft", () => {
    const { valid, errors } = validateDraft(draft());
    expect(valid).toBe(true);
    expect(errors.byQuestion).toEqual({});
  });

  it("accepts the pre-loaded defaults once a name and mascot are set", () => {
    expect(validateDraft(draft({ questions: defaultQuestions("he") })).valid).toBe(true);
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

describe("validateDraft error codes", () => {
  it("reports a blank name as a code, not a sentence", () => {
    const { errors } = validateDraft(draft({ recipientName: "   " }));
    expect(errors.recipientName).toEqual({ code: "error.name.required" });
  });

  it("carries the limit as a param rather than baking it into a sentence", () => {
    const { errors } = validateDraft(
      draft({ recipientName: "x".repeat(MAX_NAME_LENGTH + 1) })
    );
    expect(errors.recipientName).toEqual({
      code: "error.name.tooLong",
      params: { max: MAX_NAME_LENGTH },
    });
  });

  it("uses the same too-long code for the gate and for a question", () => {
    const long = "x".repeat(MAX_TEXT_LENGTH + 1);
    const { errors } = validateDraft(
      draft({
        gateQuestion: long,
        questions: [{ id: "q1", text: long, options: ["a", "b"] }],
      })
    );
    expect(errors.gateQuestion).toEqual({
      code: "error.text.tooLong",
      params: { max: MAX_TEXT_LENGTH },
    });
    expect(errors.byQuestion.q1?.text).toEqual({
      code: "error.text.tooLong",
      params: { max: MAX_TEXT_LENGTH },
    });
  });

  it("codes the mascot, gate and empty-question-list failures", () => {
    const { errors } = validateDraft(
      draft({ mascot: null, gateQuestion: "", questions: [] })
    );
    expect(errors.mascot).toEqual({ code: "error.mascot.required" });
    expect(errors.gateQuestion).toEqual({ code: "error.gate.required" });
    expect(errors.questions).toEqual({ code: "error.questions.empty" });
  });

  it("codes a blank creator email", () => {
    const { errors } = validateDraft(draft({ creatorEmail: "   " }));
    expect(errors.creatorEmail).toEqual({ code: "error.email.required" });
  });

  it("codes a malformed creator email", () => {
    const { errors } = validateDraft(draft({ creatorEmail: "not-an-email" }));
    expect(errors.creatorEmail).toEqual({ code: "error.email.invalid" });
  });

  it("accepts a well-formed creator email", () => {
    const { errors } = validateDraft(draft({ creatorEmail: "a@b.co" }));
    expect(errors.creatorEmail).toBeUndefined();
  });

  it("distinguishes the four option failures by code", () => {
    const optionsErrorFor = (options: string[]) =>
      validateDraft(draft({ questions: [{ id: "q1", text: "?", options }] })).errors
        .byQuestion.q1?.options;

    expect(optionsErrorFor(["only-one"])).toEqual({
      code: "error.options.count",
      params: { min: MIN_OPTIONS, max: MAX_OPTIONS },
    });
    expect(optionsErrorFor(["a", "  "])).toEqual({ code: "error.options.empty" });
    expect(optionsErrorFor(["a", "x".repeat(MAX_OPTION_LENGTH + 1)])).toEqual({
      code: "error.options.tooLong",
      params: { max: MAX_OPTION_LENGTH },
    });
    expect(optionsErrorFor(["same", "same"])).toEqual({
      code: "error.options.duplicate",
    });
  });
});
