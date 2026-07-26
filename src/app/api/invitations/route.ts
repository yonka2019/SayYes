import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";
import { prisma } from "@/lib/prisma";
import type { Draft, MascotKind } from "@/lib/types";
import { validateDraft } from "@/lib/validation";

const MASCOTS: MascotKind[] = ["BEAR", "PENGUIN"];

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

/** Turn an untrusted request body into a Draft, or null if it isn't one. */
function toDraft(body: unknown): Draft | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = body as Record<string, unknown>;

  if (typeof raw.recipientName !== "string") return null;
  if (typeof raw.gateQuestion !== "string") return null;
  if (raw.mascot !== null && !MASCOTS.includes(raw.mascot as MascotKind)) return null;
  if (!Array.isArray(raw.questions)) return null;

  const questions = raw.questions.map((entry, index) => {
    const question = entry as Record<string, unknown>;
    return {
      id: typeof question.id === "string" ? question.id : `q${index}`,
      text: typeof question.text === "string" ? question.text : "",
      options: isStringArray(question.options) ? question.options : [],
    };
  });

  return {
    recipientName: raw.recipientName,
    mascot: (raw.mascot as MascotKind | null) ?? null,
    gateQuestion: raw.gateQuestion,
    questions,
    // An absent or unknown locale is not worth a 400 — fall back to the default.
    locale: isLocale(raw.locale) ? raw.locale : DEFAULT_LOCALE,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "api.badRequest" }, { status: 400 });
  }

  const draft = toDraft(body);
  if (!draft) {
    return NextResponse.json({ code: "api.badRequest" }, { status: 400 });
  }

  const { valid, errors } = validateDraft(draft);
  if (!valid || draft.mascot === null) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const invitation = await prisma.invitation.create({
    data: {
      recipientName: draft.recipientName.trim(),
      mascot: draft.mascot,
      gateQuestion: draft.gateQuestion.trim(),
      locale: draft.locale,
      questions: {
        create: draft.questions.map((question, questionIndex) => ({
          order: questionIndex,
          text: question.text.trim(),
          options: {
            create: question.options.map((label, optionIndex) => ({
              label: label.trim(),
              order: optionIndex,
            })),
          },
        })),
      },
    },
  });

  return NextResponse.json({ id: invitation.id }, { status: 201 });
}
