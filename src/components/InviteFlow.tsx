"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CuteCard } from "@/components/CuteCard";
import { DodgeButton } from "@/components/DodgeButton";
import { HeartButton } from "@/components/HeartButton";
import { Mascot } from "@/components/Mascot";
import { RecapCard } from "@/components/RecapCard";
import { PLEA_KEYS } from "@/lib/dodge";
import { t, type Dictionary, type MessageKey } from "@/lib/i18n/t";
import { MASCOT_NAME_KEY } from "@/lib/mascots";
import type { AnswerSubmission, InviteView, MascotMood, RecapItem } from "@/lib/types";

type Stage = "gate" | "questions" | "finale";

function SpeechBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-[1.75rem] bg-blush px-5 py-4 text-center text-xl font-bold text-rose-ink">
      <span
        aria-hidden
        className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-blush"
      />
      {children}
    </div>
  );
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="mb-5 flex justify-center gap-2">
      {Array.from({ length: total }, (_, index) => (
        <motion.span
          key={index}
          animate={{
            width: index === current ? 26 : 10,
            opacity: index <= current ? 1 : 0.3,
          }}
          className="h-2.5 rounded-full bg-rose-soft"
        />
      ))}
    </div>
  );
}

export function InviteFlow({
  invite,
  dict,
}: {
  invite: InviteView;
  dict: Dictionary;
}) {
  const [stage, setStage] = useState<Stage>("gate");
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<AnswerSubmission[]>([]);
  const [mood, setMood] = useState<MascotMood>("idle");
  const [submitError, setSubmitError] = useState<MessageKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashMood = useCallback((next: MascotMood, ms = 1100) => {
    setMood(next);
    if (moodTimer.current) clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => setMood("idle"), ms);
  }, []);

  useEffect(() => () => {
    if (moodTimer.current) clearTimeout(moodTimer.current);
  }, []);

  useEffect(() => {
    if (stage !== "finale") return;
    let cancelled = false;
    const colors = ["#E84A7F", "#FF6BA0", "#FFD1E0", "#FFFFFF"];

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({ particleCount: 130, spread: 85, origin: { y: 0.75 }, colors });
      setTimeout(
        () => confetti({ particleCount: 80, spread: 110, origin: { x: 0.2, y: 0.6 }, colors }),
        260
      );
      setTimeout(
        () => confetti({ particleCount: 80, spread: 110, origin: { x: 0.8, y: 0.6 }, colors }),
        460
      );
    });

    return () => {
      cancelled = true;
    };
  }, [stage]);

  async function submit(answers: AnswerSubmission[]) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch(`/api/invitations/${invite.token}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!response.ok) {
        // The API answers with a code, not a sentence — translate it here.
        const payload = (await response.json().catch(() => null)) as { code?: string } | null;
        setSubmitError(
          payload?.code && payload.code in dict
            ? (payload.code as MessageKey)
            : "api.saveFailed"
        );
        return;
      }
      setMood("cheer");
      setStage("finale");
    } catch {
      setSubmitError("api.saveFailed");
    } finally {
      setSubmitting(false);
    }
  }

  function pick(questionId: string, selectedOptionId: string) {
    const answers = [...picks, { questionId, selectedOptionId }];
    setPicks(answers);

    if (index + 1 < invite.questions.length) {
      flashMood("wave", 900);
      setIndex(index + 1);
      return;
    }
    void submit(answers);
  }

  const recap: RecapItem[] = picks.map((pickedAnswer) => {
    const question = invite.questions.find((item) => item.id === pickedAnswer.questionId);
    const option = question?.options.find((item) => item.id === pickedAnswer.selectedOptionId);
    return { question: question?.text ?? "", answer: option?.label ?? "" };
  });

  const mascotLabel = t(dict, MASCOT_NAME_KEY[invite.mascot]);
  const pleas = PLEA_KEYS.map((key) => t(dict, key));

  if (stage === "gate") {
    return (
      <CuteCard
        top={<Mascot kind={invite.mascot} mood={mood} size={190} label={mascotLabel} />}
      >
        <p className="mb-3 text-center text-rose-ink/60">
          {t(dict, "invite.gate.intro", { name: invite.recipientName })}
        </p>
        <SpeechBubble>{invite.gateQuestion}</SpeechBubble>

        <div className="mt-6 flex flex-col items-center">
          <HeartButton label={t(dict, "invite.yes")} onClick={() => setStage("questions")} />
          <DodgeButton
            label={t(dict, "invite.no")}
            pleas={pleas}
            onDodge={() => flashMood("blush", 1200)}
          />
        </div>
      </CuteCard>
    );
  }

  if (stage === "questions") {
    const question = invite.questions[index];
    return (
      <CuteCard
        top={<Mascot kind={invite.mascot} mood={mood} size={170} label={mascotLabel} />}
      >
        <ProgressDots total={invite.questions.length} current={index} />

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22 }}
          >
            <SpeechBubble>{question.text}</SpeechBubble>

            <div className="mt-5 space-y-3">
              {question.options.map((option) => (
                <motion.button
                  key={option.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => pick(question.id, option.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full rounded-2xl border-2 border-blush-deep bg-white px-5 py-4 text-lg font-bold text-rose-ink transition hover:border-rose-soft hover:bg-blush disabled:opacity-60"
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {submitError && (
          <div className="mt-4 text-center">
            <p className="font-bold text-rose-deep">{t(dict, submitError)}</p>
            <button
              type="button"
              onClick={() => void submit(picks)}
              className="mt-2 rounded-2xl bg-gradient-to-b from-rose-soft to-rose-deep px-6 py-2.5 font-bold text-white"
            >
              {t(dict, "invite.retry")}
            </button>
          </div>
        )}
      </CuteCard>
    );
  }

  return (
    <CuteCard
      top={<Mascot kind={invite.mascot} mood="cheer" size={190} label={mascotLabel} />}
    >
      <h2 className="text-center text-3xl font-bold text-rose-deep">
        {t(dict, "invite.finale.title")}
      </h2>
      <p className="mt-2 text-center text-lg text-rose-ink/70">
        {t(dict, "invite.finale.text", { name: invite.recipientName })}
      </p>
      <div className="mt-6">
        <RecapCard
          items={recap}
          title={t(dict, "recap.title")}
          emptyText={t(dict, "recap.empty")}
        />
      </div>
    </CuteCard>
  );
}
