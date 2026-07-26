"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mascot } from "@/components/Mascot";
import {
  DEFAULT_GATE_QUESTION,
  MAX_OPTIONS,
  MIN_OPTIONS,
  defaultQuestions,
  emptyQuestion,
} from "@/lib/defaults";
import type { Draft, DraftErrors, DraftQuestion, MascotKind } from "@/lib/types";
import { validateDraft } from "@/lib/validation";

const MASCOT_LABELS: Record<MascotKind, string> = {
  BEAR: "דובי",
  PENGUIN: "פינגווין",
};

const EMPTY_ERRORS: DraftErrors = { byQuestion: {} };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm font-bold text-rose-deep">{message}</p>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-bold text-rose-ink/70">{children}</span>;
}

const inputClass =
  "w-full rounded-2xl border-2 border-blush-deep bg-white px-4 py-3 text-lg outline-none transition focus:border-rose-soft";

export function BuilderForm() {
  const [draft, setDraft] = useState<Draft>({
    recipientName: "",
    mascot: null,
    gateQuestion: DEFAULT_GATE_QUESTION,
    questions: defaultQuestions(),
  });
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const nextId = useRef(0);

  const patch = (changes: Partial<Draft>) => setDraft((current) => ({ ...current, ...changes }));

  const patchQuestion = (id: string, changes: Partial<DraftQuestion>) =>
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === id ? { ...question, ...changes } : question
      ),
    }));

  const moveQuestion = (index: number, direction: -1 | 1) =>
    setDraft((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.questions.length) return current;
      const questions = [...current.questions];
      [questions[index], questions[target]] = [questions[target], questions[index]];
      return { ...current, questions };
    });

  const removeQuestion = (id: string) =>
    setDraft((current) => ({
      ...current,
      questions: current.questions.filter((question) => question.id !== id),
    }));

  const addQuestion = () => {
    nextId.current += 1;
    setDraft((current) => ({
      ...current,
      questions: [...current.questions, emptyQuestion(`new-${nextId.current}`)],
    }));
  };

  const setOption = (questionId: string, optionIndex: number, label: string) =>
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option, index) =>
                index === optionIndex ? label : option
              ),
            }
          : question
      ),
    }));

  const addOption = (questionId: string) =>
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId && question.options.length < MAX_OPTIONS
          ? { ...question, options: [...question.options, ""] }
          : question
      ),
    }));

  const removeOption = (questionId: string, optionIndex: number) =>
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId && question.options.length > MIN_OPTIONS
          ? { ...question, options: question.options.filter((_, i) => i !== optionIndex) }
          : question
      ),
    }));

  async function generate() {
    setShowErrors(true);
    setServerError(null);
    if (!validateDraft(draft).valid) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setServerError(payload?.message ?? "משהו נתקע, ננסה שוב?");
        return;
      }
      const { id } = (await response.json()) as { id: string };
      setCreatedId(id);
    } catch {
      setServerError("משהו נתקע, ננסה שוב?");
    } finally {
      setSubmitting(false);
    }
  }

  const shareLink =
    createdId && typeof window !== "undefined"
      ? `${window.location.origin}/invite/${createdId}`
      : null;

  async function copyLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (createdId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2.5rem] bg-white p-8 text-center shadow-[0_24px_60px_-24px_rgba(232,74,127,0.4)]"
      >
        <div className="mx-auto mb-2 w-fit">
          <Mascot kind={draft.mascot ?? "BEAR"} mood="cheer" size={150} />
        </div>
        <h2 className="text-2xl font-bold text-rose-deep">ההזמנה מוכנה!</h2>
        <p className="mt-2 text-rose-ink/70">שלחו לה את הקישור הזה:</p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            readOnly
            value={shareLink ?? ""}
            dir="ltr"
            onFocus={(event) => event.currentTarget.select()}
            className={`${inputClass} text-center text-base`}
          />
          <button
            type="button"
            onClick={copyLink}
            className="rounded-2xl bg-gradient-to-b from-rose-soft to-rose-deep px-6 py-3 text-lg font-bold text-white transition hover:brightness-105"
          >
            {copied ? "הועתק!" : "העתקה"}
          </button>
        </div>

        <p className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm text-rose-ink/70">
          הקישור עובד רק כל עוד השרת המקומי רץ במחשב שלכם.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/invite/${createdId}`}
            className="rounded-2xl border-2 border-rose-soft px-5 py-2.5 font-bold text-rose-deep transition hover:bg-blush"
          >
            תצוגה מקדימה
          </Link>
          <Link
            href="/"
            className="rounded-2xl border-2 border-blush-deep px-5 py-2.5 font-bold text-rose-ink/70 transition hover:bg-blush"
          >
            חזרה לרשימה
          </Link>
        </div>
      </motion.div>
    );
  }

  // Once Generate has been pressed, errors stay live so they clear as she fixes them.
  const visible = showErrors ? validateDraft(draft).errors : EMPTY_ERRORS;

  return (
    <div className="space-y-6">
      <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_50px_-28px_rgba(232,74,127,0.45)]">
        <label className="block">
          <Label>למי ההזמנה?</Label>
          <input
            className={inputClass}
            value={draft.recipientName}
            placeholder="השם שלה"
            onChange={(event) => patch({ recipientName: event.target.value })}
          />
        </label>
        <FieldError message={visible.recipientName} />

        <div className="mt-6">
          <Label>איזה קמע ילווה אותה?</Label>
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(MASCOT_LABELS) as MascotKind[]).map((kind) => {
              const selected = draft.mascot === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => patch({ mascot: kind })}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-1 rounded-3xl border-2 p-3 transition ${
                    selected
                      ? "border-rose-deep bg-blush"
                      : "border-blush-deep bg-white hover:bg-blush/60"
                  }`}
                >
                  <Mascot kind={kind} mood={selected ? "wave" : "idle"} size={110} />
                  <span className="font-bold">{MASCOT_LABELS[kind]}</span>
                </button>
              );
            })}
          </div>
          <FieldError message={visible.mascot} />
        </div>

        <label className="mt-6 block">
          <Label>שאלת הפתיחה</Label>
          <input
            className={inputClass}
            value={draft.gateQuestion}
            onChange={(event) => patch({ gateQuestion: event.target.value })}
          />
        </label>
        <FieldError message={visible.gateQuestion} />
      </section>

      <section className="space-y-4">
        <h2 className="px-2 text-xl font-bold text-rose-deep">שאלות הלוגיסטיקה</h2>
        <FieldError message={visible.questions} />

        <AnimatePresence initial={false}>
          {draft.questions.map((question, index) => {
            const questionErrors = visible.byQuestion[question.id];
            return (
              <motion.div
                key={question.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="rounded-[2rem] bg-white p-5 shadow-[0_14px_40px_-28px_rgba(232,74,127,0.5)]"
              >
                {/* Wraps on phone width so the question text keeps a usable box. */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush font-bold text-rose-deep">
                    {index + 1}
                  </span>
                  <input
                    className={`${inputClass} flex-1 basis-52`}
                    value={question.text}
                    placeholder="מה נשאל?"
                    onChange={(event) => patchQuestion(question.id, { text: event.target.value })}
                  />
                  <div className="ms-auto flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label="הזזה למעלה"
                      onClick={() => moveQuestion(index, -1)}
                      disabled={index === 0}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-blush text-rose-deep disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="הזזה למטה"
                      onClick={() => moveQuestion(index, 1)}
                      disabled={index === draft.questions.length - 1}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-blush text-rose-deep disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label="מחיקת שאלה"
                      onClick={() => removeQuestion(question.id)}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-blush text-rose-deep"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <FieldError message={questionErrors?.text} />

                <div className="mt-3 space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <span className="text-rose-soft">♥</span>
                      <input
                        className={inputClass}
                        value={option}
                        placeholder={`תשובה ${optionIndex + 1}`}
                        onChange={(event) =>
                          setOption(question.id, optionIndex, event.target.value)
                        }
                      />
                      <button
                        type="button"
                        aria-label="מחיקת תשובה"
                        onClick={() => removeOption(question.id, optionIndex)}
                        disabled={question.options.length <= MIN_OPTIONS}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blush text-rose-deep disabled:opacity-30"
                      >
                        −
                      </button>
                    </div>
                  ))}
                </div>
                <FieldError message={questionErrors?.options} />

                {question.options.length < MAX_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => addOption(question.id)}
                    className="mt-3 rounded-xl px-3 py-1.5 text-sm font-bold text-rose-deep transition hover:bg-blush"
                  >
                    + עוד תשובה
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <button
          type="button"
          onClick={addQuestion}
          className="w-full rounded-[2rem] border-2 border-dashed border-rose-soft/60 py-4 text-lg font-bold text-rose-deep transition hover:bg-white"
        >
          + הוספת שאלה
        </button>
      </section>

      {serverError && (
        <p className="text-center font-bold text-rose-deep">{serverError}</p>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={submitting}
        className="w-full rounded-[2rem] bg-gradient-to-b from-rose-soft to-rose-deep py-5 text-xl font-bold text-white shadow-[0_16px_40px_-16px_rgba(232,74,127,0.7)] transition hover:brightness-105 disabled:opacity-60"
      >
        {submitting ? "רגע..." : "יצירת קישור"}
      </button>
    </div>
  );
}
