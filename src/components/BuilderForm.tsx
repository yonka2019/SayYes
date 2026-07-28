"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mascot } from "@/components/Mascot";
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  defaultGateQuestion,
  defaultQuestions,
  emptyQuestion,
} from "@/lib/defaults";
import type { Locale } from "@/lib/i18n/locales";
import { t, type Dictionary, type MessageKey } from "@/lib/i18n/t";
import { MASCOT_KINDS, MASCOT_NAME_KEY } from "@/lib/mascots";
import type { Draft, DraftErrors, DraftQuestion, FieldError } from "@/lib/types";
import { validateDraft } from "@/lib/validation";

const EMPTY_ERRORS: DraftErrors = { byQuestion: {} };

/** Renders a validation code in the creator's language. */
function FieldErrorText({ error, dict }: { error?: FieldError; dict: Dictionary }) {
  if (!error) return null;
  return (
    <p className="mt-1 text-sm font-bold text-rose-deep">
      {t(dict, error.code, error.params)}
    </p>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-bold text-rose-ink/70">{children}</span>;
}

const inputClass =
  "w-full rounded-2xl border-2 border-blush-deep bg-white px-4 py-3 text-lg outline-none transition focus:border-rose-soft";

export function BuilderForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [draft, setDraft] = useState<Draft>({
    recipientName: "",
    creatorEmail: "",
    mascot: null,
    gateQuestion: defaultGateQuestion(locale),
    questions: defaultQuestions(locale),
    locale,
  });
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<MessageKey | null>(null);
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

  /** The API answers with a code, not a sentence — translate it here. */
  const codeFrom = (value: unknown, fallback: MessageKey): MessageKey =>
    typeof value === "string" && value in dict ? (value as MessageKey) : fallback;

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
        const payload = (await response.json().catch(() => null)) as { code?: string } | null;
        setServerError(codeFrom(payload?.code, "api.createFailed"));
        return;
      }
      const { id } = (await response.json()) as { id: string };
      setCreatedId(id);
    } catch {
      setServerError("api.createFailed");
    } finally {
      setSubmitting(false);
    }
  }

  // The link carries the locale the form was filled in — the invitation owns it.
  const shareLink =
    createdId && typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/invite/${createdId}`
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
    const chosen = draft.mascot ?? "BEAR";
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2.5rem] bg-white p-8 text-center shadow-[0_24px_60px_-24px_rgba(232,74,127,0.4)]"
      >
        <div className="mx-auto mb-2 w-fit">
          <Mascot kind={chosen} mood="cheer" size={150} label={t(dict, MASCOT_NAME_KEY[chosen])} />
        </div>
        <h2 className="text-2xl font-bold text-rose-deep">{t(dict, "builder.done.title")}</h2>
        <p className="mt-2 text-rose-ink/70">{t(dict, "builder.done.subtitle")}</p>

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
            {copied ? t(dict, "builder.done.copied") : t(dict, "builder.done.copy")}
          </button>
        </div>

        <p className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm text-rose-ink/70">
          {t(dict, "builder.done.note")}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/${locale}/invite/${createdId}?preview=1`}
            className="rounded-2xl border-2 border-rose-soft px-5 py-2.5 font-bold text-rose-deep transition hover:bg-blush"
          >
            {t(dict, "builder.done.preview")}
          </Link>
          {/* Plain <a>, not <Link>: the builder lives at this same URL, so a
              client-side navigation would keep this success screen mounted.
              A full load re-seeds a fresh draft. */}
          <a
            href={`/${locale}`}
            className="rounded-2xl border-2 border-blush-deep px-5 py-2.5 font-bold text-rose-ink/70 transition hover:bg-blush"
          >
            {t(dict, "builder.done.another")}
          </a>
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
          <Label>{t(dict, "builder.name.label")}</Label>
          <input
            className={inputClass}
            value={draft.recipientName}
            placeholder={t(dict, "builder.name.placeholder")}
            onChange={(event) => patch({ recipientName: event.target.value })}
          />
        </label>
        <FieldErrorText error={visible.recipientName} dict={dict} />

        <label className="mt-6 block">
          <Label>{t(dict, "builder.email.label")}</Label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            dir="ltr"
            className={`${inputClass} text-left`}
            value={draft.creatorEmail}
            placeholder={t(dict, "builder.email.placeholder")}
            onChange={(event) => patch({ creatorEmail: event.target.value })}
          />
        </label>
        <FieldErrorText error={visible.creatorEmail} dict={dict} />

        <div className="mt-6">
          <Label>{t(dict, "builder.mascot.label")}</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MASCOT_KINDS.map((kind) => {
              const selected = draft.mascot === kind;
              const name = t(dict, MASCOT_NAME_KEY[kind]);
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
                  <Mascot
                    kind={kind}
                    mood={selected ? "wave" : "idle"}
                    size={96}
                    label={name}
                  />
                  <span className="font-bold">{name}</span>
                </button>
              );
            })}
          </div>
          <FieldErrorText error={visible.mascot} dict={dict} />
        </div>

        <label className="mt-6 block">
          <Label>{t(dict, "builder.gate.label")}</Label>
          <input
            className={inputClass}
            value={draft.gateQuestion}
            onChange={(event) => patch({ gateQuestion: event.target.value })}
          />
        </label>
        <FieldErrorText error={visible.gateQuestion} dict={dict} />
      </section>

      <section className="space-y-4">
        <h2 className="px-2 text-xl font-bold text-rose-deep">
          {t(dict, "builder.questions.title")}
        </h2>
        <FieldErrorText error={visible.questions} dict={dict} />

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
                    placeholder={t(dict, "builder.question.placeholder")}
                    onChange={(event) => patchQuestion(question.id, { text: event.target.value })}
                  />
                  <div className="ms-auto flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={t(dict, "builder.moveUp")}
                      onClick={() => moveQuestion(index, -1)}
                      disabled={index === 0}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-blush text-rose-deep disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={t(dict, "builder.moveDown")}
                      onClick={() => moveQuestion(index, 1)}
                      disabled={index === draft.questions.length - 1}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-blush text-rose-deep disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label={t(dict, "builder.removeQuestion")}
                      onClick={() => removeQuestion(question.id)}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-blush text-rose-deep"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <FieldErrorText error={questionErrors?.text} dict={dict} />

                <div className="mt-3 space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <span className="text-rose-soft">♥</span>
                      <input
                        className={inputClass}
                        value={option}
                        placeholder={t(dict, "builder.option.placeholder", {
                          n: optionIndex + 1,
                        })}
                        onChange={(event) =>
                          setOption(question.id, optionIndex, event.target.value)
                        }
                      />
                      <button
                        type="button"
                        aria-label={t(dict, "builder.removeOption")}
                        onClick={() => removeOption(question.id, optionIndex)}
                        disabled={question.options.length <= MIN_OPTIONS}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blush text-rose-deep disabled:opacity-30"
                      >
                        −
                      </button>
                    </div>
                  ))}
                </div>
                <FieldErrorText error={questionErrors?.options} dict={dict} />

                {question.options.length < MAX_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => addOption(question.id)}
                    className="mt-3 rounded-xl px-3 py-1.5 text-sm font-bold text-rose-deep transition hover:bg-blush"
                  >
                    {t(dict, "builder.addOption")}
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
          {t(dict, "builder.addQuestion")}
        </button>
      </section>

      {serverError && (
        <p className="text-center font-bold text-rose-deep">{t(dict, serverError)}</p>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={submitting}
        className="w-full rounded-[2rem] bg-gradient-to-b from-rose-soft to-rose-deep py-5 text-xl font-bold text-white shadow-[0_16px_40px_-16px_rgba(232,74,127,0.7)] transition hover:brightness-105 disabled:opacity-60"
      >
        {submitting ? t(dict, "builder.submitting") : t(dict, "builder.submit")}
      </button>
    </div>
  );
}
